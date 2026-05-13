#!/usr/bin/env node

/**
 * generate-images.mjs
 *
 * Generates hero images (and optionally favicons) for an affiliate site using
 * Google's Imagen API. Reads site-config.json, builds a niche-appropriate
 * prompt, calls Imagen, and writes the results into public/og-images/ and
 * (optionally) public/.
 *
 * Usage:
 *   node scripts/generate-images.mjs                       (uses ./site-config.json)
 *   node scripts/generate-images.mjs ./other-config.json
 *   node scripts/generate-images.mjs --hero-only           (skip favicon generation)
 *   node scripts/generate-images.mjs --favicon-only        (skip hero generation)
 *   node scripts/generate-images.mjs --force               (overwrite existing files)
 *
 * Requires:
 *   - GEMINI_API_KEY in a .env file at the repo root
 *   - npm packages: @google/genai, sharp, dotenv
 *
 * Cost (Imagen 4 standard, May 2026): roughly $0.04 per generated image.
 * One site = one hero generation (we resize from one source) = roughly $0.04.
 * If --favicon is enabled, that's a second call = roughly $0.08 total per site.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { GoogleGenAI } from '@google/genai';

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
  console.error(`${ANSI.red}${ANSI.bold}IMAGE GEN FAILED${ANSI.reset} ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const force = args.includes('--force');
const heroOnly = args.includes('--hero-only');
const faviconOnly = args.includes('--favicon-only');
const configPath = path.resolve(args.find(a => !a.startsWith('--')) || './site-config.json');

const doHero = !faviconOnly;
const doFavicon = !heroOnly;

// ---------------------------------------------------------------------------
// Load environment + config
// ---------------------------------------------------------------------------

dotenv.config({ path: path.join(REPO_ROOT, '.env') });

if (!process.env.GEMINI_API_KEY) {
  die('GEMINI_API_KEY not found. Add it to a .env file at the repo root: GEMINI_API_KEY=AIza...');
}

let config;
try {
  config = JSON.parse(await fs.readFile(configPath, 'utf8'));
} catch (err) {
  die(`Cannot read config at ${configPath}: ${err.message}`);
}

const domain = config.site.domain;
const brandName = config.site.brandName;
const niche = config.site.niche;
const primaryKeyword = config.seo.primaryKeyword;
const accentColor = config.design.accentColor;
const primaryColor = config.design.primaryColor;

log(`${ANSI.bold}generate-images${ANSI.reset}`);
log(`Domain:  ${domain}`, 'gray');
log(`Niche:   ${niche}`, 'gray');
log(`Keyword: ${primaryKeyword}`, 'gray');
log('');

// ---------------------------------------------------------------------------
// Hero image prompt builder
// ---------------------------------------------------------------------------

/**
 * Build a niche-appropriate Imagen prompt for the hero image.
 *
 * Imagen responds well to:
 *  - Photographic style descriptors
 *  - Specific lighting language
 *  - Composition cues (wide angle, depth of field)
 *  - Negative prompts via explicit "no X" phrasing
 *
 * We compose: subject (from niche) + style + lighting + composition + negatives.
 */
function buildHeroPrompt(config) {
  const niche = config.site.niche;
  const keyword = config.seo.primaryKeyword;

  return [
    `A wide horizontal photograph in 16:9 aspect ratio, suitable as a website header image.`,
    `Subject: a tasteful, on-brand scene representing ${niche}.`,
    `Specifically depict elements relevant to "${keyword}" without including any text, logos, or watermarks.`,
    `Photographic style with shallow depth of field, soft natural lighting (golden hour or soft daylight), warm and inviting tone.`,
    `Composition framed for use as a website hero where readable text could be overlaid on the lower or upper third.`,
    `High resolution, sharp focus on the main subject, slightly blurred natural background.`,
    `No people facing the camera, no celebrity likenesses, no copyrighted characters, no brand names visible, no text, no watermarks, no UI elements.`,
  ].join(' ');
}

// ---------------------------------------------------------------------------
// Favicon prompt builder
// ---------------------------------------------------------------------------

function buildFaviconPrompt(config) {
  const brand = config.site.brandName;
  const niche = config.site.niche;
  const accent = config.design.accentColor;
  const primary = config.design.primaryColor;

  // Favicons are tiny; AI generation tends to produce too much detail.
  // We ask for a flat, single-symbol icon and the build-time resize
  // crunches it down. Better-than-nothing baseline; recommend manual
  // override via favicon.io for production.
  return [
    `A minimalist flat icon, single bold symbol on a transparent or solid background.`,
    `Subject: one recognizable symbol representing ${niche}, simple geometric shape, high contrast.`,
    `Color palette: ${primary} and ${accent} only.`,
    `Square 1:1 aspect ratio.`,
    `Flat 2D vector-style illustration, no gradients, no shadows, no text, no watermarks, no fine detail.`,
    `Designed to remain legible when scaled down to 16x16 or 32x32 pixels.`,
  ].join(' ');
}

// ---------------------------------------------------------------------------
// Imagen API call
// ---------------------------------------------------------------------------

