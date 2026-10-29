# Contributing

Thanks for helping. `@ponchia/ui` is a CSS-first, framework-agnostic UI
framework consumed by several apps, so the contract (token names, the
`--accent` derivation, `.ui-*` class names, `data-bronto-*` attributes,
behavior return contracts) is treated as load-bearing and is
machine-checked.

## Setup

Use **Node.js 22.23.4 or a newer 22.x release** and npm, matching CI.
The locked development dependencies require this minimum; the published
package's Node engine floor is separate from the development toolchain.

```bash
git clone https://github.com/Ponchia/bronto-ui.git
cd bronto-ui
npm ci
npm run check
```

`npm run check` runs all `check:*` scripts, including unit tests, lint and
format checks, public imports and package exports, generated-artifact freshness,
consumer contracts, documentation links and recipes, accessibility contrast,
and the complexity budget. It reports every failed gate; use `-- --bail` to
stop at the first failure. To retain every gate's duration and outcome, use
`npm run check -- --report=/absolute/path/checks.json`. The parent directory must
exist. The report records each gate as passed, failed, interrupted or not run,
and is updated as the serial run progresses. It is measurement evidence, not a
cached success or a different gate selection. The detailed gate map is in
[architecture.md](docs/architecture.md#drift-control).

`npm run check:attw` checks the existing release artifacts before packaging them
without lifecycle scripts into a temporary directory. It checks that exact
tarball and removes it afterward; stale artifacts fail rather than being rebuilt
during validation. Use `npm run prepack` to regenerate intentionally. The real
publication lifecycle still runs its full build and artifact verification.

Choose additional verification for the surface you changed:

| Command | What it checks |
| --- | --- |
| `npm test` | Faster unit and contract test loop; also included in `npm run check`. |
| `npm run test:e2e:nonpixel` | Chromium, Firefox, and WebKit behavior, accessibility, layout, print, and motion checks without platform-sensitive pixel comparisons. |
| `npm run test:examples` | Builds the packed package in every maintained consumer example, then runs Chromium browser smokes. |
| `npm run test:examples:cross-browser` | Packed example smokes in Chromium, Firefox, and WebKit; append `-- react-vite` to narrow locally. |
| `npm run test:examples:visual` | Desktop and mobile screenshot/layout health checks for packed examples; does not update committed baselines. |
| `npm run site:build` and `npm run check:site` | Builds and validates the published website, documentation, example routes, and browser module graph. |

Install the Playwright browsers and their system dependencies before the
first local browser run:

```bash
npx playwright install --with-deps chromium firefox webkit
```

See **Visual baselines** below before running screenshot comparisons. The
reusable CI browser workflow retains failed-attempt traces, screenshots, and
reports when a job fails or a test passes on retry; these remain available in
the run's artifacts for seven days.

`main` is protected. Changes land through a PR, squash-merged with the branch
up to date and the required **`ci-gate`** status green. That aggregate verifies
`check`, `e2e`, `examples`, `layout`, and successful `sast` execution, including
the workflow's documented handling of docs-only changes. Semgrep blocks new or
changed findings: the only accepted results are the explicitly reviewed,
source-hash-bound entries in the tooling baseline. An unavailable or broken
scanner also fails the required gate. See the
[CI tooling guide](.github/tooling/README.md) before reviewing a baseline
change. Branches auto-delete on merge.

New to the repo? Start with **[docs/repository-map.md](docs/repository-map.md)**
for edit points and regeneration targets, then use
**[docs/adding-a-primitive.md](docs/adding-a-primitive.md)** before adding public
surface. **[docs/architecture.md → Repository layout](docs/architecture.md#repository-layout)**
has the deeper layout rationale, including which paths are **generated** (don't
edit; a gate will revert you) and which are **path-frozen published subpaths**
(don't move; the path is the public import specifier).

## Conventions

- **Public surface is admitted by task evidence.** Show the task, the current
  difficulty, and how the proposed composition improves it. A named consumer
  with a hand-built duplicate is useful evidence, not a prerequisite. Prefer
  an existing recipe to a new primitive. Package examples prove compatibility.
- **Surface has to pay rent.** A public class, token, behavior, schema,
  helper, CSS leaf, or docs path is accepted only when it makes the system
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

## Commit attribution

Commits must identify the person or automation that actually authored them.
For maintainer-directed changes (including coding-agent-assisted work), use
Zeno Trevisan's GitHub-linked identity `Ponchia@users.noreply.github.com`
and open the PR as `@Ponchia`. AI assistants are development tools, not
additional authors: do not add `Co-authored-by` trailers for Claude, Codex,
or other AI assistants. Credit actual human collaborators when applicable.

Dependabot and GitHub Actions may propose changes under their own identities.
To keep the active project history maintainer-authored, review and integrate
accepted automated changes on a maintainer-created branch and PR. Reference
and close the original bot PR rather than merging a bot-authored PR directly;
never impersonate the maintainer in unattended automation. Retain meaningful
source and security-review references.

The active history was consolidated for maintainer attribution in October 2026.
Original automation is identified in the relevant commit messages, while
published release tags retain their original commits and provenance.

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

**Exception — provably-unreferenced surface.** The policy allows an unused
token/class/attribute to be removed in a minor with a **BREAKING** entry and
migration note. `--orange` in 0.4.0 used this exception (see the CHANGELOG and
`docs/adr/0001-color-system.md`). Before invoking it again, document both the
repository search and the downstream usage evidence. No references in shipped
CSS, behaviors, or docs proves only that the package itself does not use the
surface; it does not prove that external consumers have no working call-sites.
If downstream absence cannot be established, use the normal deprecation window.

A consumer upgrading one minor at a time gets the normal deprecation window;
any exception must be explicit in the changelog. Machine-actionable renames
also have a migration-map entry. The 0.2 → 0.3 cut predates this policy
(documented in `docs/migrations/0.2-to-0.3.md`).

## Browser floor

The supported floor is **Chrome/Edge 125+, Safari 18+, Firefox 129+**.
Core CSS uses cascade layers, `:has()`, `color-mix()`, logical properties,
and native dialog/popover primitives. Browsers below the floor are unsupported;
an older package tag is not a general compatibility guarantee.

Features such as View Transitions, scroll-driven animations, intrinsic-size
transitions, and anchor positioning are progressive enhancements. Keep
essential content and interactions usable when an enhancement is unavailable.
See [ADR-0002](docs/adr/0002-scope-and-2026-baseline.md) for the platform policy.

The complete browser suite runs in three CI shards. Every shard remains
required by `ci-gate`; sharding changes feedback time, not coverage.

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

The release CLI has a separate integrity-locked tooling project, and Semgrep
runs from an image pinned by digest. Their update procedures and the scanner's
current upstream rule feed are documented in the
[CI tooling guide](.github/tooling/README.md).

## Release

A release follows a deletion: cut one when a consumer change is ready to delete
what it replaces ([roadmap](ROADMAP.md#investment-test)). Releases publish to
npm and are tag-driven:

```bash
# bump version + lock root metadata (no dependency resolution), date CHANGELOG,
# re-pin doc/demo
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

**Older stable releases.** `latest` only moves forward. A stable tag below
the registry's current `latest`, such as a backport or an older release
re-run after a newer one published, goes to `maint-<major>.<minor>` (for
example `npm i @ponchia/ui@maint-0.17`) and is not marked as the Latest
GitHub Release. `scripts/release-dist-tag.mjs` makes that choice in
`publish-npm`, which fails rather than publishes when the registry lookup
does not answer.

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
(SLSA) and authenticates by **trusted publishing (OIDC)** — no stored npm
token, nothing to expire. npm mints a short-lived credential only for a run
of `release.yml` in the `npm-publish` Environment, so a pushed `vX.Y.Z` tag
plus your approval is all a release needs
([ADR-0006](docs/adr/0006-trusted-publishing.md) has the rationale, and the
npm-side registration this identity depends on). CI never publishes
a package from a `main` push. Successful main CI deploys the website through
Pages; a package release requires its own version tag and approval. Rationale
and pre-publish blockers: [`docs/architecture.md`](docs/architecture.md).
