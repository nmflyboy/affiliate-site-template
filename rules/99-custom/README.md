# 99-custom/ — Third-Party Rule Packs

This directory holds opt-in third-party rule packs. Files in this directory are loaded AFTER all mandatory and conditional rules, in alphabetical order by filename.

## Currently empty

The third-party rule packs are being written in a separate session. Planned packs:

- `ftc-affiliate-disclosure.md` — FTC Endorsement Guides compliance, exact disclosure phrasing, placement requirements
- `amazon-associates-tos.md` — Amazon Associates Operating Agreement compliance, mandatory phrases, banned claims
- `google-eeat-essentials.md` — Experience, Expertise, Authoritativeness, Trustworthiness framework, named author, methodology transparency, citation requirements
- `wcag-2-2-aa.md` — Web Content Accessibility Guidelines 2.2 AA compliance, keyboard navigation, alt text, focus indicators (extends `02-design-mandatory.md`)
- `schema-org-best-practices.md` — Schema.org structured data best practices, Review schema, BreadcrumbList, aggregateRating discipline (extends `01-seo-mandatory.md`)

## How to enable a custom rule for a site

In the site's `site-config.json`:

```json
"customRules": {
  "enabled": [
    "google-eeat-essentials",
    "ftc-affiliate-disclosure",
    "wcag-2-2-aa"
  ],
  "disabled": []
}
```

The file extension `.md` is implied; do not include it in the array values.

## How custom rules interact with mandatory rules

Custom rules may ADD requirements on top of mandatory rules. They may NOT relax or override mandatory rules. If a custom rule contradicts a mandatory rule, Claude Code applies the mandatory rule and surfaces the conflict in its build report.

See `../00-master.md` for full conflict resolution rules.

## Adding your own custom rule

1. Create a new `.md` file in this directory.
2. Use the rule file structure documented in `../00-master.md`: title, purpose, authority level (CUSTOM), rules, examples, validation, source/version.
3. Use RFC 2119 vocabulary (MUST, SHOULD, MAY).
4. Commit with message `rules(custom): add [rule-name]`.
5. Enable it in any site's config by adding the filename (without `.md`) to `customRules.enabled`.
