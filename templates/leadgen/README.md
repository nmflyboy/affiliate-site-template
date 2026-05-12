# Lead Gen Template

How-to or educational page with an email capture as the primary conversion event. Optional affiliate links secondary to the email capture.

## When to use this template

- Primary keyword is informational ("how to X", "X guide", "X tutorial")
- Reader intent is "teach me how", not "show me what to buy"
- You're building a list to monetize later via email
- Affiliate links if present are supplementary, not the main conversion

## Status

**Scaffold deferred.** Lead gen requires per-site email tool integration (MailerLite, ConvertKit, SendFox), so the form embed varies per build. Approach:

1. Use `listicle/base.html` as structural base
2. Replace product cards section with content body (3-5 H2 sections of how-to content)
3. Add email capture form prominently below the hero AND above the FAQ
4. Optional 1-2 affiliate links in body content (auto-linked per rule 05-3 if products are in config)

## Build contract additions vs listicle

Add a `template.leadGen` config section (planned):

```json
"template": {
  "type": "leadgen",
  "leadGen": {
    "emailTool": "MailerLite",
    "formEmbedHtml": "...",
    "leadMagnetTitle": "Free Pour Over Cheat Sheet",
    "leadMagnetDescription": "Get the 1-page guide with grind sizes, ratios, and temperatures for 6 brew methods."
  }
}
```

## Structural differences from listicle

- Product grid replaced by `<article>` content sections (how-to body)
- Two email capture form positions: below hero, and at end of body
- Comparison table omitted unless config supplies products
- Affiliate disclosure banner ONLY when `affiliate.products` is non-empty
- robots.txt may or may not contain `Disallow: /go/` depending on whether the page has affiliate links

## Lead magnet handling

When `template.leadGen.leadMagnetTitle` is present:

- H1 becomes "Get the {leadMagnetTitle}" rather than the primary keyword phrase
- Quick Answer box becomes a benefit summary instead of an answer
- The H1 still contains the primary keyword somewhere; phrase order is flexible

## Email tool integration

The form embed HTML comes from the email tool itself (MailerLite, ConvertKit, SendFox provide HTML snippets). Claude Code injects `template.leadGen.formEmbedHtml` verbatim into both form positions. Form embed scripts MUST be deferred (per `03-performance-mandatory.md` rule 6.3).

## When to commission this template

When Robin's first lead-gen site is ready to build. The form embed pattern varies enough by email tool that pre-building a generic version provides limited value.
