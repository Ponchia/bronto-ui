/**
 * Gate the OS-sensitive Playwright visual baseline contract.
 *
 * Pixel baselines are meaningful only when @playwright/test, the CI container,
 * the baseline-regeneration workflow, and the local container runner all point
 * at the same browser build. Keep that lockstep machine-checked instead of
 * relying on release notes or memory.
 *
 * Run: node scripts/check-playwright-container.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
}

function requireIncludes(rel, needle, label) {
  if (!read(rel).includes(needle)) {
    errors.push(`${rel} does not contain ${label}: ${needle}`);
  }
}

const pkg = JSON.parse(read('package.json'));
const playwrightVersion = pkg.devDependencies?.['@playwright/test'];
if (!/^\d+\.\d+\.\d+$/.test(playwrightVersion ?? '')) {
  errors.push(
    `package.json devDependency @playwright/test must be an exact x.y.z version, got ${
      playwrightVersion ?? '<missing>'
    }`,
  );
}

const image = `mcr.microsoft.com/playwright:v${playwrightVersion}-jammy`;

for (const rel of [
  '.github/workflows/e2e.yml',
  '.github/workflows/visual-baselines.yml',
  '.github/workflows/examples.yml',
]) {
  const body = read(rel);
  const images = [...body.matchAll(/mcr\.microsoft\.com\/playwright:v[\d.]+-jammy/g)].map(
    (match) => match[0],
  );
  if (!images.length) {
    errors.push(`${rel} has no pinned Playwright container image`);
    continue;
  }
  for (const found of images) {
    if (found !== image) errors.push(`${rel} pins ${found}, expected ${image}`);
  }
}

// Example consumers run against the same preinstalled browser binaries.
// Reintroducing npx playwright install on hosted runners burns minutes and
// previously cancelled an otherwise green tagged release.
const exampleWorkflow = read('.github/workflows/examples.yml');
if (/^\s*run:\s*npx playwright install/m.test(exampleWorkflow)) {
  errors.push('examples.yml must not download browsers independently of its pinned container');
}
requireIncludes('.github/workflows/examples.yml', 'HOME: /root', 'Firefox HOME ownership');
requireIncludes(
  '.github/workflows/examples.yml',
  'shell: bash',
  'Bash array syntax in the example smoke',
);
requireIncludes(
  '.github/workflows/examples.yml',
  'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD',
  'packed example browser-download skip',
);

if (pkg.scripts?.['test:e2e:visual:container'] !== 'node scripts/test-visual-container.mjs') {
  errors.push(
    'package.json test:e2e:visual:container must run node scripts/test-visual-container.mjs',
  );
}

requireIncludes(
  'scripts/test-visual-container.mjs',
  'mcr.microsoft.com/playwright:v${playwrightVersion}-jammy',
  'the derived pinned container image',
);
requireIncludes(
  'scripts/test-visual-container.mjs',
  'test/e2e/visual.spec.mjs',
  'the visual spec target',
);
requireIncludes('CONTRIBUTING.md', 'npm run test:e2e:visual:container', 'local visual command');
requireIncludes('docs/release.md', 'npm run test:e2e:visual:container', 'release dry-run command');
requireIncludes(
  'docs/architecture.md',
  'npm run test:e2e:visual:container',
  'architecture runbook',
);
requireIncludes('playwright.config.mjs', image, 'the pinned image in the visual warning');

reportAndExit(errors, {
  label: 'playwright container',
  ok: `@playwright/test ${playwrightVersion}, ${image}, visual/example workflows, docs, and local runner are aligned`,
});
