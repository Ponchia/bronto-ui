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
import { playwrightImageFrom, visualContainerArgs } from './test-visual-container.mjs';

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

const imageTag = `mcr.microsoft.com/playwright:v${playwrightVersion}-jammy`;
let image;

for (const rel of [
  '.github/workflows/e2e.yml',
  '.github/workflows/visual-baselines.yml',
  '.github/workflows/examples.yml',
]) {
  try {
    const found = playwrightImageFrom(read(rel), playwrightVersion);
    if (image === undefined) image = found;
    else if (found !== image) errors.push(`${rel} pins ${found}, expected ${image}`);
  } catch (error) {
    errors.push(`${rel}: ${error.message}`);
  }
}

// Non-pixel WebKit has its own Ubuntu Noble image, pinned to the *same*
// Playwright version. Chromium snapshots and the local visual runner must
// remain tied to the original Jammy digest above.
try {
  const noble = playwrightImageFrom(
    read('.github/workflows/e2e-webkit-noble.yml'),
    playwrightVersion,
    'noble',
  );
  if (!noble.includes('@sha256:')) errors.push('WebKit Noble image must be digest-pinned');
} catch (error) {
  errors.push(`WebKit Noble browser workflow: ${error.message}`);
}
requireIncludes(
  '.github/workflows/e2e.yml',
  'uses: ./.github/workflows/e2e-webkit-noble.yml',
  'required WebKit reusable workflow',
);
requireIncludes(
  '.github/workflows/e2e.yml',
  'if: inputs.cross_engine',
  'WebKit conditional coverage',
);
requireIncludes(
  '.github/workflows/e2e.yml',
  '--project=chromium --project=firefox',
  'explicit Jammy browser project selection',
);
requireIncludes(
  '.github/workflows/e2e-webkit-noble.yml',
  '--project=webkit',
  'Noble nonpixel WebKit project selection',
);
requireIncludes(
  '.github/workflows/e2e-webkit-noble.yml',
  'shard: [1, 2, 3]',
  'Noble parity shard matrix',
);
requireIncludes(
  '.github/workflows/e2e-webkit-noble.yml',
  'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD',
  'Noble uses the image browser binaries',
);

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

// Inspect the actual local command arguments without invoking Docker.
try {
  const args = visualContainerArgs();
  const localImages = args.filter((arg) => arg.startsWith('mcr.microsoft.com/playwright:'));
  if (localImages.length !== 1 || localImages[0] !== image) {
    errors.push('local visual runner must use the same complete image digest as CI');
  }
  if (!args.some((arg) => arg.includes('test/e2e/visual.spec.mjs --project=chromium'))) {
    errors.push('local visual runner must target the Chromium visual spec');
  }
} catch (error) {
  errors.push(`local visual runner: ${error.message}`);
}
requireIncludes('CONTRIBUTING.md', 'npm run test:e2e:visual:container', 'local visual command');
requireIncludes('docs/release.md', 'npm run test:e2e:visual:container', 'release dry-run command');
requireIncludes(
  'docs/architecture.md',
  'npm run test:e2e:visual:container',
  'architecture runbook',
);
requireIncludes('playwright.config.mjs', imageTag, 'the pinned image in the visual warning');

reportAndExit(errors, {
  label: 'playwright container',
  ok: `@playwright/test ${playwrightVersion}, ${image}, visual/example workflows, docs, and local runner are aligned`,
});
