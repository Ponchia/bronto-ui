<!-- @ponchia/ui - GENERATED from package.json by scripts/gen-package-contract.mjs.
     Do not edit by hand; run `npm run package-contract:build`.
     Drift-checked in CI through check:fresh. -->

# Package Contract

This is the manifest-facing contract for `@ponchia/ui`: every exported
subpath, every `files` allowlist entry, and the committed generated-artifact
pipeline. It complements [stability.md](./stability.md), which defines the
semantic versioning contract for the surfaces listed here.

## Contract Summary

| Surface group | Stability | Contract |
| --- | --- | --- |
| CSS root and `dist/bronto.css` | Stable | CSS-only default bundle. CSS side-effect imports are supported in CSS-aware bundlers; Node/runtime JS root imports are not. |
| CSS leaves | Stable additive | Direct leaves are generated as layered `dist/css/*.css` exports; raw unlayered source leaves are explicit escape hatches under `./css/unlayered/*`. |
| JS subpaths | Stable | ESM-only public subpaths. Runtime behavior is SSR-safe and dependency-free unless a framework binding declares an optional peer. |
| Machine-readable data | Stable additive | JSON/data exports are for non-JS hosts, validators, renderers, and offline agents. Additive fields are allowed within a compatible minor. |
| Shipped docs | Stable paths | Curated Markdown/text docs ship inside the npm tarball for offline readers. Generated docs are regenerated and drift-checked. |
| Fonts | Stable path pattern | Doto assets ship under `fonts/*` with their OFL license. |
| Repo tooling, demos, tests, examples, workflows | Internal | Useful for development and learning, but not shipped runtime API unless a path is explicitly exported below. |

## Export Matrix

