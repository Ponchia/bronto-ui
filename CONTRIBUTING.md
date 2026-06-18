# Contributing

Thanks for helping. `@ponchia/ui` is a CSS-first, framework-agnostic UI
framework consumed by several apps, so the contract (token names, the
`--accent` derivation, `.ui-*` class names, `data-bronto-*` attributes,
behavior return contracts) is treated as load-bearing and is
machine-checked.

## Setup

```bash
npm ci
npm run check   # the full integrity suite: lint, format, exports; the
                #   consolidated generated-artifact freshness gate (check:fresh
                #   — tokens.css/json, dtcg, resolved, .d.ts, reference, vscode
                #   data); class contract; types, shiki, dist budget, pack
                #   allowlist, packed no-peer/full-peer consumer-surface
                #   import + behavior no-DOM + asset/doc resolution smoke, packed consumer type-resolution smoke,
                #   node:test unit + contract suite, complexity budget,
                #   CSS component docs/demo/spec ownership, behavior
                #   docs/unit/browser ownership, public hygiene, undefined CSS var refs,
                #   publint + arethetypeswrong, workflow syntax/shell lint,
                #   release stamp, migration map, pack-aware shipped-doc links,
                #   public import snippets, contrast; behaviors / bindings /
                #   glyphs parity; color-policy, skins, charts, visual-baseline
                #   inventory, report + shipped HTML snippet integrity
npm test        # faster unit-only loop; already included in npm run check
npm run test:e2e:nonpixel
                # local-safe Playwright: chromium + firefox + webkit for every
                #   non-screenshot behavior/a11y/structural/print/motion spec
npm run test:examples
                # packs the real tarball, builds every example in a temp dir,
                #   then browser-smokes the runtime examples in Chromium
npm run test:examples:cross-browser
                # deeper packed smoke: every example in Chromium, Firefox,
                #   and WebKit; add `-- react-vite ...` to narrow locally
npm run test:examples:visual
                # local-safe desktop + mobile screenshot/layout health smoke
                #   for packed examples; this is not the committed
                #   Linux/Chromium baseline gate
```

`main` is protected: changes land via PR, squash-merged, with `check`
and `e2e` green and the branch up to date. Branches auto-delete on
merge.

