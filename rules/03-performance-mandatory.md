# 03-performance-mandatory.md — Performance Mandatory Rules

## Purpose

This file defines non-negotiable performance and Core Web Vitals rules for every site generated from this template: hero image handling, preload behavior, picture element responsive serving, logo sizing, font loading, and JavaScript discipline. These rules exist to keep Lighthouse mobile scores above 90 and Core Web Vitals in the "good" range across all devices.

## Authority level

**MANDATORY.** Every rule below is non-negotiable. Build fails if violated.

## Rules

### 1. Hero image preload

**1.1** The hero image MUST be preloaded in the document `<head>` using a `<link rel="preload">` tag.

**1.2** The preload tag MUST appear in the `<head>` BEFORE any external CSS or JS imports. Position matters: a preload after a render-blocking stylesheet provides no benefit.

**1.3** The preload tag MUST include `fetchpriority="high"`.

**1.4** The preload tag MUST include `as="image"` and `type="image/webp"`.

**1.5** The preload tag MUST include `imagesrcset` and `imagesizes` attributes matching the picture element variants (see rule 3 below), so the browser preloads the correct variant for the viewport rather than always preloading the desktop variant.

### 2. Hero image rendering

**2.1** The hero `<img>` tag MUST include `fetchpriority="high"`.

**2.2** The hero `<img>` tag MUST NOT include `loading="lazy"`. Above-the-fold images are never lazy-loaded; this is the single most common LCP failure on Lovable-generated sites.

**2.3** The hero `<img>` tag MUST include explicit `width` and `height` attributes (not just CSS). Missing intrinsic dimensions cause CLS (Cumulative Layout Shift) when the image loads.

**2.4** Tailwind's `h-auto` class MUST NOT be used on the hero image. It overrides the `height` attribute and causes CLS. Use explicit aspect-ratio CSS or fixed height instead.

### 3. Responsive picture element

**3.1** The hero image MUST be served as a `<picture>` element with three `<source>` tags plus an `<img>` fallback:

```html
<picture>
  <source media="(max-width: 768px)"  srcset="[800w].webp"  type="image/webp">
  <source media="(max-width: 1280px)" srcset="[1200w].webp" type="image/webp">
  <img src="[1920w].webp" alt="[descriptive alt]" width="1920" height="1080" fetchpriority="high">
</picture>
```

**3.2** The three variants MUST be:
- Mobile: 800×450 WebP
- Tablet: 1200×675 WebP
- Desktop: 1920×1080 WebP

**3.3** All three variants MUST be generated and present in `/public/og-images/` or `/public/hero/` before deployment.

**3.4** The fallback `<img>` element MUST point to the desktop (1920w) variant.

### 4. Logo sizing

**4.1** Logo files MUST NOT exceed 2× their displayed dimensions in the markup. A logo displayed at 36×36 should be a 72×72 file maximum (or 144×144 for retina).

**4.2** A 1024×1024 logo for a 36×36 display slot is FORBIDDEN. This wastes ~200 KiB on every page load and was a frequent issue in early v3.x sites.

**4.3** Inline SVG is the PREFERRED format for logos when the design is vector-eligible:
- Zero HTTP request
- Zero file size penalty over what's already in the HTML
- Perfect rendering at any size

**4.4** Acceptable logo formats:
- Inline SVG (preferred)
- 144×144 PNG for a 72×72 display (retina)
- 200×200 PNG for a 100×100 display (retina)
- ICO at 16×16 and 32×32 for favicon (per `01-seo-mandatory.md`)

### 5. Font loading

**5.1** Google Fonts (or any external font CDN) link tags MUST NOT be included as render-blocking stylesheets. The default `<link rel="stylesheet" href="https://fonts.googleapis.com/...">` blocks initial render for approximately 750ms, hurting First Contentful Paint.

