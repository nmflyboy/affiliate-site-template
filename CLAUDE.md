# CLAUDE.md — Affiliate Site Template

This file is the master instructions document for Claude Code working in this repository. Read it in full at the start of every session before doing any work.

## What this repo is

This is a reusable scaffold for building static affiliate marketing sites. It is the "factory" — it holds rules, templates, and configuration schema. Sites built from this template are separate repositories (one per site) that inherit this factory's output at the moment they are cloned.

Owner: Robin Lilly
Purpose: Build, validate, and deploy single-page affiliate sites to Cloudflare Pages at scale (~20 sites)
Networks: Amazon Associates, Awin, ClickBank, JVZoo, direct programs

## Core principle: rules-driven, not memory-driven

Every site built from this template must comply with the rules defined in `rules/`. Do not rely on prior session memory, training data defaults, or general best-practices when those conflict with what's in `rules/`. The rules in this repo are authoritative.

If you find yourself reasoning "I think this should be done X way" without a rule citation, stop and check the rules first. If no rule covers the situation, ask Robin before deciding.

## Build workflow (every site, every time)

When Robin asks you to build, regenerate, or modify an affiliate site, follow these six steps in order:

1. **Read the site config.** The site's `site-config.json` is the single source of truth for site-specific values (domain, brand, products, keyword, risk tier, etc.). Validate it against `configs/_schema.json`. If validation fails, stop and report the errors. Do not attempt to fill in missing fields with defaults unless the schema explicitly defines a default.

2. **Load all applicable rules.** Read files in `rules/` in numeric order:
   - Always: `00-master.md`, `01-seo-mandatory.md` through `05-affiliate-mandatory.md`
   - Conditionally based on `config.riskTier`:
     - If `riskTier === 1`: also read `10-tier1-health.md`
     - If `riskTier === 2`: also read `11-tier2-financial.md`
   - Then read every file listed in `config.customRules.enabled` from `rules/99-custom/`
   - Skip files listed in `config.customRules.disabled`

3. **Load the template.** Based on `config.template.type`, read the corresponding scaffold from `templates/<type>/`. The template provides the structural starting point; rules constrain how it gets filled in.

4. **Apply rules to template.** Generate the site's static HTML, CSS, and JS output. Every rule labeled "MUST" or "MANDATORY" is non-negotiable. Rules labeled "SHOULD" can be deviated from with documented justification.

5. **Write output to `/dist/`.** Never modify source templates or rules during generation. The `dist/` folder is the only thing that gets deployed.

6. **Run validation.** After generation, run every check in `validation/` against the output. Report all warnings and errors before declaring the build complete.

## Rules engine: priority and conflict resolution

Rules load in numeric order. Lower numbers = higher priority.

- **00-09: Master and mandatory rules.** Always loaded. Always win in conflicts.
- **10-89: Conditional rules.** Loaded based on config flags (risk tier, template type, etc.).
- **90-98: Reserved for future system rules.**
- **99-custom/: Third-party and user-added rules.** Load last. May ADD to mandatory rules. May not OVERRIDE them.

If a custom rule contradicts a mandatory rule:
1. The mandatory rule wins.
2. Surface the conflict to Robin in your response: "Custom rule X in `99-custom/foo.md` conflicts with mandatory rule Y in `01-seo-mandatory.md`. Applying mandatory. Recommend reviewing the custom rule."
3. Continue the build.

## What you do NOT do without explicit permission

- Do not modify any file in `rules/` unless Robin explicitly asks for a rule change.
- Do not modify `configs/_schema.json` unless Robin explicitly asks for a schema change.
- Do not modify files in `templates/` during a site build. Templates are sources, not outputs.
- Do not invent statistics, metrics, dates, prices, or product specifications.
- Do not commit or push to remote without explicit instruction.
- Do not create or modify `.env` files or anything containing secrets without prompting.

## Output conventions

- All commits use Conventional Commits format: `type(scope): description`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `rules`
  - Example: `rules(seo): tighten meta description limit from 155 to 150 chars`
- Commit messages reference the rule file or config field affected.
- Multi-file changes go in a single commit when they represent one logical change.
- Generated site output (`dist/`) is gitignored in site repos; only source files are committed.

## Validation expectations

Before declaring a build complete, the following must pass:

- JSON config validates against `_schema.json` (structural)
- No em dashes anywhere in generated HTML (per `04-content-mandatory.md`)
- No banned LLM-slop phrases anywhere in generated content (per `04-content-mandatory.md`)
- Every product name in body content links to its /go/ redirect on first mention per section (per `05-affiliate-mandatory.md`)
- Schema.org JSON-LD validates (Article, ItemList where applicable, FAQPage, WebSite, SpeakableSpecification)
- Robots.txt has the blank line before the Sitemap directive (per `01-seo-mandatory.md`)
- Meta description is 155 characters or fewer (per `01-seo-mandatory.md`)
- Meta title is 60 characters or fewer (per `01-seo-mandatory.md`)
- All in-content text links use the darkest brand color from config, not the accent color (per `02-design-mandatory.md`)
- Hero image has preload tag with fetchpriority="high" and is NOT lazy-loaded (per `03-performance-mandatory.md`)

If any validation fails, the build is incomplete. Report the failure with the specific rule citation and the file/line where the violation occurred.

## Communication style with Robin

- Be direct. Robin uses short, focused messages and expects the same back.
- Reference rule files by path when explaining decisions: "Per `01-seo-mandatory.md` section 3..."
- When asked to build a site, give a one-line status before starting and a structured report after.
- If you need information not in the config, ask once, clearly. Do not assume.
- Robin is not a developer. Explain technical decisions in plain English the first time; thereafter assume familiarity with terms already used in this session.

## When this file conflicts with anything else

This file is the entry point but it is not the lowest-level authority. Specific rule files in `rules/` take precedence over the general guidance here. If `01-seo-mandatory.md` says meta descriptions must be ≤150 chars and this file says ≤155, the rule file wins.

The hierarchy from highest to lowest authority:
1. Specific mandatory rule files (`rules/01-` through `rules/05-`)
2. Specific conditional rule files (`rules/10-`, `rules/11-`)
3. Custom third-party rules in `rules/99-custom/`
4. This CLAUDE.md (general guidance)
5. Claude Code's own defaults and training

When in doubt, follow the more specific source.
