# Repository Map

Use this map to choose the edit point before touching files. It summarizes the
directory rules from [architecture.md](./architecture.md#repository-layout) and
the generators wired through `package.json` scripts.

## Directory Map

| Path | Owns | Edit status | Regenerate after edits |
| --- | --- | --- | --- |
| `css/` | The CSS framework, source entrypoints, opt-in leaves, and roll-ups. | Mixed. Most leaves are authored. `css/tokens.css` has generated `:root` palette blocks and hand-authored presets below the marker. `css/skins.css` and `css/dataviz.css` are generated. `css/generated.css` is authored trust-surface CSS despite its name. | Authored CSS changes need `npm run dist:build`. Token/charts/skins CSS is produced by the scripts below. |
| `tokens/` | Token data and resolved theme outputs for CSS, JS, charting, and renderer config. | Mixed. `tokens/index.js`, `tokens/skins.js`, and `tokens/charts.js` are authored sources. JSON, `.d.ts`, and `tokens/{mermaid,d2,vega}.*` outputs are generated. | Use `npm run build:artifacts` for broad token changes. Targeted scripts are `tokens:css:build`, `tokens:build`, `dtcg:build`, `resolved:build`, `figma:variables:build`, `skins:build`, `charts:build`, `mermaid:build`, `d2:build`, `vega:build`, and `contrast:build`. |
| `classes/` | The public `.ui-*` vocabulary, class recipes, language-neutral class data, and VS Code CSS data. | Mixed. `classes/index.js` is authored. `classes/index.d.ts`, `classes/classes.json`, and `classes/vscode.css-custom-data.json` are generated. | `npm run dts:build`, `npm run classes:json:build`, `npm run vscode:build`, and `npm run reference:build`; `npm run build:artifacts` runs all of them. |
| `behaviors/` | Vanilla SSR-safe behavior initializers and shared DOM helpers. | Mixed. `.js` files are authored. `.d.ts` and `.d.ts.map` files are generated from JSDoc by `tsc`. | `npm run dts:emit`. |
| `react/`, `solid/`, `qwik/`, `svelte/`, `vue/` | Thin optional framework bindings over `behaviors/`. | Mixed. `.js` files are authored. `.d.ts` and `.d.ts.map` files are generated from JSDoc. | `npm run dts:emit`. |
| `connectors/`, `annotations/` | Pure SVG geometry and annotation helpers. | Mixed. `.js` files are authored. `.d.ts` and `.d.ts.map` files are generated from JSDoc. | `npm run dts:emit`. |
| `schemas/` | Public JSON Schema contracts. | Authored, path-frozen where exported. | No generator; `npm run check:schemas` validates exports, docs, and examples. |
| `glyphs/` | Dot-matrix glyph runtime data and render helpers. | Mixed. `glyphs/glyphs.js` is authored. `glyphs/glyphs.d.ts` is generated. | `npm run glyphs:build`. |
| `shiki/` | The bundled Shiki theme JSON. | Authored JSON. | No generator; `npm run check:shiki` validates it. |
| `fonts/` | Vendored Doto webfont files and OFL license. | Vendored assets. | No generator. |
| `scripts/` | Artifact generators, integrity checks, release helpers, and local runners. | Authored tooling. | If a generator changes, run its matching `*:build` script. If a check changes, run the matching `check:*` gate. |
| `test/` | Node tests, Playwright specs, type tests, and committed visual baselines. | Authored fixtures and committed baselines. | Do not regenerate visual baselines locally; use the workflow described in `CONTRIBUTING.md`. |
| `examples/` | Packed-tarball consumer examples. | Authored fixtures. Local installs and build outputs are ignored. | No committed generator. |
| `demo/` | Demo and showcase pages used by docs, e2e, and visual coverage. | Authored fixtures. Preview images are ignored. | No committed generator. |
| `docs/` | Hand-authored docs, ADRs, migration notes, generated reference docs, and the docs viewer. | Mixed. Most Markdown is authored. `docs/reference.md`, `docs/package-contract.md`, and `docs/contrast.md` are generated. | `npm run reference:build`, `npm run package-contract:build`, and `npm run contrast:build` for those generated files. |
| `dist/` | Flattened bundle and layered direct-import CSS outputs. | Generated. Do not edit. | `npm run dist:build`. |
| `code-quality-audits/` | Historical audit reports and review artifacts. | Authored reports plus ignored scanner output patterns. | No committed generator. |

Root metadata matters too: `package.json` owns `exports`, `files`, `style`,
`sideEffects`, scripts, and optional peers. New public paths are not public until
they are declared there and pass `npm run check:exports` and `npm run check:pack`.

## Regeneration Map

Prefer `npm run build:artifacts` after any broad public-surface change. It runs
the artifact scripts in the order declared by `package.json`. Use narrower
commands only when the edited source has a single known projection.

| Edited source | Generated outputs | Regeneration script |
| --- | --- | --- |
| `tokens/index.js` | `css/tokens.css`, token JSON, DTCG, resolved tokens, Figma variables, token `.d.ts`, contrast docs, renderer themes, chart JSON, dist CSS. | `npm run build:artifacts` |
| `tokens/skins.js` | `css/skins.css`, `tokens/skins.d.ts`, skin contrast rows. | `npm run skins:build` and `npm run contrast:build` |
| `tokens/charts.js` | `css/dataviz.css`, `tokens/charts.json`, `tokens/charts.d.ts`, chart-backed renderer themes, contrast rows. | `npm run charts:build`, `npm run mermaid:build`, `npm run vega:build`, and `npm run contrast:build` |
| `classes/index.js` | `classes/index.d.ts`, `classes/classes.json`, VS Code custom data, `docs/reference.md`. | `npm run dts:build`, `npm run classes:json:build`, `npm run vscode:build`, and `npm run reference:build` |
| `behaviors/**/*.js`, `annotations/index.js`, `connectors/index.js`, framework binding `index.js` files | Leaf `.d.ts` and `.d.ts.map` files generated from JSDoc. | `npm run dts:emit` |
| `glyphs/glyphs.js` | `glyphs/glyphs.d.ts`. | `npm run glyphs:build` |
| Authored `css/*.css` leaves and roll-ups | `dist/bronto.css` and `dist/css/*.css`. | `npm run dist:build` |
| `scripts/gen-reference.mjs` | `docs/reference.md`. | `npm run reference:build` |
| `scripts/gen-package-contract.mjs` | `docs/package-contract.md`. | `npm run package-contract:build` |
| `scripts/gen-contrast.mjs` or token contrast policy inputs | `docs/contrast.md`. | `npm run contrast:build` |

Generated files carry a banner or are listed in `scripts/lib/artifacts.mjs`,
`scripts/build-dist.mjs`, or a semantic generator such as `scripts/gen-glyphs.mjs`.
When in doubt, edit the source named by the banner and regenerate the output.
