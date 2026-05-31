# ADR-0001 — Color system: governed evolution beyond monochrome

Status: accepted (steps 1–6 implemented in 0.4.0; 7–8 deferred) · 2026-05-31 ·
supersedes the informal "monochrome + one accent" framing in `README.md` /
`package.json`

> This is the **color constitution** for `@ponchia/ui`. It is forward-looking:
> nothing here changes the default build. It defines the tiers color is
> allowed to occupy, the rules that keep restraint load-bearing, and the
> ordered, backward-compatible path to expand expression without diluting the
> brand. Companion to [`architecture.md`](../architecture.md).

## Context

`@ponchia/ui` took its aesthetic from Nothing: monochrome surfaces, one
rationed red accent, dot-matrix motifs. The driving question for this ADR:
**is monochrome creatively restrictive, and should we evolve past Nothing's
literal one-hue constraint?**

Two facts frame the answer.

**1. We are already not monochrome — and that was the right call.** The README
says "monochrome, one rationed accent." The CSS says otherwise. We already
ship a full **functional status palette** (`--success`, `--warning`,
`--danger`, `--info`, each with light/dark/`-soft` variants, contrast-tuned
per theme, wired into `ui-alert` / `ui-toast` / `ui-meter`). It is rationed —
status-only, always paired with a leading dot/shape, never decorative — but it
exists. So the real model already has **three *active* tiers nobody wrote
down** (neutral + accent + status); the two new axes this ADR adds (display
expression, data-viz) are tiers 3–4. The question is not "should we abandon
monochrome" (we did, carefully, around 0.3.4) but **"what is our color theory
for the next axis."**

**2. Inspiration is not doctrine.** The thing worth inheriting from Nothing is
the *attitude* — restraint, intentionality, signal-over-noise — **not** the
literal one-hue limit. "We do not decorate with color; we signal with it" is a
stronger, more defensible principle than "we have no color," and we are most
of the way to it already. Monochrome *is* creatively restrictive, but only on
three specific axes: **categorical distinction** (tags/legends past ~3 items),
**multi-series data-viz** (one accent + grays cannot draw a 5-line chart — we
already felt this; `tokens/resolved.json` exists because charts needed real
color), and **brand/emotional range** (one hue at a time). What monochrome
*buys* and we must not casually spend: identity differentiation, forced
hierarchy discipline, accessibility-by-default, and the scarcity that makes the
one accent *mean* something.

### What SOTA looks like (2025–2026)

| Practice | Who | Relevance to us |
| --- | --- | --- |
| **Perceptual color space** (equal numeric step = equal perceived step) | Tailwind v4 (OKLCH+P3), Radix 3 (P3), Material 3 (HCT) | We derive `--accent-1..6` via `color-mix(in srgb,…)`; OKLCH is the modern substrate and is **CSS-native** — no dependency cost |
| **Relative color syntax** `oklch(from var(--base) calc(l-.1) c h)` | CSS Color 5 | ~90% support, Baseline in 2026 — lets a single hue derive a whole tonal ramp natively |
| **WCAG 2.2 to pass, APCA to design** | Radix text steps spec'd in APCA Lc | WCAG 2.2 AA stays the legal/hard gate; APCA (Lc, accounts for size/weight, WCAG 3 candidate) as an **advisory** track |
| **Role-bound scale steps** (1–2 bg, 3–5 component, 6–8 border, 9–10 solid, 11–12 text) | Radix 12-step | Our tiers are coarser; the role-bound scale is where depth lives if we ever need it |
| **Contrast-first generation** (pick a target Lc, derive the swatch) | Adobe Leonardo, Material dynamic | Natural evolution of "one `--accent` derives everything" |
| **Categorical color is its own discipline** | Wong / IBM / ColorBrewer | Hard limit **6–8 hues**, ≥30 CIELAB lightness delta per pair, **redundant encoding** (shape/pattern/label) — our dot-matrix wheelhouse |

SOTA is **not "more hues by default."** It is CSS-native token systems,
perceptual color, role-based scales, contrast-aware generation, and *governed
escape hatches*. Our restraint is already SOTA-adjacent; the work is to
modernize the engine and add opt-in expression without spending the brand.

