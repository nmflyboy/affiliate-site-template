# Listicle Template

Multi-product comparison page. The dominant template type for affiliate sites — used by BrewVerdict, FairwayVerdict, HydroVerdict.

## When to use this template

- Primary keyword is plural or comparative: "best X", "top X for Y", "X compared"
- You're presenting 3 to 6 products with similar use cases
- Reader intent is "show me the options, help me pick"

## Build contract

Claude Code reads `base.html` and replaces every `{{PLACEHOLDER}}` token with values derived from `site-config.json`. The full list of placeholders, what each one becomes, and which config field supplies the value:

### Site identity

| Placeholder | Source | Notes |
|---|---|---|
| `{{DOMAIN}}` | `site.domain` | Bare domain, no protocol |
| `{{BRAND_NAME}}` | `site.brandName` | Display name in header and footer |
| `{{TAGLINE}}` | `site.tagline` | Footer subtitle |
| `{{YEAR}}` | `site.year` | Copyright year |
| `{{EDITORIAL_TEAM_NAME}}` | `site.editorialTeamName` | Author meta tag |

### SEO

| Placeholder | Source | Constraint |
|---|---|---|
| `{{META_TITLE}}` | Synthesized from `seo.primaryKeyword` + `site.brandName` | ≤60 chars, contains keyword verbatim |
| `{{META_DESCRIPTION}}` | Synthesized using `seo.primaryKeyword` | ≤155 chars, contains keyword verbatim |
| `{{H1_TEXT}}` | Synthesized from `seo.primaryKeyword` | Contains keyword verbatim, may have year suffix |
| `{{QUICK_ANSWER_TEXT}}` | `seo.quickAnswer` | 40-50 words, used as-is |
| `{{SCHEMA_JSON_LD}}` | Composed from config | Article + WebSite + FAQPage + SpeakableSpecification + ItemList |
| `{{GA4_SNIPPET}}` | `seo.ga4MeasurementId` | Empty string when no GA4 ID; full async snippet when present |

### Design

| Placeholder | Source |
|---|---|
| `{{PRIMARY_COLOR}}` | `design.primaryColor` |
| `{{ACCENT_COLOR}}` | `design.accentColor` |
| `{{DARKEST_BRAND_COLOR}}` | `design.darkestBrandColor` |

### Hero image

| Placeholder | Source |
|---|---|
| `{{HERO_IMAGE_DESKTOP_URL}}` | `/og-images/[domain]-og.webp` (1920w) |
| `{{HERO_IMAGE_TABLET_URL}}` | `/og-images/[domain]-og-1200.webp` |
| `{{HERO_IMAGE_MOBILE_URL}}` | `/og-images/[domain]-og-800.webp` |
| `{{HERO_IMAGE_ALT}}` | Synthesized from keyword + niche |

### Content sections (Claude Code generates the prose)

| Placeholder | What goes there |
|---|---|
| `{{INTRO_PARAGRAPHS}}` | 2-3 paragraphs introducing the comparison. NO em dashes. NO slop phrases. Auto-links first mention of each product name to its /go/ slug per rule 05-3 |
| `{{COMPARISON_TABLE_ROWS}}` | One `<tr>` per product, in display order, columns matching base.html header |
| `{{PRODUCT_CARDS}}` | One `<article class="product-card">` per product, all sharing the same structure per rule 05-4.1 |
| `{{HOW_WE_PICKED_PARAGRAPHS}}` | 2-3 paragraphs of methodology using `content.researchScope`, `content.selectionCriteria`, `content.nicheReviewItems` |
| `{{FAQ_ITEMS}}` | At least 3 `<div class="faq-item">` with `<h3>` question and 40-100 word answer |
| `{{CLOSING_CTA_TEXT}}` | Action-oriented text like "See Our Top Pick" or "Check Latest Price" |
| `{{TOP_PRODUCT_SLUG}}` | The first product's `/go/[slug]` |
| `{{PICKED_ITEM_NOUN_TITLECASE}}` | `content.pickedItemNoun` with Title Case |

### Conditional blocks

| Placeholder | When populated |
|---|---|
| `{{AUTHOR_BYLINE}}` | Only when `site.namedAuthor` is set; renders `<p class="byline">By {namedAuthor}, {editorialTeamName}</p>` |
| `{{AMAZON_REQUIRED_STATEMENT}}` | Only when `amazon` is in `affiliate.networks`; renders the verbatim "As an Amazon Associate I earn from qualifying purchases." in an info box |
| `{{DISCLOSURE_BANNER_TEXT}}` | Default disclosure phrasing from rule 05-2.5; if config supplies a custom version under `affiliate.disclosureOverride`, use that instead |

## Product card structure

Each product card MUST follow this structure (rule 05-4):

```html
<article class="product-card">
  <span class="product-rank">#1 OVERALL</span>
  <h3>{product name}</h3>
  <p class="best-for"><strong>Best For:</strong> {bestFor from config}</p>
  <p>{shortDescription from config} {specificDetail from config}</p>

  <strong>Pros</strong>
  <ul class="pros-list">
    <li>{pros[0]}</li>
    ...
  </ul>

  <strong>Considerations</strong>
  <ul class="considerations-list">
    <li>{considerations[0]}</li>
    ...
  </ul>

  <p class="verdict">{verdict from config}</p>

  <a href="{slug from config}" class="cta-button">Check Latest Price</a>
</article>
```

Consistency rule: all cards in the grid use the same sub-sections. If even one product in the config lacks `considerations` or `verdict`, omit those sections from ALL cards rather than rendering uneven cards.

## Files in this directory

- `base.html` — the main template scaffold
- `README.md` — this file

## /go/ redirect files

Claude Code creates `dist/go/[slug]/index.html` for each product after the main page renders. The redirect template lives in `templates/go-redirect.html`.

## Subpages

After the main page, Claude Code generates these subpages from minimal scaffolds:

- `dist/about/index.html`
- `dist/contact/index.html`
- `dist/privacy/index.html`
- `dist/disclosure/index.html`

These are simple text pages using the same header/footer/CSS as the main page.

## Validation

After generation, every check in `validation/checks/` runs against the output. Build is complete only when all MUST-level rules pass.
