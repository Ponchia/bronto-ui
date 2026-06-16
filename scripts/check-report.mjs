/**
 * Report-kit integrity checks.
 *
 * Keeps the LLM/static-report docs and fixtures honest:
 *  - every mentioned ui-* class is in the public cls registry
 *  - public authoring fenced HTML snippets keep local id/ARIA/behavior references intact
 *  - report.css / annotations.css stay opt-in, never imported by core.css
 *  - static report examples do not depend on remote executable/media assets
 *  - report examples do not use raw chromatic inline colors
 *  - report fixtures keep the semantic/print contracts the docs teach
 *
 * Run: node scripts/check-report.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { cls } from '../classes/index.js';
import { reportAndExit } from './lib/gate-report.mjs';
import { shippedDocs } from './lib/shipped-docs.mjs';
import { CORE_BUNDLE, optInLeaves } from './lib/css-leaves.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const errors = [];
const valid = new Set(Object.values(cls));

const REPORTING_TOOLBOX_LEAVES = [
  ['dataviz', 'theming.md#data-viz-palette'],
  ['figure', 'figure.md'],
  ['marks', 'marks.md'],
  ['sources', 'sources.md'],
  ['interval', 'interval.md'],
  ['clamp', 'clamp.md'],
  ['highlights', 'highlights.md'],
  ['annotations', 'annotations.md'],
  ['connectors', 'connectors.md'],
  ['legend', 'legends.md'],
  ['spotlight', 'spotlight.md'],
  ['crosshair', 'crosshair.md'],
  ['selection', 'selection.md'],
  ['generated', 'generated.md'],
  ['state', 'state.md'],
  ['workbench', 'workbench.md'],
  ['command', 'command.md'],
  ['spark', 'spark.md'],
  ['bullet', 'bullet.md'],
  ['diff', 'diff.md'],
  ['code', 'code.md'],
  ['sidenote', 'sidenote.md'],
  ['textref', 'textref.md'],
  ['term', 'term.md'],
  ['toc', 'toc.md'],
  ['tree', 'tree.md'],
];
const REPORTING_TOOLBOX_JS = [
  ['@ponchia/ui/mermaid', 'mermaid.md'],
  ['@ponchia/ui/d2', 'd2.md'],
  ['@ponchia/ui/vega', 'vega.md'],
];

const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

// The unknown-class scan covers EVERY shipped doc and EVERY demo page by
// construction (derived, not hand-listed — the hand list had already drifted
// behind the post-0.6.0 leaves). The only carve-outs are docs whose job is to
// name classes that deliberately do not exist:
const CLASS_SCAN_EXCLUDES = new Set([
  'CHANGELOG.md', // historical: references removed classes (e.g. ui-chart)
  'docs/frontier-primitives.md', // names candidate primitives by design (ui-job, ui-interval, …)
]);
const isMigrationDoc = (rel) => rel.startsWith('docs/migrations/');

const allDemos = readdirSync(resolve(root, 'demo'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => `demo/${f}`);

const classSources = [
  ...shippedDocs(pkg).filter((rel) => !CLASS_SCAN_EXCLUDES.has(rel) && !isMigrationDoc(rel)),
  ...allDemos,
  ...walk('examples/report-static').filter((p) => /\.(html|js|css|md)$/.test(p)),
];

// Parts-only namespaces (classes.json group keys with base:null, e.g.
// ui-themetoggle) are honest namespace mentions even though no standalone
// base class exists — the generated reference headings name them.
const classesJson = JSON.parse(read('classes/classes.json'));
const groupNames = new Set(Object.keys(classesJson.groups ?? {}));

// Standard CSS generic font families that happen to share the ui- prefix.
const CSS_FONT_KEYWORDS = new Set(['ui-monospace', 'ui-sans-serif', 'ui-serif', 'ui-rounded']);
const PUBLIC_BOUNDARY_FILE = /\.(?:md|html|css|js|json|mjs|ts|tsx|jsx|d\.ts|ya?ml|txt)$/;

// Pedagogical anti-examples: classes the docs name precisely BECAUSE they do
// not exist ("…silently no-ops", "there is deliberately no …"). Anything
// added here must appear in that negative framing.
const KNOWN_NEGATIVE = new Set([
  'ui-field--invalid', // reference.md: "There is deliberately no ui-field--invalid class."
  'ui-prose--dense', // usage.md teaches that hand-invented modifiers no-op
  'ui-table--compact',
  'ui-dot--muted',
  'ui-meter--muted',
  'ui-delta--pos',
]);

for (const rel of classSources) {
  const src = read(rel);
  for (const m of src.matchAll(/(?<![\w-])ui-[a-z][\w-]*/g)) {
    const name = m[0];
    if (valid.has(name) || groupNames.has(name)) continue;
    if (CSS_FONT_KEYWORDS.has(name) || KNOWN_NEGATIVE.has(name)) continue;
    // Backtick docs sometimes name a whole prefix family (`ui-site*`). Accept it
    // only when the prefix is backed by real registry classes.
    if (src[m.index + name.length] === '*' && [...valid].some((c) => c.startsWith(name))) continue;
    // `ui-src--*`-style family wildcards surface as a trailing dash; they are
    // fine as long as the family actually exists.
    if (name.endsWith('-')) {
      const family = name.replace(/-+$/, '-');
      if ([...valid].some((c) => c.startsWith(family))) continue;
    }
    errors.push(`${rel}: unknown ui-* class "${name}"`);
  }
}

