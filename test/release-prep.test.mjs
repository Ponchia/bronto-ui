import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repinVersionLiterals, dateChangelogHeading } from '../scripts/release-prep.mjs';

test('repins every exact @ponchia/ui@X.Y.Z literal, and only those', () => {
  const text = [
    'href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.6.4/dist/bronto.css"',
    "import '@ponchia/ui@0.6.0/css/report.css';",
    'pin the minor: @ponchia/ui@0.6 stays untouched', // deliberate partial pin
    'plain @ponchia/ui specifier stays untouched',
  ].join('\n');
  const out = repinVersionLiterals(text, '0.7.0');
  assert.match(out, /@ponchia\/ui@0\.7\.0\/dist\/bronto\.css/);
  assert.match(out, /@ponchia\/ui@0\.7\.0\/css\/report\.css/);
  assert.match(out, /@ponchia\/ui@0\.6 stays untouched/);
  assert.match(out, /plain @ponchia\/ui specifier stays untouched/);
  assert.doesNotMatch(out, /@ponchia\/ui@0\.6\.\d/);
});

test('dates the Unreleased heading for the released version only', () => {
  const cl = ['# Changelog', '', '## Unreleased — 0.7.0', '', '## 0.6.5 — 2026-06-09'].join('\n');
  const out = dateChangelogHeading(cl, '0.7.0', '2026-06-10');
  assert.match(out, /^## 0\.7\.0 — 2026-06-10$/m);
  assert.match(out, /^## 0\.6\.5 — 2026-06-09$/m);
});

test('leaves the changelog alone when the heading is already dated or absent', () => {
  const cl = ['# Changelog', '', '## 0.7.0 — 2026-06-10'].join('\n');
  assert.equal(dateChangelogHeading(cl, '0.7.0', '2026-06-11'), cl);
  assert.equal(dateChangelogHeading(cl, '0.8.0', '2026-06-11'), cl);
});
