# 00-master.md — Rules Engine Overview

This file is the table of contents and operating manual for the rules directory. It does not contain enforceable rules itself; it explains how the other files work together. Read this before reading any individual rule file.

## How rules are loaded

When Claude Code builds a site, it loads rule files in numeric order based on filename prefix. The numeric prefix determines BOTH the load order and the authority level of the rule.

## Rule categories

### 00–09: Master and mandatory

Always loaded. Always win in conflicts. These rules are the non-negotiable foundation of every site.

- `00-master.md` — this file (no enforceable rules)
- `01-seo-mandatory.md` — keyword placement, meta tags, schema structure, robots.txt, sitemap
- `02-design-mandatory.md` — color contrast, link styling, brand color discipline
- `03-performance-mandatory.md` — hero image handling, preload tags, picture element, logo sizing
- `04-content-mandatory.md` — em dash ban, LLM-slop phrase ban, Quick Answer structure, fabricated-stat ban
- `05-affiliate-mandatory.md` — /go/ redirect implementation, disclosure placement, auto-linking rules

### 10–89: Conditional

Loaded only when the site's config sets the appropriate flag. These rules ADD requirements on top of the mandatory rules; they do not weaken them.

- `10-tier1-health.md` — loaded when `config.riskTier === 1`. Adds safety language requirements, medical disclaimers, restricted-claim list.
- `11-tier2-financial.md` — loaded when `config.riskTier === 2`. Adds financial disclaimers, restricted-claim list, citation requirements.

Reserved ranges for future expansion:
- 20–29: Template-type-specific (e.g. `20-launch-jack-mode.md` for the launch-jacking review variant)
- 30–39: Affiliate-network-specific (e.g. `30-amazon-associates.md` if Amazon ever gets stricter than the FTC baseline)
- 40–49: Locale and regulatory (e.g. `40-gdpr-eu.md` for EU traffic)
- 50–89: Available for site-class-specific rules

### 90–98: System reserved

Reserved for future system-level rules added by Robin. Not currently in use.

### 99-custom/: Third-party and user-added rules

Directory, not a single file. Each file in this directory is an opt-in rule pack. Loaded after all mandatory and conditional rules. Files load alphabetically by filename within the directory.

Examples of what lives here:
- External SEO frameworks (e.g. `google-eeat-essentials.md`)
- Legal/regulatory checklists (e.g. `ftc-affiliate-disclosure.md`)
- Network-specific compliance (e.g. `amazon-associates-tos.md`)
- Accessibility standards (e.g. `wcag-2-2-aa.md`)

Custom rules are controlled per-site via `config.customRules.enabled` and `config.customRules.disabled`. A custom rule file present in the directory but not listed in `enabled` is ignored for that site.

## Rule file structure

Every rule file in this directory follows the same structure for predictability:

1. **Title** — `# NN-filename.md — Short descriptive title`
2. **Purpose** — one paragraph explaining what this rule file covers and why
3. **Authority level** — MANDATORY, CONDITIONAL, or CUSTOM
4. **Rules** — numbered, with each rule labeled MUST, SHOULD, or MAY
5. **Examples** — correct and incorrect side-by-side where useful
6. **Validation** — what Claude Code should check after generation to confirm compliance
7. **Source / version history** — where the rule came from (v3.2 docx section, external standard, etc.) and when it last changed

Rules use RFC 2119 vocabulary:
- **MUST / MUST NOT** — non-negotiable. Build fails if violated.
- **SHOULD / SHOULD NOT** — strongly preferred. Deviation requires documented justification in the commit message or build report.
- **MAY** — optional. Use judgment based on context.

## Conflict resolution

Conflicts between rules are resolved by priority:

1. Lower numeric prefix wins over higher.
2. Within the same prefix range, the more specific rule wins over the more general one.
3. Mandatory always wins over conditional and custom.
4. Custom rules may EXTEND mandatory rules with additional requirements. They may NOT relax or override mandatory rules.

If a custom rule attempts to override a mandatory rule, Claude Code:
1. Applies the mandatory rule.
2. Reports the conflict to Robin with both rule citations.
3. Continues the build.

## Adding a new rule

The process for adding a new rule (whether to an existing file or as a new file):

1. Identify the right authority level (mandatory? conditional? custom?).
2. Pick the right numeric prefix.
3. Write the rule following the file structure above.
4. Update CLAUDE.md's validation expectations section if the rule introduces a new automated check.
5. Commit with message `rules(scope): description` using Conventional Commits format.
6. Optionally tag a release if the rule change is significant enough to retrofit existing sites.

## Modifying an existing rule

When changing an existing rule:

1. Edit only the specific rule, not the surrounding context.
2. Update the "Source / version history" section at the bottom of the rule file with the date and reason.
3. Commit with message `rules(scope): describe the change`.
4. If the change is restrictive (tightens requirements), consider whether existing sites need retrofit. Note this in the commit message.

## What this file is NOT

- This file does not contain enforceable rules. Looking here for "the no em dash rule" is wrong; that's in `04-content-mandatory.md`.
- This file does not override CLAUDE.md. CLAUDE.md sets workflow; this file documents the rules organization.
- This file is not a substitute for reading the individual rule files. Claude Code MUST read each applicable file in full when building a site, not rely on this overview.

## Source / version history

- 2026-05-12 — Initial creation. Based on v3.2 system architecture, formalized into rules-driven build for Claude Code.