| Export | Target | Group | Stability | Contract |
| --- | --- | --- | --- | --- |
| `.` | style: `./dist/bronto.css`<br>default: `./dist/bronto.css` | CSS root bundle | Stable | CSS-only package root. Supported as a CSS side-effect import in CSS-aware bundlers; not a Node/runtime JS entrypoint. |
| `./dist/bronto.css` | `./dist/bronto.css` | Flattened CSS bundle | Stable path | The prebuilt default stylesheet. Generated from css/core.css and byte-checked by check:dist. |
| `./tailwind` | `./tailwind.css` | Tailwind CSS bridge | Stable additive | CSS-only Tailwind v4 theme/variant bridge. It maps Bronto tokens into Tailwind namespaces; it does not import component CSS. |
| `./tailwind.css` | `./tailwind.css` | Tailwind CSS bridge | Stable additive | CSS-only Tailwind v4 theme/variant bridge. It maps Bronto tokens into Tailwind namespaces; it does not import component CSS. |
| `./css` | `./css/core.css` | CSS source fan-out | Stable path | Bundler entrypoint for css/core.css. It preserves source @import boundaries and layer behavior. |
| `./css/core.css` | `./css/core.css` | CSS source fan-out | Stable path | Source fan-out file for consumers that want the authored leaf graph through a bundler. |
| `./css/tokens.css` | `./dist/css/tokens.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/fonts.css` | `./dist/css/fonts.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/base.css` | `./dist/css/base.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/motion.css` | `./dist/css/motion.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/dots.css` | `./dist/css/dots.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/navigation.css` | `./dist/css/navigation.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/site.css` | `./dist/css/site.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/content.css` | `./dist/css/content.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/primitives.css` | `./dist/css/primitives.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/forms.css` | `./dist/css/forms.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/feedback.css` | `./dist/css/feedback.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/overlay.css` | `./dist/css/overlay.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/disclosure.css` | `./dist/css/disclosure.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/table.css` | `./dist/css/table.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/app.css` | `./dist/css/app.css` | Bundled layered CSS leaf | Stable additive | Generated layered direct-import leaf. Also included in dist/bronto.css. |
| `./css/skins.css` | `./dist/css/skins.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/dataviz.css` | `./dist/css/dataviz.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/report.css` | `./dist/css/report.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/figure.css` | `./dist/css/figure.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/annotations.css` | `./dist/css/annotations.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/legend.css` | `./dist/css/legend.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/marks.css` | `./dist/css/marks.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/connectors.css` | `./dist/css/connectors.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/spotlight.css` | `./dist/css/spotlight.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/crosshair.css` | `./dist/css/crosshair.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/selection.css` | `./dist/css/selection.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/sources.css` | `./dist/css/sources.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/interval.css` | `./dist/css/interval.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/clamp.css` | `./dist/css/clamp.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/highlights.css` | `./dist/css/highlights.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/diff.css` | `./dist/css/diff.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/code.css` | `./dist/css/code.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/spark.css` | `./dist/css/spark.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/sidenote.css` | `./dist/css/sidenote.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/textref.css` | `./dist/css/textref.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/bullet.css` | `./dist/css/bullet.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/term.css` | `./dist/css/term.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/toc.css` | `./dist/css/toc.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/tree.css` | `./dist/css/tree.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/state.css` | `./dist/css/state.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/generated.css` | `./dist/css/generated.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/workbench.css` | `./dist/css/workbench.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/command.css` | `./dist/css/command.css` | Opt-in layered CSS leaf | Stable additive | Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css. |
| `./css/analytical.css` | `./dist/css/analytical.css` | Opt-in CSS roll-up | Stable additive | Generated layered roll-up of the analytical leaves. Not included in the default bundle. |
| `./css/report-kit.css` | `./dist/css/report-kit.css` | Opt-in CSS roll-up | Stable additive | Generated layered roll-up for complete static reports. Not included in the default bundle. |
| `./css/unlayered/tokens.css` | `./css/tokens.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/fonts.css` | `./css/fonts.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/base.css` | `./css/base.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/motion.css` | `./css/motion.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/dots.css` | `./css/dots.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/navigation.css` | `./css/navigation.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/site.css` | `./css/site.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/content.css` | `./css/content.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/primitives.css` | `./css/primitives.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/forms.css` | `./css/forms.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/feedback.css` | `./css/feedback.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/overlay.css` | `./css/overlay.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/disclosure.css` | `./css/disclosure.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/table.css` | `./css/table.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/app.css` | `./css/app.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/skins.css` | `./css/skins.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/dataviz.css` | `./css/dataviz.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/report.css` | `./css/report.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/figure.css` | `./css/figure.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/annotations.css` | `./css/annotations.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/legend.css` | `./css/legend.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/marks.css` | `./css/marks.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/connectors.css` | `./css/connectors.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/spotlight.css` | `./css/spotlight.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/crosshair.css` | `./css/crosshair.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/selection.css` | `./css/selection.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/sources.css` | `./css/sources.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/interval.css` | `./css/interval.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/clamp.css` | `./css/clamp.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/highlights.css` | `./css/highlights.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/diff.css` | `./css/diff.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/code.css` | `./css/code.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/spark.css` | `./css/spark.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/sidenote.css` | `./css/sidenote.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/textref.css` | `./css/textref.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/bullet.css` | `./css/bullet.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/term.css` | `./css/term.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/toc.css` | `./css/toc.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/tree.css` | `./css/tree.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/state.css` | `./css/state.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/generated.css` | `./css/generated.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/workbench.css` | `./css/workbench.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./css/unlayered/command.css` | `./css/command.css` | Unlayered CSS leaf | Stable path | Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf. |
| `./tokens` | types: `./tokens/index.d.ts`<br>default: `./tokens/index.js` | Design tokens JS | Stable names/roles | ESM token registry and helpers. Token names and documented roles are public; exact values may tune before 1.0. |
| `./vscode.css-custom-data.json` | `./classes/vscode.css-custom-data.json` | Machine-readable data | Stable additive | JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal. |
| `./tokens.json` | `./tokens/index.json` | Machine-readable data | Stable additive | JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal. |
| `./tokens.dtcg.json` | `./tokens/tokens.dtcg.json` | Machine-readable data | Stable additive | JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal. |
| `./tokens/resolved.json` | `./tokens/resolved.json` | Machine-readable data | Stable additive | JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal. |
| `./tokens/figma.variables.json` | `./tokens/figma.variables.json` | Machine-readable data | Stable additive | JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal. |
| `./shiki/nothing.json` | `./shiki/nothing.json` | Machine-readable data | Stable additive | JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal. |
| `./llms.txt` | `./llms.txt` | Agent entrypoint | Stable path | Plain-text orientation file shipped for offline agents and tooling. |
| `./MIGRATIONS.json` | `./MIGRATIONS.json` | Machine-readable data | Stable additive | JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal. |
| `./schemas/report-claims.v1.schema.json` | `./schemas/report-claims.v1.schema.json` | Machine-readable data | Stable additive | JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal. |
| `./docs/architecture.md` | `./docs/architecture.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/reference.md` | `./docs/reference.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/theming.md` | `./docs/theming.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/contrast.md` | `./docs/contrast.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/stability.md` | `./docs/stability.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/package-contract.md` | `./docs/package-contract.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/usage.md` | `./docs/usage.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/frontier-primitives.md` | `./docs/frontier-primitives.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/reporting.md` | `./docs/reporting.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/dots.md` | `./docs/dots.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/glyphs.md` | `./docs/glyphs.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/mermaid.md` | `./docs/mermaid.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/d2.md` | `./docs/d2.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/vega.md` | `./docs/vega.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/figure.md` | `./docs/figure.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/annotations.md` | `./docs/annotations.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/legends.md` | `./docs/legends.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/marks.md` | `./docs/marks.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/connectors.md` | `./docs/connectors.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/spotlight.md` | `./docs/spotlight.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/crosshair.md` | `./docs/crosshair.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/selection.md` | `./docs/selection.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/sources.md` | `./docs/sources.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/interval.md` | `./docs/interval.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/clamp.md` | `./docs/clamp.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/highlights.md` | `./docs/highlights.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/diff.md` | `./docs/diff.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/code.md` | `./docs/code.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/spark.md` | `./docs/spark.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/sidenote.md` | `./docs/sidenote.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/textref.md` | `./docs/textref.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/bullet.md` | `./docs/bullet.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/term.md` | `./docs/term.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/toc.md` | `./docs/toc.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/tree.md` | `./docs/tree.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/state.md` | `./docs/state.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/generated.md` | `./docs/generated.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/workbench.md` | `./docs/workbench.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/command.md` | `./docs/command.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/interop/tailwind.md` | `./docs/interop/tailwind.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/migrations/0.2-to-0.3.md` | `./docs/migrations/0.2-to-0.3.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/migrations/0.3-to-0.4.md` | `./docs/migrations/0.3-to-0.4.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/migrations/0.4-to-0.5.md` | `./docs/migrations/0.4-to-0.5.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/migrations/0.5-to-0.6.md` | `./docs/migrations/0.5-to-0.6.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/adr/0001-color-system.md` | `./docs/adr/0001-color-system.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/adr/0002-scope-and-2026-baseline.md` | `./docs/adr/0002-scope-and-2026-baseline.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./docs/adr/0003-theme-model.md` | `./docs/adr/0003-theme-model.md` | Shipped documentation | Stable path | Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor. |
| `./classes` | types: `./classes/index.d.ts`<br>default: `./classes/index.js` | Class recipes JS | Stable | ESM class registry, recipes, attrs helpers, and cx joiner. The emitted class vocabulary is public. |
| `./classes.json` | `./classes/classes.json` | Machine-readable data | Stable additive | JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal. |
| `./behaviors` | types: `./behaviors/index.d.ts`<br>default: `./behaviors/index.js` | Vanilla behavior JS | Stable | ESM, SSR-safe, cleanup-returning behavior initializers. Behavior internals are not public. |
| `./glyphs` | types: `./glyphs/glyphs.d.ts`<br>default: `./glyphs/glyphs.js` | Geometry/render helper JS | Stable additive | ESM helper surface. Function names, options, and data shapes are public; rendering heuristics may tune. |
| `./annotations` | types: `./annotations/index.d.ts`<br>default: `./annotations/index.js` | Geometry/render helper JS | Stable additive | ESM helper surface. Function names, options, and data shapes are public; rendering heuristics may tune. |
| `./connectors` | types: `./connectors/index.d.ts`<br>default: `./connectors/index.js` | Geometry/render helper JS | Stable additive | ESM helper surface. Function names, options, and data shapes are public; rendering heuristics may tune. |
| `./react` | types: `./react/index.d.ts`<br>default: `./react/index.js` | Framework binding JS | Stable thin adapter | Optional peer wrapper over vanilla behaviors. It owns lifecycle hookup, not markup or component state. |
| `./solid` | types: `./solid/index.d.ts`<br>default: `./solid/index.js` | Framework binding JS | Stable thin adapter | Optional peer wrapper over vanilla behaviors. It owns lifecycle hookup, not markup or component state. |
| `./qwik` | types: `./qwik/index.d.ts`<br>default: `./qwik/index.js` | Framework binding JS | Stable thin adapter | Optional peer wrapper over vanilla behaviors. It owns lifecycle hookup, not markup or component state. |
| `./svelte` | types: `./svelte/index.d.ts`<br>default: `./svelte/index.js` | Framework binding JS | Stable thin adapter | Optional peer wrapper over vanilla behaviors. It owns lifecycle hookup, not markup or component state. |
| `./vue` | types: `./vue/index.d.ts`<br>default: `./vue/index.js` | Framework binding JS | Stable thin adapter | Optional peer wrapper over vanilla behaviors. It owns lifecycle hookup, not markup or component state. |
| `./skins` | types: `./tokens/skins.d.ts`<br>default: `./tokens/skins.js` | Renderer/theme helper JS | Stable additive | ESM theme data/helpers for opt-in skins, chart palettes, and external renderers. |
| `./charts` | types: `./tokens/charts.d.ts`<br>default: `./tokens/charts.js` | Renderer/theme helper JS | Stable additive | ESM theme data/helpers for opt-in skins, chart palettes, and external renderers. |
| `./charts.json` | `./tokens/charts.json` | Machine-readable data | Stable additive | JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal. |
| `./mermaid` | types: `./tokens/mermaid.d.ts`<br>default: `./tokens/mermaid.js` | Renderer/theme helper JS | Stable additive | ESM theme data/helpers for opt-in skins, chart palettes, and external renderers. |
| `./mermaid.json` | `./tokens/mermaid.json` | Machine-readable data | Stable additive | JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal. |
| `./d2` | types: `./tokens/d2.d.ts`<br>default: `./tokens/d2.js` | Renderer/theme helper JS | Stable additive | ESM theme data/helpers for opt-in skins, chart palettes, and external renderers. |
| `./d2.json` | `./tokens/d2.json` | Machine-readable data | Stable additive | JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal. |
| `./vega` | types: `./tokens/vega.d.ts`<br>default: `./tokens/vega.js` | Renderer/theme helper JS | Stable additive | ESM theme data/helpers for opt-in skins, chart palettes, and external renderers. |
| `./vega.json` | `./tokens/vega.json` | Machine-readable data | Stable additive | JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal. |
| `./fonts/*` | `./fonts/*` | Vendored font asset glob | Stable path pattern | Doto font files and license. Font file names are shipped assets, not JS APIs. |

