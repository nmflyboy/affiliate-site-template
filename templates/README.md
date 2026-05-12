# templates/ — Site Type Scaffolds

This directory holds the structural scaffolds for each of the six site template types. Each template provides the HTML/JSX/CSS starting point that Claude Code customizes per site config.

## Status

**Not yet populated.** Template scaffolds are added in Stage 4 of the build-out, after the rules engine is stable.

Planned subdirectories:

```
templates/
├── listicle/       React + Vite scaffold for multi-product listicle pages
├── review/         HTML scaffold for single-product review pages
├── headtohead/     HTML scaffold for X vs Y comparison pages
├── tool/           React scaffold for interactive tool + affiliate upsell
├── amazon/         HTML scaffold for Amazon Roundup pages
└── leadgen/        HTML scaffold for How-To / Lead Capture pages
```

## What goes in a template

Each template directory will contain:

- The minimum file set needed to scaffold the page type (index.html or App.jsx, CSS, any required components)
- Placeholder regions marked clearly for Claude Code to fill from the config (e.g. `<!-- INSERT: hero -->`)
- A README explaining the template's specific structure and any template-specific config fields

## Template type matrix

| Template | Build Type | Products | Best For |
|---|---|---|---|
| listicle | React | 1–6 with /go/ slugs | Multiple affiliate products, comparison table, broad keyword |
| review | HTML | 1 with /go/ slug | Review keyword for one specific product |
| headtohead | HTML | 2 with /go/ slugs | "X vs Y" comparison keyword |
| tool | React | Tool + 1 affiliate link | Calculator or generator keyword |
| amazon | HTML | 1–6 direct Amazon links | Amazon roundup keyword, no /go/ folders needed |
| leadgen | HTML | None | "How to" keyword, lead capture form |

Once populated, every template MUST produce output that satisfies all mandatory rules in `../rules/`. Templates do not relax rules; they provide the structure to which rules apply.