## Decision

Adopt a **five-tier color model** with a fixed governance contract. Color must
*earn its place by encoding meaning*; the discipline moves from "absence of
color" to "color is tiered, token-only, contrast-gated, and off-by-default."

| Tier | Name | What it is | Default state |
| --- | --- | --- | --- |
| **0** | Neutral canvas | The grayscale ramp — surfaces, lines, text | Always on |
| **1** | Brand accent | One themeable `--accent`, derives `--accent-1..6` | Always on (red) |
| **2** | Functional status | `success` / `warning` / `danger` / `info` — signal only | Always on |
| **3** | Display expression | Luminance, dot density/intensity, scan cadence, pulse, reveal timing — the dot-matrix substrate | Opt-in tokens |
| **4** | Categorical / data-viz | A 6–8 color colorblind-safe scale + sequential/diverging ramps — **charts only** | Opt-in module, never bundled |

### The six rules (the constitution)

Each rule notes how it is held — **[gate]** = mechanically enforced by
`check:color-policy`; **[other gate]** = enforced elsewhere in `npm run check`
/ the e2e suite; **[norm]** = a review norm, not yet machine-checked. Don't
read "rule" as "all six are CI-enforced" — only what's tagged **[gate]** is.

1. **Token-only.** No raw chromatic color in component CSS — every color is a
   tiered token (grays / `color-mix()` endpoints excepted). **[gate]** —
   `check:color-policy` invariants 1 (tier classification) + 3 (raw-color scan).
2. **Contrast-gated.** Every UI text/bg pairing passes **WCAG 2.2 AA**; **APCA
   Lc is advisory** beside the matrix, never the sole gate while WCAG 3 is a
   Working Draft. **[other gate]** — `check:contrast` + the e2e axe suite, not
   `check:color-policy`.
3. **Off-by-default.** The default red accent, all token names, and all visual
   baselines remain **unchanged**; the strict-mono purist keeps their exact
   system; everything new is opt-in. **[other gate]** — `check:dist`
   byte-equality + visual baselines.
4. **Semantic tier names.** A token's name declares its tier. **Status is never
   decorative**; **chart color is never UI chrome.** No `primary/secondary`.
   **[gate]** for "every color token is tiered" + the reserved `--chart/--cat/
   --data-*` namespace (invariants 1–2); **[norm]** for "status never
   decorative" (needs usage context a static gate can't see).
5. **One active UI accent per scope.** No second brand accent. "Duotone" lives
   in Tier 3 (dots/display ornament), not as a second interactive accent.
   **[norm]**.
6. **Meaning never by color or motion alone.** Redundant encoding (shape, dot,
   label) is mandatory — satisfies WCAG 1.4.1 / 2.2.2 and is on-brand for the
   dot-matrix. Reduced-motion users must get equivalent information statically.
   **[other gate]** — the e2e axe/`forced-colors`/reduced-motion suite.

### The brand's answer to "decorative color": luminance + time

For a *dot-matrix display* system, the authentic expressive channel is not
hue — it is **brightness and motion**, exactly like a real LED/phosphor panel
(and we already shipped reveal/pulse in 0.3.6). Tier 3 is the strategic
substitute for decorative polychrome: it deepens identity instead of diluting
it, and no competitor in this niche owns it.

### Resolving the `--orange` orphan — RESOLVED (removed, 0.4.0)

Audit finding: `--orange` / `--orange-soft` were defined in every token file
(`tokens/index.js`, `.d.ts`, `tokens.dtcg.json`, `resolved.json`,
`css/tokens.css`, `reference.md`) but **consumed by no component and documented
nowhere** — an untiered, dangling hue. Resolution: **removed** (not adopted as
a categorical seed — there is no data-viz module or demand yet, and a stray
top-level hue contradicts the tier model). If categorical color lands it ships
as a governed Tier-4 module (step 7), not a loose token. The new
`check:color-policy` gate now makes a future untiered hue a hard CI failure.

## Backward-compatibility freeze

Hard acceptance criteria for every step below:

