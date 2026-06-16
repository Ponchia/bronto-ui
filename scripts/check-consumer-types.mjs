/**
 * Tarball-level TypeScript consumer smoke.
 *
 * `check:types` compiles the repo's committed declarations directly, and ATTW
 * validates the package shape. This gate closes the gap between those two:
 * install the packed npm tarball into a clean temp consumer, import every typed
 * public subpath through `@ponchia/ui/...`, and run TypeScript's NodeNext
 * resolver over real consumer code. A broken `exports.types` target, a missing
 * internal declaration file, or a package-only type-resolution regression fails
 * here even if direct repo-relative imports still pass.
 *
 * Run: node scripts/check-consumer-types.mjs
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from './lib/stdio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const tempRoot = mkdtempSync(resolve(tmpdir(), 'bronto-ui-consumer-types-'));
let failed = false;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: 'utf8',
    env: process.env,
    stdio: options.stdio ?? 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit ${result.status}`);
  }
  return result.stdout ?? '';
}

function typedEntries() {
  return Object.entries(pkg.exports ?? {})
    .filter(
      ([, target]) => target && typeof target === 'object' && typeof target.types === 'string',
    )
    .map(([subpath, target]) => ({
      subpath,
      specifier: subpath === '.' ? pkg.name : `${pkg.name}${subpath.slice(1)}`,
      types: target.types,
    }))
    .sort((a, b) => a.specifier.localeCompare(b.specifier));
}

function consumerSource(entries) {
  const namespaceImports = entries
    .map((entry, index) => `import * as typed${index} from '${entry.specifier}';`)
    .join('\n');
  const namespaceRefs = entries.map((_entry, index) => `typed${index}`).join(', ');

  return `
${namespaceImports}

import { cls, ui, cx, type ClassValue } from '${pkg.name}/classes';
import tokens, { themeColor, cssVars, type ThemeName } from '${pkg.name}/tokens';
import { initDialog, toast, type Cleanup } from '${pkg.name}/behaviors';
import { renderGlyph, glyphCells, GLYPH_SIZE, type GlyphName } from '${pkg.name}/glyphs';
import { connectRects, connectorPath, type ConnectRectsResult } from '${pkg.name}/connectors';
import { annotationParts, notePlacement, type AnnotationPartsOptions } from '${pkg.name}/annotations';
import { useDialog as useDialogR } from '${pkg.name}/react';
import { useTabs as useTabsS } from '${pkg.name}/solid';
import { useDialog as useDialogQ } from '${pkg.name}/qwik';
import { disclosure as sDisclosure, type SvelteActionReturn } from '${pkg.name}/svelte';
import { vDisclosure, directives, brontoVue, type BrontoDirective } from '${pkg.name}/vue';
import { skins, type SkinName } from '${pkg.name}/skins';
import chartPalette, { ACCENT, charts, CHART_CATEGORICAL, CHART_PATTERN_COUNT, type ChartTheme, type ChartTokenName } from '${pkg.name}/charts';
import mermaidTheme, { brontoMermaidTheme, mermaid, type MermaidThemeVariables } from '${pkg.name}/mermaid';
import d2Vars, { brontoD2Overrides, brontoD2Vars, d2 as d2Themes, type D2ThemeOverrides } from '${pkg.name}/d2';
import vegaConfig, { brontoVegaAccent, brontoVegaConfig, brontoVegaNeutral, vega as vegaThemes, type VegaConfig } from '${pkg.name}/vega';

const button: 'ui-button' = cls.button;
const classValue: ClassValue = ['ui-button', false, null, undefined, ['ui-button--ghost']];
const joined: string = cx(classValue, ui.button({ variant: 'ghost' }));
// @ts-expect-error - unknown class keys are rejected by the generated registry.
cls.notAClass;
// @ts-expect-error - recipe option unions reject unknown values.
ui.button({ variant: 'mystery' });

const theme: ThemeName = 'dark';
const accent: string = themeColor(theme).accent;
const accentVar: string = cssVars.light['--accent'];
const scale: string = tokens.scale['space-md'];
// @ts-expect-error - arbitrary token names are rejected.
cssVars.light['--missing-token'];

const cleanup: Cleanup = initDialog({ root: document });
const dismiss: Cleanup = toast('Saved', { tone: 'success', duration: 0, closable: true });
const glyphName: GlyphName = 'check';
const glyphHtml: string = renderGlyph(glyphName, { anim: 'reveal', solid: true });
const glyphCellOn: boolean = glyphCells('spark')[0].on;
const glyphSize: 16 = GLYPH_SIZE;
// @ts-expect-error - GlyphName is a generated literal union.
const badGlyph: GlyphName = 'not-a-glyph';

const connected: ConnectRectsResult = connectRects({
  fromRect: { x: 0, y: 0, width: 10, height: 10 },
  toRect: { x: 20, y: 20, width: 10, height: 10 },
});
const path: string = connectorPath({ from: connected.from, to: connected.to, shape: 'curve' });
const annOpts: AnnotationPartsOptions = { dx: 24, dy: 12, subject: { type: 'circle', radius: 8 } };
const annConnector: string = annotationParts(annOpts).connector;
const note = notePlacement({
  x: 20,
  y: 20,
  width: 80,
  height: 30,
  bounds: { width: 240, height: 140 },
  preferred: 'right',
});

const reactDialog: void = useDialogR({ root: { current: document } });
const solidTabs: void = useTabsS({ root: () => document });
const qwikDialog: void = useDialogQ({ root: { value: document } });
// @ts-expect-error - React roots do not accept the Qwik signal shape.
useDialogR({ root: { value: document } });
const svelteAction: SvelteActionReturn = sDisclosure(document.body, { root: document });
const vueDirective: BrontoDirective = vDisclosure;
vueDirective.mounted(document.body, { value: { root: document } });
directives.disclosure.beforeUnmount(document.body);
brontoVue.install({ directive(_name: string, _directive: BrontoDirective) {} });

const skinName: SkinName = 'phosphor-green';
const skinLabel: string = skins[skinName].label;
const chartToken: ChartTokenName = '--chart-1';
const chartColor: string = charts.light.categorical[0];
const chartTheme: ChartTheme = chartPalette.dark;
const chartAccent: 'var(--accent)' = ACCENT;
const chartCount: 8 = CHART_CATEGORICAL;
const chartPatternCount: 8 = CHART_PATTERN_COUNT;
const mermaidConfig = brontoMermaidTheme('dark');
const mermaidBaseTheme: 'base' = mermaidConfig.theme;
const mermaidVars: MermaidThemeVariables = mermaid.dark;
const mermaidDefault = mermaidTheme('light');
const d2Overrides: D2ThemeOverrides = brontoD2Overrides('light');
const d2Named: D2ThemeOverrides = d2Themes.dark;
const d2Source: string = brontoD2Vars();
const d2DefaultSource: string = d2Vars();
const vegaTheme: VegaConfig = vegaThemes.dark;
const vega: VegaConfig = brontoVegaConfig('dark');
const vegaDefault: VegaConfig = vegaConfig('light');
const vegaAccent: string = brontoVegaAccent('dark');
const vegaNeutral: string = brontoVegaNeutral('light');
// @ts-expect-error - renderer theme helpers accept only light/dark.
brontoMermaidTheme('midnight');
// @ts-expect-error - renderer theme helpers accept only light/dark.
brontoD2Overrides('midnight');
// @ts-expect-error - renderer theme helpers accept only light/dark.
brontoVegaConfig('midnight');
// @ts-expect-error - renderer theme helpers accept only light/dark.
brontoVegaAccent('midnight');

void [
  ${namespaceRefs},
  button,
  joined,
  accent,
  accentVar,
  scale,
  cleanup,
  dismiss,
  glyphHtml,
  glyphCellOn,
  glyphSize,
  badGlyph,
  path,
  annConnector,
  note,
  reactDialog,
  solidTabs,
  qwikDialog,
  svelteAction,
  skinLabel,
  chartToken,
  chartColor,
  chartTheme,
  chartAccent,
  chartCount,
  chartPatternCount,
  mermaidConfig,
  mermaidBaseTheme,
  mermaidVars,
  mermaidDefault,
  d2Overrides,
  d2Named,
  d2Source,
  d2DefaultSource,
  vegaTheme,
  vega,
  vegaDefault,
  vegaAccent,
  vegaNeutral,
];
`;
}

try {
  const entries = typedEntries();
  if (!entries.length) throw new Error('no public typed exports found in package.json');

  writeFileSync(
    resolve(tempRoot, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }, null, 2),
  );

  log(`Packing ${pkg.name} into ${tempRoot}`);
  run(npm, ['pack', '--silent', '--pack-destination', tempRoot, '--ignore-scripts'], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const tarballs = readdirSync(tempRoot).filter((name) => name.endsWith('.tgz'));
  if (tarballs.length !== 1) {
    throw new Error(`Expected one packed tarball in ${tempRoot}, found ${tarballs.length}`);
  }

  run(
    npm,
    [
      'install',
      '--silent',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      resolve(tempRoot, tarballs[0]),
    ],
    { cwd: tempRoot, stdio: ['ignore', 'pipe', 'inherit'] },
  );

  mkdirSync(resolve(tempRoot, 'src'), { recursive: true });
  writeFileSync(resolve(tempRoot, 'src', 'consumer.ts'), consumerSource(entries));
  writeFileSync(
    resolve(tempRoot, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          target: 'ES2022',
          lib: ['ES2022', 'DOM'],
          strict: true,
          noEmit: true,
          skipLibCheck: false,
          types: [],
        },
        include: ['src/consumer.ts'],
      },
      null,
      2,
    ),
  );

  const tsc = resolve(root, 'node_modules', 'typescript', 'bin', 'tsc');
  if (!existsSync(tsc)) throw new Error(`missing TypeScript compiler: ${tsc}`);
  run(process.execPath, [tsc, '-p', resolve(tempRoot, 'tsconfig.json')], { cwd: tempRoot });

  log(
    `✓ packed consumer TypeScript resolves ${entries.length} typed subpath${
      entries.length === 1 ? '' : 's'
    } through package exports`,
  );
} catch (error) {
  failed = true;
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (failed) log(`Kept temp consumer workspace: ${tempRoot}`);
  else rmSync(tempRoot, { recursive: true, force: true });
}
