import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cssImports, stripCssComments } from '../scripts/lib/patterns.mjs';

test('cssImports reads string, quoted url(), and unquoted url() imports', () => {
  const css = [
    "@import './tokens.css' layer(bronto);",
    '@import url("./base.css") layer(bronto);',
    '@import url(./motion.css) layer(bronto);',
  ].join('\n');

  assert.deepEqual(cssImports(css), ['./tokens.css', './base.css', './motion.css']);
});

test('stripCssComments removes commented imports before scraping', () => {
  const css = "/* @import './dead.css'; */\n@import './live.css';";
  assert.deepEqual(cssImports(stripCssComments(css)), ['./live.css']);
});
