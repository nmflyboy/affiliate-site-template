# validation/ — Automated Output Checks

This directory holds the automated validation checks that run against generated site output.

## Status

**Not yet populated.** Validation rules are added in Stage 4 alongside the build script.

## What validation does

After Claude Code generates a site, the validation step parses the generated HTML, CSS, and supporting files and verifies that every rule labeled MUST in `../rules/` has been satisfied. The validation report is produced as part of the build output and surfaced to Robin before the build is declared complete.

Validation is the safety net that catches rule violations the template scaffolding might have missed.

## Planned checks

### Content checks (per `rules/04-content-mandatory.md`)
- `no-em-dashes.mjs` — Scan all generated HTML for U+2014 occurrences
- `no-slop-phrases.mjs` — Scan for any banned phrase from the LLM-slop blacklist
- `quick-answer-length.mjs` — Verify Quick Answer is 40-50 words
- `faq-count.mjs` — Verify at least 3 FAQ H3 elements exist

### SEO checks (per `rules/01-seo-mandatory.md`)
- `title-length.mjs` — Verify `<title>` is ≤ 60 chars and contains primary keyword
- `meta-description.mjs` — Verify length ≤ 155 chars and contains primary keyword
- `schema-valid.mjs` — Parse and validate JSON-LD structure
- `robots-format.mjs` — Verify robots.txt has the required blank line before Sitemap
- `indexnow-key-file.mjs` — Verify the key file exists with matching content

### Design checks (per `rules/02-design-mandatory.md`)
- `link-color.mjs` — Verify in-content links use darkestBrandColor not accentColor
- `contrast-ratio.mjs` — Calculate body text contrast from hex pair

### Performance checks (per `rules/03-performance-mandatory.md`)
- `hero-preload.mjs` — Verify hero preload tag exists with fetchpriority="high"
- `hero-not-lazy.mjs` — Verify hero img does NOT have loading="lazy"
- `picture-variants.mjs` — Verify three picture sources are present

### Affiliate checks (per `rules/05-affiliate-mandatory.md`)
- `go-redirects-exist.mjs` — Every product has a /go/ redirect implementation
- `no-direct-affiliate-href.mjs` — No href in HTML contains a raw affiliate URL
- `card-consistency.mjs` — All product cards in a grid share the same structure

## External-API checks (optional, runs if API keys are configured)

- `gpt-zero-score.mjs` — Submit content to GPTZero free API, return human-likelihood score
- `pagespeed-insights.mjs` — Submit deployed URL to Google PageSpeed Insights API, return CWV scores
- `securityheaders.mjs` — Submit deployed URL to securityheaders.com, return grade
- `schema-validator.mjs` — Submit JSON-LD to validator.schema.org API, return error count

Each check returns a structured result: pass/fail, rule citation, location of violation. The build script collates these into a final report.
