# 01-seo-mandatory.md — SEO Mandatory Rules

## Purpose

This file defines all non-negotiable SEO requirements for every site generated from this template: keyword placement, meta tags, schema markup, robots.txt, sitemap, and indexing helpers. These rules apply to every template type (listicle, review, head-to-head, tool, amazon, leadgen).

## Authority level

**MANDATORY.** Every rule below is non-negotiable. Build fails if violated.

## Rules

### 1. Primary keyword placement

**1.1** The site's `seo.primaryKeyword` value from the config MUST appear verbatim (exact match) in:
- The `<title>` tag
- The `<meta name="description">` content
- The first `<h1>` tag of the page

**1.2** The primary keyword MUST be preserved in full in the `<title>` tag, even at the cost of brand name truncation. If the title would exceed 60 characters, shorten the brand suffix, not the keyword.

**1.3** LSI (latent semantic indexing) variations of the primary keyword SHOULD appear in `<h2>` and `<h3>` headings throughout the page. Do not over-optimize: vary phrasings, do not repeat the exact keyword in every heading.

### 2. Meta title

**2.1** The `<title>` tag MUST be 60 characters or fewer.

**2.2** Format: `[Primary Keyword] | [Brand Name]` is the default. If too long, drop the pipe and brand: `[Primary Keyword] — [Year]`.

**2.3** MUST NOT contain em dashes inside the title (per `04-content-mandatory.md` global em-dash ban). Use a hyphen or pipe for separators.

### 3. Meta description

**3.1** The `<meta name="description">` MUST be 155 characters or fewer.

**3.2** MUST contain the primary keyword verbatim, ideally within the first 120 characters.

**3.3** MUST describe what the page offers, not just list keywords. Read like a benefit-led summary a person would actually click on in search results.

**3.4** MUST NOT contain em dashes. MUST NOT contain LLM-slop phrases listed in `04-content-mandatory.md`.

### 4. Canonical tag

**4.1** The page MUST NOT include a `<link rel="canonical">` tag. Affiliate sites with a single URL do not need one, and an incorrect canonical (e.g. pointing to a Lovable subdomain) can de-index the production domain.

### 5. Heading structure

**5.1** The page MUST have exactly one `<h1>` tag.

**5.2** Heading levels MUST descend in order: h1 → h2 → h3 → h4. Do not skip levels (no h2 followed by h4).

**5.3** Every section break MUST use an `<h2>`. Sub-points within a section use `<h3>`.

**5.4** The page MUST include at least three `<h3>` tags formatted as "People Also Ask" style questions (e.g. "What size kettle do I need for pour over?"). These drive featured-snippet eligibility.

### 6. Schema.org JSON-LD

**6.1** The page MUST include schema markup as a `<script type="application/ld+json">` block placed in the HTML `<head>`. React templates MUST place this as a static script tag, NOT render it from React state, so crawlers can read it without executing JavaScript.

**6.2** The schema block MUST contain, at minimum, the following `@type` entries:
- `Article`
- `WebSite`
- `FAQPage` (with at least 3 Question/Answer pairs)
- `SpeakableSpecification` (cssSelector targeting the Quick Answer box and FAQ section)

**6.3** When the template type is `listicle` or `amazon`, the schema MUST additionally include an `ItemList` entry with one `ListItem` per product card, in display order, each pointing to its `/go/` redirect URL.

**6.4** Article schema MUST include:
- `headline` — string, the H1 of the page
- `description` — same as meta description
- `url` — full domain URL with https://
- `dateModified` — ISO 8601 with timezone offset (e.g. `"2026-04-26T00:00:00-06:00"`), NOT a bare `YYYY-MM-DD` date
- `datePublished` — same format as dateModified
- `author` — Organization with `name` AND `url` field pointing to `https://[domain]/about`
- `publisher` — Organization with `name`, `url`, and `logo.url`
- `image` — ImageObject with url at `https://[domain]/og-images/[domain]-og.jpg`
- `mainEntityOfPage` — WebPage with `@id` matching the page URL

**6.5** WebSite schema MUST include `name`, `url`, `description`, and `publisher`.

**6.6** The schema MUST NOT contain `aggregateRating` or `Review` types unless those ratings are real and verifiable. Fabricated star ratings violate Google's structured data policy and can trigger manual actions.

### 7. Open Graph and Twitter Card tags

**7.1** The `<head>` MUST include the following Open Graph tags:
- `og:title`
- `og:description`
- `og:url`
- `og:image`
- `og:type` (set to `article`)

**7.2** The `<head>` MUST include Twitter Card tags:
- `twitter:card` (set to `summary_large_image`)
- `twitter:title`
- `twitter:description`
- `twitter:image`

**7.3** Both `og:image` and `twitter:image` MUST point to a clean descriptive filename at a predictable path: `https://[domain]/og-images/[domain]-og.jpg`. They MUST NOT point to GoogleCloudStorage GUID URLs (the kind Lovable generates by default, like `storage.googleapis.com/lovable-...`).

### 8. Favicon

**8.1** The page MUST link to a favicon using BOTH tags in the `<head>`:
```html
<link rel="icon" href="/favicon.ico" type="image/x-icon">
<link rel="shortcut icon" href="/favicon.ico">
```

**8.2** The actual `/public/favicon.ico` file MUST be replaced (overwritten), not supplemented by adding a `favicon.png` alongside it. If only the PNG is updated, `/favicon.ico` will continue serving the framework default icon to crawlers, RSS readers, bookmarks, and older browsers.

