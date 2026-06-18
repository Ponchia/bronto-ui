// Gate: every shipped CSS leaf is either a foundation layer or has explicit
// docs/demo/e2e ownership. This is a coverage map, not a behavioral test; the
// referenced Playwright/unit specs own the actual assertions.
//
// Run: node scripts/check-component-matrix.mjs
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverNonPixelE2eSpecs } from './lib/e2e-specs.mjs';
import { reportAndExit } from './lib/gate-report.mjs';
import { cssLeaves } from './lib/css-leaves.mjs';
import { checkOwnerProof, createTextReader, relExists } from './lib/ownership-proof.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const text = createTextReader(root);
const pkg = JSON.parse(text('package.json'));
const errors = [];
const nonPixelE2eSpecs = new Set(discoverNonPixelE2eSpecs(root));

const FOUNDATIONS = [
  foundation('analytical', {
    docs: ['docs/stability.md'],
    demos: ['demo/index.html'],
    proofs: [
      { file: 'test/analytical-boundary.test.mjs', includes: ['analytical behaviors stay'] },
      { file: 'scripts/check-dist.mjs', includes: ['analytical.css'] },
    ],
  }),
  foundation('app', {
    docs: [doc('docs/usage.md', ['ui-app-shell'])],
    demos: ['demo/service.html'],
    specs: [{ file: 'test/e2e/responsive.spec.mjs', includes: ['app-shell collapse'] }],
  }),
  foundation('base', {
    docs: ['docs/package-contract.md'],
    specs: [
      {
        file: 'test/e2e/modes.spec.mjs',
        includes: ['forced-colors: the keyboard focus ring is re-asserted'],
      },
    ],
  }),
  foundation('content', {
    docs: [doc('docs/reference.md', ['.ui-prose'])],
    demos: ['demo/index.html'],
    specs: [{ file: 'test/e2e/modes.spec.mjs', includes: ['print: chrome is hidden'] }],
    shots: ['prose'],
  }),
  foundation('core', {
    docs: ['docs/package-contract.md'],
    proofs: [
      { file: 'scripts/check-dist.mjs', includes: ['dist/ is the fresh'] },
      { file: 'scripts/check-exports.mjs', includes: ['package.json "style"'] },
    ],
  }),
  foundation('dataviz', {
    docs: ['docs/usage.md'],
    demos: ['demo/index.html'],
    proofs: [
      { file: 'scripts/check-charts.mjs', includes: ['Distinguishability'] },
      { file: 'test/charts.test.mjs', includes: ['generated charts.json carries'] },
    ],
    specs: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['OKLCH accent ramp resolves'] }],
  }),
  foundation('disclosure', {
    docs: ['docs/package-contract.md'],
    specs: [{ file: 'test/e2e/a11y.spec.mjs', includes: ['disclosure toggles'] }],
  }),
  foundation('feedback', {
    docs: [doc('docs/reference.md', ['.ui-alert', '.ui-toast'])],
    demos: ['demo/index.html'],
    specs: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['toast behavior creates'] }],
    shots: ['alerts'],
  }),
  foundation('fonts', {
    docs: ['docs/package-contract.md'],
    proofs: [
      { file: 'scripts/check-pack.mjs', includes: ['expected exported package file missing'] },
      { file: 'test/resolved.test.mjs', includes: ['Doto'] },
    ],
  }),
  foundation('forms', {
    docs: ['docs/package-contract.md'],
    demos: ['demo/index.html'],
    specs: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['form validation uses native'] }],
    shots: ['form'],
  }),
  foundation('motion', {
    docs: ['docs/package-contract.md'],
    specs: [
      { file: 'test/e2e/modes.spec.mjs', includes: ['prefers-reduced-motion'] },
      {
        file: 'test/e2e/motion.spec.mjs',
        includes: ['popover enters from @starting-style'],
      },
    ],
  }),
  foundation('overlay', {
    docs: ['docs/package-contract.md'],
    demos: ['demo/index.html'],
    specs: [{ file: 'test/e2e/responsive.spec.mjs', includes: ['overlays at small viewport'] }],
    shots: ['overlay'],
  }),
  foundation('primitives', {
    docs: [doc('docs/reference.md', ['.ui-button', '.ui-card'])],
    demos: ['demo/index.html'],
    specs: [{ file: 'test/e2e/responsive.spec.mjs', includes: ['coarse-pointer touch targets'] }],
    shots: ['buttons', 'cards'],
  }),
  foundation('site', {
    docs: [doc('docs/reference.md', ['.ui-siteheader', '.ui-sitenav'])],
    demos: ['demo/index.html'],
    specs: [{ file: 'test/e2e/responsive.spec.mjs', includes: ['site nav folds'] }],
    shots: ['site-shell'],
  }),
  foundation('skins', {
    docs: ['docs/package-contract.md'],
    proofs: [
      { file: 'scripts/check-skins.mjs', includes: ['colorways in sync'] },
      { file: 'test/skins.test.mjs', includes: ['every skin defines --accent'] },
    ],
  }),
  foundation('table', {
    docs: [doc('docs/reference.md', ['.ui-table'])],
    demos: ['demo/index.html'],
    specs: [{ file: 'test/e2e/behavior.spec.mjs', includes: ['sortable selectable table'] }],
    shots: ['table'],
  }),
  foundation('tokens', {
    docs: ['docs/reference.md'],
    proofs: [
      { file: 'test/tokens.test.mjs', includes: ['cssVars mirror'] },
      { file: 'scripts/check-contrast.mjs', includes: ['core palette'] },
    ],
  }),
];

