#!/usr/bin/env node

/**
 * generate-images.mjs (v2 — Path A: manual generation, automated resize)
 *
 * Generates hero images and favicons via a two-step workflow:
 *   1. Print site-specific prompts to terminal + INSTRUCTIONS.txt
 *   2. You generate the source images manually in ChatGPT, Gemini, or Grok
 *   3. Save the source PNGs at known paths
 *   4. Run the script again with --resize to produce the final WebP/ICO/PNG variants
 *
 * Usage:
 *   node scripts/generate-images.mjs                     (default: print prompts)
 *   node scripts/generate-images.mjs --prompt-only       (same — print prompts only)
 *   node scripts/generate-images.mjs --resize            (resize both hero + favicon)
 *   node scripts/generate-images.mjs --resize-hero       (resize hero only)
 *   node scripts/generate-images.mjs --resize-favicon    (resize favicon only)
 *
 * No API keys required. No billing relationships. Uses your existing
 * ChatGPT Plus / Gemini Advanced / Grok subscription for the manual
 * generation step.
 *
 * Source file locations (you save these manually after generation):
 *   public/og-images/source.png          (hero source)
 *   public/favicon-source.png             (favicon source)
 *
 * Output file locations (this script writes these):
 *   public/og-images/[domain]-og-1920.webp  (desktop hero)
 *   public/og-images/[domain]-og-1200.webp  (tablet hero)
 *   public/og-images/[domain]-og-800.webp   (mobile hero)
 *   public/favicon.ico                       (32x32)
 *   public/favicon-32.png                    (32x32 PNG)
 *   public/apple-touch-icon.png              (180x180)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

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
  blue: '\x1b[34m',
};

function log(msg, color = 'reset') {
  console.log(`${ANSI[color]}${msg}${ANSI.reset}`);
}

function die(msg) {
  console.error(`${ANSI.red}${ANSI.bold}FAILED${ANSI.reset} ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const promptOnly = args.includes('--prompt-only') || !args.some(a => a.startsWith('--resize'));
const resizeAll = args.includes('--resize');
const resizeHero = resizeAll || args.includes('--resize-hero');
const resizeFavicon = resizeAll || args.includes('--resize-favicon');
const configPathArg = args.find(a => !a.startsWith('--'));
const configPath = path.resolve(configPathArg || './site-config.json');

// ---------------------------------------------------------------------------
// Load config
// ---------------------------------------------------------------------------

let config;
try {
  config = JSON.parse(await fs.readFile(configPath, 'utf8'));
} catch (err) {
  die(`Cannot read config at ${configPath}: ${err.message}`);
}

const REPO_DIR = path.dirname(configPath);
const PUBLIC_DIR = path.join(REPO_DIR, 'public');
const OG_IMAGES_DIR = path.join(PUBLIC_DIR, 'og-images');
const HERO_SOURCE = path.join(OG_IMAGES_DIR, 'source.png');
const FAVICON_SOURCE = path.join(PUBLIC_DIR, 'favicon-source.png');

const domain = config.site.domain;
const brandName = config.site.brandName;
const niche = config.site.niche;
const primaryKeyword = config.seo.primaryKeyword;
const accentColor = config.design.accentColor;
const primaryColor = config.design.primaryColor;
const darkestColor = config.design.darkestBrandColor;

// ---------------------------------------------------------------------------
// Hero prompt builder
// ---------------------------------------------------------------------------

function buildHeroPrompt(config) {
  return [
    `Generate a single wide horizontal hero image with a 16:9 aspect ratio,`,
    `designed as a website header for an editorial review site.`,
    ``,
    `Subject: a tasteful editorial scene depicting ${niche}.`,
    `Specifically include visual elements that a reader searching for "${primaryKeyword}" would find relevant and trustworthy.`,
    ``,
    `Composition: leave the LEFT THIRD of the frame relatively uncluttered`,
    `so readable text could be overlaid in that area. Main subject positioned`,
    `in the center-right of the frame.`,
    ``,
    `Style: editorial photographic style with shallow depth of field, soft`,
    `natural lighting (golden hour or soft morning light) coming from the side.`,
    `Slightly blurred natural background suggesting an appropriate setting`,
    `for the subject matter. Sharp focus on the main subject.`,
    ``,
    `Color tone: warm and inviting, restrained palette, magazine-quality`,
    `aesthetic suggesting a premium product review.`,
    ``,
    `Output: ONE image only, full 16:9 frame. Do not combine multiple images`,
    `into a grid or contact sheet. If you want to offer alternatives, I will`,
    `ask for a new variation in a follow-up message.`,
    ``,
    `Forbidden elements: NO people facing the camera, NO celebrity likenesses,`,
    `NO copyrighted characters, NO brand names visible, NO logos, NO text overlays,`,
    `NO watermarks, NO UI elements, NO promotional banners.`,
  ].join(' ').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Favicon prompt builder
// ---------------------------------------------------------------------------

function buildFaviconPrompt(config) {
  return [
    `Generate a single minimalist flat icon design.`,
    ``,
    `Subject: a single bold geometric symbol representing ${niche}.`,
    `Choose ONE iconic visual element associated with the niche (not multiple combined).`,
    `Examples of good single-symbol approaches: silhouette of a key piece of equipment,`,
    `stylized abstract representation, single recognizable shape.`,
    ``,
    `Format: square 1:1 aspect ratio. Flat 2D vector-style illustration only.`,
    `Solid colors only, NO gradients, NO shadows, NO fine detail.`,
    ``,
    `Color palette: use only these two colors:`,
    `  - Primary: ${primaryColor} (the deeper background or main shape)`,
    `  - Accent: ${accentColor} (the highlight or detail)`,
    `Optionally a small amount of white space.`,
    ``,
    `Critical requirement: the design must remain legible and recognizable`,
    `when scaled down to 16x16 pixels (the size of a browser favicon).`,
    `Avoid any details thinner than ~5% of the icon width.`,
    ``,
    `Output: ONE image only, full square frame. Do not combine multiple icons`,
    `into a grid or contact sheet.`,
    ``,
    `Forbidden elements: NO text, NO numbers, NO letters, NO watermarks,`,
    `NO photorealism, NO complex illustration, NO branded characters.`,
  ].join(' ').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Prompt-only mode
// ---------------------------------------------------------------------------

async function printPrompts(config) {
  const heroPrompt = buildHeroPrompt(config);
  const faviconPrompt = buildFaviconPrompt(config);

  // Make sure the output directory exists so we can save INSTRUCTIONS.txt
  await fs.mkdir(OG_IMAGES_DIR, { recursive: true });

  const heroSavePath = HERO_SOURCE;
  const faviconSavePath = FAVICON_SOURCE;

  const headerLine = '='.repeat(72);
  const dashLine = '-'.repeat(70);

  // Build the on-screen output AND the instructions file content
  const fullInstructions = [
    headerLine,
    `  IMAGE GENERATION INSTRUCTIONS — ${brandName} (${domain})`,
    headerLine,
    ``,
    `Niche:        ${niche}`,
    `Keyword:      ${primaryKeyword}`,
    `Brand colors: ${primaryColor} primary / ${accentColor} accent`,
    ``,
    headerLine,
    `  STEP 1 OF 2: HERO IMAGE`,
    headerLine,
    ``,
    `1. COPY this prompt and paste it into ChatGPT, Gemini, or Grok:`,
    ``,
    dashLine,
    heroPrompt,
    dashLine,
    ``,
    `2. The chat tool generates an image. If you like it, save it. If not,`,
    `   ask the tool: "another variation, please" — it will generate a fresh one.`,
    `   Repeat until you have one you like.`,
    ``,
    `3. SAVE the chosen image as a PNG file at this exact path:`,
    ``,
    `   ${heroSavePath}`,
    ``,
    `4. RUN:`,
    ``,
    `   node scripts/generate-images.mjs --resize-hero`,
    ``,
    `   This produces:`,
    `   - ${path.join(OG_IMAGES_DIR, `${domain.replace(/\./g, '-')}-og-1920.webp`)}`,
    `   - ${path.join(OG_IMAGES_DIR, `${domain.replace(/\./g, '-')}-og-1200.webp`)}`,
    `   - ${path.join(OG_IMAGES_DIR, `${domain.replace(/\./g, '-')}-og-800.webp`)}`,
    ``,
    headerLine,
    `  STEP 2 OF 2: FAVICON`,
    headerLine,
    ``,
    `OPTION A (recommended): Use https://favicon.io for best small-size legibility.`,
    `Pick a single emoji or upload your own SVG/PNG, download the package,`,
    `unzip into ${PUBLIC_DIR}, and skip the --resize-favicon step entirely.`,
    ``,
    `OPTION B: AI-generate via chat tool.`,
    ``,
    `1. COPY this prompt and paste it into ChatGPT, Gemini, or Grok:`,
    ``,
    dashLine,
    faviconPrompt,
    dashLine,
    ``,
    `2. If the result isn't right, ask for another variation in a follow-up.`,
    ``,
    `3. SAVE the chosen image as a PNG file at this exact path:`,
    ``,
    `   ${faviconSavePath}`,
    ``,
    `4. RUN:`,
    ``,
    `   node scripts/generate-images.mjs --resize-favicon`,
    ``,
    `   This produces:`,
    `   - ${path.join(PUBLIC_DIR, 'favicon.ico')}`,
    `   - ${path.join(PUBLIC_DIR, 'favicon-32.png')}`,
    `   - ${path.join(PUBLIC_DIR, 'apple-touch-icon.png')}`,
    ``,
    headerLine,
    `  AFTER BOTH STEPS COMPLETE`,
    headerLine,
    ``,
    `Run: node scripts/build-site.mjs`,
    `Then: node scripts/validate-output.mjs`,
    ``,
    `The build script copies everything in public/ into dist/ automatically.`,
    ``,
    headerLine,
    `  TIPS`,
    headerLine,
    ``,
    `- ChatGPT's DALL-E 3 sometimes wants to give you a contact-sheet grid`,
    `  even when asked for one image. The prompt above explicitly asks for`,
    `  one image only; if you still get a grid, regenerate or follow up with`,
    `  "give me just one image, not a grid".`,
    ``,
    `- If a generation has weird artifacts (extra fingers, distorted text, etc),`,
    `  just say "another variation" in the chat. AI image gen is non-deterministic;`,
    `  the second or third try is often much better.`,
    ``,
    `- To regenerate after editing the prompt or trying different chat tools,`,
    `  just save the new source PNG over the old one and re-run --resize.`,
    ``,
    `- For the hero, the LEFT THIRD must be relatively empty so the Quick Answer`,
    `  box overlays cleanly. If the chat tool fills the whole frame, ask it to`,
    `  "leave the left side empty for text overlay" as a follow-up.`,
    ``,
    headerLine,
    ``,
  ].join('\n');

  // Print to console
  log('');
  log(headerLine, 'cyan');
  log(`  Hero image prompt for ${brandName} (${domain})`, 'cyan');
  log(headerLine, 'cyan');
  log('');
  log('Copy this and paste into ChatGPT, Gemini, or Grok:', 'bold');
  log('');
  log(heroPrompt, 'green');
  log('');
  log(`Save your favorite as: ${HERO_SOURCE}`, 'yellow');
  log(`Then run:               node scripts/generate-images.mjs --resize-hero`, 'yellow');
  log('');
  log(headerLine, 'cyan');
  log(`  Favicon prompt for ${brandName}`, 'cyan');
  log(headerLine, 'cyan');
  log('');
  log(`(Optional — recommended alternative: use https://favicon.io for best results)`, 'gray');
  log('');
  log('Or copy this prompt:', 'bold');
  log('');
  log(faviconPrompt, 'green');
  log('');
  log(`Save your favorite as: ${FAVICON_SOURCE}`, 'yellow');
  log(`Then run:               node scripts/generate-images.mjs --resize-favicon`, 'yellow');
  log('');

  // Save full instructions to file
  const instructionsPath = path.join(OG_IMAGES_DIR, 'INSTRUCTIONS.txt');
  await fs.writeFile(instructionsPath, fullInstructions, 'utf8');
  log(`Full instructions also saved to: ${ANSI.cyan}${path.relative(REPO_ROOT, instructionsPath)}${ANSI.reset}`);
  log('');
}

// ---------------------------------------------------------------------------
// Resize hero
// ---------------------------------------------------------------------------

async function resizeHeroImage(config) {
  log(`${ANSI.bold}Resizing hero image${ANSI.reset}`);

  // Check source exists
  try {
    await fs.access(HERO_SOURCE);
  } catch {
    die(`Hero source image not found at ${HERO_SOURCE}\n  Generate one via ChatGPT/Gemini/Grok and save it at that path,\n  then re-run. (Run with --prompt-only to see the prompt.)`);
  }

  // Verify the source is a valid image
  let metadata;
  try {
    metadata = await sharp(HERO_SOURCE).metadata();
  } catch (err) {
    die(`Source file at ${HERO_SOURCE} is not a valid image: ${err.message}`);
  }

  log(`  Source: ${metadata.width}x${metadata.height} ${metadata.format}`, 'gray');

  // Sanity-check aspect ratio — warn if not approximately 16:9
  const ratio = metadata.width / metadata.height;
  const targetRatio = 16 / 9;
  if (Math.abs(ratio - targetRatio) > 0.15) {
    log(`  WARN  Source aspect ratio is ${ratio.toFixed(2)} (target is ${targetRatio.toFixed(2)}).`, 'yellow');
    log(`        Resize will center-crop to 16:9, which may lose content at edges.`, 'yellow');
  }

  const stem = `${domain.replace(/\./g, '-')}-og`;
  const variants = [
    { width: 1920, height: 1080, suffix: '1920' },
    { width: 1200, height: 675,  suffix: '1200' },
    { width: 800,  height: 450,  suffix: '800' },
  ];

  for (const v of variants) {
    const outPath = path.join(OG_IMAGES_DIR, `${stem}-${v.suffix}.webp`);
    await sharp(HERO_SOURCE)
      .resize(v.width, v.height, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toFile(outPath);
    const stats = await fs.stat(outPath);
    log(`  OK    Wrote ${path.relative(REPO_DIR, outPath)} (${(stats.size / 1024).toFixed(0)} KB)`, 'green');
  }

  log('');
}

// ---------------------------------------------------------------------------
// Resize favicon
// ---------------------------------------------------------------------------

async function resizeFaviconImage(config) {
  log(`${ANSI.bold}Resizing favicon${ANSI.reset}`);

  // Check source exists
  try {
    await fs.access(FAVICON_SOURCE);
  } catch {
    die(`Favicon source image not found at ${FAVICON_SOURCE}\n  Generate one via ChatGPT/Gemini/Grok and save it at that path,\n  OR use https://favicon.io (recommended) to generate a favicon package\n  and unzip it directly into ${PUBLIC_DIR}.\n  (Run with --prompt-only to see the favicon prompt.)`);
  }

  let metadata;
  try {
    metadata = await sharp(FAVICON_SOURCE).metadata();
  } catch (err) {
    die(`Source file at ${FAVICON_SOURCE} is not a valid image: ${err.message}`);
  }

  log(`  Source: ${metadata.width}x${metadata.height} ${metadata.format}`, 'gray');

  // Should be square; warn if not
  if (metadata.width !== metadata.height) {
    log(`  WARN  Source is not square (${metadata.width}x${metadata.height}).`, 'yellow');
    log(`        Resize will center-crop to square, which may lose content.`, 'yellow');
  }

  await fs.mkdir(PUBLIC_DIR, { recursive: true });

  // 32x32 PNG
  const png32Path = path.join(PUBLIC_DIR, 'favicon-32.png');
  await sharp(FAVICON_SOURCE)
    .resize(32, 32, { fit: 'cover', position: 'center' })
    .png()
    .toFile(png32Path);
  const png32Stats = await fs.stat(png32Path);
  log(`  OK    Wrote ${path.relative(REPO_DIR, png32Path)} (${(png32Stats.size / 1024).toFixed(1)} KB)`, 'green');

  // 180x180 apple-touch-icon
  const applePath = path.join(PUBLIC_DIR, 'apple-touch-icon.png');
  await sharp(FAVICON_SOURCE)
    .resize(180, 180, { fit: 'cover', position: 'center' })
    .png()
    .toFile(applePath);
  const appleStats = await fs.stat(applePath);
  log(`  OK    Wrote ${path.relative(REPO_DIR, applePath)} (${(appleStats.size / 1024).toFixed(1)} KB)`, 'green');

  // favicon.ico — single-resolution 32x32 PNG-encoded ICO
  // Modern browsers accept PNG-encoded ICOs. Sharp doesn't directly write ICO,
  // but we can write a 32x32 PNG and Cloudflare/browsers handle the .ico
  // extension based on the file content. This is a common simplification.
  const icoPath = path.join(PUBLIC_DIR, 'favicon.ico');
  await sharp(FAVICON_SOURCE)
    .resize(32, 32, { fit: 'cover', position: 'center' })
    .png()
    .toFile(icoPath);
  const icoStats = await fs.stat(icoPath);
  log(`  OK    Wrote ${path.relative(REPO_DIR, icoPath)} (${(icoStats.size / 1024).toFixed(1)} KB, PNG-encoded ICO)`, 'green');
  log(`        ${ANSI.gray}For multi-resolution ICO (16x16+32x32+48x48 in one file),${ANSI.reset}`);
  log(`        ${ANSI.gray}use https://favicon.io which packages all sizes correctly.${ANSI.reset}`);

  log('');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  log(`${ANSI.bold}generate-images${ANSI.reset}`);
  log(`Domain:  ${domain}`, 'gray');
  log(`Niche:   ${niche}`, 'gray');
  log(`Keyword: ${primaryKeyword}`, 'gray');

  // If neither resize flag was set, we're in prompt-only mode
  if (promptOnly && !resizeHero && !resizeFavicon) {
    await printPrompts(config);
    log(`${ANSI.green}${ANSI.bold}Ready.${ANSI.reset} Follow the steps above, then re-run with --resize.`);
    return;
  }

  if (resizeHero) await resizeHeroImage(config);
  if (resizeFavicon) await resizeFaviconImage(config);

  log(`${ANSI.green}${ANSI.bold}Resize complete.${ANSI.reset}`);
  log(`Next: ${ANSI.cyan}node scripts/build-site.mjs${ANSI.reset}`);
  log('');
}

main().catch(err => {
  console.error(`${ANSI.red}${ANSI.bold}UNHANDLED ERROR${ANSI.reset}`);
  console.error(err.stack || err.message);
  process.exit(1);
});
