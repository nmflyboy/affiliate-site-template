# Image Generation

How the factory handles hero images and favicons.

## Workflow at a glance

The factory uses a **two-step manual-plus-script workflow** that uses your existing ChatGPT Plus, Gemini Advanced, or Grok subscription. No API keys, no billing setup, no per-image costs.

Per site:

1. Run `node scripts/generate-images.mjs --prompt-only` (1 second). Prints two prompts (hero + favicon) tailored to the site's niche and brand colors, AND saves them to a text file for reference.
2. Copy the hero prompt into ChatGPT/Gemini/Grok, generate 4 variations, pick the best, save the PNG to a specified path (~90 seconds).
3. Same for the favicon, OR use https://favicon.io for a better small-size result (~60 seconds).
4. Run `node scripts/generate-images.mjs --resize` (5 seconds). The script reads your saved source PNGs and produces the WebP variants and favicon sizes the build expects.

Total per site: ~2-3 minutes of human time. Zero cost.

## Setup (one-time, when the repo is fresh)

### Install npm dependencies

In your repo root:

```
npm install
```

This installs `sharp` (image resizing). One-time, ~30 seconds.

### Pick your AI chat tool

You have three viable options (any one works):

- **ChatGPT Plus** ($20/mo) — DALL-E 3 image gen, 4 variations per prompt by default. Most precise prompt-following.
- **Gemini Advanced** ($20/mo) — Imagen-powered. Photorealistic, warm. May refuse some commercial-photography prompts.
- **Grok** (X Premium+) — Aurora image gen. Good general quality, fewer refusals.

Use whichever you already have open. Style differs slightly between them but all produce usable hero images for affiliate sites.

## Standard workflow (per site)

### Step 1: Print the prompts

In your site repo:

```
node scripts/generate-images.mjs --prompt-only
```

This prints two prompts to the terminal AND saves them with full instructions to `public/og-images/INSTRUCTIONS.txt`. The prompts are auto-generated from your `site-config.json` — niche, primary keyword, and brand colors all get baked in.

### Step 2: Generate hero image

1. Copy the **hero image prompt** (the first one)
2. Open ChatGPT, Gemini, or Grok
3. Paste the prompt
4. The tool generates 4 variations (asking for variations is built into the prompt)
5. Pick the variation you like best
6. Right-click → Save image → save as PNG
7. Move/rename the file to exactly this path:
   ```
   public/og-images/source.png
   ```

### Step 3: Generate favicon (two options)

**Option A — favicon.io (recommended)**

https://favicon.io is purpose-built for favicons and produces sharper small-size output than AI image generation. Two ways:

- **Text-based** — type a single letter (your brand initial), pick a color matching your brand, generate, download. 60 seconds.
- **Emoji-based** — pick any emoji that fits your niche (🐝 for beekeeping, ☕ for coffee, 🏌️ for golf), download. 30 seconds.

Either way, you get a zip file. Unzip it directly into your `public/` folder. You're done; skip Step 4's favicon part.

**Option B — AI generation via chat tool**

1. Copy the **favicon prompt** from the script output
2. Paste into ChatGPT, Gemini, or Grok
3. Pick the variation that's most readable at small size
4. Save the PNG as:
   ```
   public/favicon-source.png
   ```

### Step 4: Resize

```
node scripts/generate-images.mjs --resize
```

This reads your saved source PNGs and produces:

For the hero (in `public/og-images/`):
- `[domain]-og-1920.webp` (1920×1080)
- `[domain]-og-1200.webp` (1200×675)
- `[domain]-og-800.webp` (800×450)

For the favicon (in `public/`):
- `favicon.ico`
- `favicon-32.png`
- `apple-touch-icon.png`

(Skipped automatically if no source.png or favicon-source.png exists.)

### Step 5: Build the site

```
node scripts/build-site.mjs
```

The build script copies everything in `public/` into `dist/`, so your generated images deploy automatically.

## Granular commands

If you want to run just one step:

```
node scripts/generate-images.mjs --prompt-only       # print prompts only
node scripts/generate-images.mjs --resize-hero       # resize hero only
node scripts/generate-images.mjs --resize-favicon    # resize favicon only
node scripts/generate-images.mjs --resize            # resize both (skips missing)
```

## Why this design

**No API costs.** Your existing ChatGPT/Gemini/Grok subscription covers the image generation; the script just handles the boring resizing.

**You stay in control of quality.** Auto-generated single-shot images sometimes have weird artifacts; the 4-variations workflow lets you pick the best.

**No new billing relationships.** No credit cards, no platform setup, no quota management.

**Tradeoff:** ~2 minutes of human time per site instead of zero. At your scale (20 sites total), that's 40-60 minutes one-time, never repeated. Worth it.

## When to use product images vs AI generation

**Hero images and favicons** — AI generation is appropriate. These are atmospheric/abstract, not specific products.

**Product card images** — Do NOT use AI generation. Two reasons:

1. AI cannot accurately render real products (Hario V60, Fellow Stagg, etc.) Readers will notice the inaccuracy.
2. Customers spending $50-500 on equipment need to see what they're actually buying.

For product images, source them from:
- Amazon Product Advertising API (requires Associate API access)
- Manufacturer media kits (most allow editorial use in reviews)
- Stock photo libraries (Unsplash, Pexels) for generic placeholders
- Photographing them yourself if you have hands-on review setup

## Troubleshooting

**`Cannot find module 'sharp'`** — Run `npm install` from the repo root.

**`Source file at [path] is not a valid image`** — The file you saved isn't a real PNG (maybe a screenshot of a screenshot, or saved with a wrong extension). Re-save the original image from the chat tool as a PNG.

**`Source aspect ratio is X (target is 1.78)`** — Warning, not error. Your source isn't 16:9 so the resize will center-crop. Acceptable for most cases. Regenerate with explicit 16:9 ask if you want pixel-perfect.

**Chat tool refused the prompt** — Some safety filters reject certain commercial-photography prompts. Try a different chat tool (ChatGPT and Grok refuse less than Gemini for commercial content). Or rephrase the prompt to remove triggering words.

**Image looks AI-generated even though I picked the best variation** — That's the current state of AI image generation. For higher-end sites where this matters more, consider hiring a real photographer for the hero (one-time cost, lifetime use) and using the script's resize-only mode to crop their work into your three WebP variants.

## Editing the prompt template

The prompts are constructed in `scripts/generate-images.mjs` in the `buildHeroPrompt()` and `buildFaviconPrompt()` functions. Edit those strings if you want to tune the default style for all future sites.

Per-site overrides aren't supported yet — if you want a specific site to have a unique prompt style, hand-edit the source files in `public/` after generating, or extend the script to read a `config.images.customPrompt` field.