- **Default rendered output is unchanged** — the red accent defaults, the
  resolved value of every token a component references, and the light/dark
  **visual baselines** are identical. (Removing a token nothing resolves —
  e.g. `--orange` in 0.4.0 — does change `dist/bronto.css` *bytes* but not what
  any selector renders; that is cleanup, not a visual change. The earlier draft
  said "dist bytes unchanged" — the precise invariant is *rendered output*.)
- Token **names** are not renamed/repurposed (removals of provably-unreferenced
  tokens follow the CONTRIBUTING.md deprecation-policy exception).
- The existing `--accent-1..6` **sRGB `color-mix` derivation is not silently
  changed.** `scripts/gen-resolved.mjs` only evaluates `color-mix(in srgb,…)`;
  for any other space it returns `null`, and a `null` token is **dropped
  entirely** from `resolved.json` (not defaulted) — so a consumer doing
  `resolved.dark['--accent-3']` would get `undefined` and may throw. Combined
  with the rendered-pixel change, switching the ramp to OKLCH is a breaking
  change twice over. Stable names alone do not make it non-breaking. Any OKLCH
  migration of the **existing** ramp is a documented **minor/RC** decision
  after tooling + visual review, never a silent patch.

## Roadmap (ordered, backward-compatible)

1. **This ADR.** Make the constitution explicit before adding surface. *(done)*
2. **`check:color-policy` gate.** Fail on: raw chromatic color in component CSS;
   any untiered palette token; use of the reserved `--chart/--cat/--data-*`
   namespace. Resolve `--orange`. *(done — `scripts/check-color-policy.mjs`,
   wired into `npm run check`; `--orange` removed)*
3. **Tier 3 expression tokens.** *(done — `css/dots.css`)* `--dotmatrix-glow`
   (phosphor bloom on lit cells), `--dotmatrix-pulse-min` (the `--pulse` floor),
   `--dotmatrix-reveal-step` (scan cadence); density stays on
   `--dotmatrix-cols/-gap/-dot`. All default to a no-op, so the default render
   is byte-for-byte unchanged; reduced-motion still kills the animations.
4. **Optional display colorways** *(done — `tokens/skins.js` →
   `css/skins.css`, exported as `./css/skins.css`, NOT in the default bundle)*:
   `data-bronto-skin="amber-crt | phosphor-green | e-ink"`. **A root-level
   choice, like `data-theme`** (apply on `:root`/`<html>`) — it must live there
   because the accent's derived family (`--accent-strong/-text/-soft`,
   `--bg-accent`, `--field-dot-accent`, `--accent-1..6`) is `color-mix(…
   var(--accent) …)` declared on `:root` and only re-evaluates against the new
   accent on the element that carries it; a skin on a subtree would leave that
   family stale, so the selectors are `:root`-anchored and a subtree skin
   no-ops. Each skin re-points only `--accent` (+ a dark `--dotmatrix-glow`);
   the family + dot-matrix + glyphs follow automatically. Single-hue per skin →
   keeps the one-accent discipline while unlocking range across skins. No
   multi-hue palette. (A future per-subtree skin would need to re-declare the
   derived family — deferred; whole-page is the natural colorway scope.) Skins
   inherit the existing `forced-colors` + `print` behavior in `css/base.css` /
   `css/forms.css` (they touch only the accent, never the canvas).
5. **OKLCH for new work first.** *(done for colorways — accents authored in
   OKLCH in `tokens/skins.js`; the contrast tooling now parses `oklch()` →
   sRGB, so skin accents are gated, not eyeballed.)* The **core** `--accent-1..6`
   ramp stays sRGB (decision below). For any future OKLCH in contractual token
   files (the core ramp), still upgrade `gen-resolved` first and add a
   gamut-aware fallback (`@supports`, sRGB-first), and consider `light-dark()`
   to collapse the twice-written dark palette — both are in the same CSS
   Color 5 / Baseline-2026 bracket.
6. **APCA advisory reporting.** *(done — `scripts/gen-contrast.mjs`)* APCA-W3
   0.1.9 `Lc` is computed beside the WCAG ratio for every pairing (core + skins)
   in `docs/contrast.md`. **Advisory only** — WCAG 2.1 AA stays the hard gate.
