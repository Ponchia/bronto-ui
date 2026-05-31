# Security Policy

## Supported versions

`@ponchia/ui` is pre-1.0; only the latest published minor receives
fixes. Breaking changes ship in the minor (see the Versioning section of
the README).

| Version | Supported |
| ------- | --------- |
| 0.4.x   | ✅        |
| < 0.4   | ❌        |

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Use GitHub's private vulnerability reporting:
**Security → Report a vulnerability**
(<https://github.com/Ponchia/bronto-ui/security/advisories/new>).

You'll get an acknowledgement within a few days. Fixes are released as a
new patch/minor and noted in `CHANGELOG.md`.

## Attack surface

The package ships **zero runtime dependencies** — it is CSS plus
optional dependency-free, side-effect-free-on-import, SSR-safe vanilla
JS (`tokens` / `classes` / `behaviors` / `glyphs` / `skins` /
`charts`). The `react` and `solid` subpaths are optional lifecycle
bindings over the same behavior layer and require their matching
optional peer only when imported.

Behaviors assume trusted application markup. Do not initialize them over
untrusted user/CMS HTML unless you have sanitized that markup and are
comfortable with its `data-bronto-*`, `aria-controls`, and `id`
relationships controlling elements inside the delegated root.

The `.ui-icon` glyph mask renderer uses an inline CSS `data:` URL. If
your app ships a strict CSP and uses `renderGlyph(..., { render:
'mask' })`, allow the required inline style/custom-property path and
`data:` mask/image source, or use the DOM dot/solid renderers instead.

Releases are published from a gated CI pipeline with npm provenance
(SLSA), every GitHub Action is pinned to a commit SHA, and the publish
step runs with `--ignore-scripts`. The realistic project surface is
supply-chain (dev dependencies, Actions, docs-site CDN dependencies) —
kept current via Dependabot and locked CI.
