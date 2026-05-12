# affiliate-site-template

Reusable scaffold for building static affiliate marketing sites — config-driven, rules-driven, deploys to Cloudflare Pages.

## What this is

This repository is the **factory** for affiliate sites. It contains:

- **Rules** that every site must comply with (SEO, design, performance, content, affiliate)
- **Templates** for the six site types (listicle, single product review, head-to-head, interactive tool, Amazon roundup, lead gen)
- **A JSON config schema** defining what variables a site needs
- **Validation checks** that run automatically on every build
- **Documentation** of the workflow

This repo is never deployed itself. It is cloned per-site to produce individual site repositories.

## How a new site gets built

The short version:

1. On GitHub, click "Use this template" to create a new repo (e.g. `brewverdict-site`).
2. Clone the new repo locally.
3. Fill in `site-config.json` with the site's variables (domain, brand, products, primary keyword, etc.).
4. In the repo, run `claude` and ask Claude Code to build the site.
5. Claude Code reads the config, applies the rules, generates the static site, and validates the output.
6. Commit and push. Cloudflare Pages auto-deploys.

Full workflow documented in `docs/workflow.md`.

## Repository structure

```
affiliate-site-template/
├── CLAUDE.md                  Master instructions for Claude Code
├── README.md                  This file
├── rules/                     The rules engine
│   ├── 00-master.md           How the rules system works
│   ├── 01-seo-mandatory.md    Keyword, meta, schema, robots, sitemap
│   ├── 02-design-mandatory.md Color contrast, link styling
│   ├── 03-performance-mandatory.md  Image handling, preload, picture element
│   ├── 04-content-mandatory.md      Em dashes, slop phrases, AEO structure
│   ├── 05-affiliate-mandatory.md    /go/ redirects, disclosure, auto-linking
│   └── 99-custom/             Third-party rule packs (opt-in)
├── configs/
│   ├── _schema.json           JSON Schema defining valid config shape
│   └── _sample-config.json    Filled-in example (brewverdict.com)
├── templates/                 Site type scaffolds (added in Stage 4)
├── scripts/                   Build helpers (added in Stage 4)
├── validation/                Automated check rules (added in Stage 4)
└── docs/
    ├── workflow.md            Full build workflow
    ├── rules-authoring.md     How to add or modify a rule
    └── migration-from-lovable.md  Migrating existing Lovable sites
```

## Owner and version

- Owner: Robin Lilly
- Current build stage: Stage 3 complete (rules engine + JSON schema)
- Next stage: Stage 4 (template scaffolds and build script), then Stage 5 (Cloudflare Pages deployment)

## License

Private. Not for redistribution.
