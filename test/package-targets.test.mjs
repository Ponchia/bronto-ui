import test from 'node:test';
import assert from 'node:assert/strict';
import { exportTargetFiles, exportTargets } from '../scripts/lib/package-targets.mjs';

test('exportTargets flattens string and conditional export leaves', () => {
  const pkg = {
    exports: {
      '.': './dist/bronto.css',
      './react': {
        types: './react/index.d.ts',
        default: './react/index.js',
      },
      './nested': {
        browser: {
          development: './nested/dev.js',
          production: './nested/prod.js',
        },
      },
    },
  };

  assert.deepEqual(exportTargets(pkg), [
    ['.', './dist/bronto.css'],
    ['./react (types)', './react/index.d.ts'],
    ['./react (default)', './react/index.js'],
    ['./nested (browser.development)', './nested/dev.js'],
    ['./nested (browser.production)', './nested/prod.js'],
  ]);
});

test('exportTargetFiles returns sorted concrete files and skips wildcard targets', () => {
  const pkg = {
    exports: {
      './tokens': {
        types: './tokens/index.d.ts',
        default: './tokens/index.js',
      },
      './tokens-again': './tokens/index.js',
      './fonts/*': './fonts/*',
    },
  };

  assert.deepEqual(exportTargetFiles(pkg), ['tokens/index.d.ts', 'tokens/index.js']);
});