const htmlSnippetDocs = [
  ...new Set([
    ...shippedDocs(pkg),
    ...walk('docs').filter((rel) => rel.endsWith('.md')),
    'examples/README.md',
  ]),
];
const htmlSnippetCount = checkHtmlSnippets(htmlSnippetDocs);

const core = read('css/core.css');
// The default bundle is a closed set: every @import in core.css must be in
// CORE_BUNDLE (growing the default bundle is a deliberate registry edit), and
// every other exported leaf must never be imported — opt-in by contract.
// Both directions derive from package.json exports via lib/css-leaves.mjs.
for (const m of core.matchAll(/@import\s+url\('\.\/([a-z-]+)\.css'\)/g)) {
  if (!CORE_BUNDLE.has(m[1])) {
    errors.push(
      `css/core.css imports ${m[1]}.css which is not in CORE_BUNDLE — ` +
        'either it is an opt-in leaf (must stay out of core) or the default bundle ' +
        'is deliberately growing (add it to scripts/lib/css-leaves.mjs)',
    );
  }
}
for (const leaf of optInLeaves(pkg)) {
  if (new RegExp(`\\b${leaf}\\.css`).test(core)) {
    errors.push(`css/core.css imports ${leaf}.css — opt-in CSS must stay opt-in`);
  }
}

checkReportingToolbox(read('docs/reporting.md'));

