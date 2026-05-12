# 04-content-mandatory.md — Content Mandatory Rules

## Purpose

This file defines non-negotiable content rules for every site generated from this template: prohibited punctuation, banned phrases, AEO (Answer Engine Optimization) structure, prohibited fabrication, FAQ structure, niche sanitization, and prose-quality requirements. These rules exist to make generated content read as if a careful human wrote it, to pass AI-content detectors at acceptable thresholds, and to avoid the specific patterns that mark text as machine-generated.

## Authority level

**MANDATORY.** Every rule below is non-negotiable. Build fails if violated.

## Rules

### 1. Em dashes — total ban

**1.1** Em dashes (`—`, U+2014) MUST NOT appear anywhere in generated content. This includes:
- Body copy
- Headings (H1, H2, H3, H4)
- Meta title and meta description
- FAQ questions and answers
- Product card descriptions
- Schema descriptions
- Image alt text
- Footer text
- Comparison table cells
- About, Contact, Privacy, Disclosure subpages

**1.2** Replacements for em dashes:
- For parenthetical insertions: use commas, or parentheses, or restructure the sentence
- For range indicators (5–10): use the en dash (`–`, U+2013) or the word "to" (5 to 10)
- For dramatic pauses: use a period and start a new sentence, or a colon
- For attribution lines: use a period or a hyphen with spaces

**1.3** Rationale: em dashes are a known LLM-generation tell. They appear with above-baseline frequency in AI-written text relative to human-written text on the same topics. AI-content detectors (Brandwell, Originality, GPTZero) weight em-dash density as a feature in their classifiers.

**1.4** En dashes (`–`, U+2013) are PERMITTED but only for numeric ranges (pages 5–10, ages 18–24). En dashes MUST NOT be used as substitutes for em dashes in prose.

### 2. LLM-slop phrase blacklist

The following phrases mark text as machine-generated. Human readers recognize them as AI-written instantly. AI-content detectors flag them. These phrases MUST NOT appear in generated content.

**2.1 Banned hype verbs:**

- unleash
- unlock
- dive into
- delve into
- embark on
- harness
- elevate
- revolutionize
- transform
- supercharge
- amplify
- empower
- master (as a verb, e.g. "master the art of")

**2.2 Banned hollow adjectives:**

- groundbreaking
- revolutionary
- game-changing
- cutting-edge
- state-of-the-art
- innovative
- seamless
- robust
- comprehensive
- unparalleled
- exceptional
- remarkable
- transformative
- holistic
- multifaceted
- nuanced

**2.3 Banned filler and meta phrases:**

- "It's worth noting that..."
- "It's important to note..."
- "In conclusion..."
- "In summary..."
- "Whether you're a beginner or a seasoned [noun]..." (this exact construction, and close variants)
- "When it comes to [noun]..."
- "In today's fast-paced world..."
- "In the world of [noun]..."
- "Look no further than..."
- "Navigate the world of..."
- "the realm of..."
- "tapestry of..."
- "testament to..."

**2.4 Banned structural patterns:**

- Formulaic tricolons that repeat parallel structure: "clean, modern, and reliable" — "fast, simple, and effective" — "powerful, intuitive, and elegant." These patterns are not banned individually (a single tricolon is fine prose), but they MUST NOT appear in every product description and every section opener. Vary sentence structure deliberately.
- Sentences beginning with "Moreover," "Furthermore," "Additionally," "Notably." Use these sparingly, not as default transitions.
- The construction "not just X, but Y" used more than once per page.

**2.5 Banned closing patterns:**

- "Ultimately, [restate thesis]."
- "At the end of the day, [restate thesis]."
- "The bottom line is..."
- "In closing..."
- Any closing paragraph that summarizes what the page just said. Conclude with forward-looking guidance, a specific recommendation, or a direct CTA — not a recap.

### 3. AEO Quick Answer

**3.1** Every page MUST include a "Quick Answer" box positioned:
- Immediately below the affiliate disclosure banner
- ABOVE the hero image
- Visible without scrolling on both desktop and mobile

**3.2** The Quick Answer text MUST come from `seo.quickAnswer` in the config.

