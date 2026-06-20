# Architecture & Decisions

Status: accepted · 2026-05-15 · applies from v0.2.0

> **Separate ADRs.** Larger, self-contained decisions live under
> [`docs/adr/`](./adr/):
>
> - [ADR-0001 — Color system: governed evolution beyond monochrome](./adr/0001-color-system.md)
>   (accepted; steps 1–8 implemented in 0.4.0) — the five-tier color
>   constitution, the `check:color-policy`/`check:skins`/`check:charts`
>   gates, opt-in colorways, data-viz, APCA advisory reporting, and the
>   OKLCH core accent ramp.

## Context

`@ponchia/ui` is the shared design layer for several projects on
different stacks: Astro, SvelteKit, and an
open-ended set of future apps (React, Solid, Qwik, plain HTML, server-rendered
templates). The question driving this document: is plain CSS the right
universal substrate, or should the framework ship per-framework components?

## Decision

**Plain, class-based CSS is the canonical and only universal layer.** It is
the single artifact every target consumes natively with zero adapter. A
per-framework component library would make every non-chosen framework a
second-class citizen and multiply the maintenance surface for the same button.

The known gaps of a pure-CSS framework — contract visibility, a home for
unavoidable JS, and distribution — are addressed as **thin, optional layers
on top of the CSS, none of which require a framework commitment**:

```
@ponchia/ui
├── css/         canonical universal layer (the framework)          [required]
├── tokens/      design tokens as JS/JSON, for JS/canvas/tooling     [optional]
├── classes/     typed class-name contract + recipe builders         [optional]
├── behaviors/   vanilla, SSR-safe JS for stateful widgets           [optional]
├── connectors/  pure SVG leader-line geometry kernel (no DOM)        [optional]
├── annotations/ pure SVG callout geometry (builds on connectors)     [optional]
├── glyphs/      dot-matrix glyph registry/renderers                 [optional]
├── schemas/     declarative JSON contracts for report/tooling data   [optional]
├── react/       thin React hooks over behaviors                     [optional peer]
├── solid/       thin Solid primitives over behaviors                [optional peer]
├── qwik/        thin Qwik hooks over behaviors (useVisibleTask$)     [optional peer]
├── svelte/      thin Svelte actions over behaviors                  [optional]
└── vue/         thin Vue directives over behaviors                  [optional]
```

### Consequences of each layer

