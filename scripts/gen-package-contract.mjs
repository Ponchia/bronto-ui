/**
 * Generate docs/package-contract.md from package.json plus a small set of
 * curated classification rules. This is the manifest-facing companion to
 * docs/stability.md:
 *
 *   docs/package-contract.md <- package.json exports/files + artifact map
 *
 * The exhaustive export/file tables are generated so the public package
 * surface cannot drift from the prose. Drift-checked by check:fresh.
 *
 * Run: node scripts/gen-package-contract.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EXTRA_LEAVES, leafFiles } from './build-dist.mjs';
import { isMain, repoRoot as root, writeGenerated } from './lib/emit.mjs';

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const coreLeaves = new Set(leafFiles());
const optInLeaves = new Set(EXTRA_LEAVES);

const code = (value) => `\`${String(value).replaceAll('`', '\\`')}\``;
const cell = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');
const sentence = (value) => cell(value);

function targetCell(value) {
  if (typeof value === 'string') return code(value);
  return Object.entries(value)
    .map(([condition, target]) => `${condition}: ${code(target)}`)
    .join('<br>');
}

function cssLeafName(key) {
  const m = key.match(/^\.\/css\/(?:unlayered\/)?(.+\.css)$/);
  return m?.[1] ?? null;
}

function exportClass(key) {
  if (key === '.') {
    return [
      'CSS root bundle',
      'Stable',
      'CSS-only package root. Supported as a CSS side-effect import in CSS-aware bundlers; not a Node/runtime JS entrypoint.',
    ];
  }
  if (key === './dist/bronto.css') {
    return [
      'Flattened CSS bundle',
      'Stable path',
      'The prebuilt default stylesheet. Generated from css/core.css and byte-checked by check:dist.',
    ];
  }
  if (key === './css') {
    return [
      'CSS source fan-out',
      'Stable path',
      'Bundler entrypoint for css/core.css. It preserves source @import boundaries and layer behavior.',
    ];
  }
  if (key === './css/core.css') {
    return [
      'CSS source fan-out',
      'Stable path',
      'Source fan-out file for consumers that want the authored leaf graph through a bundler.',
    ];
  }
  if (key.startsWith('./css/unlayered/')) {
    return [
      'Unlayered CSS leaf',
      'Stable path',
      'Raw authored CSS leaf for consumers that deliberately opt out of @layer bronto on that leaf.',
    ];
  }
  if (key.startsWith('./css/')) {
    const leaf = cssLeafName(key);
    const bundled = leaf && coreLeaves.has(leaf);
    const optIn = leaf && optInLeaves.has(leaf);
    if (key === './css/analytical.css') {
      return [
        'Opt-in CSS roll-up',
        'Stable additive',
        'Generated layered roll-up of the analytical leaves. Not included in the default bundle.',
      ];
    }
    return [
      bundled ? 'Bundled layered CSS leaf' : optIn ? 'Opt-in layered CSS leaf' : 'Layered CSS leaf',
      'Stable additive',
      bundled
        ? 'Generated layered direct-import leaf. Also included in dist/bronto.css.'
        : 'Generated layered direct-import leaf. Opt-in and not included in dist/bronto.css.',
    ];
  }
  if (key === './tokens') {
    return [
      'Design tokens JS',
      'Stable names/roles',
      'ESM token registry and helpers. Token names and documented roles are public; exact values may tune before 1.0.',
    ];
  }
  if (key === './classes') {
    return [
      'Class recipes JS',
      'Stable',
      'ESM class registry, recipes, attrs helpers, and cx joiner. The emitted class vocabulary is public.',
    ];
  }
  if (key === './behaviors') {
    return [
      'Vanilla behavior JS',
      'Stable',
      'ESM, SSR-safe, cleanup-returning behavior initializers. Behavior internals are not public.',
    ];
  }
  if (['./react', './solid', './qwik'].includes(key)) {
    return [
      'Framework binding JS',
      'Stable thin adapter',
      'Optional peer wrapper over vanilla behaviors. It owns lifecycle hookup, not markup or component state.',
    ];
  }
  if (['./glyphs', './annotations', './connectors'].includes(key)) {
    return [
      'Geometry/render helper JS',
      'Stable additive',
      'ESM helper surface. Function names, options, and data shapes are public; rendering heuristics may tune.',
    ];
  }
  if (['./skins', './charts', './mermaid', './d2', './vega'].includes(key)) {
    return [
      'Renderer/theme helper JS',
      'Stable additive',
      'ESM theme data/helpers for opt-in skins, chart palettes, and external renderers.',
    ];
  }
  if (key.endsWith('.json')) {
    return [
      'Machine-readable data',
      'Stable additive',
      'JSON package data for non-JS/tooling consumers. Shape is public unless the paired doc marks a field internal.',
    ];
  }
  if (key === './llms.txt') {
    return [
      'Agent entrypoint',
      'Stable path',
      'Plain-text orientation file shipped for offline agents and tooling.',
    ];
  }
  if (key.startsWith('./docs/')) {
    return [
      'Shipped documentation',
      'Stable path',
      'Markdown documentation shipped in the tarball. Paths are public reading assets within a compatible minor.',
    ];
  }
  if (key === './fonts/*') {
    return [
      'Vendored font asset glob',
      'Stable path pattern',
      'Doto font files and license. Font file names are shipped assets, not JS APIs.',
    ];
  }
  return [
    'Package subpath',
    'Public',
    'Exported package subpath. See docs/stability.md for semantic stability.',
  ];
}

function fileClass(path) {
  if (path === 'css') {
    return [
      'Source CSS directory',
      'Public source leaves. Mostly hand-authored; generated exceptions are called out in the provenance table.',
    ];
  }
  if (path === 'dist') {
    return ['Generated CSS directory', 'Prebuilt layered bundle and leaves. Never hand-edit.'];
  }
  if (path === 'fonts') {
    return ['Vendored assets', 'Doto woff2 files plus OFL license.'];
  }
  if (path === 'tokens') {
    return [
      'Mixed source/generated data',
      'Token source plus generated JSON, declarations, and renderer theme data.',
    ];
  }
  if (path === 'classes') {
    return [
      'Mixed source/generated data',
      'Class recipe source plus generated JSON/declarations/custom-data.',
    ];
  }
  if (['behaviors', 'annotations', 'connectors', 'react', 'solid', 'qwik'].includes(path)) {
    return [
      'Authored public JS directory',
      'ESM source shipped as-is; adjacent declarations/maps are generated.',
    ];
  }
  if (path === 'glyphs') {
    return [
      'Authored public JS directory',
      'Glyph registry/renderers shipped as JS; declarations are generated.',
    ];
  }
  if (path === 'shiki') {
    return ['Theme data', 'Shiki theme JSON on the governed palette.'];
  }
  if (path === 'llms.txt') {
    return ['Agent entrypoint', 'Shipped plain-text orientation for offline LLM/agent consumers.'];
  }
  if (path === 'CHANGELOG.md') {
    return ['Release record', 'Shipped historical release notes.'];
  }
  if (path === 'MIGRATIONS.json') {
    return ['Migration data', 'Shipped rename/migration map for tooling.'];
  }
  if (path === 'docs/reference.md' || path === 'docs/package-contract.md') {
    return ['Generated documentation', 'Committed generated doc; never hand-edit.'];
  }
  if (path.startsWith('docs/')) {
    return ['Shipped documentation', 'Curated Markdown reading asset shipped in the npm tarball.'];
  }
  return ['Package file', 'Included in the npm files allowlist.'];
}

function exportRows(manifest) {
  return Object.entries(manifest.exports)
    .map(([key, value]) => {
      const [group, stability, contract] = exportClass(key);
      return `| ${code(key)} | ${targetCell(value)} | ${sentence(group)} | ${sentence(stability)} | ${sentence(contract)} |`;
    })
    .join('\n');
}

function fileRows(manifest) {
  return manifest.files
    .map((path) => {
      const [kind, contract] = fileClass(path);
      return `| ${code(path)} | ${sentence(kind)} | ${sentence(contract)} |`;
    })
    .join('\n');
}

function provenanceRows() {
  const rows = [
    [
      'Package manifest',
      'package.json',
      'docs/package-contract.md',
      'package-contract:build',
      'check:fresh',
      'The complete export/file matrix in this document is generated from the manifest.',
    ],
    [
      'Token model',
      'tokens/index.js',
      'css/tokens.css; tokens/index.json; tokens/tokens.dtcg.json; tokens/resolved.json; tokens/index.d.ts',
      'tokens:css:build; tokens:build; dtcg:build; resolved:build; dts:build',
      'check:fresh; check:contrast',
      'Token names/roles are public. Resolved values are visual tuning before 1.0.',
    ],
    [
      'Class registry',
      'classes/index.js plus css/*.css selectors',
      'classes/classes.json; classes/index.d.ts; classes/vscode.css-custom-data.json; docs/reference.md',
      'classes:json:build; dts:build; vscode:build; reference:build',
      'check:fresh; check:classes; check:contract',
      'The typed registry, JSON vocabulary, and generated reference stay aligned with real selectors.',
    ],
    [
      'Authored CSS graph',
      'css/core.css plus css/*.css leaves',
      `dist/bronto.css; dist/css/*.css (${coreLeaves.size + optInLeaves.size + 1} layered outputs)`,
      'dist:build',
      'check:dist; check:exports',
      'Default bundle and direct layered leaf imports are generated from authored CSS and size-gated.',
    ],
    [
      'JSDoc-authored public JS',
      'behaviors/; annotations/; connectors/; react/; solid/; qwik/',
      'adjacent *.d.ts and *.d.ts.map files',
      'dts:emit',
      'check:dts-emit; check:types; check:attw; check:publint',
      'Declarations are emitted from the shipped JS, not separately maintained.',
    ],
    [
      'Glyph registry',
      'glyphs/glyphs.js',
      'glyphs/glyphs.d.ts',
      'glyphs:build',
      'check:glyphs; npm test',
      'Glyph names and render options are public. The registry stays sorted and type-covered.',
    ],
    [
      'Display colorways',
      'tokens/skins.js',
      'css/skins.css; tokens/skins.d.ts',
      'skins:build',
      'check:skins; check:contrast',
      'Skins are opt-in root-level choices and never part of dist/bronto.css.',
    ],
    [
      'Chart palette',
      'tokens/charts.js',
      'css/dataviz.css; tokens/charts.json; tokens/charts.d.ts',
      'charts:build',
      'check:charts',
      'Data-viz colors are opt-in, CVD-gated, and never UI chrome.',
    ],
    [
      'External renderer themes',
      'tokens/mermaid.js; tokens/d2.js; tokens/vega.js',
      'tokens/{mermaid,d2,vega}.{js,json,d.ts}',
      'mermaid:build; d2:build; vega:build',
      'check:mermaid; check:d2; check:vega',
      'Renderer configs use resolved colors because the external renderers cannot consume CSS variables directly.',
    ],
    [
      'Contrast report',
      'tokens/resolved.json; tokens/skins.js; tokens/charts.js',
      'docs/contrast.md',
      'contrast:build',
      'check:contrast',
      'WCAG floors are hard-gated; APCA is reported as advisory.',
    ],
  ];

  return rows
    .map(
      ([surface, source, outputs, command, gate, note]) =>
        `| ${sentence(surface)} | ${code(source)} | ${sentence(outputs)} | ${code(`npm run ${command}`)} | ${sentence(gate)} | ${sentence(note)} |`,
    )
    .join('\n');
}

export function buildPackageContract(manifest = pkg) {
  return `<!-- @ponchia/ui - GENERATED from package.json by scripts/gen-package-contract.mjs.
     Do not edit by hand; run \`npm run package-contract:build\`.
     Drift-checked in CI through check:fresh. -->

# Package Contract

This is the manifest-facing contract for \`@ponchia/ui\`: every exported
subpath, every \`files\` allowlist entry, and the committed generated-artifact
pipeline. It complements [stability.md](./stability.md), which defines the
semantic versioning contract for the surfaces listed here.

## Contract Summary

| Surface group | Stability | Contract |
| --- | --- | --- |
| CSS root and \`dist/bronto.css\` | Stable | CSS-only default bundle. CSS side-effect imports are supported in CSS-aware bundlers; Node/runtime JS root imports are not. |
| CSS leaves | Stable additive | Direct leaves are generated as layered \`dist/css/*.css\` exports; raw unlayered source leaves are explicit escape hatches under \`./css/unlayered/*\`. |
| JS subpaths | Stable | ESM-only public subpaths. Runtime behavior is SSR-safe and dependency-free unless a framework binding declares an optional peer. |
| Machine-readable data | Stable additive | JSON/data exports are for non-JS hosts, validators, renderers, and offline agents. Additive fields are allowed within a compatible minor. |
| Shipped docs | Stable paths | Curated Markdown/text docs ship inside the npm tarball for offline readers. Generated docs are regenerated and drift-checked. |
| Fonts | Stable path pattern | Doto assets ship under \`fonts/*\` with their OFL license. |
| Repo tooling, demos, tests, examples, workflows | Internal | Useful for development and learning, but not shipped runtime API unless a path is explicitly exported below. |

## Export Matrix

| Export | Target | Group | Stability | Contract |
| --- | --- | --- | --- | --- |
${exportRows(manifest)}

## Shipped Files Allowlist

\`package.json\` controls the npm tarball with this \`files\` list. npm also
always includes \`package.json\`, \`README.md\`, \`LICENSE\`, and
\`CHANGELOG.md\`; \`check:pack\` verifies no dev-only path leaks.

| Path | Kind | Contract |
| --- | --- | --- |
${fileRows(manifest)}

## Artifact Provenance

Generated files are committed so the package can publish without a consumer-side
build step. Edit the source of truth, run the listed generator, and commit the
result. The listed gates are part of \`npm run check\`.

| Surface | Source of truth | Generated outputs | Generator | Gate | Note |
| --- | --- | --- | --- | --- | --- |
${provenanceRows()}

## Internal Paths

These paths are intentionally not part of the npm runtime surface:
\`scripts/\`, \`demo/\`, \`test/\`, \`examples/\`, \`.github/\`, local config
files, visual baselines, and development-only audit artifacts. They may change
without a package-level compatibility promise.
`;
}

export const packageContractMd = buildPackageContract(pkg);

if (isMain(import.meta.url)) {
  writeGenerated(root, { 'docs/package-contract.md': packageContractMd });
}