**3.3** The Quick Answer MUST be 40 to 50 words. Shorter loses search-result snippet potential; longer breaks the "speakable" structured-data pattern.

**3.4** The Quick Answer MUST be a direct, complete answer to the primary keyword phrased as a question. It MUST NOT be a teaser, a list of features, or an invitation to read on.

**3.5** The Quick Answer box MUST be marked with a CSS class targeted by the `SpeakableSpecification` schema (typically `.quick-answer-box`).

### 4. FAQ structure

**4.1** Every page MUST include a FAQ section with at least 3 question/answer pairs.

**4.2** FAQ questions MUST be phrased as questions real searchers ask (look at "People Also Ask" boxes for the primary keyword as inspiration), not as statements rephrased as questions.

**4.3** FAQ questions MUST be wrapped in `<h3>` elements.

**4.4** FAQ answers MUST be 40 to 100 words each.

**4.5** Every FAQ Q&A pair MUST be reflected in the `FAQPage` schema in the page's JSON-LD (per `01-seo-mandatory.md`).

### 5. No fabricated facts

**5.1** Claude Code MUST NOT invent or generate the following without an explicit source in the config or prompt:
- Statistics (percentages, market sizes, spending averages, efficacy numbers)
- Dates (product launch dates, founding dates, study dates)
- Prices (current product prices, historical prices, percentage discounts)
- Product specifications (capacity, dimensions, materials, certifications)
- User counts ("over 10,000 customers")
- Awards or rankings ("voted best...", "ranked #1...")
- Quotes attributed to people, organizations, or publications

**5.2** When `seo.authorityStatistic` is provided in the config, it MAY be referenced in the body content. The source SHOULD be cited inline if it is third-party (e.g. "According to FEMA's 2024 preparedness survey...").

**5.3** When `seo.authorityStatistic` is empty in the config, the body content MUST NOT include any fabricated statistic. Leaving the field blank is the user signaling "do not invent a stat for this site."

**5.4** Product descriptions MUST be derived from the product information in the config. Embellishment beyond what the config provides is FORBIDDEN. If a product card needs more detail and the config does not supply it, leave the section shorter rather than fabricating.

### 6. Niche sanitization

**6.1** Generated content MUST NOT contain terminology from niches unrelated to `site.niche` in the config. Specifically, content MUST NOT borrow language patterns, examples, or terminology from these niches unless they are organically part of the site's niche:

- Preparedness / survival / emergency / disaster / FEMA / prepping / doomsday
- Coffee / brewing / roaster / espresso / bean / grind / subscription box
- Golf / fairway / tee / swing / putter / simulator / dad gift
- Ice bath / cold plunge / chiller / cold therapy / cold water immersion
- Red light therapy / infrared panel / skin rejuvenation
- Gold IRA / precious metals / retirement rollover / custodian
- KDP / Kindle publishing / royalty

**6.2** Every section of body copy, FAQ, About page, methodology, and footer MUST be specific to the site's actual niche from the config. If a template example or reference appears to use language from another niche, treat it as illustrative only — never copy its topic terminology into the actual build.

**6.3** Before generating body content, Claude Code MUST re-read the niche value from config and mentally clear any cross-niche language patterns from previous builds in the session.

### 7. Prose rhythm and variety

**7.1** Sentence length MUST vary deliberately within paragraphs. A paragraph composed entirely of 15–20 word sentences reads as machine-generated. Mix short sentences (4–8 words) with medium (12–18) and occasional long (25–35).

**7.2** Paragraph length MUST vary. Mix one-sentence paragraphs with three-sentence paragraphs with five-sentence paragraphs.

**7.3** First-person voice MAY be used to break up the "objective reviewer" cadence. Example: "Honestly, this one surprised me." Use sparingly — once or twice per page, not in every section.

**7.4** Concrete, specific details ALWAYS beat generic claims. "A 1.0L gooseneck kettle with a 0.5cm spout" beats "a thoughtfully designed kettle for precise pouring."

**7.5** Each product description MUST include at least one specific, concrete detail that distinguishes it from generic prose. If the config does not supply such a detail, request one from Robin rather than fabricating.

