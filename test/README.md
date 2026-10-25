# Test tree

`test/` is the regression and contract suite for `@ponchia/ui`. The tree contains:

- Node unit and contract tests in `*.test.mjs` at this directory root.
- Playwright browser specs, helpers, and HTML fixtures in [`e2e/`](./e2e/).
- Public type assertions in [`types.test-d.ts`](./types.test-d.ts) and the
  related `*.test-d.ts` files included by `tsconfig.json`.
- Committed Linux/Chromium screenshot baselines in `e2e/__screenshots__/`.

The runners discover their suites from the source tree; the coverage matrices
and `check:visual-baselines` verify ownership and baseline inventory.

## Run paths

- `npm run check:unit` delegates to `npm test`, which runs Node's built-in
  test runner against `test/*.test.mjs`.
- `npm run check:types` runs `tsc -p tsconfig.json`. The type-only assertions in
  `types.test-d.ts` prove the published declarations compile and reject typos.
- `npm run test:e2e:nonpixel` is the local-safe Playwright path. It calls
  [`scripts/test-e2e-nonpixel.mjs`](../scripts/test-e2e-nonpixel.mjs), which
  discovers every `test/e2e/*.spec.mjs` except `visual.spec.mjs`.
- `npm run test:e2e` uses [`playwright.config.mjs`](../playwright.config.mjs).
  Playwright builds the public site and starts `node scripts/serve.mjs 8124`, uses
  `http://127.0.0.1:8124` as `baseURL`, and serves the repo root so `/demo/`
  resolves like the published demo site. Public-site tests inspect the actual
  generated output under `/_site/`.
- Chromium runs every Playwright spec. Firefox and WebKit use
  `NON_PIXEL_E2E_TEST_MATCH`, so they skip only `visual.spec.mjs`.
- `npm run test:e2e:chromium` still includes pixel screenshots. Use visual
  paths only in the pinned Playwright container or the visual baseline workflow
  described in [`CONTRIBUTING.md`](../CONTRIBUTING.md#visual-baselines).

## Where to add tests

- Add pure JS, export, contract, schema, helper, and script behavior coverage as
  `test/<surface>.test.mjs` so `npm run check:unit` picks it up.
- Add public type assertions to `types.test-d.ts`. Split only if the type suite
  grows enough to need more than one file.
- Add browser, accessibility, print, interaction, and layout regressions as
  `test/e2e/<surface>.spec.mjs`. Non-pixel specs join the cross-engine run
  automatically.
- Put shared Playwright helpers and HTML fixtures under `test/e2e/` with the
  existing underscore prefix.
- For kitchen-sink visual coverage, add a stable `data-shot` section in
  [`demo/index.html`](../demo/index.html). `visual.spec.mjs` discovers it and
  maps it to `e2e/__screenshots__/`; do not hand-edit screenshot files.

Set `BRONTO_UI_TEST_PORT` for an isolated checkout. Playwright refuses to reuse
an existing server, so tests cannot silently inspect another checkout.

## Motion policy is an observed browser contract

The pinned Playwright 1.60 runner receives reduced motion through
`use.contextOptions.reducedMotion`. Its top-level `use.reducedMotion` key is
not forwarded to the browser context. `browser-environment.spec.mjs` checks
the actual media query and computed scroll behavior in every engine; accepting
a configuration object is not proof that the policy took effect.

Motion-specific suites use `test.use({ contextOptions: { reducedMotion:
'no-preference' } })`; individual interaction tests can still call
`page.emulateMedia`. Keep those normal-motion tests when changing the default.
The browser/container pins, existing visual baselines, test assertions and
retry budget are independent and must not be weakened to repair configuration.

The approved pixel baselines retain their historically observed normal-motion
media (`contextOptions.reducedMotion: 'no-preference'`), asserted at runtime by
`visual.spec.mjs`. Screenshot capture freezes animation independently. Switching
that media changes the intentionally static striped indeterminate progress bar;
it is not a reason to regenerate approved PNGs or increase their tolerance.
Reduced-motion behavior remains covered by the default suite and explicit
media/contrast tests. Native tree tests assert both hidden and restored leaves
in each motion mode, rather than sampling a disappearing leaf mid-transition.
