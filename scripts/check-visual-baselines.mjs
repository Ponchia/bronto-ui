/**
 * Static inventory gate for the Chromium visual baselines.
 *
 * Pixel comparison itself must run in the pinned Linux Playwright container,
 * but this local-safe gate catches silent coverage drift: adding/removing a
 * demo `data-shot` must add/remove the matching committed baseline files.
 *
 * Run: node scripts/check-visual-baselines.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const demoPath = resolve(root, 'demo/index.html');
const visualSpecPath = resolve(root, 'test/e2e/visual.spec.mjs');
const screenshotsDir = resolve(root, 'test/e2e/__screenshots__');
const errors = [];

const slugPattern = /^[a-z0-9][a-z0-9-]*$/;

function addExpected(expected, name, source) {
  const prior = expected.get(name);
  if (prior) {
    errors.push(`baseline ${name} is expected by both ${prior} and ${source}`);
  } else {
    expected.set(name, source);
  }
}

const dom = new JSDOM(readFileSync(demoPath, 'utf8'));
const shotNodes = [...dom.window.document.querySelectorAll('[data-shot]')];
if (!shotNodes.length) errors.push('demo/index.html declares no [data-shot] visual sections');

const expected = new Map();
const seenShots = new Map();
let rtlCount = 0;

for (const node of shotNodes) {
  const shot = node.getAttribute('data-shot')?.trim();
  const lineHint = `demo/index.html [data-shot="${shot}"]`;
  if (!shot) {
    errors.push('demo/index.html has an empty data-shot attribute');
    continue;
  }
  if (!slugPattern.test(shot)) {
    errors.push(`${lineHint} must be a lowercase kebab slug`);
  }
  const prior = seenShots.get(shot);
  if (prior) {
    errors.push(`${lineHint} duplicates ${prior}`);
    continue;
  }
  seenShots.set(shot, lineHint);
  addExpected(expected, `${shot}-dark.png`, `${lineHint} dark snapshot`);
  addExpected(expected, `${shot}-light.png`, `${lineHint} light snapshot`);
  if (node.hasAttribute('data-shot-rtl')) {
    rtlCount += 1;
    addExpected(expected, `${shot}-rtl.png`, `${lineHint} RTL snapshot`);
  }
}

const visualSpec = readFileSync(visualSpecPath, 'utf8');
for (const [label, needle] of [
  ['discovers visual sections from demo/index.html', "querySelectorAll('[data-shot]')"],
  ['derives RTL coverage from data-shot-rtl', "hasAttribute('data-shot-rtl')"],
  ['runs every discovered shot in both themes', "for (const theme of ['dark', 'light'])"],
  ['loops over the discovered shot list', 'for (const shot of shots)'],
  ['names per-theme screenshots from the shot slug', '`${shot}-${theme}.png`'],
  ['names RTL screenshots from the shot slug', '`${shot}-rtl.png`'],
  ['settles fonts/animations before screenshots', 'settleVisualState(page)'],
]) {
  if (!visualSpec.includes(needle)) {
    errors.push(`test/e2e/visual.spec.mjs no longer ${label}`);
  }
}

const fixedScreenshots = [
  ...visualSpec.matchAll(/toHaveScreenshot\(\s*['"]([^'"]+\.png)['"]/g),
].map((match) => match[1]);
for (const file of fixedScreenshots) {
  addExpected(expected, file, `literal toHaveScreenshot() in test/e2e/visual.spec.mjs`);
}

if (!existsSync(screenshotsDir)) {
  errors.push('test/e2e/__screenshots__ does not exist');
} else {
  const actual = new Set(
    readdirSync(screenshotsDir)
      .filter((name) => name.endsWith('.png'))
      .sort(),
  );
  for (const [file, source] of expected) {
    const path = resolve(screenshotsDir, file);
    if (!actual.has(file)) {
      errors.push(`${source} has no committed baseline file ${file}`);
    } else if (statSync(path).size === 0) {
      errors.push(`baseline file ${file} is empty`);
    }
  }
  for (const file of actual) {
    if (!expected.has(file)) {
      errors.push(`${file} is an orphan visual baseline with no data-shot or visual.spec owner`);
    }
  }
}

reportAndExit(errors, {
  label: 'visual baseline inventory',
  ok: `${shotNodes.length} demo shots, ${rtlCount} RTL shots, and ${fixedScreenshots.length} fixed dialog baselines are aligned`,
});
