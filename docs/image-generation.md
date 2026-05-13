# Image Generation

How the factory handles hero images and favicons.

## Workflow at a glance

The factory uses a **manual-plus-script workflow** that uses your existing ChatGPT Plus, Gemini Advanced, or Grok subscription for hero images, and one of three script-based approaches for favicons. No API keys required for the AI image generation. No billing setup.

Per site:

1. Run `node scripts/generate-images.mjs --prompt-only`. Prints prompts tailored to the site's niche and brand colors.
2. Copy the hero prompt into ChatGPT/Gemini/Grok, generate, save the PNG (~90 seconds).
3. Run `node scripts/generate-images.mjs --resize-hero` to produce the three WebP variants (5 seconds).
4. Generate the favicon — three options described below.

Total: ~2-3 minutes of human time per site, zero ongoing cost.

## Setup (one-time, when the repo is fresh)

```
npm install
```

This installs `sharp` (image resizing). One-time, ~30 seconds.

## Hero image workflow

### Step 1: Print the prompt

```
node scripts/generate-images.mjs --prompt-only
```

Prints two prompts (hero + favicon) tailored to your site config. The hero prompt is what you want for this step.

### Step 2: Generate in chat

1. Copy the hero prompt
2. Paste into ChatGPT (recommended for the editorial aesthetic) or Gemini/Grok
3. Wait for the image (typically ONE image now, not a grid — the prompt asks for one)
4. If you don't like it, type "another variation" in chat for a fresh one
5. Save as `public/og-images/source.png`

### Step 3: Resize

```
node scripts/generate-images.mjs --resize-hero
```

Produces `[domain]-og-1920.webp`, `[domain]-og-1200.webp`, `[domain]-og-800.webp` in `public/og-images/`.

## Favicon workflow — three options

Favicons are tiny (16-32 pixels). What looks great at 1024×1024 often looks mushy at 16×16. Three approaches, ranked from best small-size legibility to most automatic:

### Option A: Text-based (recommended for most sites)

```
node scripts/generate-images.mjs --text-favicon B
```

Generates a favicon with the letter "B" in your brand's accent color on a rounded-square primary color background.

- Crisp at any size including 16×16
- Always uses your brand colors automatically
- Single command, no chat, no external tools
- ~5 seconds end to end

Pick a single letter that represents the brand. Brand initial usually works best (B for BrewVerdict, F for FairwayVerdict). Two-letter codes also work (`--text-favicon BV`) but get smaller and harder to read at tiny sizes.

### Option B: Emoji-based

```
node scripts/generate-images.mjs --emoji-favicon "B"
```

Generates a favicon with the emoji centered on a rounded-square brand-color background. Replace the "B" with any emoji like a bee, coffee cup, golf flag, plant sprout, etc.

- Works well for sites where a single emoji is iconic for the niche
- Renders in full color on Windows and Mac (the script uses your system's emoji font)
- ~5 seconds end to end

Note: emoji color rendering requires a system emoji font (Segoe UI Emoji on Windows, Apple Color Emoji on Mac). Both are installed by default on those systems.

### Option C: AI-generated (atmospheric sites)

```
node scripts/generate-images.mjs --prompt-only
# Copy favicon prompt, paste into ChatGPT/Gemini/Grok
# Save best result as public/favicon-source.png
node scripts/generate-images.mjs --resize-favicon
```

Use this only when text or emoji don't fit the brand aesthetic. AI-generated favicons typically look fuzzy at 16×16, so this is a fallback, not the default.

### Option D: External tool (favicon.io)

Visit https://favicon.io, generate with a letter or emoji using their UI, download the zip, unzip into `public/`. Slightly more polished output than Option A; takes about 60 seconds. Skip the `--resize-favicon` step entirely.

## Granular commands

```
node scripts/generate-images.mjs --prompt-only          # print prompts only
node scripts/generate-images.mjs --resize-hero          # resize hero from source.png
node scripts/generate-images.mjs --resize-favicon       # resize favicon from favicon-source.png
node scripts/generate-images.mjs --resize               # both (skips missing)
node scripts/generate-images.mjs --text-favicon B       # programmatic text favicon
node scripts/generate-images.mjs --emoji-favicon X      # programmatic emoji favicon
```

The favicon modes are mutually exclusive — pass only one of `--text-favicon`, `--emoji-favicon`, or `--resize-favicon` per run.

## After both hero and favicon are ready

```
node scripts/build-site.mjs
```

The build script copies everything in `public/` into `dist/`. Images deploy automatically with the site.

## Why this design

**No API costs.** Hero generation uses your existing chat subscription. Text/emoji favicons use only `sharp` (already installed). AI-generated favicons (Option C) also use your chat subscription.

**Sharp text edges for favicons.** Text and emoji rendering goes through SVG-to-raster conversion, which produces clean edges at any size — unlike AI image generation which produces fuzz at small sizes.

**You stay in control of quality.** The chat workflow lets you regenerate hero images until you have one you like. The text/emoji favicon modes are deterministic — same input always produces the same output.

## When to use product images vs AI generation

**Hero images and favicons** — AI generation (for hero) or text/emoji (for favicon) is appropriate. These are atmospheric or symbolic, not specific products.

**Product card images** — Do NOT use AI generation. Two reasons:

1. AI cannot accurately render real products. Readers will notice the inaccuracy.
2. Customers spending serious money need to see what they're actually buying.

For product images, source them from:
- Amazon Product Advertising API (requires Associate API access)
- Manufacturer media kits (most allow editorial use in reviews)
- Stock photo libraries (Unsplash, Pexels) for generic placeholders
- Photographing them yourself if you have hands-on review setup

## Troubleshooting

**`Cannot find module 'sharp'`** — Run `npm install` from the repo root.

**`Source file at [path] is not a valid image`** — The file you saved isn't a real image. Re-save from the chat tool as a PNG.

**`Source aspect ratio is X (target is 1.78)`** — Warning, not error. Source isn't 16:9; resize will center-crop. Acceptable for most cases.

**Chat tool refused the prompt** — Some safety filters reject certain commercial-photography prompts. Try a different chat tool. Or rephrase to remove triggering words.

**Hero shows broken when I open `dist/index.html` locally** — Local `file://` protocol cannot resolve absolute paths like `/og-images/...`. Push to Cloudflare Pages and view the live URL instead. Image will render correctly there.

**Favicon does not update after change** — Browsers cache favicons aggressively. Open the site in an incognito window to see the new favicon. Hard refresh (Ctrl+Shift+R) sometimes helps, sometimes does not.

**Emoji favicon renders as a hollow box** — Your system's emoji font is not available to sharp's renderer. Use `--text-favicon` instead, or generate via favicon.io.

## Editing the prompt template

The hero and AI-favicon prompts are built in `scripts/generate-images.mjs` in the `buildHeroPrompt()` and `buildFaviconPrompt()` functions. Edit those strings to tune the default style for all future sites.
