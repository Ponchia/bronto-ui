/**
 * Report-kit integrity checks.
 *
 * Keeps the LLM/static-report docs and fixtures honest:
 *  - every mentioned ui-* class is in the public cls registry
 *  - report.css / annotations.css stay opt-in, never imported by core.css
 *  - static report examples do not depend on remote executable/media assets
 *  - report examples do not use raw chromatic inline colors
 *  - report fixtures keep the semantic/print contracts the docs teach
 *
 * Run: node scripts/check-report.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { cls } from '../classes/index.js';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const valid = new Set(Object.values(cls));

const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

const classSources = [
  'docs/reporting.md',
  'docs/annotations.md',
  'docs/legends.md',
  'docs/marks.md',
  'docs/connectors.md',
  'docs/spotlight.md',
  'docs/crosshair.md',
  'docs/selection.md',
  'docs/sources.md',
  'docs/state.md',
  'docs/generated.md',
  'docs/workbench.md',
  'docs/command.md',
  'llms.txt',
  'demo/report.html',
  'demo/report-standalone.html',
  'demo/annotations.html',
  'demo/legends.html',
  'demo/marks.html',
  'demo/connectors.html',
  'demo/spotlight.html',
  'demo/crosshair.html',
  'demo/selection.html',
  'demo/sources.html',
  'demo/state.html',
  'demo/generated.html',
  'demo/workbench.html',
  'demo/command.html',
  ...walk('examples/report-static').filter((p) => /\.(html|js|css|md)$/.test(p)),
];

for (const rel of classSources) {
  const src = read(rel);
  for (const m of src.matchAll(/(?<![\w-])ui-[a-z][\w-]*/g)) {
    const name = m[0];
    if (!valid.has(name)) errors.push(`${rel}: unknown ui-* class "${name}"`);
  }
}

const core = read('css/core.css');
// Opt-in leaves that core.css must NEVER @import — [file, human-noun]. A loop,
// not 13 hand-rolled `if`s, so adding a 14th opt-in layer is one array entry and
// the three places this list used to be spelled out can't drift. (audit Q11.)
const OPTIN_LAYERS = [
  ['report', 'report'],
  ['annotations', 'annotation'],
  ['legend', 'legend'],
  ['marks', 'marks'],
  ['connectors', 'connector'],
  ['spotlight', 'spotlight'],
  ['crosshair', 'crosshair'],
  ['selection', 'selection'],
  ['sources', 'sources'],
  ['state', 'state'],
  ['generated', 'generated'],
  ['workbench', 'workbench'],
  ['command', 'command'],
];
for (const [file, noun] of OPTIN_LAYERS) {
  if (new RegExp(`\\b${file}\\.css`).test(core)) {
    errors.push(`css/core.css imports ${file}.css — ${noun} CSS must stay opt-in`);
  }
}

