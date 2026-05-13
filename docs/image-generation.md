# Image Generation

How the factory handles hero images and favicons.

## What gets generated

For every site, the `generate-images.mjs` script produces:

**Hero image variants** (in `public/og-images/`):
- `[domain]-og-1920.webp` (desktop, 1920×1080)
- `[domain]-og-1200.webp` (tablet, 1200×675)
- `[domain]-og-800.webp` (mobile, 800×450)
- `[domain]-og-source.png` (high-res source backup, not deployed)

**Favicon files** (in `public/`):
- `favicon.ico` (32×32, single-resolution)
- `favicon-32.png` (32×32)
- `apple-touch-icon.png` (180×180)

The build script `build-site.mjs` then copies the contents of `public/` into `dist/` at deploy time. The references in the template HTML already point at the correct paths.

## Setup (one-time)

### 1. Get a Google AI Studio API key

Go to https://aistudio.google.com/apikey, sign in with your Google account, click **Create API key**, copy the value (starts with `AIza...`).

### 2. Add the key to a .env file

In your repo root, create a file named `.env` with this single line:

```
GEMINI_API_KEY=AIza-your-key-here
```

**Critical:** `.env` is in `.gitignore` and must never be committed. If you accidentally commit an API key, revoke it immediately at https://aistudio.google.com/apikey and create a new one.

### 3. Install npm dependencies (one-time per repo)

```
npm install
```

This installs the three packages the image script needs: `@google/genai`, `sharp`, `dotenv`.

## Usage

### Generate both hero and favicon

```
node scripts/generate-images.mjs
```

Or via the npm script:

```
npm run images
```

This skips any image files that already exist. To overwrite:

```
npm run images:force
```

### Generate hero only

```
npm run images:hero
```

### Generate favicon only

```
npm run images:favicon
```

## How prompts are built

The script reads `site-config.json` and composes the Imagen prompt automatically using:

- `site.niche` — the topic of the site, used as the main subject
- `seo.primaryKeyword` — refines the subject toward what readers searched for
- `design.primaryColor` and `design.accentColor` — used for favicon color palette

You do not write the prompt manually for each site. The prompt template is in `scripts/generate-images.mjs` in the `buildHeroPrompt()` and `buildFaviconPrompt()` functions. Adjust those if the default style does not work for a particular niche.

## Cost and quotas

Imagen 4 generation costs roughly $0.04 per image as of May 2026. Google AI Studio includes a free tier that typically covers low-volume use; check current limits at https://ai.google.dev/pricing.

For a typical site: one hero call + one favicon call = ~$0.08. For 20 sites: ~$1.60 total.

Costs are billed to your Google account based on the API key in `.env`. Set up billing limits in the Google Cloud console if you want a hard cap.

## When NOT to use auto-generation

The script is designed for hero images and favicons — backgrounds and brand marks, not specific products. **Do not use it for product card images.** Two reasons:

1. AI-generated product images look fake. Readers spending money on $50-$500 equipment will notice and lose trust.
2. AI cannot generate accurate likenesses of real products. The Hario V60 in the AI output will not look like the actual Hario V60.

For product images, use real product photography:
- Pull from the Amazon Product Advertising API (requires Associate API access)
- Download from manufacturer media kits
- Use stock photos from Unsplash or Pexels for generic product types

## Manual override

Anything in `public/` overrides what the build expects. If you want a hand-made favicon instead of the AI-generated one, just drop your favicon.ico/apple-touch-icon.png in `public/` and the script will skip generation (unless you pass `--force`).

Same for hero images: if you place WebP files at the expected paths, the script skips its API call.

## Troubleshooting

**`GEMINI_API_KEY not found`** — Check the .env file exists at repo root with the key on one line, no quotes.

**`Imagen API call failed`** — Verify the API key works. Test at https://aistudio.google.com/apikey. Quota limits may apply on the free tier.

**`Cannot find module '@google/genai'`** — Run `npm install` from the repo root.

**Image looks generic / off-brand** — Tweak the prompt builder functions in `scripts/generate-images.mjs`. The prompt is just a JavaScript string composed from config values; adjusting the wording adjusts the output.
