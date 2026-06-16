// Gate: every public helper export in the pure helper modules has explicit
// docs, unit-test, and type-test ownership. The behavior matrix owns DOM init*
// exports and the component matrix owns CSS leaves; this owns the JS class,
// geometry, and rendering helper APIs so a new exported helper cannot ship as
// an undocumented, untested, or untyped surface.
//
// Run: node scripts/check-helper-matrix.mjs
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const textCache = new Map();

const MODULES = [
  helperModule('classes', {
    source: 'classes/index.js',
    docs: 'docs/stability.md',
    unit: 'test/classes.test.mjs',
    types: 'test/types.test-d.ts',
    helpers: ['attrs', 'cls', 'cx', 'ui'],
  }),
  helperModule('annotations', {
    source: 'annotations/index.js',
    docs: 'docs/annotations.md',
    unit: 'test/annotations.test.mjs',
    types: 'test/types.test-d.ts',
    helpers: [
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
    ],
  }),
  helperModule('connectors', {
    source: 'connectors/index.js',
    docs: 'docs/connectors.md',
    unit: 'test/connectors.test.mjs',
    types: 'test/types.test-d.ts',
    helpers: [
      'PRECISION',
      'anchorPoint',
      'angleBetween',
      'arrowHead',
      'autoSides',
      'clamp',
      'connectRects',
      'connectorPath',
      'curvePath',
      'dimension',
      'dotMark',
      'elbowPath',
      'endTangentAngle',
      'finite',
      'fmt',
      'point',
      'rectPath',
      'roundNumber',
      'straightPath',
    ],
  }),
  helperModule('glyphs', {
    source: 'glyphs/glyphs.js',
    docs: 'docs/glyphs.md',
    unit: 'test/glyphs.test.mjs',
    types: 'test/types.test-d.ts',
    helpers: [
      'GLYPHS',
      'GLYPH_NAMES',
      'GLYPH_SIZE',
      'GLYPH_TAGS',
      'findGlyphs',
      'glyph',
      'glyphCells',
      'glyphMask',
      'renderGlyph',
      'renderReadout',
    ],
  }),
];

const ARCHITECTURE_ROW =
  'every public helper export in `classes`/`annotations`/`connectors`/`glyphs` has explicit docs, unit-test, and type-test ownership';

function helperModule(name, options) {
  return { name, ...options };
}

function text(rel) {
  if (!textCache.has(rel)) textCache.set(rel, readFileSync(resolve(root, rel), 'utf8'));
  return textCache.get(rel);
}

function withoutImportDeclarations(source) {
  return source.replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, '');
}

function hasWord(haystack, needle) {
  return new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(haystack);
}

if (!text('docs/architecture.md').includes(ARCHITECTURE_ROW)) {
  errors.push('docs/architecture.md does not describe the helper matrix type-test invariant');
}

for (const entry of MODULES) {
  const abs = resolve(root, entry.source);
  if (!existsSync(abs)) {
    errors.push(`${entry.name} helper source is missing: ${entry.source}`);
    continue;
  }

  const mod = await import(pathToFileURL(abs));
  const exported = new Set(Object.keys(mod).filter((name) => name !== 'default'));
  const owned = new Set(entry.helpers);

  for (const name of [...exported].sort()) {
    if (!owned.has(name)) {
      errors.push(`${entry.name}: ${name} is exported from ${entry.source} but not matrix-owned`);
    }
  }
  for (const name of [...owned].sort()) {
    if (!exported.has(name)) {
      errors.push(`${entry.name}: ${name} is matrix-owned but not exported from ${entry.source}`);
    }
  }

  for (const owner of [entry.docs, entry.unit, entry.types]) {
    if (!existsSync(resolve(root, owner))) {
      errors.push(`${entry.name}: owner file is missing: ${owner}`);
    }
  }
  if (
    !existsSync(resolve(root, entry.docs)) ||
    !existsSync(resolve(root, entry.unit)) ||
    !existsSync(resolve(root, entry.types))
  )
    continue;

  const docs = text(entry.docs);
  const unit = withoutImportDeclarations(text(entry.unit));
  const types = withoutImportDeclarations(text(entry.types));
  for (const name of entry.helpers) {
    if (!hasWord(docs, name)) {
      errors.push(`${entry.name}: ${name} is exported but not documented in ${entry.docs}`);
    }
    if (!hasWord(unit, name)) {
      errors.push(`${entry.name}: ${name} is exported but has no unit proof in ${entry.unit}`);
    }
    if (!hasWord(types, name)) {
      errors.push(`${entry.name}: ${name} is exported but has no type proof in ${entry.types}`);
    }
  }
}

reportAndExit(errors, {
  label: 'helper matrix',
  ok: `${MODULES.reduce(
    (sum, entry) => sum + entry.helpers.length,
    0,
  )} public helper export(s) have docs, unit, and type ownership`,
});
