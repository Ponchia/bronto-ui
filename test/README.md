# Test tree

`test/` is the regression and contract suite for `@ponchia/ui`. It currently
contains this README plus 118 suite files:

- 27 Node unit and contract tests in `*.test.mjs` at this directory root.
- 35 Playwright browser specs in [`e2e/`](./e2e/).
- One type-only compile test, [`types.test-d.ts`](./types.test-d.ts).
- Seven Playwright helpers and fixtures in `e2e/_*.mjs` and
  `e2e/_*.fixture.html`.
- 48 committed Linux/Chromium screenshot baselines in
  `e2e/__screenshots__/`.

## Run paths

- `npm run check:unit` delegates to `npm test`, which runs Node's built-in
  test runner against `test/*.test.mjs`.
- `npm run check:types` runs `tsc -p tsconfig.json`. The type-only assertions in
  `types.test-d.ts` prove the published declarations compile and reject typos.
- `npm run test:e2e:nonpixel` is the local-safe Playwright path. It calls
  [`scripts/test-e2e-nonpixel.mjs`](../scripts/test-e2e-nonpixel.mjs), which
  discovers every `test/e2e/*.spec.mjs` except `visual.spec.mjs`.
- `npm run test:e2e` uses [`playwright.config.mjs`](../playwright.config.mjs).
  Playwright starts `node scripts/serve.mjs 8123`, uses
  `http://127.0.0.1:8123` as `baseURL`, and serves the repo root so `/demo/`
  resolves like the published demo site.
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