**5.2** Fonts MUST be loaded using the non-blocking preconnect + preload + onload swap pattern:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=...">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=..."
      media="print" onload="this.media='all'">
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=...">
</noscript>
```

**5.3** Font choices MUST be limited to two families maximum per site: one display family for headings, one body family. Loading additional families adds page weight and rarely improves design.

**5.4** Self-hosted fonts SHOULD be preferred for sites with stable typography (one-page affiliate templates qualify). Use `font-display: swap` and `<link rel="preload" as="font" crossorigin>`.

### 6. JavaScript discipline

**6.1** Render-blocking JavaScript in the `<head>` MUST be avoided. Use `defer` or `async` on `<script>` tags.

**6.2** Analytics scripts (GA4) MUST be loaded with `async` and placed at the end of `<head>` or beginning of `<body>` after critical content.

**6.3** No third-party JavaScript widget (chat, pop-up, email capture) MUST be loaded synchronously. All third-party widgets MUST be deferred or lazy-loaded on user interaction.

**6.4** Inline `<script>` blocks longer than 30 lines SHOULD be moved to external `.js` files with proper caching headers (handled by Cloudflare Pages defaults).

### 7. Images other than hero

**7.1** Product card images, supporting images, and any image below the fold MUST include `loading="lazy"` (the opposite of the hero rule).

**7.2** Product card images MUST include explicit `width` and `height` attributes for CLS prevention.

**7.3** Images SHOULD use WebP format with a JPEG fallback for older browsers. AVIF is acceptable as an additional fallback layer but not required.

### 8. Inline CSS for critical render path

**8.1** CSS needed for above-the-fold rendering (header, hero, Quick Answer box) SHOULD be inlined in `<style>` blocks in the `<head>` rather than loaded from an external stylesheet, to eliminate render-blocking on first paint.

**8.2** Below-the-fold CSS MAY be loaded from external stylesheets with the same non-blocking pattern as Google Fonts (rule 5.2).

### 9. Core Web Vitals targets

**9.1** Lighthouse mobile Performance score target: ≥ 90.
**9.2** Largest Contentful Paint (LCP) target: ≤ 2.5 seconds.
**9.3** First Contentful Paint (FCP) target: ≤ 1.8 seconds.
**9.4** Total Blocking Time (TBT) target: ≤ 200 ms.
**9.5** Cumulative Layout Shift (CLS) target: ≤ 0.1.

These are targets, not pass/fail thresholds for the build to complete. Build completion does not require these to be hit at first generation; the site SHOULD be measured at https://pagespeed.web.dev/ post-deploy and any deviation flagged for fix.

## Examples

### Correct hero image markup

```html
<!-- in <head>, before any external CSS -->
<link rel="preload"
      as="image"
      href="/og-images/brewverdict-og-1920.webp"
      imagesrcset="/og-images/brewverdict-og-800.webp 800w,
                   /og-images/brewverdict-og-1200.webp 1200w,
                   /og-images/brewverdict-og-1920.webp 1920w"
      imagesizes="100vw"
      fetchpriority="high"
      type="image/webp">

<!-- in <body> hero section -->
<picture>
  <source media="(max-width: 768px)"  srcset="/og-images/brewverdict-og-800.webp"  type="image/webp">
  <source media="(max-width: 1280px)" srcset="/og-images/brewverdict-og-1200.webp" type="image/webp">
  <img src="/og-images/brewverdict-og-1920.webp"
       alt="Six pour over coffee makers compared"
       width="1920"
       height="1080"
       fetchpriority="high">
</picture>
```

### Incorrect hero image — multiple failures

```html
<img src="https://storage.googleapis.com/lovable-gen/abc123.jpg"
     alt="hero"
     class="w-full h-auto"
     loading="lazy">
```

Problems: (1) GoogleCloudStorage GUID URL violates `01-seo-mandatory.md` rule 7.3, (2) no preload tag in head, (3) `h-auto` overrides height causing CLS, (4) `loading="lazy"` on above-the-fold image kills LCP, (5) no picture element for responsive variants, (6) no fetchpriority="high", (7) generic alt text "hero" provides no semantic value.

## Validation

After generating a site, Claude Code MUST verify:

1. `<head>` contains a `<link rel="preload" as="image">` tag for the hero with `fetchpriority="high"`
2. The preload tag appears BEFORE any external stylesheet `<link>` tags
3. The preload tag includes `imagesrcset` with at least three variants
4. Hero `<img>` has `fetchpriority="high"` attribute
5. Hero `<img>` does NOT have `loading="lazy"` attribute
6. Hero `<img>` has explicit `width` and `height` attributes
7. Hero `<img>` does NOT use Tailwind `h-auto` class
8. Three hero image variants exist in `public/`: 800w, 1200w, 1920w WebP
9. `<picture>` element with three `<source>` tags is used for the hero
10. Below-fold images have `loading="lazy"` attribute
11. Below-fold images have explicit `width` and `height` attributes
12. No render-blocking external stylesheet for Google Fonts (must use the swap pattern)
13. Analytics `<script>` tags include `async` attribute
14. Logo file size is ≤ 2× its display dimensions

If any check fails, the build is incomplete. Report the failure with the specific check number and the file or element involved.

## Source / version history

- 2026-05-12 — Initial creation. Compiled from v3.2 Phase 1 PERFORMANCE REQUIREMENTS section. Incorporates HydroVerdict launch learnings (PSI mobile score lifted from 72 to 84 via aspect-ratio and font preloading fixes — both codified here).