async function generateImageWithImagen(prompt, aspectRatio) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  log(`  Calling Imagen API (aspect ratio ${aspectRatio})...`, 'gray');
  const startTime = Date.now();

  let response;
  try {
    response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio,
      },
    });
  } catch (err) {
    die(`Imagen API call failed: ${err.message}\n${err.stack || ''}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`  OK    Imagen responded in ${elapsed}s`, 'green');

  if (!response.generatedImages || response.generatedImages.length === 0) {
    die(`Imagen returned no images. Full response: ${JSON.stringify(response, null, 2)}`);
  }

  const imageBytes = response.generatedImages[0].image.imageBytes;
  return Buffer.from(imageBytes, 'base64');
}

// ---------------------------------------------------------------------------
// Hero image generation + resize
// ---------------------------------------------------------------------------

async function generateHero(config) {
  log(`${ANSI.bold}Hero image${ANSI.reset}`);

  const publicDir = path.join(path.dirname(configPath), 'public', 'og-images');
  await fs.mkdir(publicDir, { recursive: true });

  const stem = `${domain.replace(/\./g, '-')}-og`;
  const variants = [
    { width: 1920, height: 1080, suffix: '1920' },
    { width: 1200, height: 675,  suffix: '1200' },
    { width: 800,  height: 450,  suffix: '800' },
  ];

  // Check if all three variants already exist
  if (!force) {
    let allExist = true;
    for (const v of variants) {
      const filePath = path.join(publicDir, `${stem}-${v.suffix}.webp`);
      try { await fs.access(filePath); } catch { allExist = false; break; }
    }
    if (allExist) {
      log(`  SKIP  All three hero variants already exist. Use --force to regenerate.`, 'yellow');
      return;
    }
  }

  const prompt = buildHeroPrompt(config);
  log(`  Prompt: ${ANSI.gray}${prompt.substring(0, 100)}...${ANSI.reset}`);

  // Imagen 4 supports 16:9 aspect ratio natively (returns ~1408x768 base)
  // We resize from the returned image to our three target sizes
  const sourcePng = await generateImageWithImagen(prompt, '16:9');

  log(`  Resizing to 3 variants and converting to WebP...`, 'gray');

  for (const v of variants) {
    const outPath = path.join(publicDir, `${stem}-${v.suffix}.webp`);
    await sharp(sourcePng)
      .resize(v.width, v.height, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toFile(outPath);
    const stats = await fs.stat(outPath);
    log(`  OK    Wrote ${path.relative(REPO_ROOT, outPath)} (${(stats.size / 1024).toFixed(0)} KB)`, 'green');
  }

  // Also save the source PNG for posterity / regeneration
  const sourcePath = path.join(publicDir, `${stem}-source.png`);
  await fs.writeFile(sourcePath, sourcePng);
  log(`  OK    Wrote ${path.relative(REPO_ROOT, sourcePath)} (source backup)`, 'green');
}

// ---------------------------------------------------------------------------
// Favicon generation + resize
// ---------------------------------------------------------------------------

async function generateFavicon(config) {
  log(`${ANSI.bold}Favicon${ANSI.reset}`);

  const publicDir = path.join(path.dirname(configPath), 'public');
  await fs.mkdir(publicDir, { recursive: true });

  const targets = [
    { width: 32,  filename: 'favicon-32.png' },
    { width: 180, filename: 'apple-touch-icon.png' },
  ];

  if (!force) {
    let allExist = true;
    for (const t of targets) {
      const filePath = path.join(publicDir, t.filename);
      try { await fs.access(filePath); } catch { allExist = false; break; }
    }
    if (allExist) {
      log(`  SKIP  Favicon files already exist. Use --force to regenerate.`, 'yellow');
      return;
    }
  }

  const prompt = buildFaviconPrompt(config);
  log(`  Prompt: ${ANSI.gray}${prompt.substring(0, 100)}...${ANSI.reset}`);

  const sourcePng = await generateImageWithImagen(prompt, '1:1');

  log(`  Resizing to favicon sizes...`, 'gray');

  for (const t of targets) {
    const outPath = path.join(publicDir, t.filename);
    await sharp(sourcePng)
      .resize(t.width, t.width, { fit: 'cover', position: 'center' })
      .png()
      .toFile(outPath);
    const stats = await fs.stat(outPath);
    log(`  OK    Wrote ${path.relative(REPO_ROOT, outPath)} (${(stats.size / 1024).toFixed(0)} KB)`, 'green');
  }

  // Generate favicon.ico from the 32x32 PNG (single-resolution ICO)
  // Modern browsers accept PNG-encoded ICOs; sharp can write them via raw output
  // For full multi-resolution ICO we'd use the 'png-to-ico' package, but the
  // single-res 32x32 covers the common case
  const ico32Buffer = await sharp(sourcePng).resize(32, 32, { fit: 'cover' }).png().toBuffer();
  await fs.writeFile(path.join(publicDir, 'favicon.ico'), ico32Buffer);
  log(`  OK    Wrote public/favicon.ico (single-resolution 32x32)`, 'green');

  log(`  ${ANSI.gray}Note: For production sites, consider replacing favicon.ico with a hand-crafted version from favicon.io for best small-size legibility.${ANSI.reset}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (doHero) await generateHero(config);
  if (doHero && doFavicon) log('');
  if (doFavicon) await generateFavicon(config);

  log('');
  log(`${ANSI.green}${ANSI.bold}Image generation complete.${ANSI.reset}`);
  log(`Run ${ANSI.cyan}node scripts/build-site.mjs${ANSI.reset} to rebuild the site with the new images.`);
}

main().catch(err => {
  console.error(`${ANSI.red}${ANSI.bold}UNHANDLED ERROR${ANSI.reset}`);
  console.error(err.stack || err.message);
  process.exit(1);
});