const SURFACES = [
  surface('annotations', {
    docs: ['docs/annotations.md'],
    demos: ['demo/annotations.html'],
    specs: [{ file: 'test/e2e/annotations.spec.mjs', includes: ['annotation specimen renders'] }],
  }),
  surface('bullet', {
    docs: ['docs/bullet.md'],
    demos: ['demo/bullet.html'],
    specs: [{ file: 'test/e2e/bullet.spec.mjs', includes: ['bullet paints the measure bar'] }],
  }),
  surface('clamp', {
    docs: ['docs/clamp.md'],
    demos: ['demo/clamp.html'],
    specs: [{ file: 'test/e2e/report-primitives.spec.mjs', includes: ['ui-clamp toggles'] }],
  }),
  surface('code', {
    docs: ['docs/code.md'],
    demos: ['demo/code.html'],
    specs: [{ file: 'test/e2e/code.spec.mjs', includes: ['numbered code renders'] }],
  }),
  surface('command', {
    docs: ['docs/command.md'],
    demos: ['demo/command.html'],
    specs: [{ file: 'test/e2e/command.spec.mjs', includes: ['typing filters the list'] }],
  }),
  surface('connectors', {
    docs: ['docs/connectors.md'],
    demos: ['demo/connectors.html'],
    specs: [{ file: 'test/e2e/connectors.spec.mjs', includes: ['draws a non-empty path'] }],
  }),
  surface('crosshair', {
    docs: ['docs/crosshair.md'],
    demos: ['demo/crosshair.html'],
    specs: [{ file: 'test/e2e/crosshair.spec.mjs', includes: ['crosshair activates'] }],
  }),
  surface('diff', {
    docs: ['docs/diff.md'],
    demos: ['demo/diff.html'],
    specs: [{ file: 'test/e2e/diff.spec.mjs', includes: ['renders rows'] }],
  }),
  surface('dots', {
    docs: [doc('docs/dots.md', ['.ui-dotmatrix', '.ui-waffle'])],
    demos: ['demo/dots.html'],
    specs: [{ file: 'test/e2e/render-geometry.spec.mjs', includes: ['dot data surfaces paint'] }],
  }),
  surface('figure', {
    docs: ['docs/figure.md'],
    demos: ['demo/figure.html'],
    specs: [{ file: 'test/e2e/report-primitives.spec.mjs', includes: ['ui-figure lays out'] }],
  }),
  surface('generated', {
    docs: ['docs/generated.md'],
    demos: ['demo/generated.html'],
    specs: [{ file: 'test/e2e/quality.spec.mjs', includes: ['generated.css'] }],
  }),
  surface('highlights', {
    docs: ['docs/highlights.md'],
    demos: ['demo/highlights.html'],
    specs: [{ file: 'test/e2e/report-primitives.spec.mjs', includes: ['ui-highlights registers'] }],
  }),
  surface('interval', {
    docs: ['docs/interval.md'],
    demos: ['demo/interval.html'],
    specs: [{ file: 'test/e2e/report-primitives.spec.mjs', includes: ['ui-interval paints'] }],
  }),
  surface('legend', {
    docs: ['docs/legends.md'],
    demos: ['demo/legends.html'],
    specs: [{ file: 'test/e2e/legends.spec.mjs', includes: ['renders every key type'] }],
  }),
  surface('marks', {
    docs: ['docs/marks.md'],
    demos: ['demo/marks.html'],
    specs: [{ file: 'test/e2e/marks.spec.mjs', includes: ['renders marks'] }],
  }),
  surface('navigation', {
    docs: [doc('docs/usage.md', ['ui-sitenav', 'ui-app-nav'])],
    demos: ['demo/index.html'],
    specs: [
      { file: 'test/e2e/modes.spec.mjs', includes: ['active app-nav link'] },
      { file: 'test/e2e/responsive.spec.mjs', includes: ['site nav folds'] },
    ],
    shots: ['navigation'],
  }),
  surface('report', {
    docs: ['docs/reporting.md'],
    demos: ['demo/report.html', 'demo/version-history-report.html'],
    specs: [
      { file: 'test/e2e/report.spec.mjs', includes: ['report fixture passes axe'] },
      { file: 'test/e2e/report-standalone.spec.mjs', includes: ['standalone report'] },
    ],
    shots: ['report-semantics'],
  }),
  surface('report-kit', {
    docs: ['docs/reporting.md'],
    demos: ['demo/report.html', 'demo/report-standalone.html'],
    specs: [
      { file: 'test/e2e/report-print.spec.mjs', includes: ['print media demotes'] },
      { file: 'test/e2e/render-geometry.spec.mjs', includes: ['report-kit does not turn'] },
    ],
  }),
  surface('selection', {
    docs: ['docs/selection.md'],
    demos: ['demo/selection.html'],
    specs: [{ file: 'test/e2e/selection.spec.mjs', includes: ['selection specimen passes axe'] }],
  }),
  surface('sidenote', {
    docs: ['docs/sidenote.md'],
    demos: ['demo/sidenote.html'],
    specs: [{ file: 'test/e2e/sidenote.spec.mjs', includes: ['sidenotes are numbered'] }],
  }),
  surface('sources', {
    docs: ['docs/sources.md'],
    demos: ['demo/sources.html'],
    specs: [
      { file: 'test/e2e/report-primitives.spec.mjs', includes: ['source trust marks'] },
      { file: 'test/e2e/render-geometry.spec.mjs', includes: ['standalone .ui-src pill'] },
    ],
  }),
  surface('spark', {
    docs: ['docs/spark.md'],
    demos: ['demo/spark.html'],
    specs: [{ file: 'test/e2e/spark.spec.mjs', includes: ['bar height tracks'] }],
  }),
  surface('spotlight', {
    docs: ['docs/spotlight.md'],
    demos: ['demo/spotlight.html'],
    specs: [{ file: 'test/e2e/spotlight.spec.mjs', includes: ['cutout to the target'] }],
  }),
  surface('state', {
    docs: ['docs/state.md'],
    demos: ['demo/state.html', 'demo/service.html'],
    specs: [{ file: 'test/e2e/state.spec.mjs', includes: ['job progress bar tracks'] }],
  }),
  surface('term', {
    docs: ['docs/term.md'],
    demos: ['demo/term.html'],
    specs: [{ file: 'test/e2e/term.spec.mjs', includes: ['term popover opens'] }],
  }),
  surface('textref', {
    docs: ['docs/textref.md'],
    demos: ['demo/textref.html'],
    specs: [{ file: 'test/e2e/textref.spec.mjs', includes: ['textref link carries'] }],
  }),
  surface('toc', {
    docs: ['docs/toc.md'],
    demos: ['demo/toc.html'],
    specs: [{ file: 'test/e2e/toc.spec.mjs', includes: ['rail is sticky'] }],
  }),
  surface('tree', {
    docs: ['docs/tree.md'],
    demos: ['demo/tree.html'],
    specs: [{ file: 'test/e2e/tree.spec.mjs', includes: ['branches are native'] }],
  }),
  surface('workbench', {
    docs: ['docs/workbench.md'],
    demos: ['demo/workbench.html'],
    specs: [{ file: 'test/e2e/workbench.spec.mjs', includes: ['splitter exposes'] }],
  }),
];

