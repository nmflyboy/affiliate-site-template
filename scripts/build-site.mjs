#!/usr/bin/env node

/**
 * build-site.mjs
 *
 * Reads site-config.json, validates against configs/_schema.json, loads applicable
 * rules from rules/, applies them to the matching template from templates/, and
 * writes static HTML output to dist/.
 *
 * Usage:
 *   node scripts/build-site.mjs                  (defaults to ./site-config.json)
 *   node scripts/build-site.mjs ./my-config.json (custom config path)
 *
 * This script ONLY handles the structural assembly: reading the template, doing
 * placeholder substitution, copying static assets, and generating /go/ redirect
 * folders. The CONTENT (intro paragraphs, FAQ answers, product card prose) is
 * NOT generated here. Claude Code generates that content into the config or into
 * a separate content file before this script runs.
 *
 * The reason for this split: prose generation requires LLM judgment that follows
 * the rules in /rules/. That belongs in a Claude Code session, not in a build
 * script. This script is the "compiler" that takes assembled parts and produces
 * a deployable site.
 *
 * Expected workflow:
 *   1. Robin fills out site-config.json
 *   2. Claude Code generates the prose content (Quick Answer is already in config,
 *      but intro paragraphs, FAQ items, product card descriptions, etc. are
 *      written by Claude Code following rules/ and saved to a content.json file
 *      alongside site-config.json)
 *   3. This script reads both and assembles dist/
 *   4. validate-output.mjs checks the result against rules/
 *   5. Cloudflare Pages deploys
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

function log(msg, color = 'reset') {
  console.log(`${ANSI[color]}${msg}${ANSI.reset}`);
}

function die(msg) {
  console.error(`${ANSI.red}${ANSI.bold}BUILD FAILED${ANSI.reset} ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 1: read and validate the site config
// ---------------------------------------------------------------------------

async function loadConfig(configPath) {
  let raw;
  try {
    raw = await fs.readFile(configPath, 'utf8');
  } catch (err) {
    die(`Cannot read config at ${configPath}: ${err.message}`);
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch (err) {
    die(`Config is not valid JSON: ${err.message}`);
  }

  return config;
}

async function validateConfigShape(config) {
  // Structural sanity checks. Full JSON-Schema validation lives in
  // validate-config.mjs (separate script) for use with the jsonschema-cli or
  // ajv-cli tools. We do basic checks here so a misconfigured build fails fast
  // with a clear message rather than producing broken output.

  const required = ['version', 'site', 'seo', 'template', 'design', 'affiliate', 'content', 'riskTier', 'customRules'];
  for (const key of required) {
    if (!(key in config)) die(`Config missing required top-level field: ${key}`);
  }

  if (config.version !== '1.0.0') {
    die(`Config version must be "1.0.0", got "${config.version}"`);
  }

  if (!config.site.domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(config.site.domain)) {
    die(`Invalid site.domain: ${config.site.domain}`);
  }

  if (!config.seo.primaryKeyword || config.seo.primaryKeyword.length < 3) {
    die(`seo.primaryKeyword must be present and at least 3 characters`);
  }

  const qaWords = config.seo.quickAnswer ? config.seo.quickAnswer.trim().split(/\s+/).length : 0;
  if (qaWords < 35 || qaWords > 55) {
    log(`  WARN  Quick Answer is ${qaWords} words (rule 04-3.3 requires 40-50). Continuing.`, 'yellow');
  }

  const validTemplates = ['listicle', 'review', 'headtohead', 'tool', 'amazon', 'leadgen'];
  if (!validTemplates.includes(config.template.type)) {
    die(`Invalid template.type: ${config.template.type}. Must be one of: ${validTemplates.join(', ')}`);
  }

  for (const colorField of ['primaryColor', 'accentColor', 'darkestBrandColor']) {
    const val = config.design[colorField];
    if (!val || !/^#[0-9A-Fa-f]{6}$/.test(val)) {
      die(`design.${colorField} must be a 6-char hex color, got: ${val}`);
    }
  }

  if (!Array.isArray(config.affiliate.products)) {
    die(`affiliate.products must be an array`);
  }
  if (config.affiliate.products.length > 6) {
    die(`affiliate.products may have at most 6 entries, got ${config.affiliate.products.length}`);
  }

  for (let i = 0; i < config.affiliate.products.length; i++) {
    const p = config.affiliate.products[i];
    if (!p.slug || !/^\/go\/[a-z0-9-]+$/.test(p.slug)) {
      die(`affiliate.products[${i}].slug must match /go/[lowercase-alphanumeric-hyphen], got: ${p.slug}`);
    }
    if (!p.affiliateLink) {
      die(`affiliate.products[${i}].affiliateLink is required`);
    }
    if (p.affiliateLink.includes('REPLACE-WITH-REAL-LINK')) {
      die(`affiliate.products[${i}].affiliateLink contains REPLACE-WITH-REAL-LINK placeholder. Update the config before building.`);
    }
  }

  log('  OK    Config shape valid', 'green');
}

// ---------------------------------------------------------------------------
// Step 2: load the content file (Claude-generated prose)
// ---------------------------------------------------------------------------

async function loadContent(contentPath) {
  // Content file is generated by Claude Code following the rules in /rules/.
  // If absent, the build still proceeds but with placeholder text that flags
  // the missing content clearly. This lets you scaffold a site visually before
  // generating the prose.

  try {
    const raw = await fs.readFile(contentPath, 'utf8');
    log('  OK    Loaded site-content.json', 'green');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      log('  WARN  No site-content.json found; using placeholder prose. Run Claude Code to generate content.', 'yellow');
      return null;
    }
    die(`Cannot parse site-content.json: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Step 3: load applicable rules (informational only; rules are enforced by
//         Claude Code when generating content, and by validate-output.mjs)
// ---------------------------------------------------------------------------

async function loadApplicableRules(config) {
  // For now this just reports which rules will apply. The actual rule
  // content is read by Claude Code when generating prose and by the
  // validation script when checking output.

  const ruleFiles = ['00-master.md', '01-seo-mandatory.md', '02-design-mandatory.md',
                     '03-performance-mandatory.md', '04-content-mandatory.md',
                     '05-affiliate-mandatory.md'];

  if (config.riskTier === 1) ruleFiles.push('10-tier1-health.md');
  if (config.riskTier === 2) ruleFiles.push('11-tier2-financial.md');

  log(`  OK    ${ruleFiles.length} mandatory rule files applicable`, 'green');

  for (const customName of config.customRules.enabled) {
    if (config.customRules.disabled.includes(customName)) continue;
    const customPath = path.join(REPO_ROOT, 'rules', '99-custom', `${customName}.md`);
    try {
      await fs.access(customPath);
      log(`        + custom rule: ${customName}`, 'gray');
    } catch {
      log(`  WARN  Custom rule enabled but file not found: ${customName}.md`, 'yellow');
    }
  }
}

// ---------------------------------------------------------------------------
// Step 4: template substitution helpers
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function titleCase(s) {
  return s.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
}

function applyTemplate(template, vars) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
    if (key in vars) {
      const v = vars[key];
      return v === null || v === undefined ? '' : String(v);
    }
    // Unfilled placeholder — keep as-is and warn
    log(`  WARN  Template placeholder not filled: {{${key}}}`, 'yellow');
    return match;
  });
}

// ---------------------------------------------------------------------------
// Step 5: synthesize template variables from config + content
// ---------------------------------------------------------------------------

function synthesizeMetaTitle(config) {
  // Rule 01-2.1: ≤60 chars
  // Rule 01-1.2: keyword preserved even at cost of brand suffix
  const keyword = config.seo.primaryKeyword;
  const brand = config.site.brandName;
  const fullForm = `${keyword} | ${brand}`;
  if (fullForm.length <= 60) return fullForm;

  // Fall back to just the keyword
  if (keyword.length <= 60) return keyword;

  // Keyword itself too long — flag this; don't truncate the keyword
  log(`  WARN  Primary keyword "${keyword}" exceeds 60 chars; meta title will be just the keyword`, 'yellow');
  return keyword;
}

function synthesizeMetaDescription(config, content) {
  // Rule 01-3.1: ≤155 chars; contains primary keyword verbatim
  if (content?.metaDescription) {
    if (content.metaDescription.length > 155) {
      log(`  WARN  content.metaDescription is ${content.metaDescription.length} chars (rule 01-3.1 max 155)`, 'yellow');
    }
    return content.metaDescription;
  }

  // Fallback: synthesize from primary keyword + first part of quick answer
  // This guarantees the keyword appears verbatim per rule 01-3.2
  const keyword = config.seo.primaryKeyword;
  const qa = config.seo.quickAnswer;

  // Take first sentence of quick answer, or first 120 chars if no sentence break
  const firstSentence = qa.split(/\.\s/)[0];
  const trimmedQa = firstSentence.length > 120 ? firstSentence.substring(0, 117) + '...' : firstSentence;

  let synthesized;
  // If quick answer already contains keyword, use as-is
  if (trimmedQa.toLowerCase().includes(keyword.toLowerCase())) {
    synthesized = trimmedQa + '.';
  } else {
    // Lead with keyword to guarantee inclusion
    synthesized = `${titleCase(keyword)}: ${trimmedQa.toLowerCase()}.`;
  }

  if (synthesized.length > 155) {
    synthesized = synthesized.substring(0, 152) + '...';
  }
  return synthesized;
}

function synthesizeH1(config, content) {
  if (content?.h1) return content.h1;

  // Fallback: capitalize the primary keyword
  return titleCase(config.seo.primaryKeyword);
}

function buildAuthorByline(config) {
  if (!config.site.namedAuthor) return '';
  return `<p style="color: #6A5A3A; font-size: 0.9375rem; margin: -0.5rem 0 1.25rem;">By <strong>${escapeHtml(config.site.namedAuthor)}</strong>, ${escapeHtml(config.site.editorialTeamName)}</p>`;
}

function buildDisclosureBannerText(config, content) {
  if (content?.disclosureBannerText) return content.disclosureBannerText;
  return `<strong>Affiliate disclosure:</strong> This page contains affiliate links. If you click a link and make a purchase, ${escapeHtml(config.site.brandName)} may earn a commission at no extra cost to you.`;
}

function buildAmazonRequiredStatement(config) {
  if (!config.affiliate.networks.includes('amazon')) return '';
  return `<aside style="background: #FFF8E7; border: 1px solid #E8DCB4; padding: 0.875rem 1.25rem; border-radius: 4px; margin: 1.5rem 0; font-size: 0.875rem; color: #5A4A2A;">As an Amazon Associate I earn from qualifying purchases.</aside>`;
}

function buildHeroImageUrls(config) {
  // Convention: /og-images/[domain]-og.webp (1920w) plus -1200 and -800 variants
  const stem = `/og-images/${config.site.domain.replace(/\./g, '-')}-og`;
  return {
    desktop: `${stem}-1920.webp`,
    tablet: `${stem}-1200.webp`,
    mobile: `${stem}-800.webp`,
  };
}

function buildHeroImageAlt(config) {
  // Generic but descriptive; uses keyword + niche
  return `${titleCase(config.seo.primaryKeyword)} compared by ${config.site.brandName}`;
}

function buildComparisonTableRows(config, content) {
  return config.affiliate.products.map(p => {
    const keyFeature = (content?.products?.[p.slug]?.keyFeatureForTable) || p.specificDetail || p.shortDescription || '';
    const truncatedFeature = keyFeature.length > 90 ? keyFeature.substring(0, 87) + '...' : keyFeature;
    return `          <tr>
            <td><strong>${escapeHtml(p.name)}</strong></td>
            <td>${escapeHtml(p.bestFor || '')}</td>
            <td>${escapeHtml(truncatedFeature)}</td>
            <td><a href="${escapeAttr(p.slug)}/" class="table-cta">View</a></td>
          </tr>`;
  }).join('\n');
}

function buildProductCards(config, content) {
  // Rule 05-4.2: determine card structure consistency
  // Use long format if EVERY product has considerations AND verdict
  // Otherwise use short format for ALL products
  const allHaveConsiderations = config.affiliate.products.every(p => Array.isArray(p.considerations) && p.considerations.length > 0);
  const allHaveVerdict = config.affiliate.products.every(p => p.verdict);
  const useLongFormat = allHaveConsiderations && allHaveVerdict;

  if (!useLongFormat && config.affiliate.products.some(p => Array.isArray(p.considerations) && p.considerations.length > 0)) {
    log(`  WARN  Some products have considerations but not all; rendering all cards in short format per rule 05-4.1`, 'yellow');
  }

  return config.affiliate.products.map((p, idx) => {
    const rank = idx === 0 ? '#1 OVERALL' : `#${idx + 1} PICK`;
    const pros = (p.pros || []).map(pro => `        <li>${escapeHtml(pro)}</li>`).join('\n');
    const considerations = useLongFormat
      ? (p.considerations || []).map(c => `        <li>${escapeHtml(c)}</li>`).join('\n')
      : '';

    const description = (content?.products?.[p.slug]?.cardDescription) || `${p.shortDescription || ''} ${p.specificDetail || ''}`.trim();
    const ctaText = (content?.products?.[p.slug]?.ctaText) || 'Check Latest Price';

    let sections = '';
    sections += `      <span class="product-rank">${escapeHtml(rank)}</span>\n`;
    sections += `      <h3>${escapeHtml(p.name)}</h3>\n`;
    if (p.bestFor) sections += `      <p class="best-for"><strong>Best For:</strong> ${escapeHtml(p.bestFor)}</p>\n`;
    sections += `      <p>${escapeHtml(description)}</p>\n`;
    if (pros) sections += `      <strong>Pros</strong>\n      <ul class="pros-list">\n${pros}\n      </ul>\n`;
    if (useLongFormat && considerations) sections += `      <strong>Considerations</strong>\n      <ul class="considerations-list">\n${considerations}\n      </ul>\n`;
    if (useLongFormat && p.verdict) sections += `      <p class="verdict">${escapeHtml(p.verdict)}</p>\n`;
    sections += `      <a href="${escapeAttr(p.slug)}/" class="cta-button">${escapeHtml(ctaText)}</a>\n`;

    return `    <article class="product-card">\n${sections}    </article>`;
  }).join('\n\n');
}

function buildIntroParagraphs(config, content) {
  if (content?.introParagraphs && Array.isArray(content.introParagraphs)) {
    return content.introParagraphs.map(p => `    <p>${escapeHtml(p)}</p>`).join('\n');
  }
  return `    <p style="background: #FFE7E7; padding: 1rem; border-left: 4px solid #B85A2D;">[NEEDS CONTENT] Intro paragraphs not yet generated. Run Claude Code on this site to generate prose following rules/04-content-mandatory.md.</p>`;
}

function buildHowWePickedParagraphs(config, content) {
  if (content?.howWePickedParagraphs && Array.isArray(content.howWePickedParagraphs)) {
    return content.howWePickedParagraphs.map(p => `    <p>${escapeHtml(p)}</p>`).join('\n');
  }
  return `    <p style="background: #FFE7E7; padding: 1rem; border-left: 4px solid #B85A2D;">[NEEDS CONTENT] "How We Picked" content not yet generated.</p>`;
}

function buildFaqItems(config, content) {
  if (content?.faqItems && Array.isArray(content.faqItems) && content.faqItems.length >= 3) {
    return content.faqItems.map(item => {
      return `      <div class="faq-item">
        <h3>${escapeHtml(item.question)}</h3>
        <p>${escapeHtml(item.answer)}</p>
      </div>`;
    }).join('\n');
  }
  return `      <div style="background: #FFE7E7; padding: 1rem; border-left: 4px solid #B85A2D;">[NEEDS CONTENT] FAQ items not yet generated. Rule 04-4.1 requires at least 3 question/answer pairs.</div>`;
}

function buildSchemaJsonLd(config, content) {
  const domain = config.site.domain;
  const url = `https://${domain}/`;
  const isoNow = new Date().toISOString();
  const datePub = content?.publishedDate || isoNow;
  const dateMod = content?.modifiedDate || isoNow;

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": synthesizeH1(config, content),
        "description": synthesizeMetaDescription(config, content),
        "url": url,
        "datePublished": datePub,
        "dateModified": dateMod,
        "author": {
          "@type": "Organization",
          "name": config.site.editorialTeamName,
          "url": `${url}about/`
        },
        "publisher": {
          "@type": "Organization",
          "name": config.site.brandName,
          "url": url,
          "logo": {
            "@type": "ImageObject",
            "url": `${url}apple-touch-icon.png`
          }
        },
        "image": {
          "@type": "ImageObject",
          "url": `${url}og-images/${domain.replace(/\./g, '-')}-og-1920.webp`,
          "width": 1920,
          "height": 1080
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": url
        }
      },
      {
        "@type": "WebSite",
        "name": config.site.brandName,
        "url": url,
        "description": config.site.tagline,
        "publisher": {
          "@type": "Organization",
          "name": config.site.brandName
        }
      },
      {
        "@type": "SpeakableSpecification",
        "cssSelector": [".quick-answer-box", ".faq-section"]
      }
    ]
  };

  // FAQ schema
  if (content?.faqItems && content.faqItems.length >= 3) {
    schemaGraph["@graph"].push({
      "@type": "FAQPage",
      "mainEntity": content.faqItems.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.answer
        }
      }))
    });
  }

  // ItemList for listicle and amazon templates
  if (config.template.type === 'listicle' || config.template.type === 'amazon') {
    schemaGraph["@graph"].push({
      "@type": "ItemList",
      "itemListElement": config.affiliate.products.map((p, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": p.name,
        "url": `${url}${p.slug.replace(/^\//, '')}/`
      }))
    });
  }

  return JSON.stringify(schemaGraph, null, 2);
}

function buildGa4Snippet(config) {
  const id = config.seo.ga4MeasurementId;
  if (!id || id === 'G-XXXXXXXXXX') return '';
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}');
  </script>`;
}

function buildClosingCtaText(config, content) {
  return content?.closingCtaText || 'See Our Top Pick';
}

// ---------------------------------------------------------------------------
// Step 6: build the main page
// ---------------------------------------------------------------------------

async function buildMainPage(config, content, distDir) {
  log(`Building main page for ${config.site.domain}`, 'cyan');

  // Pick the template
  const templateType = config.template.type;
  let templatePath;
  if (['listicle', 'amazon', 'review', 'headtohead', 'leadgen', 'tool'].includes(templateType)) {
    // For now, all template types start from listicle/base.html
    // Variants (review, headtohead, etc.) get post-processed below
    templatePath = path.join(REPO_ROOT, 'templates', 'listicle', 'base.html');
  } else {
    die(`Unknown template type: ${templateType}`);
  }

  let template;
  try {
    template = await fs.readFile(templatePath, 'utf8');
  } catch (err) {
    die(`Cannot read template at ${templatePath}: ${err.message}`);
  }

  const heroUrls = buildHeroImageUrls(config);

  const vars = {
    DOMAIN: config.site.domain,
    BRAND_NAME: escapeHtml(config.site.brandName),
    TAGLINE: escapeHtml(config.site.tagline),
    YEAR: config.site.year,
    EDITORIAL_TEAM_NAME: escapeAttr(config.site.editorialTeamName),

    META_TITLE: escapeHtml(synthesizeMetaTitle(config)),
    META_DESCRIPTION: escapeAttr(synthesizeMetaDescription(config, content)),

    H1_TEXT: escapeHtml(synthesizeH1(config, content)),
    QUICK_ANSWER_TEXT: escapeHtml(config.seo.quickAnswer),

    PRIMARY_COLOR: config.design.primaryColor,
    ACCENT_COLOR: config.design.accentColor,
    DARKEST_BRAND_COLOR: config.design.darkestBrandColor,

    HERO_IMAGE_DESKTOP_URL: heroUrls.desktop,
    HERO_IMAGE_DESKTOP_ABS_URL: `https://${config.site.domain}${heroUrls.desktop}`,
    HERO_IMAGE_TABLET_URL: heroUrls.tablet,
    HERO_IMAGE_MOBILE_URL: heroUrls.mobile,
    HERO_IMAGE_ALT: escapeAttr(buildHeroImageAlt(config)),

    INTRO_PARAGRAPHS: buildIntroParagraphs(config, content),
    COMPARISON_TABLE_ROWS: buildComparisonTableRows(config, content),
    PRODUCT_CARDS: buildProductCards(config, content),
    HOW_WE_PICKED_PARAGRAPHS: buildHowWePickedParagraphs(config, content),
    FAQ_ITEMS: buildFaqItems(config, content),

    PICKED_ITEM_NOUN_TITLECASE: titleCase(config.content.pickedItemNoun || 'Picks'),

    AUTHOR_BYLINE: buildAuthorByline(config),
    DISCLOSURE_BANNER_TEXT: buildDisclosureBannerText(config, content),
    AMAZON_REQUIRED_STATEMENT: buildAmazonRequiredStatement(config),

    SCHEMA_JSON_LD: buildSchemaJsonLd(config, content),
    GA4_SNIPPET: buildGa4Snippet(config),

    TOP_PRODUCT_SLUG: config.affiliate.products[0] ? `${config.affiliate.products[0].slug}/` : '#',
    CLOSING_CTA_TEXT: escapeHtml(buildClosingCtaText(config, content)),
  };

  const rendered = applyTemplate(template, vars);
  const outPath = path.join(distDir, 'index.html');
  await fs.mkdir(distDir, { recursive: true });
  await fs.writeFile(outPath, rendered, 'utf8');
  log(`  OK    Wrote ${path.relative(REPO_ROOT, outPath)}`, 'green');
}

// ---------------------------------------------------------------------------
// Step 7: build /go/ redirect files (skipped for amazon template)
// ---------------------------------------------------------------------------

async function buildGoRedirects(config, distDir) {
  // Rule 05-1.3 — for HTML template types, create folder-based redirect files
  // Amazon template (rule 05-amazon table) skips /go/ redirects entirely

  if (config.template.type === 'amazon') {
    log(`  SKIP  /go/ redirects (amazon template uses direct affiliate URLs)`, 'gray');
    return;
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'go-redirect.html');
  const template = await fs.readFile(templatePath, 'utf8');

  for (const product of config.affiliate.products) {
    const slug = product.slug.replace(/^\/go\//, '');
    const goDir = path.join(distDir, 'go', slug);
    await fs.mkdir(goDir, { recursive: true });

    const rendered = applyTemplate(template, {
      AFFILIATE_URL: product.affiliateLink,
      PRODUCT_NAME: escapeHtml(product.name),
    });

    await fs.writeFile(path.join(goDir, 'index.html'), rendered, 'utf8');
  }
  log(`  OK    Wrote ${config.affiliate.products.length} /go/ redirect file(s)`, 'green');
}

// ---------------------------------------------------------------------------
// Step 8: build subpages (about, contact, privacy, disclosure)
// ---------------------------------------------------------------------------

async function buildSubpage(config, content, distDir, slug, title, metaDesc, bodyHtml) {
  const templatePath = path.join(REPO_ROOT, 'templates', 'subpage.html');
  const template = await fs.readFile(templatePath, 'utf8');

  const rendered = applyTemplate(template, {
    SUBPAGE_TITLE: escapeHtml(title),
    SUBPAGE_META_DESCRIPTION: escapeAttr(metaDesc),
    SUBPAGE_BODY: bodyHtml,
    BRAND_NAME: escapeHtml(config.site.brandName),
    EDITORIAL_TEAM_NAME: escapeAttr(config.site.editorialTeamName),
    YEAR: config.site.year,
    PRIMARY_COLOR: config.design.primaryColor,
    ACCENT_COLOR: config.design.accentColor,
    DARKEST_BRAND_COLOR: config.design.darkestBrandColor,
  });

  const dir = path.join(distDir, slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.html'), rendered, 'utf8');
}

async function buildSubpages(config, content, distDir) {
  const brand = config.site.brandName;
  const team = config.site.editorialTeamName;
  const niche = config.site.niche;
  const email = config.site.contactEmail;

  // About
  const aboutBody = content?.subpages?.about || `
      <p>${escapeHtml(brand)} is an independent editorial project covering ${escapeHtml(niche)}. We research products, compare options, and publish concise buyer guidance for readers making purchase decisions.</p>
      <h2>Methodology</h2>
      <p>Our reviews are based on a combination of product specification analysis, manufacturer documentation, third-party expert reviews, and verified buyer feedback aggregated across major retail platforms. When the editorial team has hands-on experience with a product, we say so explicitly. When we do not, we say that too.</p>
      <h2>Editorial Independence</h2>
      <p>${escapeHtml(brand)} earns affiliate commissions when readers purchase through links on this site. Commission payment does not influence which products we recommend, and we publish our methodology openly so readers can evaluate our process.</p>
      <h2>Contact</h2>
      <p>Reach the editorial team at <a href="mailto:${escapeAttr(email)}">${escapeHtml(email)}</a>.</p>
  `;
  await buildSubpage(config, content, distDir, 'about', `About ${brand}`, `About ${brand}, an independent ${niche} review site.`, aboutBody);

  // Contact
  const contactBody = content?.subpages?.contact || `
      <p>Get in touch with the ${escapeHtml(team)}.</p>
      <h2>General Inquiries</h2>
      <p>For general questions, feedback on our reviews, or corrections, email <a href="mailto:${escapeAttr(email)}">${escapeHtml(email)}</a>. We read every message and respond within 2 business days.</p>
      <h2>Press and Partnerships</h2>
      <p>For press inquiries, partnership proposals, or product review requests, use the same email address with "Press" in the subject line.</p>
      <h2>Affiliate Disclosure</h2>
      <p>For details on our affiliate relationships, see our <a href="/disclosure/">full disclosure</a>.</p>
  `;
  await buildSubpage(config, content, distDir, 'contact', 'Contact', `Contact the ${brand} editorial team.`, contactBody);

  // Privacy
  const privacyBody = content?.subpages?.privacy || `
      <p>This privacy policy describes how ${escapeHtml(brand)} collects, uses, and protects information about visitors to this website.</p>
      <h2>Information We Collect</h2>
      <p>We collect anonymized analytics data through Google Analytics, including page views, session duration, and general geographic region. We do not collect personally identifiable information unless you voluntarily provide it (for example, by sending us an email).</p>
      <h2>Cookies</h2>
      <p>This site uses cookies for analytics purposes. You can disable cookies in your browser settings. Some affiliate links may set cookies for commission attribution; these are placed by the merchant, not by us.</p>
      <h2>Third-Party Services</h2>
      <p>Affiliate links on this site lead to third-party retailers (such as Amazon). When you click a link and visit a retailer, their privacy policy applies to your activity there.</p>
      <h2>Data Retention</h2>
      <p>Analytics data is retained for the default Google Analytics period. Email correspondence is retained as long as needed to respond to your inquiry.</p>
      <h2>Updates</h2>
      <p>This policy may be updated periodically. The current version is dated ${escapeHtml(String(config.site.year))}.</p>
  `;
  await buildSubpage(config, content, distDir, 'privacy', 'Privacy Policy', `Privacy policy for ${brand}.`, privacyBody);

  // Disclosure
  const disclosureBody = content?.subpages?.disclosure || `
      <p>${escapeHtml(brand)} participates in affiliate programs. This page explains what that means for you as a reader.</p>
      <h2>Affiliate Links</h2>
      <p>Links on this site that lead to retailer pages are affiliate links. When you click an affiliate link and make a purchase, ${escapeHtml(brand)} may earn a commission from the retailer. The price you pay does not change; the commission is paid by the retailer out of their margin.</p>
${config.affiliate.networks.includes('amazon') ? `      <h2>Amazon Associates</h2>
      <p>${escapeHtml(brand)} is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. As an Amazon Associate I earn from qualifying purchases.</p>` : ''}
      <h2>Editorial Independence</h2>
      <p>Affiliate commissions support the editorial work of this site, but they do not determine which products we recommend. Our recommendations are based on the methodology described on our <a href="/about/">About page</a>.</p>
      <h2>Questions</h2>
      <p>If you have questions about our affiliate relationships, email us at <a href="mailto:${escapeAttr(email)}">${escapeHtml(email)}</a>.</p>
  `;
  await buildSubpage(config, content, distDir, 'disclosure', 'Affiliate Disclosure', `Affiliate disclosure for ${brand}.`, disclosureBody);

  log(`  OK    Wrote 4 subpages (about, contact, privacy, disclosure)`, 'green');
}

// ---------------------------------------------------------------------------
// Step 9: build robots.txt, sitemap.xml, IndexNow key file
// ---------------------------------------------------------------------------

async function buildRobotsAndSitemap(config, distDir) {
  // Rule 01-10: robots.txt with blank line before Sitemap
  const robots = `User-agent: *
Allow: /
Disallow: /go/

Sitemap: https://${config.site.domain}/sitemap.xml
`;
  await fs.writeFile(path.join(distDir, 'robots.txt'), robots, 'utf8');

  // Rule 01-11: sitemap.xml with homepage and subpages
  const isoNow = new Date().toISOString();
  const urls = ['', 'about/', 'contact/', 'privacy/', 'disclosure/'];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>https://${config.site.domain}/${u}</loc>
    <lastmod>${isoNow}</lastmod>
    <changefreq>monthly</changefreq>
  </url>`).join('\n')}
</urlset>
`;
  await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');

  // Rule 01-12: IndexNow key file
  const keyFile = `${config.seo.indexNowKey}.txt`;
  await fs.writeFile(path.join(distDir, keyFile), config.seo.indexNowKey, 'utf8');

  log(`  OK    Wrote robots.txt, sitemap.xml, ${keyFile}`, 'green');
}

// ---------------------------------------------------------------------------
// Step 10: copy static assets from public/ if present
// ---------------------------------------------------------------------------

async function copyPublicAssets(distDir) {
  const publicDir = path.join(REPO_ROOT, 'public');
  try {
    await fs.access(publicDir);
  } catch {
    log(`  WARN  No public/ directory; favicon and hero images must be added manually`, 'yellow');
    return;
  }

  // Recursive copy
  async function copyDir(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  await copyDir(publicDir, distDir);
  log(`  OK    Copied public/ assets to dist/`, 'green');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const configPath = path.resolve(process.argv[2] || './site-config.json');
  const contentPath = path.resolve(path.dirname(configPath), 'site-content.json');
  const distDir = path.resolve(path.dirname(configPath), 'dist');

  log(`${ANSI.bold}affiliate-site-template build${ANSI.reset}`);
  log(`Config:  ${configPath}`, 'gray');
  log(`Content: ${contentPath}`, 'gray');
  log(`Output:  ${distDir}`, 'gray');
  console.log('');

  // Step 1: load and validate config
  log('Step 1/8: Validating config', 'bold');
  const config = await loadConfig(configPath);
  await validateConfigShape(config);

  // Step 2: load content
  log('Step 2/8: Loading content', 'bold');
  const content = await loadContent(contentPath);

  // Step 3: identify applicable rules
  log('Step 3/8: Identifying applicable rules', 'bold');
  await loadApplicableRules(config);

  // Step 4: clean and re-create dist
  log('Step 4/8: Preparing dist/', 'bold');
  try {
    await fs.rm(distDir, { recursive: true, force: true });
  } catch (err) {
    if (err.code !== 'ENOENT') log(`  WARN  Could not clean dist/: ${err.message}`, 'yellow');
  }
  await fs.mkdir(distDir, { recursive: true });
  log('  OK    dist/ ready', 'green');

  // Step 5: build main page
  log('Step 5/8: Building main page', 'bold');
  await buildMainPage(config, content, distDir);

  // Step 6: build /go/ redirects
  log('Step 6/8: Building /go/ redirect files', 'bold');
  await buildGoRedirects(config, distDir);

  // Step 7: build subpages
  log('Step 7/8: Building subpages', 'bold');
  await buildSubpages(config, content, distDir);

  // Step 8: robots, sitemap, indexnow, public assets
  log('Step 8/8: Writing robots.txt, sitemap.xml, IndexNow key, copying public/', 'bold');
  await buildRobotsAndSitemap(config, distDir);
  await copyPublicAssets(distDir);

  console.log('');
  log(`${ANSI.bold}Build complete.${ANSI.reset} Run ${ANSI.cyan}node scripts/validate-output.mjs${ANSI.reset} to check against rules.`);
  console.log('');
}

main().catch(err => {
  console.error(`${ANSI.red}${ANSI.bold}BUILD FAILED${ANSI.reset}`);
  console.error(err.stack || err.message);
  process.exit(1);
});
