# ADR-0002 — Scope, and the 2026 baseline: what `@ponchia/ui` is and isn't

Status: accepted · 2026-06-01 · sets the project's category, browser floor, and
the line between "ours" and "the consumer's framework"

## Context

The 2026 "UI framework" bar is often framed around **application/runtime**
concerns: signals vs VDOM, resumable/granular hydration, server-driven UI
streaming, local-first + CRDT state sync, cross-target native compilation
(SwiftUI/Compose/WebGPU), physics-based interruptible motion, and "neural
expressive" tactile/haptic, dimensional UI.

`@ponchia/ui` is a different species: a **CSS-first design layer** — semantic
`ui-*` classes in one `@layer`, design tokens as data, and *thin optional*
behaviors/bindings — that sits **on top of** whatever app framework the
consumer chooses (ADR-0001 / architecture.md). Conflating the two is a category
error. This ADR records, against that 2026 bar, what the project deliberately
provides, pursues, and refuses. Second lens that governs every call: the project
is currently single-maintainer / single-consumer — **restraint is both the
brand and the correct strategy**; complexity with no payoff for one user is pure
cost.

## Decision

### What we ARE (and lean into)
- **A CSS-first, zero-runtime-dependency design system.** The CSS renders
  server-side with nothing to hydrate; behaviors are optional, SSR-safe,
  delegated progressive enhancement. (This already satisfies the "zero JS until
  interaction" goal for our scope — there is nothing to hydrate.)
- **AI-/agent-legible by construction.** Plain `ui-*` classes (no component API
  to learn) + `llms.txt` + drift-checked `reference.md` + typed `cls` + DTCG /
  `resolved.json`. An LLM can read and emit our markup today — the "semantic
  rendering" pillar, had, without an SDUI engine.
- **Accessibility as a gate, and system-signal-adaptive.** CI-enforced WCAG +
  APCA, CVD-gated charts, and live adaptation to `prefers-reduced-motion` /
  `prefers-contrast` / `forced-colors` + `data-density`/`data-contrast`.
- **Cross-target via tokens, not components.** `resolved.json` / DTCG feed
  canvas/SVG/MapLibre and Figma/Style-Dictionary; the design *language* travels
  even though components don't.
- **Framework-agnostic, with optional thin React/Solid/Qwik bindings.**

### What we PURSUE (the 2026 leap that fits: CSS-native motion)
"Motion as a first-class citizen / interruptible / layout morphing" is the one
manifesto pillar that converges with a CSS-first, zero-dependency identity —
because the modern platform makes it declarative:
- **Shipped (0.4.1):** native `<dialog>` (modal/drawer) + backdrop **enter *and*
  exit** transitions via `@starting-style` + `transition-behavior: allow-discrete`
  — zero JS, reduced-motion-aware. (Previously the overlay only animated in.)
  Extended, same approach, to **popover** (both the native `[popover]` top-layer
  and the `.is-open` fallback), **toast** (CSS fade-out on dismiss — the
  behavior adds `.is-leaving` and removes on `transitionend`, falling back to
  instant removal under reduced-motion), and **accordion** auto-height open/close
  via `::details-content` + `interpolate-size: allow-keywords` (gated on
  `@supports selector(::details-content)`; engines without it snap).
- **Shipped (0.4.1), progressive enhancement:** **scroll-driven** primitives
  (`.ui-scroll-progress`, `.ui-scroll-reveal`) on `scroll()` / `view()`
  timelines, gated on `@supports (animation-timeline: …)` so they degrade to a
  static end-state, and **View Transitions** — a `.ui-vt` `view-transition-name`
  helper, an on-brand `::view-transition-*(root)` cross-fade, and a
  reduced-motion kill-switch for the VT pseudo-tree (which does *not* honour
  reduced-motion on its own). The document-global cross-document opt-in
  (`@view-transition { navigation: auto }`) is documented rather than shipped —
  it can't be layered or scoped, so it stays the consumer's one-liner. No JS
  animation runtime — the platform is the engine.
- **Next:** track the not-yet-cross-engine features to general availability
  (scroll-driven + `interpolate-size` are Chromium-led today) and continue the
  OKLCH / `light-dark()` / P3 work flagged in ADR-0001.

### Browser floor — deliberately modern
Floor raised to **Chrome/Edge 125+, Safari 18+, Firefox 129+** (early–mid 2025)
to build on `@starting-style`, `allow-discrete`, `oklch()`/relative color, and
`light-dark()` natively. Greenfield stance: **no fallbacks below the floor**;
not-yet-cross-engine features are enhancement-only. (Acceptable precisely because
this is new and not yet in production for real products.)

### What is OUT OF SCOPE (permanently — the consumer's framework, or counter-brand)
- **Reactivity runtime** (signals vs VDOM), **granular/resumable hydration**,
  **server-driven-UI streaming engine** — the consumer's framework (React, Solid,
  Qwik, …). We *compose* with them; we don't compete.
- **Local-first / CRDTs / IndexedDB / sync** — a data layer, not a design layer.
  Zero payoff for a solo consumer.
- **Cross-target native compilation** (SwiftUI / Jetpack Compose / WebGPU) — a
  Flutter/RN-class ambition; the token layer already covers the modest
  cross-target need.
- **Haptics + "vibrant dimensional layering / adaptive lighting / liquid
  glass"** — not merely out of scope but **counter to the thesis** (flat,
  monochrome, anti-skeuomorphic). Our on-brand "dimensional" expression is the
  dot-matrix glow / luminance work (ADR-0001 Tier 3), not Apple-glass.
- **"Cognitive-load-adaptive" dynamic a11y** — speculative, app-level.

## Consequences
- New work is judged against this map: if a request belongs to the runtime/data/
  native-compile layer, it's the consumer's, and we document the composition
  instead of building it.
- The headline forward investment is **CSS-native motion**, progressively
  enhanced — making fluid, interruptible, exit-animated UI the *default* with no
  JS, which is the project's ethos rather than a departure from it.
- The modern floor is a feature, not a liability, for a greenfield design system.

## Method
Prompted by a review of the 2026 UI-framework baseline against the actual repo
(no reactivity/hydration/state code exists — by design) and the single-consumer
reality. Grounded in ADR-0001 (color) and architecture.md (CSS-is-the-framework).
