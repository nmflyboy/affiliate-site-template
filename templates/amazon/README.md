# Amazon Roundup Template

Multi-product page where ALL products are Amazon Associates links. Structurally identical to the listicle template; behaviorally simpler.

## When to use this template

- Primary keyword is "best X on Amazon" or similar
- ALL products in the comparison are Amazon Associates links
- You want to skip /go/ redirect folders entirely (Amazon links go direct)

## Status

**Reuses `listicle/base.html` with two modifications:**

1. /go/ redirects are NOT generated. Product `href` values point directly to the Amazon affiliate URL.
2. The Amazon Associates required statement (rule 05-2.6) appears in BOTH the disclosure banner AND a second time near the bottom of the page.

## Build contract differences vs listicle

| Aspect | Listicle | Amazon |
|---|---|---|
| /go/ redirect files | Generated for each product | NOT generated |
| Product `<a href>` values | Point to `/go/[slug]` | Point directly to amazon affiliate URL |
| `affiliate.networks` | May contain mix | MUST be exactly `["amazon"]` |
| Amazon required statement count | Once | Twice (top + bottom of page) |
| FTC disclosure prominence | Standard banner | Standard banner with bold |
| robots.txt `Disallow: /go/` | Required | Optional (no /go/ paths exist) |

## Why two appearances of the Amazon statement

The Amazon Associates Operating Agreement requires the verbatim statement be visible alongside any Amazon link. For sites with mixed affiliate networks, one prominent banner near the top satisfies this. For Amazon-only sites where every link on the page is Amazon, placing the statement near the bottom too reduces the chance of an Amazon compliance review flagging the page during a sweep.

## Implementation path

Claude Code building an Amazon template:

1. Loads `templates/listicle/base.html`
2. Validates `config.affiliate.networks` is exactly `["amazon"]`
3. Generates product cards with `href={product.affiliateLink}` (NOT a /go/ slug)
4. Skips the /go/ redirect file generation step
5. Injects the Amazon required statement in both the disclosure banner AND a footer-area info box
6. Generates robots.txt without `Disallow: /go/` (optional)

## Custom rule recommendation

For Amazon templates, enable `99-custom/amazon-associates-tos.md` (when that rule pack is added) for full Operating Agreement compliance checks. The mandatory rule 05-2.6 covers the headline requirement, but the full TOS has additional constraints worth checking.
