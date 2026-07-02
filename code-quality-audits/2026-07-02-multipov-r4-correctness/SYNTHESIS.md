# bronto-ui — round 4 (correctness & robustness) synthesis

## Executive verdict
All seven reports are present and non-empty. The codebase looks generally solid with no P0s, but the reviewers found 23 confirmed HIGH/MED-confidence defects, clustered in CSS logical-axis/RTL handling, behavior lifecycle/a11y, adapter reactivity, and validator false negatives. The worst issue is the P1 print contrast regression where dark opt-in skins override the print-safe palette.

## Defect scorecard
| Area | Grade | # confirmed (HIGH/MED conf) | Worst defect |
|---|---:|---:|---|
| CSS correctness | B | 5 | Generic global `--value` registration can break host CSS; RTL chart geometry bugs |
| Behaviors correctness | B- | 3 | Stacked controlled modals can leave the top modal itself `inert` |
| Adapters correctness | B- | 4 | React/Solid/Qwik can permanently stale behavior after option/root changes |
| Forms/a11y correctness | B- | 4 | Tabs and editable combobox inputs hijack expected keyboard behavior |
| Build/scripts robustness | B | 3 | Validation gates can false-pass bad CSS vars, CDN recipes, and impossible dates |
| Tokens/contrast correctness | C+ | 2 | Dark skin print accents produce white-on-accent contrast around 1.5–1.8:1 |
| Report/renderer correctness | B | 2 | Figure overlays size to reserved stage, not rendered media |
| Overall | B- | 23 | One P1 contrast defect plus multiple P2 lifecycle, a11y, adapter, and validation defects |

## Confirmed defects — the fix list (severity × confidence, ranked)

**Tokens / print / report CSS**

- **[P1] [HIGH]** `css/skins.css:17` / `css/tokens.css:348` — dark skin accents override print palette remap · tokens/contrast · **failure scenario**: with `dist/bronto.css` then `dist/css/skins.css`, `<html data-theme="dark" data-bronto-skin="phosphor-green">` prints white button text over bright skin accent at `1.53:1`; amber CRT and e-ink are similarly below 2:1 · **fix direction**: add a later print skin reset block or raise print remap specificity above skin selectors · **SAFE-FIX**.
- **[P2] [HIGH]** `css/dataviz.css:39` — global chart pattern ink is too low-contrast against shipped fills · tokens/contrast · **failure scenario**: `background: var(--chart-5); background-image: var(--chart-pattern-5)` gives pattern contrast as low as `1.12:1` in dark mode over `#f0e442` · **fix direction**: generate per-series pattern ink tokens or require/set contrasting ink per fill · **NEEDS-DESIGN**.
- **[P2] [HIGH]** `css/legend.css:112` — indexed legend swatches do not fall back when `dataviz.css` is absent · report/renderer · **failure scenario**: `analytical.css` without `dataviz.css` sets `--chart-color: var(--chart-2)`, the unresolved var invalidates `background`, and the swatch renders transparent instead of accent fallback · **fix direction**: add fallback inside each indexed helper or import `dataviz.css` from `analytical.css` · **SAFE-FIX**.
- **[P2] [HIGH]** `css/figure.css:65` — annotation overlays size to reserved stage, not rendered media · report/renderer · **failure scenario**: `320x120` media rendered 180px tall inside a 240px stage maps overlay y=120 to 240px while media bottom is 210px, offsetting annotations by about 30px · **fix direction**: tie overlay and media to the same aspect-ratio wrapper/sized box · **NEEDS-DESIGN**.

**Behavior lifecycle / modal state**

- **[P2] [HIGH]** `behaviors/modal.js:112` — sibling stacked controlled modals can inert the top modal · behaviors · **failure scenario**: open sibling modal A, then B; A’s trap already inerted B, B’s trap never clears its own `inert`, so both modal subtrees are inert while focus is in B · **fix direction**: make inert reconciliation stack-aware so only the active top modal is interactive · **NEEDS-DESIGN**.
- **[P2] [HIGH]** `behaviors/internal.js:69` — `bindOnce()` stale cleanups are not one-shot · behaviors · **failure scenario**: `stop1 = initTabs()`, `stop2 = initTabs()`, then later stale `stop1()` removes active tab roles/ARIA while `stop2` listeners remain · **fix direction**: guard cleanup wrapper with a `done` flag before calling `remove()` · **SAFE-FIX**.
- **[P2] [HIGH]** `behaviors/theme.js:108` — theme toggle double-init removes freshly reflected `aria-pressed` · behaviors · **failure scenario**: second `initThemeToggle()` reflects `aria-pressed`, then old cleanup removes it; active toggle has no pressed state until click · **fix direction**: run `applyStoredTheme()` and `reflect()` inside the `bindOnce` add callback after old cleanup · **SAFE-FIX**.

