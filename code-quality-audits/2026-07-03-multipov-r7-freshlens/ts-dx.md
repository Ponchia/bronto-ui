# TypeScript / typed-API DX — bronto-ui round 7 review
**Verdict:** The shipped JS subpath declarations are generally tight, but strict TS consumers still hit real defects at the package boundary and in generated JSDoc declarations: the documented root CSS side-effect import does not resolve in TS, several geometry helpers type-check with omitted required inputs and then throw, Svelte/Vue factory generics erase custom options, and `cx` rejects common readonly tuple inputs.

## Confirmed defects
- **[P1] [conf HIGH]** `package.json:127` — root export has no `types` condition for the documented `import '@ponchia/ui'` side-effect CSS import.
  - Failure scenario: `import '@ponchia/ui';` in a strict TS app gives `TS2882: Cannot find module or type declarations for side-effect import of '@ponchia/ui'`.
  - Fix direction: add a shipped empty root declaration and `"types"` for `"."` before `style/default`. **SAFE-FIX**.

- **[P2] [conf HIGH]** `connectors/index.d.ts:86` — `connectorPath(opts?: ConnectorPathOptions)` allows omitting required `from`/`to`.
  - Failure scenario: `connectorPath()` type-checks, then runtime throws `TypeError: from.x must be a finite number` from `connectors/index.js:236`.
  - Fix direction: make `opts` required in JSDoc/signature; same for `connectRects(opts?: ConnectRectsOptions)` at `connectors/index.d.ts:142`, which throws without rects. **SAFE-FIX**.

- **[P2] [conf HIGH]** `annotations/index.d.ts:15` — required annotation geometry option objects are emitted optional.
  - Failure scenario: `notePlacement()` and `connectorLine()` type-check, then throw `width must be a finite number` / `dx must be a finite number` at runtime (`annotations/index.js:380`, `annotations/index.js:627`).
  - Fix direction: remove optional/default-object signatures for helpers whose typedefs have required fields: `notePlacement`, `rectSubjectPath`, `thresholdPath`, `axisThresholdPath`, `bracketSubjectPath`, `bandSubjectPath`, `slopeSubjectPath`, `comparisonBracePath`, `outlierClusterPath`, `connectorEndDot`, `connectorEndArrow`, `connectorLine/Elbow/Curve`. **SAFE-FIX**.

- **[P2] [conf HIGH]** `svelte/index.d.ts:7` — `createBrontoAction` erases custom behavior option types.
  - Failure scenario: `const a = createBrontoAction((opts?: { root?: Element | Document | null; threshold?: number }) => {}); a(document.body, { threshold: 0.5 });` fails with `'threshold' does not exist in type 'BrontoActionOpts'`, while runtime spreads and forwards it in `svelte/index.js:66`.
  - Fix direction: make `BrontoActionOpts`, `BrontoAction`, and `createBrontoAction` generic over `T extends DelegateOpts`. **SAFE-FIX**.

- **[P2] [conf HIGH]** `vue/index.d.ts:7` — `createBrontoDirective` has the same custom option erasure.
  - Failure scenario: `createBrontoDirective(init).mounted(document.body, { value: { threshold: 0.5 } })` fails with `'threshold' does not exist in type 'BrontoDirectiveOpts'`, while runtime forwards arbitrary option fields in `vue/index.js:109`.
  - Fix direction: make `BrontoDirectiveOpts`, bindings, directive, and factory generic over the initializer option type. **SAFE-FIX**.

- **[P3] [conf HIGH]** `classes/index.d.ts:7` — `ClassValue` only recurses through mutable arrays.
  - Failure scenario: `const parts = [cls.button, false && cls.buttonGhost] as const; cx(parts);` fails because the readonly tuple is not assignable to `ClassValue[]`, while runtime `cx` uses `parts.flat(Infinity)` and handles it (`classes/index.js:707`).
  - Fix direction: change recursion to `readonly ClassValue[]` and keep generated `.d.ts` in sync. **SAFE-FIX**.

## Lower-confidence / needs-repro
- `tokens/mermaid.js:176` demonstrates `brontoMermaidTheme(document.documentElement.dataset.theme)`, and token helper comments say unknown themes fall back to light, but `.d.ts` signatures use `'light' | 'dark'` and type tests intentionally reject arbitrary strings. Needs design call: strict typo rejection vs accepting defensive runtime inputs.

## Notable (not a bug)
- `behaviors/internal.d.ts` contains many `any` helper declarations, but the public barrel only re-exports the precise `Cleanup` and `DelegateOpts` aliases.
- React/Solid/Qwik `useBrontoBehavior` keep the custom option generic; the remaining generic erasure is isolated to Svelte/Vue factories.