## Shipped Files Allowlist

`package.json` controls the npm tarball with this `files` list. npm also
always includes `package.json`, `README.md`, `LICENSE`, and
`CHANGELOG.md`; `check:pack` verifies no dev-only path leaks.

| Path | Kind | Contract |
| --- | --- | --- |
| `css` | Source CSS directory | Public source leaves. Mostly hand-authored; generated exceptions are called out in the provenance table. |
| `dist` | Generated CSS directory | Prebuilt layered bundle and leaves. Never hand-edit. |
| `tailwind.css` | Tailwind CSS bridge | CSS-only Tailwind v4 theme/variant bridge; hand-authored and not part of the default Bronto bundle. |
| `fonts` | Vendored assets | Doto woff2 files plus OFL license. |
| `tokens` | Mixed source/generated data | Token source plus generated JSON, declarations, and renderer theme data. |
| `classes` | Mixed source/generated data | Class recipe source plus generated JSON/declarations/custom-data. |
| `behaviors` | Authored public JS directory | ESM source shipped as-is; adjacent declarations/maps are generated. |
| `glyphs` | Authored public JS directory | Glyph registry/renderers shipped as JS; declarations are generated. |
| `schemas` | Machine-readable schemas | Declarative JSON schemas for package-adjacent report/tooling contracts. |
| `annotations` | Authored public JS directory | ESM source shipped as-is; adjacent declarations/maps are generated. |
| `connectors` | Authored public JS directory | ESM source shipped as-is; adjacent declarations/maps are generated. |
| `react` | Authored public JS directory | ESM source shipped as-is; adjacent declarations/maps are generated. |
| `solid` | Authored public JS directory | ESM source shipped as-is; adjacent declarations/maps are generated. |
| `qwik` | Authored public JS directory | ESM source shipped as-is; adjacent declarations/maps are generated. |
| `svelte` | Authored public JS directory | ESM source shipped as-is; adjacent declarations/maps are generated. |
| `vue` | Authored public JS directory | ESM source shipped as-is; adjacent declarations/maps are generated. |
| `shiki` | Theme data | Shiki theme JSON on the governed palette. |
| `llms.txt` | Agent entrypoint | Shipped plain-text orientation for offline LLM/agent consumers. |
| `CHANGELOG.md` | Release record | Shipped historical release notes. |
| `MIGRATIONS.json` | Migration data | Shipped rename/migration map for tooling. |
| `docs/architecture.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/reference.md` | Generated documentation | Committed generated doc; never hand-edit. |
| `docs/theming.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/contrast.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/stability.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/package-contract.md` | Generated documentation | Committed generated doc; never hand-edit. |
| `docs/usage.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/frontier-primitives.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/reporting.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/dots.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/glyphs.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/mermaid.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/d2.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/vega.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/figure.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/annotations.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/legends.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/marks.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/connectors.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/spotlight.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/crosshair.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/selection.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/sources.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/interval.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/clamp.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/highlights.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/diff.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/code.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/spark.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/sidenote.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/textref.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/bullet.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/term.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/toc.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/tree.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/state.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/generated.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/workbench.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/command.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/interop/tailwind.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/migrations/0.2-to-0.3.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/migrations/0.3-to-0.4.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/migrations/0.4-to-0.5.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/migrations/0.5-to-0.6.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/adr/0001-color-system.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/adr/0002-scope-and-2026-baseline.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |
| `docs/adr/0003-theme-model.md` | Shipped documentation | Curated Markdown reading asset shipped in the npm tarball. |

## Artifact Provenance

Generated files are committed so the package can publish without a consumer-side
build step. Edit the source of truth, run the listed generator, and commit the
result. The listed gates are part of `npm run check`.

| Surface | Source of truth | Generated outputs | Generator | Gate | Note |
| --- | --- | --- | --- | --- | --- |
| Package manifest | `package.json` | docs/package-contract.md | `npm run package-contract:build` | check:fresh; check:exports; check:pack; check:consumer-surface; check:consumer-types; check:publint; check:attw | The complete export/file matrix in this document is generated from the manifest; packed tarball imports, concrete file resolution, and package-level type resolution are smoke-tested in clean consumers. |
| Token model | `tokens/index.js` | css/tokens.css; tokens/index.json; tokens/tokens.dtcg.json; tokens/resolved.json; tokens/figma.variables.json; tokens/index.d.ts | `npm run tokens:css:build; tokens:build; dtcg:build; resolved:build; figma:variables:build; dts:build` | check:fresh; check:contrast | Token names/roles are public. Resolved and Figma handoff values are visual tuning before 1.0. |
| Class registry | `classes/index.js plus css/*.css selectors` | classes/classes.json; classes/index.d.ts; classes/vscode.css-custom-data.json; docs/reference.md | `npm run classes:json:build; dts:build; vscode:build; reference:build` | check:fresh; check:classes; check:contract | The typed registry, JSON vocabulary, and generated reference stay aligned with real selectors. |
| Authored CSS graph | `css/core.css plus css/*.css leaves` | dist/bronto.css; dist/css/*.css (46 layered outputs) | `npm run dist:build` | check:dist; check:exports; check:component-matrix | Default bundle and direct layered leaf imports are generated from authored CSS, size-gated, and coverage-owned as foundation or component leaves. |
| JSDoc-authored public JS | `behaviors/; annotations/; connectors/; react/; solid/; qwik/; svelte/; vue/` | adjacent *.d.ts and *.d.ts.map files | `npm run dts:emit` | check:dts-emit; check:types; check:consumer-surface; check:consumer-types; check:behavior-matrix; check:attw; check:publint | Declarations are emitted from the shipped JS, package subpath imports are compiled from a packed clean consumer, and public behavior exports are docs/unit/browser owned. |
| Glyph registry | `glyphs/glyphs.js` | glyphs/glyphs.d.ts | `npm run glyphs:build` | check:glyphs; check:unit | Glyph names and render options are public. The registry stays sorted and type-covered. |
| Display colorways | `tokens/skins.js` | css/skins.css; tokens/skins.d.ts | `npm run skins:build` | check:skins; check:contrast | Skins are opt-in root-level choices and never part of dist/bronto.css. |
| Chart palette | `tokens/charts.js` | css/dataviz.css; tokens/charts.json; tokens/charts.d.ts | `npm run charts:build` | check:charts | Data-viz colors are opt-in, CVD-gated, and never UI chrome. |
| External renderer themes | `tokens/mermaid.js; tokens/d2.js; tokens/vega.js` | tokens/{mermaid,d2,vega}.{js,json,d.ts} | `npm run mermaid:build; d2:build; vega:build` | check:mermaid; check:d2; check:vega; check:unit | Renderer configs use resolved colors because the external renderers cannot consume CSS variables directly; unit tests prove helper defaults and Vega render landing. |
| Contrast report | `tokens/resolved.json; tokens/skins.js; tokens/charts.js` | docs/contrast.md | `npm run contrast:build` | check:contrast | WCAG floors are hard-gated; APCA is reported as advisory. |

## Internal Paths

These paths are intentionally not part of the npm runtime surface:
`scripts/`, `demo/`, `test/`, `examples/`, `.github/`, local config
files, visual baselines, and development-only audit artifacts. They may change
without a package-level compatibility promise.
