import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  importsAnnotationEngine,
  importsPackageSpecifier,
  isJavaScriptOrDeclarationFile,
} from '../scripts/lib/import-policy.mjs';

test('importsAnnotationEngine detects static imports and re-exports', () => {
  const sources = [
    "import '@ponchia/annotations';",
    "import { createAnnotation } from '@ponchia/annotations';",
    "import type { Annotation } from '@ponchia/annotations/types';",
    "export { createAnnotation } from '@ponchia/annotations';",
    "export * from '@ponchia/annotations/react';",
    ['import {', '  createAnnotation,', "} from '@ponchia/annotations/dom';"].join('\n'),
  ];

  for (const source of sources) {
    assert.equal(importsAnnotationEngine(source), true, source);
  }
});

test('importsAnnotationEngine detects dynamic imports', () => {
  assert.equal(importsAnnotationEngine("await import('@ponchia/annotations/dom');"), true);
});

test('importsAnnotationEngine detects declaration-file type references', () => {
  const sources = [
    "import type { AnnotationLayer } from '@ponchia/annotations/types';",
    "export type AnnotationLayer = import('@ponchia/annotations').AnnotationLayer;",
    "import annotations = require('@ponchia/annotations');",
    "declare module '@ponchia/annotations' { export interface Theme {} }",
    '/// <reference types="@ponchia/annotations" />',
    '/// <amd-dependency path="@ponchia/annotations/amd" />',
  ];

  for (const source of sources) {
    assert.equal(importsAnnotationEngine(source, 'annotations/index.d.ts'), true, source);
  }

  assert.equal(
    importsAnnotationEngine(
      "export type AnnotationLayer = import('@ponchia/annotations').AnnotationLayer;",
      'annotations/index.d.mts',
    ),
    true,
  );
});

test('importsAnnotationEngine detects CommonJS requires', () => {
  assert.equal(
    importsAnnotationEngine("const annotations = require('@ponchia/annotations');"),
    true,
  );
});

test('importsAnnotationEngine detects JSDoc type imports in shipped JavaScript', () => {
  const sources = [
    "/** @type {import('@ponchia/annotations').Layer} */\nconst layer = {};",
    "/** @typedef {import('@ponchia/annotations').Layer} Layer */",
    "/** @import { Layer } from '@ponchia/annotations' */",
    "/** @import * as annotations from '@ponchia/annotations' */",
    "/** @import annotations from '@ponchia/annotations' */",
  ];

  for (const source of sources) {
    assert.equal(importsAnnotationEngine(source, 'annotations/index.js'), true, source);
  }
});

test('importsAnnotationEngine ignores comments, strings, and adjacent packages', () => {
  const sources = [
    "// import '@ponchia/annotations';",
    "/*\nimport x from '@ponchia/annotations';\n*/",
    'const text = "await import(\'@ponchia/annotations\')";',
    'const text = "const x = require(\'@ponchia/annotations\')";',
    "import '@ponchia/ui/annotations';",
    "import { createAnnotation } from './annotations.js';",
    "import '@ponchia/annotations-extra';",
    "export type Local = import('./annotations.js').Local;",
    "declare module '@ponchia/annotations-extra' { export interface Theme {} }",
    '/// <reference types="@ponchia/annotations-extra" />',
    "/** @type {import('@ponchia/annotations-extra').Layer} */\nconst layer = {};",
    "/** @import { Layer } from '@ponchia/annotations-extra' */",
  ];

  for (const source of sources) {
    assert.equal(importsAnnotationEngine(source), false, source);
  }
});

test('importsPackageSpecifier can check another package boundary', () => {
  const source = "const module = await import('@example/toolkit/runtime');";
  assert.equal(importsPackageSpecifier(source, '@example/toolkit'), true);
  assert.equal(importsPackageSpecifier(source, '@example/tool'), false);
});

test('isJavaScriptOrDeclarationFile covers shipped JS, TS, JSX, and declaration forms', () => {
  for (const rel of [
    'index.js',
    'index.cjs',
    'index.mjs',
    'index.jsx',
    'index.ts',
    'index.cts',
    'index.mts',
    'index.tsx',
    'index.d.ts',
    'index.d.cts',
    'index.d.mts',
  ]) {
    assert.equal(isJavaScriptOrDeclarationFile(rel), true, rel);
  }

  assert.equal(isJavaScriptOrDeclarationFile('style.css'), false);
  assert.equal(isJavaScriptOrDeclarationFile('package.json'), false);
  assert.equal(isJavaScriptOrDeclarationFile('index.mjsx'), false);
  assert.equal(isJavaScriptOrDeclarationFile('index.ctsx'), false);
});
