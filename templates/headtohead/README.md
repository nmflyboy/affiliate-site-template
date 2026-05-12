# Head-to-Head Template

Two-product comparison page. Used for "X vs Y" keywords.

## When to use this template

- Primary keyword is exactly "X vs Y" or "X or Y" or "X compared to Y"
- Reader intent is "I am choosing between these two specific things"
- Config has exactly 2 products in `affiliate.products[]`

## Status

**Scaffold deferred.** Like the review template, this is a variant of `listicle/base.html` with structural differences:

1. Comparison table becomes the centerpiece, not a quick-glance summary — full-width, more columns (Feature, Product A, Product B), one row per attribute
2. Product cards arranged side-by-side at all viewport widths (stack on mobile if needed)
3. H1 pattern: "{Product A} vs {Product B}: Which Is Right For You?"
4. Verdict section after the cards picks a winner for each of 3-4 use cases
5. FAQ section answers "should I get X or Y for..." questions

## Build contract additions vs listicle

- Require exactly 2 entries in `affiliate.products[]`; validation fails if 1 or 3+
- Synthesize H1 as: `{products[0].name} vs {products[1].name}: Which Is Right For You?`
- Comparison table has columns: Feature, {products[0].shortForms[0]}, {products[1].shortForms[0]}
- Comparison table rows: at minimum Best For, Key Strength, Considerations, Price Range, Verdict Pick
- Product cards: 2-column grid at all widths ≥ 640px
- After cards, render a "Which Should You Pick?" section with 3-4 H3 use cases and a recommended pick per case

## Implementation path

When you build a head-to-head site, Claude Code:

1. Starts from `listicle/base.html`
2. Replaces the comparison table block with the head-to-head variant
3. Modifies the product grid CSS to `grid-template-columns: 1fr 1fr`
4. Generates "Which Should You Pick?" content from `content.comparisonAxes`

A dedicated `base.html` for this template can be added later if the structural overrides become numerous.