**Framework adapters**

- **[P2] [HIGH]** `react/index.js:105` — React hook ignores changed options and late scoped refs · adapters · **failure scenario**: changing `storageKey` still writes the old key; a ref rendered after first effect is initialized as `root:null` and never retried · **fix direction**: add an explicit dependency/rebind API such as `useBrontoBehavior(init, opts, deps)` and wrapper deps · **NEEDS-DESIGN**.
- **[P2] [HIGH]** `solid/index.js:107` — Solid resolver/signal options are read only once in `onMount` · adapters · **failure scenario**: `useThemeToggle(() => ({ storageKey: key() }))` keeps writing the old key after `key()` changes; late signal root remains unwired · **fix direction**: wrap `resolveOpts(opts)` in `createEffect` and register prior cleanup with `onCleanup` · **SAFE-FIX**.
- **[P2] [MED]** `qwik/index.js:110` — Qwik signal roots/options are unwrapped without `ctx.track` · adapters · **failure scenario**: `useDialog({ root })` reads `root.value` as null in the first visible task; later root assignment does not rebind · **fix direction**: pass `ctx.track` into option resolution and track Qwik signals before `init` · **SAFE-FIX**.
- **[P3] [MED]** `vue/index.js:108` — Vue directive update skips same-object option mutations · adapters · **failure scenario**: mutating `opts.root = second` with same object identity causes `updated` to return early, leaving old root active · **fix direction**: compare resolved option signatures per element/directive key, not binding object identity · **SAFE-FIX**.

**Interaction / forms a11y**

- **[P2] [HIGH]** `behaviors/tabs.js:132` — tab keyboard handling ignores `aria-orientation` · forms/a11y · **failure scenario**: horizontal tabs consume `ArrowDown`; vertical tabs also react to `ArrowRight`, contrary to expected APG axis behavior · **fix direction**: branch by orientation; horizontal handles Left/Right, vertical handles Up/Down, Home/End shared · **SAFE-FIX**.
- **[P2] [HIGH]** `behaviors/combobox.js:361` — editable combobox steals text-field `Home`/`End` · forms/a11y · **failure scenario**: with popup open, pressing `Home` prevents native caret movement and may do nothing when no matches exist · **fix direction**: reserve list navigation for ArrowUp/ArrowDown or modified shortcuts; let unmodified Home/End edit text · **SAFE-FIX**.
- **[P2] [HIGH]** `behaviors/forms.js:149` — error-summary links are indistinguishable across invalid fields · forms/a11y · **failure scenario**: “First name” and “Email” empty both produce summary links named only “Please fill out this field” · **fix direction**: include associated label/legend/name in link text, e.g. `Email: Please fill out this field` · **SAFE-FIX**.
- **[P3] [MED]** `behaviors/command.js:194` — command combobox also intercepts input `Home`/`End` · forms/a11y · **failure scenario**: pressing `Home` while editing a query prevents caret movement and changes active command · **fix direction**: prioritize native text editing; use Arrow keys for command navigation · **SAFE-FIX**.

**CSS components / logical axes**

- **[P2] [HIGH]** `css/feedback.css:13` — global registration of generic `--value` can break host CSS · CSS correctness · **failure scenario**: consumer CSS using `--value: 50%` for `inline-size` collapses because Bronto registered `--value` as `<number>` and rejects percentages · **fix direction**: use a prefixed typed property or remove the global registration · **SAFE-FIX**.
- **[P2] [HIGH]** `css/bullet.css:46` — RTL bullet graph bands do not mirror with the value axis · CSS correctness · **failure scenario**: in `dir="rtl"`, measures/targets anchor from the right but qualitative band gradient remains `to right`, so values are read against reversed bands · **fix direction**: add RTL `to left` gradient and mirror target translate, or keep the axis consistently physical LTR · **SAFE-FIX**.
- **[P2] [HIGH]** `css/feedback.css:329` — tooltip centering breaks in RTL · CSS correctness · **failure scenario**: `inset-inline-start: 50%` anchors the right edge, then `translate(-50%, …)` moves the bubble further left by about one width · **fix direction**: use physical `left: 50%` for visual centering or mirror transform in RTL · **SAFE-FIX**.
- **[P3] [HIGH]** `css/interval.css:64` — RTL interval point is offset from its value · CSS correctness · **failure scenario**: `inset-inline-start` anchors from the right, but `translate(-50%, -50%)` still moves left; endpoint points are inset by about one diameter · **fix direction**: mirror X translate in RTL · **SAFE-FIX**.
- **[P3] [MED]** `css/dots.css:508` — dotfit container query uses physical `width` on an inline-size container · CSS correctness · **failure scenario**: vertical writing mode tracks inline-size but `(width < 18rem)` tests physical width, so densification can fail · **fix direction**: use inline-size container query syntax · **SAFE-FIX**.

