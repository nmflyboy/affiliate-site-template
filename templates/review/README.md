# Review Template

Single-product deep-dive page. Used when the primary keyword is a product name or a review-intent phrase like "X review" or "is X worth it".

## When to use this template

- Primary keyword targets ONE specific product
- Reader intent is "I am considering this product specifically, help me decide"
- You can write 2000+ words about a single product

## Status

**Scaffold deferred.** This template inherits 80%+ of its structure from `listicle/base.html`. Rather than maintain two near-identical files, the recommended approach is:

1. Build a single-product page by using `listicle/base.html` with exactly 1 product in `config.affiliate.products[]`
2. Set `template.type` to `review` so Claude Code knows to:
   - Hide the comparison table block
   - Hide the "The [Pick Items]" section header
   - Show only one product card, centered, full-width on desktop
   - Use the H1 pattern "[Product Name] Review: [angle]" instead of "Best [keyword]"
   - Generate intro paragraphs as "what is this product" instead of "here are the options"

The structural divergence between review and listicle is small enough to handle as conditional logic at build time. If you find this template needs its own base.html, Claude Code can spawn one from a future session.

## Build contract additions vs listicle

- `{{H1_TEXT}}` synthesized as: `{Product Name} Review: {one-line angle from product specificDetail or shortDescription}`
- `{{INTRO_PARAGRAPHS}}` describes the product itself, not a comparison
- `{{HOW_WE_PICKED_PARAGRAPHS}}` becomes "How We Tested" or "Why This Product"
- Comparison table is omitted
- Single product card rendered centered: `style="max-width: 480px; margin: 0 auto;"`

## Launch jack variant

When `template.launchJackMode === true`, additional structure is injected:

- Countdown timer between disclosure banner and Quick Answer (vanilla JS, uses `template.launchJack.cartCloseDateTime`)
- Two-state CTA (pre-launch shows "Notify Me" form; live shows "Buy Now")
- Bonus stack section between product description and FAQ
- Email capture form (uses `template.launchJack.emailTool` and `emailFormId`)

The launch-jack-specific injection points are implemented in the build script.
