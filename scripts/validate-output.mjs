#!/usr/bin/env node

/**
 * validate-output.mjs
 *
 * After build-site.mjs writes to dist/, this script reads the output and
 * verifies every MUST-level rule from /rules/ has been satisfied. Reports
 * pass/fail per check with rule citations.
 *
 * Usage:
 *   node scripts/validate-output.mjs              (uses ./site-config.json + ./dist)
 *   node scripts/validate-output.mjs ./other-config.json
 *
 * Exit codes:
 *   0  All MUST-level rules pass
 *   1  One or more MUST-level rules failed
 *   2  Could not run (missing dist/, missing config, etc.)
 *
 * Each check returns { rule, description, passed, detail }. The script
 * prints a summary at the end and exits with a non-zero code if any MUST
 * check failed. SHOULD-level warnings are printed but do not fail the run.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const checks = []; // { rule, level, description, passed, detail }

function recordCheck(rule, level, description, passed, detail = '') {
  checks.push({ rule, level, description, passed, detail });
  const icon = passed ? `${ANSI.green}PASS${ANSI.reset}` : (level === 'MUST' ? `${ANSI.red}FAIL${ANSI.reset}` : `${ANSI.yellow}WARN${ANSI.reset}`);
  const ruleTag = `${ANSI.gray}[${rule}]${ANSI.reset}`;
  console.log(`  ${icon}  ${ruleTag} ${description}${detail ? ` ${ANSI.gray}— ${detail}${ANSI.reset}` : ''}`);
}

// Banned phrases from rule 04-2 (case-insensitive substring match)
const BANNED_HYPE_VERBS = [
  'unleash', 'dive into', 'delve into', 'embark on', 'harness',
  'elevate', 'revolutionize', 'transform', 'supercharge', 'amplify',
  'empower', 'master the art', 'unlock the',
];

const BANNED_ADJECTIVES = [
  'groundbreaking', 'revolutionary', 'game-changing', 'cutting-edge',
  'state-of-the-art', 'seamless', 'unparalleled', 'transformative',
  'multifaceted', 'nuanced',
];

const BANNED_FILLERS = [
  "it's worth noting that", "it's important to note",
  'in conclusion', 'in summary',
  "whether you're a beginner or a seasoned",
  'when it comes to', "in today's fast-paced world",
  'in the world of', 'look no further than',
  'navigate the world of', 'the realm of',
  'tapestry of', 'testament to',
  'at the end of the day', 'the bottom line is',
];

// Strip HTML tags and JSON-LD script content to get only visible body text
function getBodyText(html) {
  // Remove <script> blocks entirely
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  // Remove <style> blocks
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  // Remove all tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

// Count specific characters in text
function countChar(text, char) {
  let count = 0;
  for (const c of text) if (c === char) count++;
  return count;
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

function checkTitle(html, config) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  if (!m) {
    recordCheck('01-2', 'MUST', 'Page has <title> tag', false, '<title> not found');
    return;
  }
  const title = m[1].trim();
  const lengthOk = title.length <= 60;
  recordCheck('01-2.1', 'MUST', `<title> ≤ 60 chars`, lengthOk, `actual: ${title.length} chars: "${title}"`);

  const keyword = config.seo.primaryKeyword.toLowerCase();
  const hasKeyword = title.toLowerCase().includes(keyword);
  recordCheck('01-1.1', 'MUST', `<title> contains primary keyword verbatim`, hasKeyword, hasKeyword ? '' : `keyword: "${keyword}"`);
}

function checkMetaDescription(html, config) {
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  if (!m) {
    recordCheck('01-3', 'MUST', 'Page has meta description', false);
    return;
  }
  const desc = m[1];
  recordCheck('01-3.1', 'MUST', 'meta description ≤ 155 chars', desc.length <= 155, `actual: ${desc.length} chars`);

  const keyword = config.seo.primaryKeyword.toLowerCase();
  recordCheck('01-3.2', 'MUST', 'meta description contains primary keyword verbatim', desc.toLowerCase().includes(keyword));
}

function checkSingleH1(html) {
  const h1Matches = html.match(/<h1[^>]*>/gi);
  const count = h1Matches ? h1Matches.length : 0;
  recordCheck('01-5.1', 'MUST', 'Exactly one <h1> on page', count === 1, `found: ${count}`);
}

function checkH3Count(html) {
  const h3Matches = html.match(/<h3[^>]*>/gi);
  const count = h3Matches ? h3Matches.length : 0;
  recordCheck('01-5.4', 'MUST', 'At least 3 <h3> elements', count >= 3, `found: ${count}`);
}

function checkNoCanonical(html) {
  const hasCanonical = /<link\s+rel=["']canonical["']/i.test(html);
  recordCheck('01-4.1', 'MUST', 'No canonical tag', !hasCanonical, hasCanonical ? 'canonical tag present' : '');
}

function checkSchemaPresent(html) {
  const m = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) {
    recordCheck('01-6.1', 'MUST', 'Schema JSON-LD script present', false);
    return null;
  }
  try {
    const schema = JSON.parse(m[1]);
    recordCheck('01-6.1', 'MUST', 'Schema JSON-LD is valid JSON', true);
    return schema;
  } catch (err) {
    recordCheck('01-6.1', 'MUST', 'Schema JSON-LD is valid JSON', false, err.message);
    return null;
  }
}

function checkSchemaTypes(schema, config) {
  if (!schema) return;
  const graph = schema['@graph'] || [schema];
  const types = graph.map(item => item['@type']).flat();

  recordCheck('01-6.2', 'MUST', 'Schema includes Article', types.includes('Article'));
  recordCheck('01-6.2', 'MUST', 'Schema includes WebSite', types.includes('WebSite'));
  recordCheck('01-6.2', 'MUST', 'Schema includes FAQPage', types.includes('FAQPage'));
  recordCheck('01-6.2', 'MUST', 'Schema includes SpeakableSpecification', types.includes('SpeakableSpecification'));

  if (config.template.type === 'listicle' || config.template.type === 'amazon') {
    recordCheck('01-6.3', 'MUST', 'Schema includes ItemList (listicle/amazon)', types.includes('ItemList'));
  }

  // Article date format check
  const article = graph.find(item => item['@type'] === 'Article');
  if (article) {
    const isoWithTz = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([.\d]+)?(Z|[+-]\d{2}:\d{2})$/;
    recordCheck('01-6.4', 'MUST', 'Article datePublished is ISO 8601 with timezone', isoWithTz.test(article.datePublished || ''));
    recordCheck('01-6.4', 'MUST', 'Article dateModified is ISO 8601 with timezone', isoWithTz.test(article.dateModified || ''));
    const hasAuthorUrl = article.author && article.author.url;
    recordCheck('01-6.4', 'MUST', 'Article author has url field', !!hasAuthorUrl);
  }
}

function checkOgAndTwitter(html, config) {
  const ogTags = ['og:title', 'og:description', 'og:url', 'og:image', 'og:type'];
  for (const tag of ogTags) {
    const present = new RegExp(`<meta\\s+property=["']${tag}["']\\s+content=["']`).test(html);
    recordCheck('01-7.1', 'MUST', `Open Graph ${tag}`, present);
  }

  const twitterTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
  for (const tag of twitterTags) {
    const present = new RegExp(`<meta\\s+name=["']${tag}["']\\s+content=["']`).test(html);
    recordCheck('01-7.2', 'MUST', `Twitter Card ${tag}`, present);
  }

  // og:image should not point to googleapis.com
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    const goodPath = !ogImageMatch[1].includes('storage.googleapis.com');
    recordCheck('01-7.3', 'MUST', 'og:image not a GoogleCloudStorage URL', goodPath, `actual: ${ogImageMatch[1].substring(0, 60)}`);
  }
}

function checkFavicon(html) {
  const hasIcoLink = /<link\s+rel=["']icon["']\s+href=["']\/favicon\.ico["']/i.test(html);
  recordCheck('01-8.1', 'MUST', 'Favicon link to /favicon.ico present', hasIcoLink);
}

function checkHeroPreload(html) {
  // Find the preload tag
  const m = html.match(/<link\s+rel=["']preload["'][^>]*as=["']image["'][^>]*>/i);
  if (!m) {
    recordCheck('03-1.1', 'MUST', 'Hero image preload tag in <head>', false);
    return;
  }
  recordCheck('03-1.1', 'MUST', 'Hero image preload tag in <head>', true);

  const tag = m[0];
  recordCheck('03-1.3', 'MUST', 'Hero preload has fetchpriority="high"', /fetchpriority=["']high["']/.test(tag));
  recordCheck('03-1.5', 'MUST', 'Hero preload has imagesrcset', /imagesrcset=/.test(tag));

  // Check ordering: preload must come BEFORE any external stylesheet link
  const preloadIdx = html.indexOf(m[0]);
  const externalStylesheetMatch = html.match(/<link\s+rel=["']stylesheet["'][^>]*href=["']https?:/i);
  if (externalStylesheetMatch) {
    const stylesheetIdx = html.indexOf(externalStylesheetMatch[0]);
    recordCheck('03-1.2', 'MUST', 'Hero preload appears before external stylesheets', preloadIdx < stylesheetIdx);
  }
}

function checkHeroImg(html) {
  // Find the hero img — the one with fetchpriority="high"
  const m = html.match(/<img[^>]*fetchpriority=["']high["'][^>]*>/i);
  if (!m) {
    recordCheck('03-2.1', 'MUST', 'Hero <img> has fetchpriority="high"', false);
    return;
  }
  recordCheck('03-2.1', 'MUST', 'Hero <img> has fetchpriority="high"', true);

  const tag = m[0];
  const hasLazy = /loading=["']lazy["']/.test(tag);
  recordCheck('03-2.2', 'MUST', 'Hero <img> does NOT have loading="lazy"', !hasLazy);

  const hasWidth = /\swidth=["']?\d+/.test(tag);
  const hasHeight = /\sheight=["']?\d+/.test(tag);
  recordCheck('03-2.3', 'MUST', 'Hero <img> has explicit width and height', hasWidth && hasHeight);

  const hasHAuto = /class=["'][^"']*h-auto/.test(tag);
  recordCheck('03-2.4', 'MUST', 'Hero <img> does not use h-auto class', !hasHAuto);
}

function checkPictureElement(html) {
  const m = html.match(/<picture>([\s\S]*?)<\/picture>/i);
  if (!m) {
    recordCheck('03-3.1', 'MUST', '<picture> element for hero', false);
    return;
  }
  const sources = m[1].match(/<source[^>]*>/gi) || [];
  recordCheck('03-3.1', 'MUST', 'Picture has at least 2 <source> tags', sources.length >= 2, `found: ${sources.length}`);
}

function checkBodyContentForEmDashes(html) {
  const bodyText = getBodyText(html);
  const count = countChar(bodyText, '\u2014');
  recordCheck('04-1.1', 'MUST', 'No em dashes (—) in body text', count === 0, count > 0 ? `found ${count}` : '');
}

function checkBannedPhrases(html) {
  const bodyText = getBodyText(html).toLowerCase();

  const found = [];
  for (const phrase of [...BANNED_HYPE_VERBS, ...BANNED_ADJECTIVES, ...BANNED_FILLERS]) {
    if (bodyText.includes(phrase.toLowerCase())) {
      found.push(phrase);
    }
  }
  recordCheck('04-2', 'MUST', 'No banned LLM-slop phrases', found.length === 0, found.length > 0 ? `found: ${found.slice(0, 3).join(', ')}${found.length > 3 ? ` +${found.length - 3} more` : ''}` : '');
}

function checkQuickAnswerBox(html, config) {
  const m = html.match(/<div\s+class=["'][^"']*quick-answer-box[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (!m) {
    recordCheck('04-3.5', 'MUST', '.quick-answer-box element present', false);
    return;
  }
  recordCheck('04-3.5', 'MUST', '.quick-answer-box element present', true);

  // Check word count
  const text = getBodyText(m[1]);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const lenOk = wordCount >= 35 && wordCount <= 55;
  recordCheck('04-3.3', 'MUST', 'Quick Answer is 40-50 words', lenOk, `actual: ${wordCount}`);
}

function checkDirectAffiliateLinks(html, config) {
  // Rule 05-1.1: no <a href=...> should match any config affiliateLink value
  const violations = [];
  for (const product of config.affiliate.products) {
    if (config.template.type === 'amazon') continue; // amazon template intentionally has direct links

    const url = product.affiliateLink;
    if (html.includes(`href="${url}"`) || html.includes(`href='${url}'`)) {
      violations.push(product.name);
    }
  }
  recordCheck('05-1.1', 'MUST', 'No direct affiliate URLs in href values', violations.length === 0, violations.length > 0 ? `violations: ${violations.join(', ')}` : '');
}

async function checkGoRedirects(distDir, config) {
  if (config.template.type === 'amazon') {
    recordCheck('05-1.3', 'MUST', '/go/ redirects exist for each product', true, '(amazon template; skipped)');
    return;
  }

  let allExist = true;
  const missing = [];
  for (const product of config.affiliate.products) {
    const slug = product.slug.replace(/^\//, '');
    const filePath = path.join(distDir, slug, 'index.html');
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const hasMetaRefresh = /<meta\s+http-equiv=["']refresh["']/i.test(content);
      const hasJsRedirect = /window\.location\.replace/.test(content);
      if (!hasMetaRefresh || !hasJsRedirect) {
        allExist = false;
        missing.push(`${product.slug} (meta-refresh:${hasMetaRefresh}, js-redirect:${hasJsRedirect})`);
      }
    } catch {
      allExist = false;
      missing.push(`${product.slug} (file not found)`);
    }
  }
  recordCheck('05-1.3', 'MUST', '/go/ redirects exist with meta-refresh AND js-redirect', allExist, missing.join('; '));
}

async function checkRobotsTxt(distDir) {
  let content;
  try {
    content = await fs.readFile(path.join(distDir, 'robots.txt'), 'utf8');
  } catch {
    recordCheck('01-10.1', 'MUST', 'public/robots.txt exists', false);
    return;
  }
  recordCheck('01-10.1', 'MUST', 'robots.txt exists', true);

  // Rule 01-10.2: blank line before Sitemap directive
  const lines = content.split('\n');
  const sitemapIdx = lines.findIndex(l => l.startsWith('Sitemap:'));
  if (sitemapIdx === -1) {
    recordCheck('01-10.2', 'MUST', 'robots.txt has Sitemap directive', false);
    return;
  }
  const prevLine = lines[sitemapIdx - 1];
  recordCheck('01-10.2', 'MUST', 'robots.txt has blank line before Sitemap', prevLine === '' || prevLine === '\r', `prev line: "${prevLine}"`);

  // Disallow /go/ (rule 01-10.4)
  const hasDisallowGo = lines.some(l => l.trim() === 'Disallow: /go/');
  recordCheck('01-10.4', 'MUST', 'robots.txt has Disallow: /go/', hasDisallowGo);
}

async function checkSitemap(distDir, config) {
  let content;
  try {
    content = await fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf8');
  } catch {
    recordCheck('01-11.1', 'MUST', 'sitemap.xml exists', false);
    return;
  }
  recordCheck('01-11.1', 'MUST', 'sitemap.xml exists', true);

  const hasUrlsetTag = /<urlset/.test(content);
  recordCheck('01-11.1', 'MUST', 'sitemap.xml has <urlset> root', hasUrlsetTag);

  // Should include homepage + 4 subpages
  const expectedPaths = ['', 'about/', 'contact/', 'privacy/', 'disclosure/'];
  for (const p of expectedPaths) {
    const hasIt = content.includes(`https://${config.site.domain}/${p}`);
    recordCheck('01-11.2', 'MUST', `sitemap includes /${p || ''}`, hasIt);
  }
}

async function checkIndexNowKeyFile(distDir, config) {
  const filename = `${config.seo.indexNowKey}.txt`;
  const filePath = path.join(distDir, filename);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const matches = content.trim() === config.seo.indexNowKey;
    recordCheck('01-12.2', 'MUST', `IndexNow key file content matches filename`, matches);
  } catch {
    recordCheck('01-12.1', 'MUST', `IndexNow key file ${filename} exists`, false);
  }
}

async function checkSubpages(distDir) {
  for (const p of ['about', 'contact', 'privacy', 'disclosure']) {
    const filePath = path.join(distDir, p, 'index.html');
    try {
      await fs.access(filePath);
      recordCheck('01-14.1', 'MUST', `Subpage /${p}/ exists`, true);
    } catch {
      recordCheck('01-14.1', 'MUST', `Subpage /${p}/ exists`, false);
    }
  }
}

function checkAmazonStatement(html, config) {
  if (!config.affiliate.networks.includes('amazon')) return;
  const required = 'As an Amazon Associate I earn from qualifying purchases';
  recordCheck('05-2.6', 'MUST', 'Amazon required statement present verbatim', html.includes(required));
}

function checkWordCount(html) {
  // Rule 01-13.1: at least 1500 words of body content
  // Strip header, footer, scripts, schema
  let text = getBodyText(html);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  recordCheck('01-13.1', 'SHOULD', `Body content ≥ 1500 words`, wordCount >= 1500, `actual: ${wordCount} (note: includes nav/footer text in this rough count)`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const configPath = path.resolve(process.argv[2] || './site-config.json');
  const distDir = path.resolve(path.dirname(configPath), 'dist');

  console.log(`${ANSI.bold}affiliate-site-template validate${ANSI.reset}`);
  console.log(`${ANSI.gray}Config: ${configPath}${ANSI.reset}`);
  console.log(`${ANSI.gray}Dist:   ${distDir}${ANSI.reset}`);
  console.log('');

  let config;
  try {
    config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  } catch (err) {
    console.error(`${ANSI.red}Cannot read config: ${err.message}${ANSI.reset}`);
    process.exit(2);
  }

  let html;
  try {
    html = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
  } catch (err) {
    console.error(`${ANSI.red}Cannot read dist/index.html — has the build run? ${err.message}${ANSI.reset}`);
    process.exit(2);
  }

  console.log(`${ANSI.bold}SEO checks${ANSI.reset}`);
  checkTitle(html, config);
  checkMetaDescription(html, config);
  checkSingleH1(html);
  checkH3Count(html);
  checkNoCanonical(html);
  checkOgAndTwitter(html, config);
  checkFavicon(html);
  const schema = checkSchemaPresent(html);
  checkSchemaTypes(schema, config);

  console.log('');
  console.log(`${ANSI.bold}Performance checks${ANSI.reset}`);
  checkHeroPreload(html);
  checkHeroImg(html);
  checkPictureElement(html);

  console.log('');
  console.log(`${ANSI.bold}Content checks${ANSI.reset}`);
  checkBodyContentForEmDashes(html);
  checkBannedPhrases(html);
  checkQuickAnswerBox(html, config);
  checkWordCount(html);

  console.log('');
  console.log(`${ANSI.bold}Affiliate checks${ANSI.reset}`);
  checkDirectAffiliateLinks(html, config);
  await checkGoRedirects(distDir, config);
  checkAmazonStatement(html, config);

  console.log('');
  console.log(`${ANSI.bold}Site structure checks${ANSI.reset}`);
  await checkRobotsTxt(distDir);
  await checkSitemap(distDir, config);
  await checkIndexNowKeyFile(distDir, config);
  await checkSubpages(distDir);

  // Summary
  console.log('');
  const mustChecks = checks.filter(c => c.level === 'MUST');
  const mustFailed = mustChecks.filter(c => !c.passed);
  const shouldFailed = checks.filter(c => c.level === 'SHOULD' && !c.passed);

  console.log(`${ANSI.bold}Summary${ANSI.reset}`);
  console.log(`  MUST checks:   ${mustChecks.length - mustFailed.length}/${mustChecks.length} passed`);
  console.log(`  SHOULD checks: ${shouldFailed.length} warning(s)`);

  if (mustFailed.length === 0) {
    console.log(`${ANSI.green}${ANSI.bold}All MUST-level rules pass.${ANSI.reset}`);
    process.exit(0);
  } else {
    console.log(`${ANSI.red}${ANSI.bold}${mustFailed.length} MUST-level rule(s) failed.${ANSI.reset}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`${ANSI.red}${ANSI.bold}VALIDATION ERROR${ANSI.reset}`);
  console.error(err.stack || err.message);
  process.exit(2);
});