7. **Categorical chart module last, only on real demand.** Optional
   `css/dataviz.css` with 6–8 colorblind-safe categorical tokens (Wong/IBM
   base) + sequential/diverging ramps, exported and packed but **never** in the
   default bundle, and requiring labels/patterns so color is not the sole
   signal.
8. **Consider OKLCH default-ramp migration later** — only after resolver
   support and screenshot review prove acceptable diffs, as an opt-in engine or
   a clearly documented minor/RC.

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| **Brand dilution** (secondary accents, decorative hues creep in) | Rule 4/5; `check:color-policy`; off-by-default |
| **Compat break** from OKLCH ramp swap | Freeze above; OKLCH for *new* work first; minor/RC only, never silent |
| **Tooling drift** (resolver/DTCG/contrast/baseline assume sRGB) | Upgrade tooling *before* OKLCH enters token files; add computed-style tests |
| **Chart color leakage** into UI chrome | `check:color-policy` forbids chart tokens in core CSS; docs forbid it |
| **Motion/status misuse** carrying sole meaning | Rule 6; reduced-motion equivalence; status stays locked, never skin-derived |
| **APCA overreach** | Advisory only; WCAG 2.2 AA stays the hard gate while WCAG 3 is draft |

## Verification plan

- Existing `npm run check`, `npm test`, token/DTCG/resolved/dist/visual/a11y
  gates stay green and **unchanged** for the default build.
- New `check:color-policy` (raw color, status misuse, chart leakage, untiered
  hue).
- Contrast matrices extended to: default light/dark, `prefers-contrast`,
  `forced-colors`, **every shipped skin**, and chart tokens if shipped.
- APCA output as non-blocking generated docs.
- Playwright computed-style tests for `oklch()` / `color-mix(in oklch,…)`
  before any core reliance.
- Verify `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`, and
  native `accent-color` for every skin.
- Confirm optional skin/chart CSS is exported + packed but **excluded** from
  default `dist/bronto.css`.

## Decisions taken (0.4.0)

Resolved while implementing steps 3–6 (the open questions the earlier draft
flagged):

- **`--accent-1..6` is semver-stable and stays sRGB.** No silent ramp change.
  → step 8 (default-ramp OKLCH migration) **deferred** — visual-diff review
  cost outweighs the gain; reconsider as an opt-in engine / explicit minor.
- **Colorways ship as a supported package export** (`./css/skins.css`),
  opt-in, excluded from the default bundle. Not docs-only recipes.
- **Colorways are root-level** (`data-bronto-skin` on `:root`, like
  `data-theme`) — see step 4 for why per-subtree is deferred.
- **OKLCH is within the existing browser floor** (Chrome 111+/Safari 16.4+/
  Firefox 121+ all support `oklch()`); used for skin accents now. The contrast
  tooling parses it so skins are gated.
- **Build tooling stays dependency-free.** APCA + the OKLCH→sRGB conversion are
  hand-rolled in `scripts/gen-contrast.mjs` (zero new deps), matching the
  zero-dependency stance.
- **Data-viz categorical color (step 7) is deferred** — no consumer demand yet;
  the `--chart/--cat/--data-*` namespace stays reserved and gated. Building it
  speculatively would violate "only on real demand" and the leakage risk.
- **No second UI accent / "duotone" stays Tier-3 ornament only** (rule 5).

## Method

Grounded in web research (OKLCH/relative-color/`color-mix` baseline; APCA vs
WCAG; Radix 12-step; Material 3 HCT; Adobe Leonardo; colorblind-safe
categorical limits) and a 14-leg AgentMix `deep` multi-POV pass
(Pi/MiniMax, Aider, OpenCode, Crush, Codex + architecture / implementation-risk
/ testing / security / operations / contrarian legs). Key reconciled dissent:
several legs wanted an immediate OKLCH ramp swap — rejected as a silent break
(see freeze); the claim that `--accent-1..6` already serves as a categorical
scale was rejected (a same-hue ramp encodes sequence/intensity, not independent
categories); deriving status from skins was rejected (status stays locked).