**8.3** Favicon variations MUST be provided at the following sizes:
- 16×16 (favicon.ico)
- 32×32
- 180×180 (apple-touch-icon.png)

### 9. Author meta tag

**9.1** The `<head>` MUST include `<meta name="author" content="[editorialTeamName]">` using the value from `site.editorialTeamName` in the config.

**9.2** When `site.namedAuthor` is provided in the config (recommended for EEAT), the value MUST also appear as a byline near the H1 or in the page footer.

### 10. robots.txt

**10.1** Every site MUST have a `public/robots.txt` file with the following exact format:

```
User-agent: *
Allow: /
Disallow: /go/

Sitemap: https://[domain]/sitemap.xml
```

**10.2** The blank line between `Disallow: /go/` and `Sitemap:` is REQUIRED. It is not optional formatting; some crawlers fail to parse the Sitemap directive without it.

**10.3** Per-bot blocks (e.g. separate sections for Googlebot, Bingbot, GPTBot) MUST NOT be added. The single wildcard block is the standard and per-bot redundancy creates parsing risk.

**10.4** The `Disallow: /go/` line is required to prevent search engines from crawling affiliate redirect URLs, which would dilute crawl budget and could expose affiliate parameters to indexing.

### 11. sitemap.xml

**11.1** Every site MUST have a `public/sitemap.xml` file at the site root.

**11.2** The sitemap MUST include the homepage and every subpage (`/about/`, `/contact/`, `/privacy/`, `/terms/`, `/disclosure/`).

**11.3** The sitemap MUST NOT include `/go/` URLs.

**11.4** Each `<url>` entry MUST include `<loc>`, `<lastmod>` (in ISO 8601 with timezone), and `<changefreq>` (`monthly` for static affiliate content).

### 12. IndexNow key file

**12.1** The site MUST host its IndexNow key file at the root: `public/[indexNowKey].txt` where the filename matches the key value from `seo.indexNowKey` in the config.

**12.2** The file content MUST be the key value itself (a single line, no quotes, no trailing whitespace).

**12.3** Both the filename and the content MUST exactly match the `seo.indexNowKey` value.

### 13. Word count

**13.1** Every page MUST be at least 1500 words of body content (excluding navigation, header, footer, comparison table cell text, schema JSON).

**13.2** Listicle pages SHOULD aim for 2000–2500 words to support thorough product coverage and FAQ depth.

### 14. Subpages

**14.1** Every site MUST have the following subpages, even if minimal:
- `/about/` — describes the editorial team, methodology, and niche scope
- `/contact/` — provides a way to reach the editorial team
- `/privacy/` — privacy policy
- `/disclosure/` — affiliate disclosure (long-form, separate from in-page banner)

**14.2** When `template.type === 'leadgen'`, the disclosure subpage MAY be omitted if no affiliate links exist on the site.

## Examples

### Correct title and meta description

```html
<title>Best Pour Over Coffee Makers | BrewVerdict</title>
<meta name="description" content="The best pour over coffee makers tested for ease of use, brew quality, and value. Compare 6 top options with detailed reviews and buyer guidance.">
```

Length check: title = 47 chars ✓, description = 152 chars ✓, both contain "best pour over coffee makers" verbatim ✓.

### Incorrect — title too long, em dash in description

```html
<title>The Best Pour Over Coffee Makers of 2026 — BrewVerdict Reviews</title>
<meta name="description" content="Find the best pour over coffee maker—we tested 6 top models for brew quality, ease of use, and durability so you don't have to.">
```

Problems: title = 63 chars (over 60), description contains em dash (banned per `04-content-mandatory.md`), title contains em dash.

### Correct robots.txt

```
User-agent: *
Allow: /
Disallow: /go/

Sitemap: https://brewverdict.com/sitemap.xml
```

### Incorrect robots.txt — missing blank line

```
User-agent: *
Allow: /
Disallow: /go/
Sitemap: https://brewverdict.com/sitemap.xml
```

Without the blank line, some crawlers fail to recognize the Sitemap directive.

## Validation

After generating a site, Claude Code MUST verify:

1. `<title>` length ≤ 60 chars and contains `seo.primaryKeyword` verbatim
2. `<meta name="description">` length ≤ 155 chars and contains primary keyword verbatim
3. Exactly one `<h1>` element exists on the page
4. At least three `<h3>` elements exist
5. No `<link rel="canonical">` tag is present
6. Schema JSON-LD parses as valid JSON
7. Schema includes Article, WebSite, FAQPage, SpeakableSpecification (and ItemList if listicle/amazon)
8. Article schema dates use ISO 8601 with timezone offset
9. Article schema author Organization has `url` field
10. `og:image` and `twitter:image` URLs match pattern `/og-images/[domain]-og.jpg`
11. `public/robots.txt` exists and contains the blank line before Sitemap
12. `public/sitemap.xml` exists and is valid XML
13. `public/[indexNowKey].txt` exists and contains the key value
14. Body content word count ≥ 1500
15. Subpages `/about/`, `/contact/`, `/privacy/`, `/disclosure/` exist

If any check fails, the build is incomplete. Report the failure with the specific check number and the file or selector where the violation occurred.

## Source / version history

- 2026-05-12 — Initial creation. Compiled from v3.2 Phase 1 SEO requirements, Phase 4 schema template, and Phase 3 post-launch checklist. Incorporates HydroVerdict and FairwayVerdict launch learnings.
