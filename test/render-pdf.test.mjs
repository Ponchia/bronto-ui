import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../scripts/render-pdf.mjs';

// Regression guard for the arg-drop bug: when `--out` was absent, `indexOf`
// returned -1, `outIdx + 1` was 0, and the filter silently dropped the first
// input — so the documented `report:pdf -- report.html` rendered nothing.
test('keeps the first input when --out is absent (the documented one-arg case)', () => {
  assert.deepEqual(parseArgs(['report.html']), { outDir: null, inputs: ['report.html'] });
});

test('keeps every input when --out is absent', () => {
  assert.deepEqual(parseArgs(['a.html', 'b.html', 'c.html']), {
    outDir: null,
    inputs: ['a.html', 'b.html', 'c.html'],
  });
});

test('parses --out and drops only its value, keeping all inputs', () => {
  assert.deepEqual(parseArgs(['a.html', 'b.html', '--out', 'pdfs']), {
    outDir: 'pdfs',
    inputs: ['a.html', 'b.html'],
  });
});

test('parses --out placed before the inputs', () => {
  assert.deepEqual(parseArgs(['--out', 'pdfs', 'a.html', 'b.html']), {
    outDir: 'pdfs',
    inputs: ['a.html', 'b.html'],
  });
});

test('no inputs yields an empty list (caller prints usage and exits)', () => {
  assert.deepEqual(parseArgs([]), { outDir: null, inputs: [] });
  assert.deepEqual(parseArgs(['--out', 'pdfs']), { outDir: 'pdfs', inputs: [] });
});
