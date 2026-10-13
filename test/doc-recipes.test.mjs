import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stylesheetRecipeProblems } from '../scripts/lib/doc-recipes.mjs';

const version = '0.16.1';
const check = (text) => stylesheetRecipeProblems(text, version);

test('HTML stylesheet recipes reject package-root and leaf specifiers', () => {
  const broken = [
    '<link rel="stylesheet" href="@ponchia/ui" />',
    "<link href='@ponchia/ui/css/legend.css' rel='stylesheet'>",
    '<link rel="stylesheet"\n  href="@ponchia/ui/dist/bronto.css" />',
    '<link rel="stylesheet" href="@ponchia/ui@0.16.1/dist/css/skins.css" />',
  ];
  for (const recipe of broken) {
    const problems = check(recipe);
    assert.equal(problems.length, 1, recipe);
    assert.match(problems[0].reason, /bare package specifier/);
    assert.equal(recipe.slice(problems[0].index, problems[0].index + 5), '<link');
  }
});

test('stylesheet recipes accept real local and CDN URLs and bundler CSS imports', () => {
  const valid = [
    '<link rel="stylesheet" href="./node_modules/@ponchia/ui/dist/bronto.css" />',
    '<link rel="stylesheet" href="/vendor/bronto/dist/css/legend.css" />',
    `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@${version}/dist/bronto.css" />`,
    `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@${version}/dist/css/report-kit.css" />`,
    "@import '@ponchia/ui/css/legend.css';",
    // Other link relations and plain package references are outside this check.
    '<link rel="canonical" href="@ponchia/ui" />',
    'Load `@ponchia/ui` through a CSS-aware bundler.',
  ];
  for (const recipe of valid) assert.deepEqual(check(recipe), [], recipe);
});

test('pinned CDN stylesheet recipes still require the built dist assets', () => {
  const sourceUrl = `https://cdn.jsdelivr.net/npm/@ponchia/ui@${version}/css/legend.css`;
  const problems = check(`<link rel="stylesheet" href="${sourceUrl}" />`);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].url, sourceUrl);
  assert.match(problems[0].reason, /built dist assets/);
});