function surface(css, options) {
  return { css, shots: [], ...options };
}

function foundation(css, options) {
  return { css, docs: [], demos: [], specs: [], proofs: [], shots: [], ...options };
}

function doc(file, includes) {
  return { file, includes };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function jsStringArrayValues(rel, name) {
  const body = text(rel);
  const pattern = 'const\\s+' + escapeRegExp(name) + '\\s*=\\s*\\[([\\s\\S]*?)\\];';
  const match = new RegExp(pattern).exec(body);
  if (!match) {
    errors.push(`${rel} is missing ${name} array`);
    return [];
  }
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((item) => item[1]);
}

const surfacesByCss = new Map();
for (const entry of SURFACES) {
  const owner = surfacesByCss.get(entry.css);
  if (owner) errors.push(`css/${entry.css}.css is owned by both ${owner} and ${entry.css}`);
  surfacesByCss.set(entry.css, entry.css);
}

const foundationsByCss = new Map();
for (const entry of FOUNDATIONS) {
  const owner = foundationsByCss.get(entry.css);
  if (owner) errors.push(`css/${entry.css}.css is owned by both ${owner} and ${entry.css}`);
  foundationsByCss.set(entry.css, entry.css);
}

const leaves = new Set(cssLeaves(pkg));
const showcaseDemoNames = jsStringArrayValues('test/e2e/demos.spec.mjs', 'SHOWCASE');
const guardOnlyDemoNames = jsStringArrayValues('test/e2e/demos.spec.mjs', 'GUARD_ONLY');
const demoSweepNameList = [...showcaseDemoNames, ...guardOnlyDemoNames];
const demoSweepNames = new Set(demoSweepNameList);
const publicLeafDemos = readdirSync(resolve(root, 'demo'))
  .filter((file) => file.endsWith('.html'))
  .map((file) => file.replace(/\.html$/, ''))
  .filter((name) => name !== 'index')
  .sort((a, b) => a.localeCompare(b));

function demoName(demoPath) {
  return demoPath.replace(/^demo\//, '').replace(/\.html$/, '');
}

function demoCounts(names) {
  const counts = new Map();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return counts;
}

for (const name of demoSweepNameList) {
  if (!relExists(root, `demo/${name}.html`)) {
    errors.push(`test/e2e/demos.spec.mjs sweeps missing demo/${name}.html`);
  }
}
for (const name of publicLeafDemos) {
  if (!demoSweepNames.has(name)) {
    errors.push(
      `demo/${name}.html is not classified in test/e2e/demos.spec.mjs SHOWCASE or GUARD_ONLY`,
    );
  }
}
for (const [name, duplicateCount] of demoCounts(demoSweepNameList)) {
  if (duplicateCount > 1) {
    errors.push(`test/e2e/demos.spec.mjs classifies demo/${name}.html ${duplicateCount} times`);
  }
  if (name === 'index') {
    errors.push('demo/index.html is the kitchen-sink page and must not be a leaf demo sweep entry');
  }
}

for (const leaf of leaves) {
  if (foundationsByCss.has(leaf) && surfacesByCss.has(leaf)) {
    errors.push(`css/${leaf}.css is classified as both foundation and component surface`);
  }
  if (!foundationsByCss.has(leaf) && !surfacesByCss.has(leaf)) {
    errors.push(`css/${leaf}.css is not classified as foundation or component surface`);
  }
}
for (const leaf of foundationsByCss.keys()) {
  if (!leaves.has(leaf)) errors.push(`foundation row names missing css/${leaf}.css`);
}
for (const { css, docs, demos, specs, proofs, shots } of FOUNDATIONS) {
  if (!leaves.has(css)) errors.push(`foundation row names missing css/${css}.css`);
  if (!specs?.length && !proofs?.length) {
    errors.push(`css/${css}.css foundation row has no executable proof owner`);
  }

  checkOwnerProof({
    root,
    errors,
    text,
    subject: `css/${css}.css foundation`,
    kind: 'docs',
    items: docs,
    fallbackIncludes: [`css/${css}.css`],
    missingOwnerMessage: `css/${css}.css foundation row has no docs owner`,
    missingFileMessage: (owner) => `css/${css}.css foundation docs owner is missing: ${owner.file}`,
    missingNeedleMessage: (owner, needle) =>
      `css/${css}.css foundation docs owner ${owner.file} does not contain "${needle}"`,
  });
  for (const demo of demos ?? []) {
    if (!relExists(root, demo))
      errors.push(`css/${css}.css foundation demo owner is missing: ${demo}`);
    else if (demo !== 'demo/index.html') {
      const name = demoName(demo);
      if (!demoSweepNames.has(name)) {
        errors.push(
          `css/${css}.css foundation demo owner ${demo} is not swept by test/e2e/demos.spec.mjs SHOWCASE/GUARD_ONLY`,
        );
      }
    }
  }
  if (specs?.length) {
    checkOwnerProof({
      root,
      errors,
      text,
      subject: `css/${css}.css foundation`,
      kind: 'proof',
      items: specs,
      missingFileMessage: (owner) =>
        `css/${css}.css foundation spec owner is missing: ${owner.file}`,
      missingNeedleMessage: (owner, needle) =>
        `css/${css}.css foundation proof ${owner.file} does not contain "${needle}"`,
      validateItem(owner) {
        if (!nonPixelE2eSpecs.has(owner.file)) {
          errors.push(
            `css/${css}.css foundation proof ${owner.file} is not a non-pixel Playwright spec discovered by scripts/test-e2e-nonpixel.mjs`,
          );
        }
      },
    });
  }
  if (proofs?.length) {
    checkOwnerProof({
      root,
      errors,
      text,
      subject: `css/${css}.css foundation`,
      kind: 'proof',
      items: proofs,
      missingFileMessage: (owner) =>
        `css/${css}.css foundation proof owner is missing: ${owner.file}`,
      missingNeedleMessage: (owner, needle) =>
        `css/${css}.css foundation proof ${owner.file} does not contain "${needle}"`,
    });
  }
  for (const shot of shots ?? []) {
    const demoIndex = text('demo/index.html');
    if (!demoIndex.includes(`data-shot="${shot}"`)) {
      errors.push(
        `css/${css}.css foundation visual owner missing data-shot="${shot}" in demo/index.html`,
      );
    }
    for (const theme of ['dark', 'light']) {
      const screenshot = `test/e2e/__screenshots__/${shot}-${theme}.png`;
      if (!relExists(root, screenshot)) {
        errors.push(`css/${css}.css foundation visual owner is missing ${screenshot}`);
      }
    }
  }
}
for (const { css, docs, demos, specs, shots } of SURFACES) {
  if (!leaves.has(css)) errors.push(`component row names missing css/${css}.css`);
  if (!demos?.length) errors.push(`css/${css}.css has no demo owner`);

  checkOwnerProof({
    root,
    errors,
    text,
    subject: `css/${css}.css`,
    kind: 'docs',
    items: docs,
    fallbackIncludes: [`css/${css}.css`],
    missingFileMessage: (owner) => `css/${css}.css docs owner is missing: ${owner.file}`,
  });
  for (const demo of demos ?? []) {
    if (!relExists(root, demo)) errors.push(`css/${css}.css demo owner is missing: ${demo}`);
    else if (demo !== 'demo/index.html') {
      const name = demoName(demo);
      if (!demoSweepNames.has(name)) {
        errors.push(
          `css/${css}.css demo owner ${demo} is not swept by test/e2e/demos.spec.mjs SHOWCASE/GUARD_ONLY`,
        );
      }
    }
  }
  checkOwnerProof({
    root,
    errors,
    text,
    subject: `css/${css}.css`,
    kind: 'executable spec',
    items: specs,
    missingOwnerMessage: `css/${css}.css has no executable spec owner`,
    missingFileMessage: (owner) => `css/${css}.css spec owner is missing: ${owner.file}`,
    missingNeedleMessage: (owner, needle) =>
      `css/${css}.css proof ${owner.file} does not contain "${needle}"`,
    validateItem(owner) {
      if (!nonPixelE2eSpecs.has(owner.file)) {
        errors.push(
          `css/${css}.css proof ${owner.file} is not a non-pixel Playwright spec discovered by scripts/test-e2e-nonpixel.mjs`,
        );
      }
    },
  });
  for (const shot of shots ?? []) {
    const demoIndex = text('demo/index.html');
    if (!demoIndex.includes(`data-shot="${shot}"`)) {
      errors.push(`css/${css}.css visual owner missing data-shot="${shot}" in demo/index.html`);
    }
    for (const theme of ['dark', 'light']) {
      const screenshot = `test/e2e/__screenshots__/${shot}-${theme}.png`;
      if (!relExists(root, screenshot)) {
        errors.push(`css/${css}.css visual owner is missing ${screenshot}`);
      }
    }
  }
}

reportAndExit(errors, {
  label: 'component matrix',
  ok:
    `${FOUNDATIONS.length} foundation CSS leaves and ${SURFACES.length} ` +
    'component surface leaves have explicit exported-surface ownership',
});
