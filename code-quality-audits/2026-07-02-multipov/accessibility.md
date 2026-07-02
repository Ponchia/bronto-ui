# Accessibility (a11y / WCAG) — bronto-ui review

**Verdict:** The shipped design system has a credible WCAG story: contrast is generated and gated for core tokens and shipped skins, focus states are explicit, forced-colors support is real, and JS behaviors cover most ARIA/focus mechanics. The main risk is not the default system, but consumer re-skinning and partial adoption: arbitrary `--accent` values are explicitly outside the gate, some accent-on-tint pairings are advisory despite very low ratios, and several components are only accessible when their behavior initializer is used (`docs/contrast.md:9`, `docs/contrast.md:239`, `css/base.css:163`, `test/e2e/a11y.spec.mjs:10`, `docs/usage.md:613`).

**Grade:** A- — strong shipped-surface conformance, weaker guarantees for arbitrary themes and behavior-optional use.

## Strengths

- Contrast is treated as a build contract: generated docs say gated pairings come from `tokens/resolved.json`, and the checker fails missing or below-floor ratios (`docs/contrast.md:9`, `scripts/check-contrast.mjs:25`, `scripts/check-contrast.mjs:38`).
- The contrast model distinguishes text AA from non-text UI floors: body/UI text targets 4.5:1, while focus/accent/status UI targets 3:1 (`docs/contrast.md:16`, `scripts/gen-contrast.mjs:130`).
- Shipped colorways are not hand-waved: skins are opt-in, root-scoped, accent-only, and audited per theme (`css/skins.css:1`, `tokens/skins.js:1`, `test/skins.test.mjs:49`).
- Global focus visibility is present and reinforced in forced-colors: interactive elements get `:focus-visible` outlines, and Windows high-contrast maps them to `Highlight` (`css/base.css:163`, `css/base.css:235`).
- Local `outline: none` cases have replacements: form controls replace focus with border plus `:focus-visible` outline, search inputs move the ring to the wrapper, and tabs use an inset focus ring distinct from selection (`css/forms.css:59`, `css/forms.css:66`, `css/forms.css:356`, `css/disclosure.css:70`).
- Behaviors cover the hard ARIA/focus cases: dialogs restore focus, controlled modals inert siblings and dispatch Escape close events, toasts use persistent live regions, tabs use roving tabindex, and comboboxes own `aria-expanded`/`aria-activedescendant` (`behaviors/dialog.js:4`, `behaviors/modal.js:61`, `behaviors/toast.js:18`, `behaviors/tabs.js:12`, `behaviors/combobox.js:89`).
- Reduced motion is broadly handled: scroll-linked effects are gated to `no-preference`, view transitions are disabled, and the fallback forces near-zero animation/transition durations (`css/motion.css:278`, `css/motion.css:381`, `css/motion.css:391`).
- Test coverage goes beyond axe: demos run axe in light/dark and RTL, check focus restore/live regions/disclosure state, and custom guards catch broken ARIA refs plus nameless controls (`test/e2e/a11y.spec.mjs:33`, `test/e2e/a11y.spec.mjs:74`, `test/e2e/_demo-guards.mjs:139`, `test/e2e/_demo-guards.mjs:201`).

## Weaknesses / risks

- [P1] Arbitrary consumer accents can break contrast: the docs explicitly exclude arbitrary rebrands from the gate and make custom accent/focus/native-control contrast the consumer’s obligation, hurting low-vision users when downstream themes pick pale or saturated accents (`docs/contrast.md:239`, `docs/theming.md:56`, `docs/theming.md:101`, `docs/theming.md:151`).
- [P2] Some accent-on-tint pairings fail badly but are advisory, not gated: amber CRT, e-ink, and phosphor green dark modes show ratios around 1.33-1.51 for `--accent-text` on accent tint surfaces, which can hurt low-vision users if authors use those combinations for real text (`scripts/gen-contrast.mjs:166`, `docs/contrast.md:132`, `docs/contrast.md:162`, `docs/contrast.md:192`).
- [P2] Reduced-transparency support is missing from the inspected CSS while translucent blur is used in overlays and app chrome; users sensitive to blur/transparency still receive `backdrop-filter` unless forced-colors mode is active (`css/overlay.css:23`, `css/overlay.css:194`, `css/overlay.css:453`, `css/app.css:173`).
- [P2] Several widgets are accessibility-dependent on JS initializers: docs acknowledge disclosure ARIA can go stale, tab panels can become unreachable, and controlled modals lose trap/focus/Escape without behavior init, hurting keyboard and screen-reader users on partial adoption or JS failure (`docs/usage.md:613`, `docs/usage.md:629`, `docs/usage.md:637`, `behaviors/tabs.js:20`).
- [P2] The command palette relies on author-supplied accessible naming: the docs example includes `aria-label`, but `initCommand` sets combobox/listbox roles without the accessible-name warning/mirroring that combobox has, so a missing label can silently ship (`docs/command.md:29`, `behaviors/command.js:228`, `behaviors/combobox.js:97`).
- [P3] Form progressive-enhancement messaging is undermined by demo markup using `novalidate`: the behavior says JS-off native validation should still work, but copy-pasted markup can disable required/email validation before JS runs, affecting all users on broken/no-JS paths (`behaviors/forms.js:213`, `behaviors/forms.js:255`, `demo/index.html:475`).

## Top recommendations

1. Add a consumer-facing accent audit command/API that validates arbitrary `--accent`, `--button-text`, `--accent-text`, `--focus-ring`, and native `accent-color` pairings before a theme ships (`docs/theming.md:56`, `docs/theming.md:101`).
2. Either gate `--accent-text` on accent-tint surfaces or document/lint that those combinations are decorative-only; the current advisory ratios are too low for accidental text use (`scripts/gen-contrast.mjs:166`, `docs/contrast.md:132`).
3. Add `@media (prefers-reduced-transparency: reduce)` fallbacks for modal/lightbox/topbar blur and translucent scrims, using opaque token surfaces instead (`css/overlay.css:23`, `css/overlay.css:194`, `css/app.css:173`).
4. Make behavior-required components harder to misuse: avoid copyable hidden tab panels unless init is guaranteed, and add static/demo guards for missing behavior initialization on modal/tabs/disclosure patterns (`behaviors/tabs.js:20`, `docs/usage.md:613`).
5. Give `initCommand` the same accessible-name warning/mirroring standard as `initCombobox`, so unlabeled command inputs fail loudly in development (`behaviors/command.js:228`, `behaviors/combobox.js:97`).
6. Remove `novalidate` from copyable form demo markup or set it only inside the initializer, then add a no-JS form-validation regression test (`behaviors/forms.js:213`, `demo/index.html:475`).

## Notable observations

- Hairline borders are intentionally not counted as semantic contrast gates; the docs report them but reserve guaranteed perception for forced-colors/high-contrast remaps (`docs/contrast.md:24`, `css/base.css:199`).
- APCA is tracked but intentionally advisory while WCAG 3 remains draft, which is a sensible future-proofing signal without moving the compliance target (`scripts/check-contrast.mjs:51`, `docs/contrast.md:247`).
- The menu behavior deliberately avoids pretending to be a full WAI-ARIA menu: it keeps native `details` plus real buttons, which preserves Tab reachability (`behaviors/menu.js:3`).
- The modal docs appear stale on scroll locking: docs say scroll lock is not automatic, while CSS now locks `html` when native or controlled modals are open (`docs/usage.md:380`, `css/overlay.css:91`).