// No demo page or report example may depend on remote executable/media assets.
const htmlSources = [
  ...allDemos,
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
  ...allDemos.filter((rel) => /<main\b[^>]*class=["'][^"']*\bui-report\b/i.test(read(rel))),
  'test/e2e/_report-print.fixture.html',
  ...walk('examples/report-static').filter((p) => /\.html$/.test(p)),
].filter((rel, index, all) => all.indexOf(rel) === index);
for (const rel of reportHtmlSources) {
  checkReportShape(rel, read(rel));
}

// Raw chromatic literals in inline report styling — scan the same derived
// doc + demo surface as the class scan, plus a carve-out for docs whose JOB
// is to show literal colours (theming/token/diagram-theme recipes).
const RAW_COLOR_EXCLUDES = new Set([
  'CHANGELOG.md',
  'docs/theming.md', // re-skin recipe shows literal oklch()/hex by design
  'docs/contrast.md', // contrast tables discuss explicit colour values
  'docs/mermaid.md', // resolved-hex theme maps are the whole point
  'docs/d2.md',
  'docs/vega.md',
]);
const rawColor = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/i;
for (const rel of [
  ...shippedDocs(pkg).filter((rel) => !RAW_COLOR_EXCLUDES.has(rel) && !isMigrationDoc(rel)),
  ...allDemos,
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
const publicBoundarySources = trackedPublicBoundarySources();
for (const rel of publicBoundarySources) {
  const src = read(rel);
  if (/\/Users\/zeno\/bronto(?:\/[^\s`"')<]*)?/.test(src)) {
    errors.push(`${rel}: public-boundary check found local workspace path`);
  }
  if (/\/var\/folders\/[^\s`"')<]*/.test(src)) {
    errors.push(`${rel}: public-boundary check found local temp path`);
  }
}

if (forbiddenTerms.length) {
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
  ok:
    `report kit: ${classSources.length} docs/fixtures use valid ui-* classes; ` +
    `${htmlSnippetCount} public authoring HTML snippet(s) keep local references intact`,
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

function trackedPublicBoundarySources() {
  let files;
  try {
    files = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split(/\n/);
  } catch {
    files = walk('.');
  }
  return files.filter((p) => PUBLIC_BOUNDARY_FILE.test(p) && p !== 'package-lock.json');
}

function checkHtmlSnippets(docs) {
  let count = 0;
  for (const rel of docs) {
    let src;
    try {
      src = read(rel);
    } catch {
      continue; // missing shipped docs are check:pack's responsibility
    }

    for (const match of src.matchAll(/```html[^\n]*\n([\s\S]*?)\n```/g)) {
      count += 1;
      const line = src.slice(0, match.index).split('\n').length;
      const where = `${rel}:${line}`;
      const fragment = JSDOM.fragment(match[1]);
      const ids = new Map();
      for (const node of fragment.querySelectorAll('[id]')) {
        ids.set(node.id, (ids.get(node.id) || 0) + 1);
      }

      for (const [id, seen] of ids) {
        if (seen > 1) errors.push(`${where}: fenced HTML snippet repeats id="${id}" ${seen}x`);
      }

      for (const node of fragment.querySelectorAll(
        '[aria-controls], [aria-labelledby], [aria-describedby]',
      )) {
        for (const attr of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
          const value = node.getAttribute(attr);
          if (!value) continue;
          for (const id of value.trim().split(/\s+/)) {
            if (id && !ids.has(id)) {
              errors.push(
                `${where}: fenced HTML snippet has ${attr}="${id}" on ` +
                  `<${node.tagName.toLowerCase()}> but no matching id="${id}"`,
              );
            }
          }
        }
      }

      for (const label of fragment.querySelectorAll('label[for]')) {
        const id = label.getAttribute('for');
        if (id && !ids.has(id)) {
          errors.push(`${where}: fenced HTML snippet has label[for="${id}"] with no matching id`);
        }
      }

      for (const input of fragment.querySelectorAll('input[list]')) {
        const id = input.getAttribute('list');
        if (id && !ids.has(id)) {
          errors.push(`${where}: fenced HTML snippet has input[list="${id}"] with no datalist id`);
        }
      }

      for (const node of fragment.querySelectorAll(
        '[data-bronto-open], [data-bronto-close], [data-bronto-target], [data-target]',
      )) {
        for (const attr of [
          'data-bronto-open',
          'data-bronto-close',
          'data-bronto-target',
          'data-target',
        ]) {
          const value = node.getAttribute(attr);
          if (!value) continue;
          for (const part of value.trim().split(/\s+/)) {
            if (part.startsWith('#') && !ids.has(part.slice(1))) {
              errors.push(
                `${where}: fenced HTML snippet has ${attr}="${part}" but no matching target id`,
              );
            }
          }
        }
      }

      for (const node of fragment.querySelectorAll('[data-source-ids]')) {
        const value = node.getAttribute('data-source-ids') || '';
        for (const id of value.trim().split(/\s+/)) {
          if (id && !ids.has(id)) {
            errors.push(
              `${where}: fenced HTML snippet has data-source-ids="${id}" but no source id`,
            );
          }
        }
      }
    }
  }
  return count;
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

function checkReportingToolbox(src) {
  const start = src.indexOf('## The analytical toolbox in a report');
  const end = src.indexOf('## Canonical skeleton', start);
  if (start === -1 || end === -1) {
    errors.push('docs/reporting.md: expected analytical toolbox section before canonical skeleton');
    return;
  }
  const toolbox = src.slice(start, end);
  for (const [leaf, doc] of REPORTING_TOOLBOX_LEAVES) {
    if (!toolbox.includes(`css/${leaf}.css`)) {
      errors.push(`docs/reporting.md: analytical toolbox missing css/${leaf}.css routing row`);
    }
    if (!toolbox.includes(`./${doc}`)) {
      errors.push(`docs/reporting.md: analytical toolbox missing link to ${doc}`);
    }
  }
  for (const [specifier, doc] of REPORTING_TOOLBOX_JS) {
    if (!toolbox.includes(specifier)) {
      errors.push(`docs/reporting.md: analytical toolbox missing ${specifier} routing row`);
    }
    if (!toolbox.includes(`./${doc}`)) {
      errors.push(`docs/reporting.md: analytical toolbox missing link to ${doc}`);
    }
  }

  const reportKit = read('css/report-kit.css');
  for (const screenLeaf of ['workbench', 'command']) {
    if (new RegExp(`@import\\s+url\\('\\./${screenLeaf}\\.css'\\)`).test(reportKit)) {
      errors.push(
        `css/report-kit.css imports ${screenLeaf}.css — screen-tool leaves stay explicit`,
      );
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
