# 02-design-mandatory.md — Design Mandatory Rules

## Purpose

This file defines non-negotiable design and styling rules for every site generated from this template: link color discipline, contrast requirements, and the boundary between brand colors and CTA accent colors. These rules exist to guarantee WCAG-compliant readability and to prevent the most common visual mistake in affiliate site builds — using a bright accent color (brass, gold, neon) for in-content text links on a light background, which fails contrast and looks unprofessional.

## Authority level

**MANDATORY.** Every rule below is non-negotiable. Build fails if violated.

## Color terminology used in this file

- **Darkest brand color** — the deepest color in the site's brand palette. Used for body text, headings, in-content links. Pulled from `config.design.darkestBrandColor`.
- **Primary brand color** — the dominant non-text brand color used for backgrounds, dividers, accents (other than CTAs). Pulled from `config.design.primaryColor`.
- **Accent color** — the high-saturation color reserved exclusively for buttons, CTAs, and hover states. Pulled from `config.design.accentColor`.

## Rules

### 1. In-content text links

**1.1** Links inside paragraphs, FAQ answers, intro copy, and any other body text MUST use the **darkest brand color**, NOT the accent color.

**1.2** Links MUST have a persistent underline (text-decoration: underline) at all times, not only on hover.

**1.3** Link font-weight MUST be 500 (medium). Body text font-weight is 400; the +100 weight differential is the secondary visual cue that this is a link.

**1.4** Hover state MUST shift the **underline color** (not the text color) to the accent color. The text color remains the darkest brand color in both default and hover state.

**1.5** Visited link styling MAY match the default link styling (browsers default to purple, which usually clashes with brand palette).

### 2. CTA buttons and primary actions

**2.1** The accent color MUST be reserved exclusively for:
- Primary CTA buttons ("Visit Official Site", "Check Price", "Read Full Review")
- Hover states (underline color shift for links, fill or border emphasis for buttons)
- Active/focus indicators on interactive elements

**2.2** CTA buttons MUST have a minimum click target of 44×44 pixels on mobile (WCAG 2.5.5).

**2.3** Button text MUST contrast with button background at 4.5:1 minimum (3:1 is allowed only for large text 18pt+ or 14pt+ bold).

### 3. Body text contrast

**3.1** Body text on its background MUST achieve a contrast ratio of at least **4.5:1** (WCAG AA for normal text). Target ratio is **7:1 (WCAG AAA)** when achievable without compromising the design.

**3.2** Headings on their background MUST achieve at least **3:1** contrast (WCAG AA for large text, defined as 18pt+ or 14pt+ bold).

**3.3** Contrast MUST be verified at https://webaim.org/resources/contrastchecker/ or equivalent before launch. The verification SHOULD be documented in the site's launch checklist.

### 4. Color discipline rationale

**4.1** This is the most common design failure on affiliate sites: brass, gold, copper, neon, or other high-saturation accent colors used for in-content text on cream or white backgrounds typically fall around 2.5:1 to 3.5:1 contrast — well below WCAG AA. The visual result also looks "spammy" or "marketing-y" to readers, reducing trust.

**4.2** Using the darkest brand color for links guarantees readable contrast even when the brand accent is high-saturation, AND preserves the brand identity through the underline color and the buttons.

### 5. Typography baseline

**5.1** Body text MUST use a font size of at least 16px on desktop and 16px on mobile (do not shrink for mobile; 16px is the iOS minimum below which Safari auto-zooms on form inputs).

**5.2** Line height for body text MUST be between 1.5 and 1.7.

**5.3** Maximum line length for body text SHOULD be 65–75 characters (use `max-width` on the content container, not absolute width).

**5.4** Headings MUST visibly distinguish from body text via size, weight, and spacing. Default heading sizes:
- h1: 2.25–2.5rem (36–40px)
- h2: 1.75–2rem (28–32px)
- h3: 1.25–1.5rem (20–24px)

### 6. Whitespace and rhythm

**6.1** Sections MUST be visually separated by spacing or dividers. Two H2 sections butted against each other with no breathing room reads as cramped and lowers perceived quality.

**6.2** Product cards in a grid MUST have consistent height. CSS Grid will render empty space below shorter cards when their content lengths differ — see `05-affiliate-mandatory.md` for the product card structure rules that prevent this.

### 7. Mobile responsive baseline

**7.1** The site MUST render correctly at 360px viewport width (the narrowest common mobile viewport).

**7.2** No horizontal scroll MAY appear at any viewport width between 360px and 1920px.

**7.3** Tap targets (links, buttons) MUST have at least 8px spacing between them on mobile to prevent mis-taps.

### 8. Focus indicators

**8.1** All interactive elements (links, buttons, form inputs) MUST have a visible focus indicator. The browser default outline is acceptable; custom focus styles MUST achieve 3:1 contrast against the surrounding background.

**8.2** Focus indicators MUST NOT be removed with `outline: none` unless replaced with an equivalent or stronger custom focus style.

## Examples

### Correct in-content link styling (CSS)

```css
.content a {
  color: var(--darkest-brand-color);   /* e.g. #1A0F08 */
  text-decoration: underline;
  text-decoration-color: var(--darkest-brand-color);
  font-weight: 500;
}

.content a:hover {
  text-decoration-color: var(--accent-color);  /* e.g. #C9A961 */
  /* text color stays the same */
}
```

### Incorrect — accent color used for link text

```css
.content a {
  color: var(--accent-color);   /* WRONG: brass on cream = 2.8:1 contrast, fails WCAG */
  text-decoration: none;        /* WRONG: no persistent underline */
  font-weight: 400;             /* WRONG: same weight as body, no secondary cue */
}
```

### Correct color assignments for BrewVerdict (illustrative)

| Element | Color | Hex |
|---|---|---|
| Body text | darkest brand | #1A0F08 |
| Headings | darkest brand | #1A0F08 |
| In-content links | darkest brand + underline | #1A0F08 underline |
| Link hover | underline shifts to accent | underline-color: #C9A961 |
| Primary CTA button bg | accent | #C9A961 |
| Primary CTA button text | darkest brand or white (whichever passes contrast) | #1A0F08 or #FFFFFF |
| Section dividers | primary brand color | #3D2817 |
| Page background | cream | #FAF7F2 |

## Validation

After generating a site, Claude Code MUST verify:

1. In-content `<a>` tags in body sections use the `darkestBrandColor` from config, not the `accentColor`
2. In-content `<a>` tags have `text-decoration: underline` in their default state, not only `:hover`
3. In-content `<a>` tags have `font-weight: 500`
4. CTA buttons use the `accentColor` for their background
5. Body text + background pair achieves ≥4.5:1 contrast (calculate from hex values)
6. Body text font-size is ≥16px on both mobile and desktop breakpoints
7. No `outline: none` rule exists without a replacement focus style
8. The site has a single content container with `max-width` set, producing line lengths in the 65–75 char range at desktop sizes

If any check fails, the build is incomplete. Report the failure with the specific check number and the CSS selector or hex pair involved.

## Source / version history

- 2026-05-12 — Initial creation. Compiled from v3.2 Phase 1 DESIGN REQUIREMENTS section and FairwayVerdict launch learnings (link contrast was the top retrofit issue).
