# scripts/ — Build Helpers

This directory holds executable build scripts and helpers used by the build system.

## Status

**Not yet populated.** Scripts are added in Stage 4 after the templates are in place.

## Planned scripts

- `build-site.mjs` — Reads `site-config.json`, validates against `configs/_schema.json`, loads applicable rules from `rules/`, applies them to the matching template from `templates/`, writes output to `dist/`.
- `validate-output.mjs` — After generation, runs every check defined in `validation/` against the output and reports pass/fail per rule.
- `validate-config.mjs` — Standalone config validation (runnable before invoking the build, to surface schema errors early).
- `init-site.mjs` — Generates a fresh `site-config.json` skeleton based on prompted answers. Used for new-site spin-up.

## Invocation pattern

Scripts are designed to be invoked by Claude Code as part of the build workflow defined in `../CLAUDE.md`. Direct manual invocation is supported but not required:

```
node scripts/validate-config.mjs ./site-config.json
node scripts/build-site.mjs ./site-config.json
node scripts/validate-output.mjs ./dist
```

Node.js 18 or higher is required for these scripts. The native installer for Claude Code does not include Node; if Node is needed at this stage, install separately.
