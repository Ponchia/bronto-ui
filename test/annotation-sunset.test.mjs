/**
 * Freeze the deprecated Bronto UI annotation surface.
 *
 * During the 0.17 deprecation window, none of the existing exports disappear,
 * no new annotation engine functionality should be added to UI, and the
 * independent package must never become a UI runtime/peer dependency.
 * Remove this gate alongside the API in the 0.18 breaking change.
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
  assert.match(css, /Deprecated in the planned 0\.17 minor/);
  assert.match(migration, /0\.18/);
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