- **css/** — wrapped in a single `@layer bronto`. Any un-layered CSS in a
  consumer wins the cascade without specificity wars or `!important`. This is
  a deliberate behavioural change vs. unlayered v0.1.0; consumers pin a tag
  so it ships only on the next version bump.
- **Fonts** — `@font-face` moved out of `tokens.css` into `css/fonts.css`
  with URLs relative to the package (`../fonts/*`), so font hosting is
  decoupled from the token layer and resolves through bundlers or static
  serving without an absolute `/fonts` assumption.
- **tokens/** — `index.js` (`cssVars`) is the single source of truth for token
  values. The four `:root` palette blocks of `css/tokens.css` are **generated**
  from it (`scripts/gen-tokens-css.mjs`), as are the JSON artifacts (`index.json`,
  `tokens.dtcg.json`, `resolved.json`, `figma.variables.json`). So the dark
  palette is authored once, not in three places (the two CSS dark blocks are now
  identical by construction), resolving the duplication ADR-0003 flagged. The
  CSS-only presets (density / contrast / OLED) stay hand-authored below a marker
  and are preserved across regeneration. `scripts/check-fresh.mjs` fails CI if a
  generated mirror drifts from the model.
- **classes/** — `cls` is the flat registry; recipes only emit from it;
  `scripts/check-classes.mjs` enforces a bidirectional match with the
  stylesheet's `.ui-*` selectors. The class contract cannot silently rot.
- **behaviors/** — vanilla, dependency-free, side-effect-free on import,
  SSR-safe. Chosen over Web Components (SSR/hydration friction with Astro
  islands and SvelteKit) and over per-framework packages (maintenance
  multiplier). Revisit Web Components only if stateful widgets accumulate.
  `index.js` is a barrel; each behavior lives in its own module
  (`dialog.js`, `combobox.js`, …) over a shared `internal.js` of DOM helpers,
  so the public import surface is unchanged.
- **connectors/** and **annotations/** — dependency-free SVG geometry helpers
  for report and analytical figures. `@ponchia/ui/annotations` intentionally
  stays a small static-helper compatibility layer for the Bronto subject /
  connector / note grammar. The richer annotation engine - placement,
  collision handling, SVG/React renderers, editing, and diagram/chart adapters
  - lives in the sibling `@ponchia/annotations` package and must not be pulled
  in as a runtime or public type dependency of `@ponchia/ui`.
- **glyphs/** — static bitmap data and SSR-safe render helpers. The
  256-cell DOM renderers are for display and solid inline icons; the `.ui-icon`
  mask renderer is for dense icon-at-scale use.
- **react/** / **solid/** / **qwik/** / **svelte/** / **vue/** — optional lifecycle
  adapters over `behaviors/`. They do not define markup, own state, or fork
  behavior logic; they only run the vanilla initializers on mount and cleanup
  on unmount/dispose. The Svelte and Vue adapters are plain action/directive
  objects, so they do not add runtime dependencies to the package.
- **`css/analytical.css` — the analytical roll-up.** This convenience file
  `@import`s exactly **nine** analytical figure/evidence leaves: `figure`,
  `annotations`, `legend`, `marks`, `connectors`, `spotlight`, `crosshair`,
  `selection`, and `highlights`. The adjacent opt-in leaves — `sources`,
  `interval`, `clamp`, `state`, `generated`, `workbench`, and `command` — are
  report/tooling/trust surfaces that are intentionally **not** part of the
  analytical roll-up and must be imported individually. Importing
  `analytical.css` does not pull in any of those seven.
- **Root export (`.`) is CSS-only.** `exports["."]` resolves to the CSS
  bundle (`dist/bronto.css`). It is a CSS side-effect import for CSS-aware
  bundlers (`@import '@ponchia/ui'` in CSS, or a side-effect
  `import '@ponchia/ui'` in Vite/Astro/SvelteKit). There is no runtime JS at
  the package root — Node/runtime JS imports of `.` are not supported. All JS
  entrypoints are explicit subpaths (`/behaviors`, `/classes`, `/tokens`,
  `/glyphs`, `/annotations`, `/connectors`, `/react`, `/solid`, `/qwik`,
  `/svelte`, `/vue`, `/skins`, `/charts`, `/mermaid`, `/d2`, `/vega`). This is
  a permanent, intentional contract.

### Surface admission rule

The default bundle is the shared app/service identity, not the complete Bronto
catalog. A new public surface must choose one lane before it ships:

- **core identity** — universal application chrome or accessibility/platform
  glue that belongs in `dist/bronto.css`;
- **opt-in toolbox** — report, analytical, provenance, generated-content,
  renderer, workbench, or command vocabulary that ships as an explicit CSS/JS
  subpath;
- **recipe/docs only** — a pattern that can be taught without creating a new
  class, token, behavior, export, or package path.

When the answer is unclear, choose recipe/docs first. Promote to an opt-in leaf
only after a real consumer repeats the pattern; promote to core only when it is
clearly shared application identity. Bronto owns visual grammar, token handoff,
pure geometry, and delegated accessibility behavior. It does not own chart
scales, data fetching, persistence, routing, workflow execution, action
registries, virtualized grids, or framework component APIs.

## Repository layout

The repo root mixes five kinds of directory that look alike but follow very
different rules. Two distinctions matter most: several are **path-frozen
published subpaths** — the directory name _is_ the public import specifier
(`@ponchia/ui/react` resolves to `./react/`), so they cannot be moved or
renamed — and several are **generated** and must never be hand-edited (a
generator overwrites them and a drift gate fails CI).

| Path | Kind | Edit here? | Notes |
| --- | --- | --- | --- |
| `css/` | source | yes | The framework. Hand-authored `@layer bronto` CSS. (`css/tokens.css` palette blocks and `css/generated.css` are generated — see below.) |
| `tokens/index.js` | source | yes | The single source of truth for token **values** (`cssVars`). |
| `classes/index.js`, `behaviors/`, `annotations/`, `connectors/`, `react/`, `solid/`, `qwik/`, `svelte/`, `vue/`, `glyphs/`, `shiki/` | source · published-subpath (path-frozen) | yes — but **do not move** | Authored ESM shipped as-is; the dir name is the public import path. The `.d.ts` beside them are generated/drift-checked: `connectors`/`annotations`/`react`/`solid`/`qwik`/`svelte`/`vue`/`behaviors` are emitted from JSDoc by `tsc` (`npm run dts:emit`), `classes`/`tokens`/`glyphs` from the runtime. No leaf `.d.ts` is hand-maintained. |
| `schemas/*.schema.json` | source · published schema files (path-frozen) | yes — but **do not move exported files** | Declarative JSON Schema contracts for sidecars/tooling data. Each exported schema file path is public; the directory itself is not a wildcard import. No validator runtime ships. |
| `dist/` | generated | no | Build of `css/` (`npm run dist:build`); byte-checked by `check:dist`. |
| `tokens/index.json`, `tokens/resolved.json`, `tokens/tokens.dtcg.json`, `tokens/figma.variables.json`, `tokens/charts.json`, `classes/index.d.ts`, `tokens/index.d.ts`, `tokens/{skins,charts}.d.ts`, `glyphs/glyphs.d.ts`, `classes/vscode.css-custom-data.json`, `docs/reference.md` | generated | no | Committed build artifacts; regenerate with `npm run prepack`, never hand-edit. Drift-checked in `npm run check`. |
| `fonts/` | vendored | — | The Doto webfont (woff2) + its OFL license. |
| `scripts/` | tooling | yes | `gen-*` regenerate artifacts, `check-*` are the drift/contract gates wired into `npm run check`, plus `build-dist`, `serve`, `size-report`. |
| `docs/` | source (mostly) | yes | Hand-authored docs + ADRs; the curated subset in `package.json` `files` ships in the tarball. `docs/reference.md` is generated. |
| `demo/`, `test/`, `examples/` | fixtures | yes | The self-driving demo/showcase, the unit + Playwright e2e suite, and consumer example apps built against the packed tarball. |
| `.github/`, `*.config.mjs`, `.prettierrc`, `.stylelintrc.json`, `tsconfig.json`, `.editorconfig` | config | yes | CI workflows and tool config. |
| `package.json`, `llms.txt`, `CHANGELOG.md`, `MIGRATIONS.json`, `README.md`, `CONTRIBUTING.md`, `ROADMAP.md`, `LICENSE` | meta | yes | Manifest, the agent entrypoint, the curated changelog, the rename map, and project docs. |

The **path-frozen** dirs are the cost of zero-build, path-stable publishing:
`files` map 1:1 to published paths and the consumer's own bundler tree-shakes
the ESM, so there is no `src/` indirection (and no JS bundler — see the
distribution decision below). **Generated** files are regenerated from their
source and policed by a drift gate — edit the source, run the generator, commit
the result.

## Drift control

Every data mirror and public documentation contract is backed by a check wired
into `npm run check`, run by CI on every push/PR and again by `release.yml`
before publish (see "Release gating" below), so a version that fails any
invariant never reaches npm. Public authoring docs are treated as public surface
too: `check:doc-links` fails stale local paths/anchors across shipped docs,
GitHub-only docs, and the docs viewer route list, while shipped-doc links must
also point at files present in the npm tarball. `check:contract` verifies
documented named imports, `check:doc-recipes` fails copy-paste CDN recipes that
silently no-op, and `check:report` validates fenced HTML snippets before they
are copied into consumer reports.

| Invariant                                       | Enforced by         |
| ----------------------------------------------- | ------------------- |
| exports / import graph / source CSS `layer(bronto)` imports / layered-vs-unlayered CSS target map / `files` consistent | `check-exports.mjs` |
| pure generated mirrors fresh — `tokens.css`/`index.json`, `dtcg.json`, `resolved.json`, `figma.variables.json`, `classes`/`tokens` `.d.ts`, `reference.md`, vscode data — each byte-equal to its generator (registry: `scripts/lib/artifacts.mjs`) | `check-fresh.mjs` |
| `classes` `cls` ⇄ `.ui-*` selectors             | `check-classes.mjs` |
| `connectors`/`annotations`/`react`/`solid`/`qwik`/`svelte`/`vue`/`behaviors` `.d.ts` (+ maps) == fresh `tsc` emit of their JSDoc | `check-dts-emit.mjs` |
| legend swatch colours ⊆ `charts.js` · opt-in   | `check-legend.mjs`  |
| color tokens tiered · no raw chromatic color in components | `check-color-policy.mjs` |
| `css/skins.css` ⇄ `tokens/skins.js` · colorways opt-in | `check-skins.mjs` |
| every shipped colorway accent meets its WCAG floor | `check-contrast.mjs` |
| `dataviz.css`/`charts.json`/`charts.d.ts` ⇄ `tokens/charts.js` · CVD-distinguishable · opt-in | `check-charts.mjs` |
| `shiki/nothing.json` valid + on rationed palette | `check-shiki.mjs`  |
| `dist/*.css` == fresh single-`@layer bronto` build of `css/` + budget | `check-dist.mjs`    |
| published tarball == intended `files` only      | `check-pack.mjs`    |
| packed core JS/JSON public subpaths import without optional framework peers, packed JS named exports exactly match source modules, peer-backed adapters import after peers are linked, concrete CSS/doc/font subpaths resolve, and packed behavior initializers/toast no-op in a clean consumer with no DOM globals | `check-consumer-surface.mjs` |
| packed typed public subpaths compile through package exports in a clean TypeScript consumer | `check-consumer-types.mjs` |
| function-level cyclomatic complexity stays ≤12 and function NLOC stays within budget, with no per-function exception list | `check-complexity.mjs` |
| GitHub Actions workflow syntax and embedded shell snippets lint | `check:workflows` (`github-actionlint`) |
| every shipped CSS leaf is classified as foundation or has explicit docs/demo/e2e ownership | `check-component-matrix.mjs` |
| every public behavior export has explicit docs, unit-test, and browser-test ownership | `check-behavior-matrix.mjs` |
| every public helper export in `classes`/`annotations`/`connectors`/`glyphs` has explicit docs, unit-test, and type-test ownership | `check-helper-matrix.mjs` |
| every delegated behavior has React/Solid/Qwik hook, Svelte action, Vue directive, docs, example, unit, and type ownership | `check-binding-matrix.mjs` |
| `@playwright/test` version ⇄ pinned Playwright container image ⇄ visual workflows/docs/local runner | `check-playwright-container.mjs` |
| every shipped JSON schema is exported, documented, validates its public cookbook example, and rejects malformed sidecars | `check-schemas.mjs` |
| packed public text contains no private terms, local paths, or secret-looking assignments | `check-public-hygiene.mjs` |
| CSS custom-property references resolve or carry an explicit fallback/host boundary | `check-variables.mjs` |
| `MIGRATIONS.json` edges have structured rules and matching docs | `check-migrations.mjs` |
| example inventory ⇄ CI matrix ⇄ browser-smoke list ⇄ README rows ⇄ preview ports | `check-examples.mjs` |
| demo visual snapshot declarations ⇄ committed Chromium baseline inventory | `check-visual-baselines.mjs` |
| public authoring docs keep valid local paths/anchors; shipped-doc links resolve inside the tarball; docs viewer routes resolve | `check-doc-links.mjs` |
| report/docs snippets use valid `ui-*` classes and public authoring snippets keep intact local id/ARIA/behavior references | `check-report.mjs` |
| published `.d.ts` compile + reject typos        | `tsc` (`check:types`) |
| CSS style/correctness                           | Stylelint           |
| non-CSS source style                            | Prettier (`check:format`) |

`check-dist` is the most supply-chain-critical row: `dist/bronto.css` is
the default `exports["."]` consumers actually load, so its byte-equality
to a fresh build of `css/` is what makes the committed bundle trustworthy.
The `check-dist` size ceiling (`BUDGET` in `build-dist.mjs`) is calibrated
to the current bundle with deliberate headroom — it is the consumer-facing
payload contract, raised only intentionally with a CHANGELOG note.
`check:types` compiles the published declarations against
`test/types.test-d.ts`, whose `@ts-expect-error`s would fail to compile
if the generated literal `cls`/token types stopped rejecting typos —
so the *value* of the generated `.d.ts` is itself gated, not just their
freshness (`check-fresh`).
`check:consumer-types` then installs the packed tarball in a clean temp
project and compiles package-subpath imports, so `exports.types` and
internal declaration references are proven through consumer resolution.

## Release gating

`release.yml` (on a pushed `v*` tag) is a six-job DAG, serialized by a
`concurrency: release-publish` group so two tags can't race the dist-tag
pointer:

- `validate` — read-only: verifies the tag commit is reachable from `main`,
  then runs `npm run check` and the tag↔version match. `check`
  includes the node:test unit and contract suite, plus `check:release`;
  for a prerelease tag the base version's CHANGELOG
  section need only exist (`## Unreleased — x.y.z` is fine) — only a stable
  release must carry a dated heading.
- `e2e` — `needs: validate`: Playwright (visual + axe a11y, both themes,
  demo structural integrity, both themes, cross-engine) in the pinned
  `mcr.microsoft.com/playwright` container. Local cross-engine reproduction
  without screenshot rasterisation is
  `npm run test:e2e:nonpixel`; use `npm run test:e2e` or
  `npm run test:e2e:chromium` only in the pinned container when the pixel
  baseline gate itself is in scope. With Docker running,
  `npm run test:e2e:visual:container` is the local shortcut for the same
  Chromium screenshot environment.
- `examples` — `needs: validate`: builds the downstream example
  apps against the **packed tarball**, mirroring CI. Catches a broken
  published surface (exports map / missing file / unresolved subpath)
  that `check:pack`'s file-allowlist inspection cannot — so the release
  path runs the same consumer smoke as merge-to-main.
- `publish-preflight` — `needs: [validate, e2e, examples]`: installs with
  lifecycle scripts disabled, runs `npm pack --dry-run --ignore-scripts`, and
  writes the pack manifest + size report to the job summary for review before
  the protected publish approval.
- `publish-npm` — `needs: publish-preflight`: `npm publish --ignore-scripts`
  with provenance. Runs in the `npm-publish` **Environment**
  (required-reviewer protection), so after the gates and preflight pass the run
  pauses for a manual approval in the Actions UI before anything reaches npm —
  a guard against an accidental tag push publishing. Dist-tag is derived from
  the tag: stable (`v0.4.0`) → `latest`; SemVer prerelease (`v0.4.0-rc.1`, any
  hyphenated identifier) → `next`, so the default `npm i @ponchia/ui` never
  moves onto an unstable build (opt in with `@ponchia/ui@next`). Post-publish
  `npm view` registry observation is best-effort only: a registry read flake must
  not fail the job after the immutable publish already succeeded.
- `release-notes` — `needs: publish-npm`: a GitHub Release for visibility
  (transitively gated on a successful publish, hence on the gates above);
  prerelease tags are flagged so they aren't surfaced as "Latest". The Release
  **body is the curated `CHANGELOG.md` section** for the tag
  (`scripts/changelog-section.mjs`), not GitHub's auto-generated PR list — one
  source of truth, surfaced where readers look.

Because the documented install path is the npm package, **the npm publish
is a real gate**: if `validate`, `e2e`, `examples`, or `publish-preflight` fails,
`publish-npm` never runs, the version never reaches the registry, and
consumers never resolve it.
(Corollary: a flaky `e2e` blocks releases — that is deliberate; fix the
flake, don't bypass the gate.) Permissions are least-privilege per job
(only `release-notes` gets `contents: write`; only `publish-npm` gets
`id-token: write` for provenance).

GitHub still serves the raw tag tarball `archive/refs/tags/vX.Y.Z.tar.gz`
for any tag, ungated — that path is legacy/fallback, deliberately *not* the
documented install, so it is no longer the safeguard-critical surface.
Process still applies: bump `package.json`, land on `main`, go green, tag.

## Decision — distribution: npm public `@ponchia/ui`

Decided 2026-05-15. The framework is consumed by a growing set of
heterogeneous web frontends (Astro, SvelteKit, React, Solid, Qwik, Vue,
Tailwind, vanilla), several deploying via third-party CI. The only option where
onboarding a new frontend is `npm i @ponchia/ui` with zero per-consumer config is **npm
public**, and it uniquely also closes the release-gating gap (publish *is*
the gate). GitHub Packages was rejected: it requires auth to install even
public packages, i.e. an `.npmrc` + token on every frontend and CI runner —
the exact friction to avoid. The raw tag tarball is kept as an ungated
legacy/fallback only.

The npm scope `@bronto` is not ownable, so the package name is
**`@ponchia/ui`**. Naming layers, intentionally distinct:

- **npm package**: `@ponchia/ui` (registry identity).
- **CSS cascade layer**: `@layer bronto` and `data-bronto-*` behavior
  attributes (the design-system namespace — unchanged; renaming gains
  nothing and risks consumer overrides).
- **Workspace / brand**: "Bronto" (repo `Ponchia/bronto-ui`) — unchanged.

This split is deliberate; the README states it so the apparent mismatch is
explained, not surprising.

### Post-publish checklist

- Confirm npm `latest` points at the tagged version and the package page shows
  provenance.
- Run `npm pack --dry-run --json` locally or from CI logs and confirm the
  intended file count/payload.
- Build the packed examples matrix from the tarball, not a workspace link:
  `npm run test:examples` covers vanilla, Astro, SvelteKit, Vue, React, Solid,
  Qwik, Tailwind, and report-static, with Chromium browser smokes for runtime
  examples. For a deeper consumer pass, `npm run test:examples:cross-browser`
  runs the same packed smokes in Chromium, Firefox, and WebKit; manual CI
  dispatches pass the same cross-browser flag to the reusable examples workflow.
  `npm run test:examples:visual` adds local-safe desktop + mobile
  screenshot/layout health smokes for packed examples; it detects blank,
  under-painted, or horizontally overflowing output but intentionally does not
  author OS-sensitive committed PNG baselines.
- Confirm the GitHub Release body matches the curated changelog section.
- If a bad package is published, deprecate that exact version on npm, publish a
  patched version, and link the deprecation note to the changelog/security
  advisory as appropriate.