**Build / validation scripts**

- **[P2] [HIGH]** `scripts/check-variables.mjs:51` — nested `var()` fallbacks are not validated · build/scripts · **failure scenario**: `color: var(--diff-tint, var(--text-dimm));` exits 0 because only the outer `var()` is checked · **fix direction**: parse CSS values with a balanced parser and recursively validate fallback references · **SAFE-FIX**.
- **[P2] [HIGH]** `scripts/check-doc-recipes.mjs:52` — CDN recipe checks miss multiline HTML tags · build/scripts · **failure scenario**: multiline `<script src=...>` or `<link href=...>` snippets produce no match because scanning is line-by-line · **fix direction**: extract tags from full documents or parse snippets as HTML, deriving line numbers from offsets · **SAFE-FIX**.
- **[P2] [HIGH]** `scripts/check-schemas.mjs:132` — `date-time` validation accepts impossible dates · build/scripts · **failure scenario**: `"2026-02-30T00:00:00Z"` passes because `Date.parse` normalizes it · **fix direction**: use Ajv plus `ajv-formats`, or RFC3339 regex plus calendar round-trip validation · **SAFE-FIX**.

## Lower-confidence / needs-repro

- `css/marks.css:33` — WebKit may still require `-webkit-box-decoration-break: clone`; wrapped `.ui-mark` highlights may fail to clone padding/background.
- `behaviors/dialog.js:96` — cleanup removes native dialog `close` focus-restorer before `dlg.close()`; jsdom shows focus left inside closed dialog, but real-browser confirmation needed.
- `qwik/index.d.ts:45` — Qwik types accept function option resolvers even though Qwik serialization may reject captured plain functions; likely needs serializable/QRL type narrowing.
- `behaviors/forms.js:138` — required radio groups may duplicate summary entries when several radios in the same named group carry `required`.
- `scripts/check-release.mjs:41` / `scripts/changelog-section.mjs:487` — changelog heading `includes` matching could let `0.6.0-rc.1` satisfy or shadow `0.6.0`; current changelog does not reproduce.
- `css/interval.css:62` / `css/bullet.css:89` — boundary markers at `0|1` bleed half a marker outside the track; may be intentional scale-boundary rendering.
- `css/spark.css:27`, `css/bullet.css:63`, `css/interval.css:48` — out-of-contract normalized values can overflow/collapse, but docs require host-normalized `0..1`.

## False alarms / non-defects

- Direct public `./css/*.css` exports to generated layered CSS are intentional; raw unlayered leaves are under `./css/unlayered/*`.
- `::details-content`, scroll timelines, and `@starting-style` uses are gated/progressive, not fallback bugs.
- Toast live regions intentionally persist after individual toasts drain.
- Audited observer/listener/timer paths generally pair teardown correctly.
- React StrictMode double-invoke is handled by returned cleanup plus behavior idempotency.
- Svelte action lifecycle looked correct.
- Qwik shared `start()` helper is not the defect; untracked signal reads are.
- `behaviors/menu.js` intentionally uses Tab-reachable buttons in native `<details>`, not ARIA menu roving focus.
- Advisory script default exit-0 behavior is documented; strict audit scripts pass on current tree.
- No generated-output sort/order nondeterminism reproduced for current key sets.
- `check-public-hygiene` failing under read-only `npm pack --dry-run` is nonzero, not a false pass.
- Missing skin-specific renderer palettes are not a defect because docs say resolved renderer themes do not live-reskin from later CSS overrides.
- Mermaid/D2/Vega checked outputs did not leak `var()`, `undefined`, `NaN`, or `Infinity`.

## Recommended fix batching

| Batch | Scope | SAFE-FIX defects covered |
|---|---|---|
| 1 | `css/skins.css`, `css/tokens.css`, `css/legend.css` | P1 print skin contrast; analytical legend swatch fallback |
| 2 | `css/feedback.css`, `css/bullet.css`, `css/interval.css`, `css/dots.css` | global `--value`; RTL bullet bands; RTL tooltip; RTL interval point; dotfit inline-size query |
| 3 | `behaviors/internal.js`, `behaviors/theme.js` | `bindOnce()` one-shot cleanup; theme double-init ARIA restore ordering |
| 4 | `behaviors/tabs.js`, `behaviors/combobox.js`, `behaviors/forms.js`, `behaviors/command.js` | tab orientation keys; editable combobox Home/End; form summary labels; command Home/End |
| 5 | `solid/index.js`, `qwik/index.js`, `vue/index.js` | Solid reactive options; Qwik tracked signal roots/options; Vue same-object option mutations |
| 6 | `scripts/check-variables.mjs`, `scripts/check-doc-recipes.mjs`, `scripts/check-schemas.mjs` | nested CSS var fallback validation; multiline CDN recipe validation; strict date-time validation |