New to the repo? **[docs/architecture.md → Repository layout](docs/architecture.md#repository-layout)**
classifies every top-level directory — which are hand-authored source, which
are **generated** (don't edit; a gate will revert you), and which are
**path-frozen published subpaths** (don't move; the path is the public import
specifier).

## Conventions

- **Surface has to pay rent.** A public class, token, behavior, schema,
  binding, CSS leaf, or docs path is accepted only when it makes the system
  clearer, safer, smaller, or more stable. Prefer a documented recipe over a
  new primitive until a real consumer proves the pattern repeats.
- **Default bundle is identity, not inventory.** `dist/bronto.css` owns the
  shared app/service identity: tokens, base, motion, navigation, site/content,
  primitives, forms, feedback, overlay, disclosure, tables, and app shell.
  Report, analytical, trust, renderer, workbench, and command surfaces stay
  opt-in unless they are genuinely universal application chrome.
- **Bronto owns visual grammar and narrow behavior, not product logic.** Do
  not add chart scales, data fetching, persistence, routing, action registries,
  workflow engines, virtualized grids, or framework component APIs. The host
  application owns domain state; Bronto may provide tokens, class contracts,
  pure geometry, and delegated accessibility glue.
- **Registries before hand lists.** When a change touches exports, shipped
  docs, CSS leaves, examples, behavior ownership, or generated artifacts,
  extend the local shared registry first and let checks consume it. A second
  bespoke list is a future drift bug unless there is a specific reason it
  cannot share the registry.
- **Conventional commits** for PR titles: `feat` / `fix` / `docs` /
  `ci` / `test` / `chore`, with `!` for breaking changes. Pre-1.0,
  breaking changes bump the **minor** (see README → Versioning).
- The CSS is the framework. New components are `.ui-*`, added to the
  `cls` registry in `classes/index.js` — `check-classes` enforces a
  bidirectional match with the stylesheet, and the `.d.ts` are
  **generated** (`npm run dts:build`) and drift-checked, so don't
  hand-edit `classes/index.d.ts` / `tokens/index.d.ts`.
- Token **values** live in `tokens/index.js` (`cssVars`) — the single source.
  The four `:root` palette blocks of `css/tokens.css` are **generated** from it
  (`npm run tokens:css:build`), so don't hand-edit them; edit `cssVars` and
  regenerate. The CSS-only presets (density / contrast / OLED) below the
  HAND-AUTHORED marker in `tokens.css` are hand-authored and preserved.
- Other generated artifacts (`dist/`, `tokens/index.json`,
  `tokens/tokens.dtcg.json`, the `.d.ts`) are committed; rebuild with
  `npm run prepack` and commit the result.
- Accessibility is a gate, not an afterthought: keyboard paths, both
  themes, RTL, forced-colors and reduced-motion are covered by the e2e
  axe suite. New interactive components need matching coverage.
- **A new report-relevant CSS leaf ships in the same PR as its routing
  row in `docs/reporting.md`** (the analytical-toolbox table). The hub is
  what an LLM consumer actually reads; a leaf with its own doc but no
  when-to-use row there is effectively undiscoverable.
- Every breaking change gets a **BREAKING** entry in `CHANGELOG.md`
  with a migration note. The changelog is hand-curated — keep it
  narrative and accurate. The version in `package.json` must map to a
  **dated** changelog heading (the `check:release` gate enforces this —
  a published version can never be left marked `unreleased`).

## Deprecation policy

From 0.3.1 onward, public surface (`.ui-*` classes, `data-bronto-*`
attributes, `cls`/token keys, behavior signatures) is removed on a
**deprecate-one-minor** cycle:

1. **Deprecate** in minor _N_: the surface keeps working unchanged, is
   marked deprecated in `CHANGELOG.md`, and — if it is a rename — an
   entry is added to [`MIGRATIONS.json`](MIGRATIONS.json) with a
   `safe`/`manual` classification.
2. **Remove** no earlier than minor _N+1_, with a **BREAKING** entry
   pointing at the migration.

**Exception — provably-unreferenced surface.** A token/class/attribute that
is consumed by **no** shipped CSS, component, behavior, or doc (verifiable by
repo-wide search) may be removed in a single minor with a **BREAKING** entry
and a one-line migration note, **skipping the deprecation window** — there is
no internal usage to wind down and the deprecation cycle exists to protect
working call-sites, of which there are none. This is the path taken for
`--orange` in 0.4.0 (an orphan hue; see the CHANGELOG and
`docs/adr/0001-color-system.md`). The `check:color-policy` gate now prevents a
new untiered hue from being added in the first place.

This makes "minor may break" predictable: a consumer who upgrades one
minor at a time always gets a working deprecation window and a
machine-readable rename map. The 0.2 → 0.3 cut predates this policy
(documented in `docs/migrations/0.2-to-0.3.md`).

## Browser floor

Recent-evergreen only — **Chrome/Edge 125+, Safari 18+, Firefox 129+**
(early–mid 2025). On top of the prior baseline (cascade layers, `:has()`,
`color-mix()`, logical properties, native `<dialog>`) this floor adds the
2026 interaction primitives the framework now builds on:
`@starting-style`, `transition-behavior: allow-discrete` (zero-JS
enter/exit transitions), `oklch()`/relative color, and `light-dark()`.
This is a deliberate, greenfield stance (see
[ADR-0002](docs/adr/0002-scope-and-2026-baseline.md)): the framework targets
the modern web platform and does **not** ship fallbacks below this floor —
pin an older tag if you need to. Features that aren't yet cross-engine
(View Transitions, scroll-driven animations, `interpolate-size`) are used
only as progressive enhancement and degrade to a static end-state.

## Visual baselines

Pixel snapshots (`test/e2e/__screenshots__`) are Linux/Chromium,
authored in the pinned Playwright container — **never regenerate them
on a dev machine** (cross-OS rasterisation differs). After an
intentional visual change, run the **“Update visual baselines”**
workflow (Actions → run `workflow_dispatch`); it rebuilds them in the
container and opens a PR with the new baselines.

For local browser regression work, use `npm run test:e2e:nonpixel`.
`npm run test:e2e` and `npm run test:e2e:chromium` include
`visual.spec.mjs`, so run them only in the pinned Playwright container
when the screenshot gate itself is the target. For a local authoritative
pixel check with Docker running, use `npm run test:e2e:visual:container`;
it mounts the current worktree into
`mcr.microsoft.com/playwright:v1.60.0-jammy` and runs the Chromium visual
spec there. Packed examples also have `npm run test:examples:visual`, which is
a local-safe desktop + mobile screenshot/layout health smoke; it does not
author or compare committed PNG baselines.

## Dependencies

The package has **zero runtime dependencies** and that is a feature —
don't add one. Dev dependencies and GitHub Actions are kept current by
Dependabot (grouped, weekly). `@playwright/test` is intentionally
**not** auto-bumped: it must stay in lockstep with the pinned
`mcr.microsoft.com/playwright` container image, so bump both together
in one deliberate PR.

## Release

Releases publish to npm and are tag-driven:

```bash
# bump version + lock, date the CHANGELOG section, re-pin doc/demo
# version literals (check:release / check:versions enforce this):
npm run release:prep -- X.Y.Z
# land on main, let CI go green, then:
git tag vX.Y.Z && git push origin vX.Y.Z
```

Before tagging a release candidate or stable release, leave a **Release
evidence** note in the PR/release record. It should name the packed-tarball
proof (`check:pack`, `check:consumer-surface`, `check:consumer-types`,
`check:examples`, plus `check:publint`/`check:attw` for npm metadata), any
default-bundle budget movement, and the downstream proof reached. For a 1.0
candidate, downstream proof means at least one real app, report, or tool was
upgraded against the packed tarball; record the consumer class, imported
surface, and result in public-safe terms, not private repo or product names. If
that downstream pass was not run, the release can still ship pre-1.0 but it is
not 1.0-ready.

**Prereleases (release candidates).** Tag a SemVer prerelease and it
publishes to the `next` dist-tag instead of `latest`, so consumers only
get it via `npm i @ponchia/ui@next`:

```bash
# package.json version must match, e.g. "0.4.0-rc.1". The base version's
# CHANGELOG section need only exist ("## Unreleased — 0.4.0" is fine) —
# only the final stable release must be dated.
git tag v0.4.0-rc.1 && git push origin v0.4.0-rc.1
```

The tag triggers `.github/workflows/release.yml`: `validate` (read-only
checks + tag↔version match), `e2e` (Playwright visual + a11y), **and**
`examples` (consumer build against the packed tarball) must all pass →
`publish-npm` → `release-notes`. **The npm publish is the gate** — a
failing check, e2e, or examples build means the version never reaches
npm, so consumers never resolve it. `publish-npm` then **pauses for a
manual approval** (the `npm-publish` Environment's required-reviewer
rule) — open the run in the Actions tab and click *Review deployments →
Approve* to release. Nothing reaches npm until you approve. GitHub also serves the raw tag
tarball ungated, but that is a legacy/fallback path, not the documented
install. Publishing runs `npm publish --ignore-scripts` with provenance
(SLSA); the `@ponchia` scope and the `NPM_TOKEN` secret (scoped to the
`npm-publish` Environment) are in place, so a pushed `vX.Y.Z` tag plus
your approval is all a release needs. CI never publishes
from a `main` push — a push to `main` ships nothing. Rationale and
pre-publish blockers: [`docs/architecture.md`](docs/architecture.md).
