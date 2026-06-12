/**
 * Keep consumer examples and browser-smoke coverage aligned.
 *
 * The expensive work (packing the tarball, installing examples, building them,
 * running Chromium) lives in .github/workflows/examples.yml and
 * scripts/test-examples.mjs. This lightweight gate prevents coverage metadata drift:
 * examples on disk, CI matrix entries, README rows, smoke-script branches, and
 * preview ports must all agree with scripts/lib/examples.mjs.
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
sameSet(
  'browser-smoke examples subset',
  BROWSER_SMOKE_EXAMPLE_NAMES.filter((name) => EXAMPLE_NAMES.includes(name)),
  BROWSER_SMOKE_EXAMPLE_NAMES,
);

const smokeScript = readFileSync(resolve(root, 'scripts/smoke-example.mjs'), 'utf8');
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
  ok: `${EXAMPLE_NAMES.length} examples and ${BROWSER_SMOKE_EXAMPLE_NAMES.length} browser-smoke entries are aligned`,
});
