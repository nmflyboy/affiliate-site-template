# 05-affiliate-mandatory.md — Affiliate Mandatory Rules

## Purpose

This file defines non-negotiable affiliate-implementation rules for every site generated from this template: /go/ redirect implementation, disclosure placement, in-content auto-linking of product names, product card structure consistency, and link styling for affiliate destinations. These rules cover the mechanics that make affiliate tracking work and disclosures legally compliant.

## Authority level

**MANDATORY.** Every rule below is non-negotiable. Build fails if violated.

This file covers the GENERIC affiliate requirements. Network-specific compliance rules (Amazon Associates Operating Agreement, FTC disclosure exact phrasing, JVZoo tracking parameters) live in `99-custom/` and load when their corresponding rule files are enabled in the config.

## Rules

### 1. /go/ redirect implementation

**1.1** Affiliate destination URLs MUST NOT appear directly as `href` values in the page HTML. All product links MUST point to a local `/go/[slug]/` URL on the site's own domain, which then redirects to the actual affiliate URL.

**1.2** Rationale: /go/ redirects allow (a) tracking aggregated clicks per product without third-party scripts, (b) updating an affiliate link in one place if a network changes the URL, (c) hiding raw affiliate parameters from page source (less spammy appearance), (d) controlled robots.txt exclusion of redirect paths from crawl.

**1.3** For HTML template types (review, headtohead, amazon, leadgen): /go/ redirects MUST be implemented as folder-based redirect files. Each redirect lives at `public/go/[slug]/index.html` and contains BOTH a meta refresh AND a JavaScript redirect:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0; url=[AFFILIATE_LINK]">
  <link rel="canonical" href="[AFFILIATE_LINK]">
  <script>window.location.replace("[AFFILIATE_LINK]");</script>
</head>
<body>
  <p>Redirecting to <a href="[AFFILIATE_LINK]">[AFFILIATE_LINK]</a></p>