### 8. Brandwell and AI-detection targets

**8.1** Generated content SHOULD score 80% human or higher when checked at brandwell.ai/ai-content-detector (or equivalent detector).

**8.2** 80% is a guardrail, not a target. Hitting 95%+ on objective comparison content is not realistically achievable without first-person experience injection (covered by the EEAT rule pack in `99-custom/`).

**8.3** When generated content scores below 80%, Claude Code SHOULD identify the lowest-scoring sections and rewrite them with: shorter sentences, more specific details, less parallel structure, more idiosyncratic phrasing, fewer transitions.

### 9. Words and phrases that are FINE despite reputation

The following are common AI-detection false-positives. They are NOT banned and may appear naturally in human writing:

- "However" as a transition (common in academic and journalistic prose)
- "Therefore" used sparingly (logical conclusion marker)
- The Oxford comma (style choice, not a tell)
- Numbered or bulleted lists (a formatting choice, not a tell)
- The word "additionally" used once per page

Do not over-correct by avoiding common words.

## Examples

### Correct sentence with em dash replacement

> The hero image must be served as a WebP with three responsive variants, and the preload tag must include matching `imagesrcset` so the browser picks the right one.

(Was originally a sentence with two em-dash breaks; reworked into a compound sentence.)

### Incorrect — em dashes present

> The hero image must be served as a WebP — with three responsive variants — and the preload tag must include matching `imagesrcset`.

### Correct opening paragraph (no slop)

> Pour over brewing rewards careful attention. The kettle, the grind, and the pour all matter, and small upgrades in any of the three meaningfully change what ends up in the cup. The setups below cover the price range from $40 starter kits to enthusiast-grade equipment over $500.

### Incorrect opening paragraph (slop)

> When it comes to pour over coffee, the journey to the perfect cup can be a transformative experience. Whether you're a beginner or a seasoned coffee enthusiast, you'll want to dive into our comprehensive guide to the most innovative, cutting-edge brewing equipment that will revolutionize your morning routine.

Problems: "When it comes to," "transformative," "Whether you're a beginner or a seasoned," "dive into," "comprehensive," "innovative," "cutting-edge," "revolutionize" — 8 banned phrases in two sentences.

### Correct Quick Answer (44 words)

> The best pour over coffee maker for most people is a Hario V60 with a gooseneck kettle and a quality burr grinder. This combination produces consistent extraction, fits a typical kitchen counter, and stays under $200 for the complete setup.

### Incorrect Quick Answer (teases instead of answering)

> Discover the best pour over coffee makers we've tested in 2026, ranked by brew quality, price, and ease of use. Our team has carefully evaluated dozens of options to bring you the top picks for every budget and skill level.

Problems: doesn't answer the question, uses banned phrases ("Discover," "carefully evaluated"), reads as introduction not answer.

## Validation

After generating a site, Claude Code MUST verify by scanning the generated HTML and content:

1. Zero occurrences of em dash (`—`, U+2014) in any text content
2. Zero occurrences of each banned hype verb from rule 2.1 (case-insensitive substring match)
3. Zero occurrences of each banned hollow adjective from rule 2.2
4. Zero occurrences of each banned filler phrase from rule 2.3
5. Zero "Whether you're a beginner or a seasoned" constructions
6. Quick Answer box exists with word count between 40 and 50
7. Quick Answer box has CSS class matching the SpeakableSpecification target
8. At least 3 H3 elements styled as FAQ questions
9. Each FAQ answer is 40 to 100 words
10. Schema FAQPage entry count matches visible FAQ count
11. If `seo.authorityStatistic` is empty in config, no fabricated statistics appear in content
12. Niche terminology from rule 6.1 list (other than the site's actual niche) does not appear in body content

If any check fails, the build is incomplete. Report the failure with the specific check number, the violating phrase, and the file location.

## Source / version history

- 2026-05-12 — Initial creation. Compiled from v3.2 Phase 1 SANITIZATION, GUARDRAIL, and LLM-SLOP PHRASING GUARDRAIL sections. Em-dash rule is the most-violated rule in v3.2 sites; codified here as the top-priority check.
