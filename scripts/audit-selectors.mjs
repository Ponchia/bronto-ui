/**
 * Advisory selector ownership audit.
 *
 * This is intentionally not wired into `npm run check`: it operationalizes a
 * review finding without making documented compatibility aliases blocking.
 *
 * Run:
 *   node scripts/audit-selectors.mjs
 *   node scripts/audit-selectors.mjs --strict
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORE_BUNDLE, optInLeaves } from './lib/css-leaves.mjs';
import { stripCssComments } from './lib/patterns.mjs';
import { log } from './lib/stdio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const issues = [];
const allowed = [];

const pkg = readJson('package.json');
const exportedOptInLeaves = new Set(optInLeaves(pkg));
const coreFiles = new Set([...CORE_BUNDLE].map((leaf) => `css/${leaf}.css`));

const SELECTOR_OWNERS = [
  owner('app-shell', 'css/app.css', /^ui-app(?:-|$)/),
  owner('annotations', 'css/annotations.css', /^ui-annotation(?:$|[-_])/),
  owner('bullet', 'css/bullet.css', /^ui-bullet(?:$|[-_])/),
  owner('clamp', 'css/clamp.css', /^ui-clamp(?:$|[-_])/),
  owner('code', 'css/code.css', /^ui-code(?:$|[-_])/),
  owner('command', 'css/command.css', /^ui-command(?:$|[-_])/),
  owner('connectors', 'css/connectors.css', /^ui-connector(?:$|[-_])/),
  owner('crosshair', 'css/crosshair.css', /^ui-crosshair(?:$|[-_])/),
  owner('diff', 'css/diff.css', /^ui-diff(?:$|[-_])/),
  owner('figure', 'css/figure.css', /^ui-figure(?:$|[-_])/),
  owner('generated', 'css/generated.css', /^ui-generated(?:$|[-_])/),
  owner('highlights', 'css/highlights.css', /^ui-highlights(?:$|[-_])/),
  owner('interval', 'css/interval.css', /^ui-interval(?:$|[-_])/),
  owner('legend', 'css/legend.css', /^ui-legend(?:$|[-_])/),
  owner('marks', 'css/marks.css', /^(?:ui-mark|ui-bracket-note)(?:$|[-_])/),
  owner('report', 'css/report.css', /^ui-report(?:$|[-_])/),
  owner('selection', 'css/selection.css', /^ui-sel(?:$|[-_])/),
  owner('sidenote', 'css/sidenote.css', /^(?:ui-sidenote|ui-marginnote)(?:$|[-_])/),
  owner('sources', 'css/sources.css', /^ui-source(?:$|[-_])/),
  owner('spark', 'css/spark.css', /^ui-spark(?:$|[-_])/),
  owner('spotlight', 'css/spotlight.css', /^ui-spotlight(?:$|[-_])/),
  owner('state', 'css/state.css', /^ui-state(?:$|[-_])/),
  owner('term', 'css/term.css', /^ui-term(?:$|[-_])/),
  owner('textref', 'css/textref.css', /^ui-textref(?:$|[-_])/),
  owner('toc', 'css/toc.css', /^ui-toc(?:$|[-_])/),
  owner('tree', 'css/tree.css', /^ui-tree(?:$|[-_])/),
  owner('workbench', 'css/workbench.css', /^(?:ui-workbench|ui-selectionbar)(?:$|[-_])/),
].filter((entry) => entry.id === 'app-shell' || exportedOptInLeaves.has(entry.id));

const ALLOWLIST = [
  allow(
    'css/primitives.css',
    /^(?:ui-app-metrics|ui-app-metric(?:$|__label$|__value$|__delta$)|ui-app-empty-state)$/,
    'permanent app-shell aliases grouped on shell-agnostic primitive rules',
  ),
  allow(
    'css/base.css',
    /^(?:ui-app-rail|ui-app-topbar)$/,
    'global print reset hides interactive app chrome',
  ),
  allow('css/content.css', /^ui-mark$/, 'prose mark exclusion lets the opt-in marks leaf win'),
];

for (const file of cssFiles()) {
  const text = readText(file);
  if (text === null) continue;

  for (const { line, selector } of classOccurrences(text)) {
    const expected = expectedOwner(file, selector);
    if (!expected || expected === file) continue;

    const message = `${file}:${line} — .${selector} — expected-owner ${expected}`;
    const allowance = allowanceFor(file, selector);
    if (allowance) {
      allowed.push(`${message} (${allowance.reason})`);
    } else {
      issues.push(message);
    }
  }
}

if (issues.length) {
  console.warn(`⚠ ${issues.length} selector ownership advisory finding(s):`);
  for (const issue of issues) console.warn(`  - ${issue}`);
  if (allowed.length) {
    log(
      `i ${allowed.length} documented selector ownership crossing(s) allowlisted; rerun with --strict to fail only on unallowlisted findings.`,
    );
  }
  if (strict) process.exit(1);
} else {
  log(
    `✓ selector ownership audit: 0 unallowlisted crossing(s) across ${coreFiles.size} core CSS owner file(s); ${allowed.length} documented crossing(s) allowlisted`,
  );
}

function owner(id, expectedOwner, selectorPattern) {
  return { id, expectedOwner, selectorPattern };
}

function allow(file, selectorPattern, reason) {
  return { file, selectorPattern, reason };
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(resolve(root, file), 'utf8'));
  } catch (error) {
    issues.push(`${file} — could not read JSON (${error.message})`);
    return {};
  }
}

function readText(file) {
  try {
    return readFileSync(resolve(root, file), 'utf8');
  } catch (error) {
    issues.push(`${file} — could not read file (${error.message})`);
    return null;
  }
}

function cssFiles() {
  try {
    return readdirSync(resolve(root, 'css'))
      .filter((file) => file.endsWith('.css'))
      .map((file) => `css/${file}`)
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    issues.push(`css/ — could not list CSS files (${error.message})`);
    return [];
  }
}

function expectedOwner(file, selector) {
  const entry = SELECTOR_OWNERS.find((candidate) => candidate.selectorPattern.test(selector));
  if (!entry) return null;

  if (entry.id === 'app-shell') return entry.expectedOwner;
  if (!coreFiles.has(file)) return null;
  return entry.expectedOwner;
}

function allowanceFor(file, selector) {
  return ALLOWLIST.find((entry) => entry.file === file && entry.selectorPattern.test(selector));
}

function classOccurrences(css) {
  const lines = stripCssCommentsPreservingLines(css).split('\n');
  const out = [];

  for (const [index, line] of lines.entries()) {
    const seenOnLine = new Set();
    for (const match of line.matchAll(/\.(ui-[\w-]+)/g)) {
      const selector = match[1];
      if (seenOnLine.has(selector)) continue;
      seenOnLine.add(selector);
      out.push({ line: index + 1, selector });
    }
  }

  return out;
}

function stripCssCommentsPreservingLines(css) {
  if (stripCssComments(css) === css) return css;
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) => '\n'.repeat(lineBreaks(comment)));
}

function lineBreaks(value) {
  return value.split('\n').length - 1;
}
