import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportTargets } from '../scripts/lib/package-targets.mjs';

const rootUrl = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const domGlobals = [
  'document',
  'window',
  'localStorage',
  'matchMedia',
  'CustomEvent',
  'HTMLElement',
  'Node',
];

function publicTargets(ext) {
  return [
    ...new Set(
      exportTargets(pkg)
        .map(([, target]) => target)
        .filter((target) => target.endsWith(ext) && !target.includes('*')),
    ),
  ].sort();
}

test('public JavaScript subpaths import without a DOM and do not create DOM globals', async () => {
  const previous = new Map(domGlobals.map((key) => [key, globalThis[key]]));
  for (const key of domGlobals) delete globalThis[key];

  try {
    const targets = publicTargets('.js');
    assert.ok(targets.length > 0, 'expected public JS targets');

    for (const target of targets) {
      const mod = await import(new URL(target, rootUrl));
      assert.ok(Object.keys(mod).length > 0, `${target} has public exports`);
    }

    for (const key of domGlobals) {
      assert.equal(globalThis[key], undefined, `${key} was not created during public imports`);
    }
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});

test('public JSON subpaths remain parseable data files', () => {
  const targets = publicTargets('.json');
  assert.ok(targets.length > 0, 'expected public JSON targets');

  for (const target of targets) {
    const parsed = JSON.parse(
      readFileSync(resolve(fileURLToPath(new URL(target, rootUrl))), 'utf8'),
    );
    assert.ok(parsed && typeof parsed === 'object', `${target} parses to an object`);
  }
});