</body>
</html>
```

**1.4** For React template types (listicle, tool): /go/ redirects MUST be implemented as React Router routes that call `window.location.replace([AFFILIATE_LINK])` in a `useEffect` hook. Each redirect route MUST have its own component (or a generic component reading the slug from URL params).

**1.5** Cloudflare redirect rules MUST NOT be used for /go/ redirects on React-built sites. The React Router architecture intercepts the route before Cloudflare's edge rules fire, so the Cloudflare rule never executes. This is a known issue documented in v3.2 site launches.

**1.6** /go/ redirects MUST NOT include any tracking pixels, analytics events, or other client-side scripts beyond the redirect itself. Keep redirect pages minimal to ensure they execute in under 100ms.

**1.7** Slug naming: /go/ slugs MUST match the value provided in the product config (`config.affiliate.products[].slug`). The build MUST NOT invent slugs from product names.

### 2. Affiliate disclosure

**2.1** An affiliate disclosure MUST appear as a visible banner placed:
- Directly below the sticky header
- ABOVE the Quick Answer box
- Visible without scrolling on both desktop and mobile

**2.2** The disclosure banner MUST be visually distinct from regular body text (background tint, top/bottom border, smaller font, or all three). It must read as "this is a notice" not "this is body copy."

**2.3** The disclosure MUST appear BEFORE the first affiliate link on the page. Disclosures buried only in the footer fail FTC guidance (covered in detail by the `ftc-affiliate-disclosure.md` rule in `99-custom/`).

**2.4** The disclosure text MUST clearly state:
- That the page contains affiliate links
- That clicking those links may earn the site a commission
- That there is no extra cost to the reader

**2.5** Approved disclosure phrasing for the in-page banner (pick one or write a variant that meets the above requirements):

> "Affiliate disclosure: This page contains affiliate links. If you click a link and make a purchase, [site name] may earn a commission at no extra cost to you."

> "Some links on this page are affiliate links. We may earn a commission if you buy, at no additional cost to you. This helps support our editorial work."

**2.6** When Amazon Associates is listed in `affiliate.networks`, the page MUST also include the verbatim Amazon-required statement somewhere visible: "As an Amazon Associate I earn from qualifying purchases." This wording is non-negotiable under the Amazon Associates Operating Agreement. The Amazon-specific rule pack (`99-custom/amazon-associates-tos.md`) covers full Amazon TOS requirements.

**2.7** A separate, more detailed disclosure page MUST exist at `/disclosure/` (per `01-seo-mandatory.md` rule 14.1).

### 3. In-content auto-linking of product names

**3.1** When any product name from `config.affiliate.products` appears in body content (intro paragraphs, FAQ answers, urgency callouts, "How we picked" sections, or any prose outside of product cards), the FIRST mention within each section MUST be linked to that product's /go/ redirect URL.

**3.2** Auto-linking rules:

**3.2.a Match both full and short forms.** For a product named "Orange Whip Trainer" with slug `/go/orangewhip`, the auto-linker MUST recognize and link BOTH the full phrase "Orange Whip Trainer" AND the shorter form "Orange Whip." The product config MAY provide a `shortForms` array; if not, the default short form is the first word of the product name.

**3.2.b Longest-match-wins.** When text contains "Orange Whip Trainer," link the full phrase, not just "Orange Whip" inside it. The auto-linker MUST scan for longest matches first to prevent nested links.

**3.2.c First mention only per section.** Do not auto-link the same product in every paragraph. The first time the product name appears in a section, link it; subsequent mentions in the same section are plain text.

**3.2.d Section boundary definition.** A "section" is the content under a single `<h2>` heading. Each new H2 begins a new section, so each product's first mention resets at each H2.

**3.3** Auto-linking MUST NOT apply inside:
- `<h1>`, `<h2>`, `<h3>`, `<h4>` headings
- Product card titles
- Product card buttons (those are already linked to /go/)
- The comparison table cells (those already link via the table's Get-It column)
- The Quick Answer box (keep this clean for speakable schema)
- The affiliate disclosure banner

**3.4** Auto-linked product names in body text MUST use the same link styling as other in-content links (darkest brand color, persistent underline, font-weight 500, hover shifts underline to accent — per `02-design-mandatory.md`).

### 4. Product card structure consistency

**4.1** All product cards in a single page's product grid MUST share the same internal structure. Mixing card formats within one grid causes CSS Grid to render empty space below shorter cards, which is the second-most-common visual defect in v3.2 sites.

**4.2** Choose ONE of the following structures for the entire grid (not mixed):

**Long format:**
- "Best For:" line
- Description paragraph
- Pros list (3–5 items)
- Considerations list (1–3 items)
- Verdict (1–2 sentence summary)
- CTA button

**Short format:**
- "Best For:" line
- Description paragraph
- Pros list (3–5 items)
- CTA button

**4.3** The CTA button MUST be pinned to the bottom of each card using CSS (flexbox with `margin-top: auto` on the button, or grid with the button in a defined row). This guarantees alignment regardless of variable description length.

### 5. Comparison table

**5.1** Listicle and Amazon templates MUST include a comparison table near the top of the page, after the Quick Answer and before the product cards.

**5.2** The comparison table MUST have one row per product, in display order matching the product cards.

**5.3** Standard comparison table columns:
- Product Name (linked to product card anchor on same page)
- Category or Best For
- Key Feature
- Price Range (only if config provides — no fabrication)
- Get It (button linking to /go/ slug)

**5.4** The comparison table SHOULD use horizontal scroll on mobile rather than stacking, to preserve scannability.

### 6. Urgency banners and mid-page callouts

**6.1** Urgency callouts ("Order early to ensure shipping by [date]", "Limited stock", "Sale ends [date]") MUST be rendered as full-width horizontal banners placed BETWEEN rows of the product grid.

**6.2** Urgency callouts MUST NOT be nested inside a product card column. A callout in one product card breaks the grid alignment and creates uneven white space.

**6.3** Urgency callouts MUST NOT reference specific dates unless those dates come from the config. Generic urgency ("limited time") is acceptable; specific dates that the build invents are not (per `04-content-mandatory.md` rule 5.1).

### 7. CTA placement and count

**7.1** Every page MUST have at least three CTA buttons distributed across the content:
- A "sticky header" CTA (e.g. "View Resources") that scrolls to or jumps to the product section
- A CTA at the end of each product card
- A final CTA after the FAQ or at the bottom of the page

**7.2** CTAs use the accent color (per `02-design-mandatory.md` rule 2.1) and link to the product's /go/ slug, NOT directly to the affiliate URL.

### 8. Affiliate link parameters

**8.1** The affiliate URL stored in `config.affiliate.products[].affiliateLink` is treated as opaque. The build MUST NOT modify, append to, or strip parameters from this URL.

**8.2** If an affiliate program requires UTM parameters or sub-IDs, those MUST be included in the URL value stored in the config, not appended by the build.

## Examples

### Correct /go/ redirect HTML

```html
<!-- public/go/staggekg/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0; url=https://amzn.to/abc123?tag=brewverdict-20">
  <link rel="canonical" href="https://amzn.to/abc123?tag=brewverdict-20">
  <script>window.location.replace("https://amzn.to/abc123?tag=brewverdict-20");</script>
