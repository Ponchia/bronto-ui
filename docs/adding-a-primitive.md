# Adding A Primitive

Use this playbook for a new CSS primitive, component, opt-in report surface, or
small behavior-backed widget. It follows the contracts in
[CONTRIBUTING.md](../CONTRIBUTING.md) and
[architecture.md](./architecture.md#surface-admission-rule).

## 1. Choose The Layer

Pick the lane before adding classes or exports:

- **Recipe/docs only**: use this when a pattern can be taught with existing
  classes, tokens, and behaviors. This is the default when the surface is not
  clearly repeated.
- **Core identity**: universal application chrome, platform glue, or primitives
  that belong in the default `dist/bronto.css` bundle. Source lives in an
  existing core CSS leaf or in a new leaf imported by `css/core.css`.
- **Opt-in toolbox**: report, analytical, provenance, generated-content,
  renderer-theme, workbench, or command vocabulary. Source lives in an explicit
  subpath such as `css/<leaf>.css`, not in `css/core.css`.

Do not add product logic. The host application owns data fetching, routing,
persistence, chart scales, workflow execution, action registries, and component
state. Bronto owns visual grammar, CSS contracts, pure geometry, and narrow
delegated accessibility behavior.

## 2. Add The CSS

Use `.ui-*` class names and keep the authored CSS in `css/`.

- Existing family: edit the matching `css/<leaf>.css`.
- New core leaf: add `css/<leaf>.css`, import it from `css/core.css` in cascade
  order, and add package targets for both the layered import
  `./css/<leaf>.css -> ./dist/css/<leaf>.css` and the raw escape hatch
  `./css/unlayered/<leaf>.css -> ./css/<leaf>.css`.
- New opt-in leaf: add `css/<leaf>.css`, add it to
  `EXTRA_LEAVES` in `scripts/build-dist.mjs`, and add the same layered and
  unlayered package export targets.
- Analytical/report roll-up: update `css/analytical.css` only for the nine
  analytical leaves it intentionally owns, and update `css/report-kit.css` only
  when the static-report kit should import the leaf.

If a new primitive needs token values, edit `tokens/index.js` for core tokens.
Use `tokens/skins.js` only for root-level `data-bronto-skin` colorways and
`tokens/charts.js` only for chart/data-viz palettes. Do not add raw chromatic
component colors to CSS; `scripts/check-color-policy.mjs` gates that boundary.

## 3. Add The Class Contract

Add every public selector to `classes/index.js`:

- Add base, part, modifier, and author-applied state classes to `cls`.
- Add or extend a `ui.*` recipe only when it prevents repeated string assembly.
- Add recipe options to `scripts/gen-dts.mjs`. The generated
  `classes/index.d.ts` emits the literal `cls` map from `classes/index.js`, but
  the option interfaces and `Ui` recipe signatures are curated in that script.

`scripts/check-classes.mjs` enforces the bidirectional match between
`classes/index.js` and stylesheet `.ui-*` selectors.

## 4. Add Behavior Only When CSS Cannot Own It

If the primitive needs JS, add the vanilla behavior under `behaviors/` and export
it from `behaviors/index.js` only if it is public.

Public behavior exports must have:

- Docs ownership in the relevant `docs/*.md` file.
- Unit ownership in `test/behaviors.test.mjs` or the appropriate test file.
- Browser ownership in a non-pixel Playwright spec discovered by
  `scripts/test-e2e-nonpixel.mjs`.

`scripts/check-behavior-matrix.mjs` enforces those three owners. If the export is
a delegated `init*` behavior, `scripts/check-binding-matrix.mjs` also expects the
React/Solid/Qwik hooks, Svelte action, Vue directive, framework docs, packed
example smoke, unit proof, and type proof.

If the new public surface is a helper in `classes/`, `annotations/`,
`connectors/`, or `glyphs/`, add it to `scripts/check-helper-matrix.mjs` with
docs, unit, and type-test owners.

## 5. Declare Published Surface

Public paths are declared in `package.json`:

- Add `exports` entries for new CSS, JS, JSON, schema, or doc subpaths.
- Keep exported files covered by `files`.
- Keep runtime dependencies empty. Only the documented optional framework peers
  belong in `peerDependencies`.

`scripts/check-exports.mjs` validates export targets, CSS layered/unlayered
pairs, package metadata, and dependency policy. `scripts/check-pack.mjs` proves
the packed tarball contains the intended files and no dev-only directories.

## 6. Add Docs, Demo, And Specs

A shipped CSS leaf must be matrix-owned:

- Add a row to `scripts/check-component-matrix.mjs`.
- Foundation rows need a docs owner and an executable proof owner.
- Component surface rows need docs, a demo, and a non-pixel Playwright spec.
- Demo owners other than `demo/index.html` must be listed in
  `test/e2e/demos.spec.mjs` under `SHOWCASE` or `GUARD_ONLY`.
- Visual snapshot owners need matching `data-shot="<name>"` in
  `demo/index.html` and committed dark/light PNG baselines under
  `test/e2e/__screenshots__/`.

For report-relevant CSS leaves, add the routing row in
[reporting.md](./reporting.md). The analytical toolbox table is how report and
LLM consumers discover when to import the leaf.

Docs that describe public classes, behavior names, imports, or HTML snippets are
checked by `scripts/check-doc-links.mjs`, `scripts/check-contract.mjs`,
`scripts/check-doc-recipes.mjs`, and `scripts/check-report.mjs`.

## 7. Regenerate And Run Gates

After implementation, regenerate committed artifacts with:

```bash
npm run build:artifacts
```

The full required gate is still `npm run check`. For primitive work, expect these
targeted gates to be relevant:

- `npm run check:exports`
- `npm run check:fresh`
- `npm run check:classes`
- `npm run check:recipe-types`
- `npm run check:dts-emit`
- `npm run check:types`
- `npm run check:dist`
- `npm run check:pack`
- `npm run check:component-matrix`
- `npm run check:behavior-matrix` when public behavior is involved
- `npm run check:binding-matrix` when a delegated public behavior is involved
- `npm run check:helper-matrix` when a public helper is involved
- `npm run check:schemas` when public schemas change
- `npm run check:variables`
- `npm run check:color-policy`
- `npm run check:skins`, `npm run check:charts`, `npm run check:contrast`,
  `npm run check:mermaid`, `npm run check:d2`, or `npm run check:vega` when
  token, color, or renderer-theme data changes
- `npm run check:doc-links`
- `npm run check:doc-recipes`
- `npm run check:contract`
- `npm run check:report`

Run `npm run test:e2e:nonpixel` for local browser coverage. Do not regenerate
committed pixel baselines on a dev machine; use the workflow described in
`CONTRIBUTING.md`.
