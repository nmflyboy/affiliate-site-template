# Rules Authoring Guide

How to write a new rule or modify an existing one in this template repo.

## When to add a new rule

Add a new rule when you discover a pattern that:

- Affects multiple sites (not a one-off site fix)
- Has a clear pass/fail criterion (not a subjective style preference)
- Can be enforced or verified programmatically by Claude Code

Examples of good rule additions:
- A new SEO best practice discovered from a site launch
- A specific accessibility requirement from a WCAG audit
- A new content pattern that consistently scores poorly on AI detectors
- An updated affiliate network policy

Examples of things that should NOT be rules:
- Niche-specific copywriting choices (those belong in `content notes` in a site's config)
- Aesthetic preferences with no measurable criterion
- One-time site-specific exceptions

## Where to put a new rule

Use the numeric prefix system to pick the right file:

| Prefix range | Authority | Where to add |
|---|---|---|
| 01–05 | Mandatory | Add a numbered rule to an existing file (01–05) if it fits the existing scope, or to a new file in this range if it's a new domain |
| 10–11 | Conditional (risk tier) | Add to `10-tier1-health.md` or `11-tier2-financial.md` |
| 20–89 | Conditional (other) | Create a new file with appropriate prefix per the reservation table in `rules/00-master.md` |
| 99-custom/ | Third-party or user-added | Create a new file in `rules/99-custom/`, opt-in per site via `customRules.enabled` |

## How to write the rule itself

Every rule file follows the same structure. Use this as a template:

```markdown
# NN-filename.md — Short descriptive title

## Purpose

One paragraph explaining what this rule file covers and why it exists.

## Authority level

**MANDATORY** | **CONDITIONAL** | **CUSTOM**

## Rules

### 1. [Section name]

**1.1** [Rule text using MUST / SHOULD / MAY vocabulary]
**1.2** [Next rule]

### 2. [Next section]

...

## Examples

Correct and incorrect examples side-by-side.

## Validation

What Claude Code MUST check after generation to confirm compliance. Numbered list of checks.

## Source / version history

- YYYY-MM-DD — [Change description]
```

## Rule vocabulary

Use RFC 2119 keywords consistently:

- **MUST / MUST NOT** — Non-negotiable. Violation means the build is incomplete.
- **SHOULD / SHOULD NOT** — Strongly preferred. Deviation requires a documented justification.
- **MAY** — Permitted but optional. Use judgment based on context.

Do not use weaker phrases like "It's a good idea to..." or "Try to..." — these read as guidelines, not rules.

## Writing enforceable rules

Every rule MUST be both unambiguous and machine-verifiable. Compare:

### Bad rule (subjective, unverifiable)

> Body text should look professional and well-spaced.

### Good rule (specific, verifiable)

> **3.1** Body text MUST use a font size of at least 16px on desktop and 16px on mobile.
> **3.2** Line height for body text MUST be between 1.5 and 1.7.

The good version has specific numbers Claude Code can check against generated CSS. The bad version requires human judgment.

## Validation section

Every rule file MUST include a validation section listing the checks Claude Code performs on the generated output. Each check should:

- Reference the rule number it validates (e.g. "Check rule 3.1: font size ≥ 16px")
- Be specific about what to scan (e.g. "Scan all `<p>` elements in body content")
- Specify the pass/fail outcome (e.g. "Pass if all elements have font-size ≥ 16px in computed CSS")

## Updating an existing rule

When changing an existing rule:

1. Edit only the specific rule, not surrounding context.
2. Add an entry to "Source / version history" at the bottom of the file with the date and reason for the change.
3. Commit using Conventional Commits format: `rules(scope): describe the change`.
4. Example commit: `rules(seo): tighten meta description from 155 to 150 chars`
5. If the change is restrictive (tightens requirements), note in the commit whether existing sites need retrofit.

## Custom rule files

Custom rules in `rules/99-custom/` follow the same structure but with `Authority level: CUSTOM`. They MUST NOT contain rules that override or relax mandatory rules; they may only ADD requirements.

If a custom rule discovers it needs to override a mandatory rule, that is a signal the mandatory rule itself should be revisited — flag it to Robin instead of writing the override.

## Testing a new rule

Before committing, mentally walk through:

1. Could Claude Code enforce this rule when generating a site? If the rule is ambiguous, sharpen it.
2. Could Claude Code verify the rule was satisfied after generation? If not, the validation section is incomplete.
3. Would I object if a site I'd already built failed this rule? If yes, consider whether the rule should be MUST or SHOULD.
4. Does this rule conflict with any other existing rule? Read adjacent rule files before adding.

## Removing a rule

Removing a rule is rare but legitimate when:

- The reason for the rule no longer applies (e.g. a platform change made the rule obsolete)
- The rule was found to produce worse outcomes than the alternative
- The rule is being replaced by a different rule that supersedes it

When removing:

1. Move the rule's content to a new section at the bottom of the file titled "Removed rules" with the removal date and reason.
2. Renumber remaining rules.
3. Commit with `rules(scope): remove rule [number] (reason)`.

Do not delete rules from history entirely; the "Removed rules" graveyard preserves institutional memory of why a rule existed and why it was abandoned.