</head>
<body>
  <p>Redirecting to <a href="https://amzn.to/abc123?tag=brewverdict-20">Fellow Stagg EKG</a></p>
</body>
</html>
```

### Correct auto-link in body text

> The setup I recommend most often is the [Fellow Stagg EKG](/go/staggekg) kettle paired with a Comandante grinder. The Stagg's heating accuracy makes a real difference at the 195–205°F brewing range.

Note: "Fellow Stagg EKG" is linked on first mention only; the second mention "Stagg" is plain text within the same section. If this paragraph were the start of a new H2 section, "Stagg" or "Stagg EKG" would link instead.

### Incorrect — direct affiliate link in href

```html
<a href="https://amzn.to/abc123?tag=brewverdict-20">Fellow Stagg EKG</a>
```

Problems: exposes affiliate URL in page source, no aggregation tracking, breaks if Amazon URL changes, fails the /go/ redirect mandate.

### Incorrect — disclosure buried in footer

The disclosure appears only in the footer at the bottom of the page, below 2500 words of content. Reader has scrolled past dozens of affiliate links before seeing the disclosure. This fails FTC guidance.

### Incorrect — mixed product card formats

Cards 1, 2, 3, and 4 have Pros, Considerations, and Verdict sections. Cards 5 and 6 omit Considerations and Verdict. CSS Grid renders cards 5 and 6 with ~100px of empty white space below the CTA button to match the row height of the longer cards. This is the most-reported visual defect in v3.2 launches.

## Validation

After generating a site, Claude Code MUST verify:

1. No `<a>` tag in the rendered HTML has an `href` value matching any URL from `config.affiliate.products[].affiliateLink`. All product links go through /go/ slugs.
2. Every product in the config has a corresponding /go/ redirect file (HTML templates) or /go/ route (React templates).
3. Each /go/ redirect contains BOTH a meta refresh AND a window.location.replace call.
4. /go/ slugs in rendered links match the slug values in the config exactly.
5. Affiliate disclosure banner exists below the header and above the Quick Answer.
6. If Amazon is in `affiliate.networks`, the verbatim "As an Amazon Associate I earn from qualifying purchases" string appears on the page.
7. Product cards in the same grid all use the same structure (all long format or all short format).
8. CTA button is pinned to the bottom of every product card (CSS verifies via `margin-top: auto` or grid layout).
9. Auto-linked product names in body content use the same styling as other in-content links (color, underline, weight per `02-design-mandatory.md`).
10. No product name auto-links inside `<h1>`, `<h2>`, `<h3>`, the Quick Answer box, the disclosure banner, or product card titles/buttons.
11. Urgency callouts (if present) are full-width banners between product grid rows, not inside product cards.
12. At least three CTA buttons exist on the page.

If any check fails, the build is incomplete. Report the failure with the specific check number and the file or element involved.

## Source / version history

- 2026-05-12 — Initial creation. Compiled from v3.2 Phase 1 PRODUCT CARD rules, AUTO-LINKING rules, /go/ REDIRECT requirements, and Phase 5 common issues table. Codifies the consistent-card-structure rule that was the #2 issue in v3.2 launches.
