# Build Workflow

This document describes the full workflow for spinning up a new affiliate site from this template. It supersedes the v3.2 Phase 0–9 workflow that targeted Lovable.dev.

## High-level workflow

1. **Decide on a niche and primary keyword.** Use the keyword research spreadsheet to pick a low-competition keyword with commercial intent.
2. **Acquire the domain.** Register on Cloudflare or another registrar. Add to Cloudflare DNS if not already there.
3. **Set up affiliate program access.** Confirm Amazon tag for the niche, apply for Awin merchants if relevant, get hoplinks for ClickBank or JVZoo products.
4. **Spin up the site repo from this template.** Click "Use this template" on github.com/nmflyboy/affiliate-site-template. Name the new repo `[domain]-site` (e.g. `brewverdict-site`).
5. **Clone the new repo locally.** `cd C:\code\sites && git clone https://github.com/nmflyboy/[domain]-site.git`
6. **Fill in `site-config.json`.** Copy `configs/_sample-config.json` to the repo root as `site-config.json`, edit values for the new site.
7. **Build the site.** In the repo directory: `claude` → "build this site from site-config.json".
8. **Review the generated output.** Claude Code writes to `dist/`. Open `dist/index.html` and walk through it. Run validation: "validate the generated output."
9. **Commit and push.** `claude` will commit on instruction; auto-deploy via Cloudflare Pages picks it up.
10. **Cloudflare DNS and SSL setup.** Point the domain at Cloudflare Pages, enable SSL Full Strict, Always HTTPS, configure email routing.
11. **Post-launch checklist.** Submit to Google Search Console + Bing, verify schema with Rich Results Test, run PageSpeed Insights, paste content into Brandwell or equivalent for AI-detection check, verify /go/ redirects in browser.

## Step-by-step detail

### Step 1: Niche and keyword

- Open `Copy_of_Mega_LowCompetition_Keywords_Sheet.xlsx`
- Filter by niche column (forward-fill the niche column first if needed)
- Sort by competition score ascending
- Pick a keyword with monthly search volume above 500 and competition below 30
- Confirm the keyword has commercial intent (someone searching this is shopping, not just learning)

### Step 2: Domain

- Search availability on Cloudflare Registrar (cheapest with no upsells)
- Prefer .com if available; .org or .net only as fallback
- Verdict-family naming convention (BrewVerdict, FairwayVerdict, HydroVerdict, etc.) creates compounding brand authority across multiple sites
- After registration, the domain auto-appears in your Cloudflare DNS dashboard

### Step 3: Affiliate program access

- **Amazon Associates**: tag is one per niche category; reuse if you already have a tag for this category (e.g. brewverdict-20 for coffee, fairwayverdict-20 for golf)
- **Awin**: apply for individual merchants in the niche (Fellow, Prima Coffee, etc.) — note as of May 2026 Awin is NOT pre-approved
- **ClickBank**: get hoplinks from clickbank.com → Marketplace, filter by gravity ≥ 30 for active products
- **JVZoo / WarriorPlus**: request approval per product; vendors typically approve within 24 hours

### Step 4: Spin up site repo from template

On github.com, navigate to https://github.com/nmflyboy/affiliate-site-template

- Click the green **Use this template** button (top right of the file list)
- Choose **Create a new repository**
- Name: `[domain]-site` (e.g. `brewverdict-site`)
- Visibility: **Private** (flip to Public later if desired; private is safer default)
- Click **Create repository from template**

### Step 5: Clone locally

```
cd C:\code\sites
git clone https://github.com/nmflyboy/[domain]-site.git
cd [domain]-site
code .
```

### Step 6: Fill in site-config.json

In the new site repo, copy the sample config to the repo root and edit:

```
copy configs\_sample-config.json site-config.json
```

Then edit `site-config.json` in VS Code. Fill in:

- `site` — domain, brandName, tagline, editorialTeamName, namedAuthor (you), contactEmail, niche, year
- `seo` — primaryKeyword, quickAnswer (write 40-50 words), authorityStatistic (leave empty if none), indexNowKey (generate fresh 32-char hex per site), ga4MeasurementId
- `template` — type (listicle, review, headtohead, tool, amazon, leadgen), handsOnReview (true/false)
- `design` — primaryColor, accentColor, darkestBrandColor (hex codes from your brand palette)
- `affiliate` — amazonTag, networks array, products array with 1-6 products
- `content` — researchScope, comparisonAxes, pickedItemNoun, selectionCriteria, nicheReviewItems
- `riskTier` — 3 for general consumer, 2 for financial, 1 for health/safety (only set 1 if truly health-related)
- `customRules` — leave enabled empty initially; add third-party rule names once those packs exist

### Step 7: Build the site

In the integrated terminal:

```
claude
```

At the Claude Code prompt:

> Build this site using site-config.json. Read CLAUDE.md and apply all mandatory rules. Generate output to dist/.

Claude Code reads the config, validates, loads rules, loads the template, generates output, and reports.

### Step 8: Review generated output

In VS Code, open `dist/index.html` and walk through it. Pay attention to:

- Title and meta description visible in the document head
- H1 contains primary keyword
- Quick Answer box renders above hero
- Product cards all have the same structure
- /go/ redirect files exist for each product
- robots.txt has the blank line before Sitemap

Then run validation:

> Validate the generated output in dist/ against all mandatory rules. Report any violations.

### Step 9: Commit and push

> Commit the dist output and site-config.json with message `feat(site): initial brewverdict.com build` and push to main.

Cloudflare Pages auto-deploys within 60 seconds of the push.

### Step 10: Cloudflare DNS and SSL setup

In Cloudflare dashboard:

- DNS: A record `@` and CNAME `www` point to Cloudflare Pages
- SSL/TLS: Full (Strict) mode
- SSL/TLS → Edge Certificates: Always Use HTTPS ON, Auto HTTPS Rewrites ON, Min TLS 1.2
- Rules → Redirect Rules: `www.[domain]` → `https://[domain]` 301
- Email → Email Routing: `contact@[domain]` → your personal email

### Step 11: Post-launch checklist

- Google Search Console: add property → verify (DNS or HTML file) → submit `https://[domain]/sitemap.xml`
- Bing Webmaster Tools: add site → verify → submit sitemap
- IndexNow: hit `https://[domain]/indexnow?url=https://[domain]&key=[indexNowKey]` in browser
- Rich Results Test: paste `https://[domain]` at search.google.com/test/rich-results, expect zero errors
- PageSpeed Insights: paste at pagespeed.web.dev, expect mobile ≥ 90 (Cloudflare Pages handles the security and caching audits that Lovable Cloud failed)
- securityheaders.com: paste domain, expect A or A+ grade
- Brandwell or equivalent: paste body content (2500 char chunks if needed), expect ≥ 80% human
- Manual /go/ redirect verification: visit each /go/[slug] in browser, confirm correct affiliate URL loads

## What this workflow replaces from v3.2

- **Phase 1 Lovable master prompt** is replaced by `site-config.json` + Claude Code build.
- **Phase 2 Cloudflare** is condensed to step 10.
- **Phases 3, 5, 6** are replaced by automated validation against `rules/`.
- **Phase 4 schema** is enforced by `rules/01-seo-mandatory.md`.
- **Phase 7 IndexNow** is part of step 11.
- **Phase 8 quick reference** is this document.
- **Phase 9 Cloudflare Pages migration** is no longer needed because Cloudflare Pages is the default hosting.
