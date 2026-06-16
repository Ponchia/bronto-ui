/**
 * Keep consumer examples and browser-smoke coverage aligned.
 *
 * The expensive work (packing the tarball, installing examples, building them,
 * and running browser smokes) lives in .github/workflows/examples.yml and
 * scripts/test-examples.mjs. This lightweight gate prevents coverage metadata
 * drift: examples on disk, CI matrix entries, README rows, smoke-script
 * branches, preview ports, and the deeper cross-browser smoke command must all
 * agree with scripts/lib/examples.mjs.
 *
 * Run: node scripts/check-examples.mjs
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reportAndExit } from './lib/gate-report.mjs';
import { BROWSER_SMOKE_EXAMPLE_NAMES, EXAMPLE_NAMES } from './lib/examples.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function sameSet(label, actual, expected) {
  const a = sorted(actual);
  const e = sorted(expected);
  if (JSON.stringify(a) !== JSON.stringify(e)) {
    errors.push(`${label} mismatch: expected [${e.join(', ')}], got [${a.join(', ')}]`);
  }
}

function parseWorkflowList(body) {
  return body
    .split(/[\n,]/)
    .map((item) => item.replace(/#.*/, '').trim())
    .filter(Boolean)
    .map((item) => item.replace(/^['"]|['"]$/g, ''));
}

function previewPort(exampleName) {
  const pkg = JSON.parse(
    readFileSync(resolve(root, 'examples', exampleName, 'package.json'), 'utf8'),
  );
  if (!pkg.scripts?.build) errors.push(`examples/${exampleName}/package.json has no build script`);
  const preview = pkg.scripts?.preview;
  if (!preview) {
    errors.push(`examples/${exampleName}/package.json has no preview script`);
    return null;
  }
  const match = /--port\s+(\d+)/.exec(preview);
  if (!match) {
    errors.push(`examples/${exampleName} preview script has no explicit --port: ${preview}`);
    return null;
  }
  return Number(match[1]);
}

const exampleDirs = readdirSync(resolve(root, 'examples'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => existsSync(resolve(root, 'examples', name, 'package.json')));
sameSet('examples directory/package.json inventory', exampleDirs, EXAMPLE_NAMES);

const workflow = readFileSync(resolve(root, '.github/workflows/examples.yml'), 'utf8');
const matrix = workflow.match(/matrix:[\s\S]*?example:\s*\n\s*\[([\s\S]*?)\]/);
if (!matrix) {
  errors.push('could not find examples workflow matrix example list');
} else {
  sameSet('examples workflow matrix', parseWorkflowList(matrix[1]), EXAMPLE_NAMES);
}

const smokeLists = [...workflow.matchAll(/fromJSON\('(\[[^']+\])'\)/g)].map((match) =>
  JSON.parse(match[1]),
);
if (!smokeLists.length) {
  errors.push('could not find examples workflow browser-smoke fromJSON lists');
}
for (const [index, list] of smokeLists.entries()) {
  sameSet(`examples workflow browser-smoke list #${index + 1}`, list, BROWSER_SMOKE_EXAMPLE_NAMES);
}
if (!workflow.includes('cross_browser:')) {
  errors.push('examples workflow has no cross_browser input for the deeper packed smoke');
}
if (!workflow.includes('visual_smoke:')) {
  errors.push('examples workflow has no visual_smoke input for packed example visual smoke');
}
if (!workflow.includes('npx playwright install --with-deps chromium firefox webkit')) {
  errors.push('examples workflow does not install chromium, firefox, and webkit for cross_browser');
}
if (!workflow.includes('npm run test:examples:cross-browser -- "${args[@]}"')) {
  errors.push(
    'examples workflow does not run test:examples:cross-browser when cross_browser is true',
  );
}
if (!workflow.includes('npm run test:examples -- "${args[@]}"')) {
  errors.push('examples workflow does not run test:examples with shared smoke args');
}
if (!workflow.includes('args+=(--visual)')) {
  errors.push('examples workflow does not pass --visual when visual_smoke is true');
}
sameSet(
  'browser-smoke examples subset',
  BROWSER_SMOKE_EXAMPLE_NAMES.filter((name) => EXAMPLE_NAMES.includes(name)),
  BROWSER_SMOKE_EXAMPLE_NAMES,
);

const ciWorkflow = readFileSync(resolve(root, '.github/workflows/ci.yml'), 'utf8');
if (!ciWorkflow.includes('cross_browser: ${{ github.event_name ==')) {
  errors.push('CI workflow does not opt manual workflow_dispatch runs into cross-browser examples');
}
if (!ciWorkflow.includes('visual_smoke: ${{ github.event_name ==')) {
  errors.push(
    'CI workflow does not opt manual workflow_dispatch runs into packed example visual smoke',
  );
}

const releaseWorkflow = readFileSync(resolve(root, '.github/workflows/release.yml'), 'utf8');
if (
  !/examples:\s*[\s\S]*?uses:\s*\.\/\.github\/workflows\/examples\.yml[\s\S]*?with:\s*[\s\S]*?cross_browser:\s*true[\s\S]*?visual_smoke:\s*true/.test(
    releaseWorkflow,
  )
) {
  errors.push(
    'release workflow must gate publish on cross-browser packed examples and desktop+mobile visual smoke',
  );
}

const smokeScript = readFileSync(resolve(root, 'scripts/smoke-example.mjs'), 'utf8');
if (!smokeScript.includes('VISUAL_VIEWPORTS')) {
  errors.push('scripts/smoke-example.mjs visual smoke has no explicit viewport inventory');
}
if (!smokeScript.includes("name: 'mobile'")) {
  errors.push('scripts/smoke-example.mjs visual smoke does not include a mobile viewport');
}
if (!smokeScript.includes('documentWidth > layout.viewportWidth')) {
  errors.push('scripts/smoke-example.mjs visual smoke does not fail horizontal overflow');
}
for (const [label, needle] of [
  ['records bronto:themechange events', 'window.__brontoThemeEvents'],
  ['checks theme-toggle aria reflection', "ariaPressed !== String(after === 'dark')"],
  ['checks theme-toggle persistence', "localStorage.getItem('bronto-theme')"],
]) {
  if (!smokeScript.includes(needle)) {
    errors.push(`scripts/smoke-example.mjs ${label}`);
  }
}
if (
  !/if \(name === 'vanilla-vite'\) \{[\s\S]*?await assertThemeToggle\(\);[\s\S]*?await assertToast\(\);/.test(
    smokeScript,
  )
) {
  errors.push('scripts/smoke-example.mjs vanilla-vite branch must exercise theme toggle and toast');
}
for (const name of BROWSER_SMOKE_EXAMPLE_NAMES) {
  if (!smokeScript.includes(`name === '${name}'`)) {
    errors.push(`scripts/smoke-example.mjs has no explicit assertion branch for ${name}`);
  }
}

const readme = readFileSync(resolve(root, 'examples/README.md'), 'utf8');
for (const name of EXAMPLE_NAMES) {
  if (!readme.includes(`[\`${name}\`](${name})`)) {
    errors.push(`examples/README.md has no table row for ${name}`);
  }
}

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const crossBrowserScript = pkg.scripts?.['test:examples:cross-browser'];
if (crossBrowserScript !== 'node scripts/test-examples.mjs --browsers=chromium,firefox,webkit') {
  errors.push(
    'package.json test:examples:cross-browser must run packed examples in chromium, firefox, and webkit',
  );
}
if (pkg.scripts?.['test:examples:visual'] !== 'node scripts/test-examples.mjs --visual') {
  errors.push('package.json test:examples:visual must run packed examples with --visual');
}

const ports = new Map();
for (const name of EXAMPLE_NAMES) {
  const port = previewPort(name);
  if (port == null) continue;
  const owner = ports.get(port);
  if (owner) errors.push(`preview port ${port} is used by both ${owner} and ${name}`);
  else ports.set(port, name);
}

reportAndExit(errors, {
  label: 'examples',
  ok: `${EXAMPLE_NAMES.length} examples, ${BROWSER_SMOKE_EXAMPLE_NAMES.length} browser-smoke entries, cross-browser smoke, and desktop+mobile visual smoke are aligned`,
});
