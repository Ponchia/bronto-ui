/**
 * Freeze the deprecated Bronto UI annotation surface.
 *
 * Deprecated in 0.17 and retained in 0.19, none of the existing exports disappear,
 * no new annotation engine functionality should be added to UI, and the
 * independent package must never become a UI runtime/peer dependency.
 * Remove this gate alongside the API only in a separate breaking minor,
 * 0.20 or later, after consumer acceptance. A 0.19 patch keeps compatibility.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const pkg = JSON.parse(read('package.json'));

const legacyHelpers = [
  'annotationParts',
  'annotationTransform',
  'axisThresholdPath',
  'bandSubjectPath',
  'bracketSubjectPath',
  'circleSubjectPath',
  'comparisonBracePath',
  'connectorCurve',
  'connectorElbow',
  'connectorEndArrow',
  'connectorEndDot',
  'connectorLine',
  'declutterLabels',
  'directLabels',
  'evidenceMarkerPath',
  'notePlacement',
  'noteTransform',
  'outlierClusterPath',
  'rectSubjectPath',
  'slopeSubjectPath',
  'thresholdPath',
  'timelineEventPath',
];

test('old public annotation functions are frozen and individually deprecated', () => {
  const source = read('annotations/index.js');
  const declarations = [...source.matchAll(/\/\*\*([\s\S]*?)\*\/\s*export function (\w+)/g)];
  assert.deepEqual(
    declarations.map((match) => match[2]).sort(),
    [...legacyHelpers].sort(),
    'do not add new geometry helpers or silently remove old ones during the migration window',
  );
  for (const [, doc, name] of declarations) {
    assert.match(doc, /\* @deprecated\b/, `${name}: editor-visible deprecation is required`);
    assert.match(doc, /@ponchia\/annotations/, `${name}: point to new ownership`);
  }
});

test('CSS remains compatible but marked for removal', () => {
  const css = read('css/annotations.css');
  const migration = read('docs/migrations/0.16-to-0.17.md');
  assert.match(css, /Deprecated in 0\.17 and retained in 0\.19/);
  assert.match(css, /0\.20 or later, after consumer acceptance/);
  assert.match(migration, /0\.20 or later/);
  assert.match(migration, /after consumer\s+acceptance/);
  assert.match(migration, /A patch release cannot remove this surface/);
  assert.match(migration, /@ponchia\/annotations\/bronto\.css/);
  assert.ok(pkg.exports['./annotations'], 'do not remove the legacy export before the next minor');
  assert.ok(pkg.exports['./css/annotations.css']);
});

test('UI does not depend on or re-export the annotation engine', () => {
  for (const kind of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    assert.equal(pkg[kind]?.['@ponchia/annotations'], undefined);
  }
  assert.equal(read('annotations/index.js').includes("from '@ponchia/annotations'"), false);
  assert.equal(read('css/annotations.css').includes('@import'), false);
});

test('independent example consumes annotation-owned APIs without legacy roll-ups', () => {
  const example = JSON.parse(read('examples/annotations-vite/package.json'));
  const source = read('examples/annotations-vite/src/main.js');
  assert.equal(example.dependencies['@ponchia/annotations'], '0.9.2');
  assert.match(source, /from '@ponchia\/annotations'/);
  assert.match(source, /@ponchia\/annotations\/bronto\.css/);
  assert.doesNotMatch(
    source,
    /@ponchia\/ui\/(?:annotations|css\/(?:annotations|analytical|report-kit)\.css)/,
  );
});