const htmlSources = [
  'demo/report.html',
  'demo/report-standalone.html',
  'demo/annotations.html',
  'demo/legends.html',
  'demo/marks.html',
  'demo/connectors.html',
  'demo/spotlight.html',
  'demo/crosshair.html',
  'demo/selection.html',
  'demo/sources.html',
  'demo/state.html',
  'demo/generated.html',
  'demo/workbench.html',
  'demo/command.html',
  ...walk('examples/report-static').filter((p) => /\.html$/.test(p)),
];
for (const rel of htmlSources) {
  const src = read(rel);
  const remoteAsset =
    /<(?:script|img|iframe|source)\b[^>]*(?:src|srcset)=["'][^"']*https?:/i.test(src) ||
    /<link\b[^>]*\bhref=["'][^"']*https?:/i.test(src);
  if (remoteAsset) {
    errors.push(`${rel}: report examples must not depend on remote scripts/styles/images/iframes`);
  }
  if (/<iframe\b/i.test(src)) errors.push(`${rel}: report examples must not embed iframes`);
}

const reportHtmlSources = [
  'demo/report.html',
  'demo/report-standalone.html',
  ...walk('examples/report-static').filter((p) => /\.html$/.test(p)),
];
for (const rel of reportHtmlSources) {
  checkReportShape(rel, read(rel));
}

const rawColor = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/i;
for (const rel of [
  'docs/reporting.md',
  'docs/annotations.md',
  'docs/legends.md',
  'docs/marks.md',
  'docs/connectors.md',
  'docs/spotlight.md',
  'docs/crosshair.md',
  'docs/selection.md',
  'docs/sources.md',
  'docs/state.md',
  'docs/generated.md',
  'docs/workbench.md',
  'docs/command.md',
  'demo/report.html',
  'demo/report-standalone.html',
  'demo/annotations.html',
  'demo/legends.html',
  'demo/marks.html',
  'demo/connectors.html',
  'demo/spotlight.html',
  'demo/crosshair.html',
  'demo/selection.html',
  'demo/sources.html',
  'demo/state.html',
  'demo/generated.html',
  'demo/workbench.html',
  'demo/command.html',
  ...walk('examples/report-static'),
]) {
  if (!/\.(md|html|css|js)$/.test(rel)) continue;
  const src = read(rel);
  const inlineStyles = [
    ...src.matchAll(/\bstyle=["']([\s\S]*?)["']/gi),
    ...src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi),
  ];
  for (const m of inlineStyles) {
    if (rawColor.test(m[1])) {
      errors.push(`${rel}: raw chromatic color in inline report styling — use tokens or CSS vars`);
    }
  }
}

const forbiddenTerms = loadForbiddenTerms();
if (forbiddenTerms.length) {
  const publicBoundarySources = walk('.').filter(
    (p) => /\.(md|html|css|js|json|mjs|ts|tsx|jsx|d\.ts)$/.test(p) && p !== 'package-lock.json',
  );
  for (const rel of publicBoundarySources) {
    const src = read(rel).toLowerCase();
    for (const term of forbiddenTerms) {
      if (src.includes(term)) {
        errors.push(`${rel}: public-boundary check found forbidden local term "${term}"`);
      }
    }
  }
}

reportAndExit(errors, {
  label: 'report-kit',
  ok: `report kit: ${classSources.length} docs/fixtures use valid ui-* classes`,
});

function loadForbiddenTerms() {
  const terms = [];
  const env = process.env.BRONTO_UI_FORBIDDEN_TERMS || '';
  terms.push(...env.split(/[\n,]/));
  const localPath = resolve(root, '.bronto-ui-forbidden-terms');
  if (existsSync(localPath)) {
    terms.push(...readFileSync(localPath, 'utf8').split(/\n/));
  }
  return [
    ...new Set(terms.map((term) => term.replace(/#.*/, '').trim().toLowerCase()).filter(Boolean)),
  ];
}

function checkReportShape(rel, src) {
  const doc = new JSDOM(src).window.document;
  const h1s = [...doc.querySelectorAll('h1')];
  if (h1s.length !== 1) errors.push(`${rel}: expected exactly one <h1>, found ${h1s.length}`);

  const reportMains = [...doc.querySelectorAll('main.ui-report')];
  if (reportMains.length !== 1) {
    errors.push(
      `${rel}: expected exactly one <main class="ui-report">, found ${reportMains.length}`,
    );
  }

  for (const table of doc.querySelectorAll('table')) {
    if (!table.querySelector('caption')) errors.push(`${rel}: table is missing a caption`);
    if (!table.querySelector('th')) errors.push(`${rel}: table is missing header cells`);
  }

  for (const figure of doc.querySelectorAll('figure')) {
    if (!figure.querySelector('figcaption')) errors.push(`${rel}: figure is missing a figcaption`);
  }

  for (const svg of doc.querySelectorAll('svg')) {
    if (
      svg.hasAttribute('role') ||
      svg.hasAttribute('aria-label') ||
      svg.hasAttribute('aria-labelledby') ||
      svg.closest('figure')
    ) {
      if (!svg.querySelector('title')) errors.push(`${rel}: report SVG is missing a <title>`);
      if (!svg.querySelector('desc')) errors.push(`${rel}: report SVG is missing a <desc>`);
    }
  }

  for (const alert of doc.querySelectorAll('.ui-alert')) {
    if (!alert.querySelector('.ui-alert__body')) {
      errors.push(`${rel}: ui-alert text must be wrapped in .ui-alert__body`);
    }
  }

  for (const source of doc.querySelectorAll('.ui-source-card')) {
    if (!source.id) {
      errors.push(`${rel}: ui-source-card needs a stable id for claim/source links`);
    }
    if (
      ![...source.classList].some((name) =>
        /^ui-src--(?:verified|reviewed|generated|unverified|stale|conflict)$/.test(name),
      )
    ) {
      errors.push(`${rel}: ui-source-card needs an explicit ui-src--* trust state`);
    }
    for (const required of [
      'ui-source-card__title',
      'ui-source-card__origin',
      'ui-source-card__time',
    ]) {
      if (!source.querySelector(`.${required}`)) {
        errors.push(`${rel}: ui-source-card needs .${required}`);
      }
    }
  }

  for (const finding of doc.querySelectorAll('.ui-report__finding')) {
    for (const severity of ['critical', 'major', 'minor', 'resolved']) {
      if (finding.classList.contains(`ui-report__finding--${severity}`)) {
        const text = readableText(finding).toLowerCase();
        if (!new RegExp(`\\b${severity}\\b`).test(text)) {
          errors.push(
            `${rel}: ui-report__finding--${severity} must repeat "${severity}" in readable text`,
          );
        }
      }
    }
  }

  for (const citation of doc.querySelectorAll('.ui-citation[href^="#"]')) {
    const id = citation.getAttribute('href')?.slice(1);
    if (id && !doc.getElementById(id)) {
      errors.push(`${rel}: ui-citation points to missing target #${id}`);
    }
  }

  const sourceCardIds = new Set(
    [...doc.querySelectorAll('.ui-source-card[id]')].map((node) => node.id),
  );
  for (const claim of doc.querySelectorAll('.ui-claim')) {
    if (!claim.id) {
      errors.push(`${rel}: ui-claim needs a stable id for evidence ledgers`);
    }
    const status = ['supported', 'partial', 'disputed', 'unsupported', 'unknown'].find((name) =>
      claim.classList.contains(`ui-claim--${name}`),
    );
    if (!status) {
      errors.push(`${rel}: ui-claim needs an explicit ui-claim--* evidence state`);
    } else if (!new RegExp(`\\b${status}\\b`, 'i').test(readableText(claim))) {
      errors.push(`${rel}: ui-claim--${status} must repeat "${status}" in readable text`);
    }
    for (const required of ['ui-claim__statement', 'ui-claim__status']) {
      if (!claim.querySelector(`.${required}`)) {
        errors.push(`${rel}: ui-claim needs .${required}`);
      }
    }
    const declaredSources = (claim.getAttribute('data-source-ids') || '')
      .split(/\s+/)
      .map((id) => id.trim())
      .filter(Boolean);
    for (const id of declaredSources) {
      if (!sourceCardIds.has(id)) {
        errors.push(`${rel}: ui-claim data-source-ids references missing source card #${id}`);
      }
    }
    const linkedSourceIds = [...claim.querySelectorAll('a[href^="#"]')]
      .map((link) => link.getAttribute('href')?.slice(1))
      .filter((id) => id && sourceCardIds.has(id));
    if (
      !['unsupported', 'unknown'].includes(status) &&
      !declaredSources.length &&
      !linkedSourceIds.length
    ) {
      errors.push(`${rel}: ui-claim needs data-source-ids or a source-card citation`);
    }
  }

  for (const action of doc.querySelectorAll('.ui-report__action')) {
    if (!action.querySelector('.ui-report__action-status')) {
      errors.push(`${rel}: ui-report__action needs .ui-report__action-status text`);
    }
    if (action.querySelector('.ui-report__action-title')) {
      for (const required of [
        'ui-report__action-owner',
        'ui-report__action-due',
        'ui-report__action-criteria',
      ]) {
        if (!action.querySelector(`.${required}`)) {
          errors.push(`${rel}: action-register row with a title needs .${required}`);
        }
      }
    }
  }
}

function readableText(node) {
  return (node.textContent || '').replace(/\s+/g, ' ').trim();
}

function walk(rel) {
  const abs = resolve(root, rel);
  const out = [];
  for (const name of readdirSync(abs)) {
    if (
      name === '.git' ||
      name === '.bronto-ui-forbidden-terms' ||
      name === 'node_modules' ||
      name === 'dist' ||
      name === 'playwright-report' ||
      name === 'test-results' ||
      name === 'blob-report' ||
      name === 'reports-lab' ||
      name === '_site'
    ) {
      continue;
    }
    const childRel = join(rel, name).replaceAll('\\', '/');
    const childAbs = resolve(root, childRel);
    if (statSync(childAbs).isDirectory()) out.push(...walk(childRel));
    else out.push(childRel);
  }
  return out;
}
