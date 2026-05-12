# Tool Template

Interactive tool or calculator page with affiliate upsell beneath. Used when the primary keyword is a tool-intent search like "X calculator" or "X generator" or "compare X".

## When to use this template

- Primary keyword implies an interactive tool ("calculator", "generator", "compare", "estimator", "quiz", "finder")
- Reader intent is "let me run this calculation, then show me products"
- You're willing to write 50-200 lines of vanilla JS for the tool itself

## Status

**Scaffold deferred.** Tool template requires per-site custom JS, so a generic scaffold provides limited value. Approach:

1. Use `listicle/base.html` as the structural starting point
2. Replace the hero image block with a `<section class="tool-app">` block
3. Write the tool's vanilla JS inline in a `<script defer>` block at end of body
4. Below the tool, render 1-3 product cards with affiliate links to recommended products

## Build contract additions vs listicle

- Add a `template.tool` config section (planned) with:
  - `toolType` — calculator, comparison, generator, quiz
  - `inputFields` — array of {label, type, min, max, defaultValue}
  - `outputLabel` — what the tool produces
  - `recommendationLogic` — how to map outputs to products
- Tool UI rendered in vanilla JS, no framework
- Hero image omitted; tool takes the above-the-fold position
- Tool MUST be keyboard-accessible (rule 02-8 focus indicators)
- Tool MUST work without JS (server-renders a "JS required" message with a static fallback recommendation)

## JS performance notes

Per `03-performance-mandatory.md` rule 6.1, tool JS MUST be deferred or async. The tool itself is below-the-fold-equivalent for performance budgeting; it does not need to render in the first paint.

## When to commission this template

Right now (May 2026), Robin has no live tool sites. When the first one is needed, that build session generates a specific tool scaffold here rather than maintaining a generic one in advance.
