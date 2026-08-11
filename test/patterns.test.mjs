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

// `.ui-menu__item` and `.ui-row` are the same object, and the whole point of
// extracting the row was that a second copy of that shape is how the two drift.
// This asserts the composition rather than the appearance: the menu item must
// NOT restate what the row already says.
test('the menu item composes the row rather than restating it', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const read = (name) =>
    readFileSync(fileURLToPath(new URL(`../css/${name}`, import.meta.url)), 'utf8');

  const overlay = stripCssComments(read('overlay.css'));
  const item = /\.ui-menu__item \{([^}]*)\}/.exec(overlay);
  assert.ok(item, '.ui-menu__item must exist');

  // The shape lives in row.css. Anything here that duplicates it is drift.
  const SHARED = [
    'display: flex',
    'align-items: center',
    'background: transparent',
    'border: 0',
    'cursor: pointer',
    'text-align: start',
    'inline-size: 100%',
  ];
  for (const decl of SHARED) {
    assert.ok(
      !item[1].includes(decl),
      `.ui-menu__item restates "${decl}" — that belongs to .ui-row`,
    );
  }

  // And the row must actually be in the default bundle, or a core component
  // composing it would break for anyone who did not opt in.
  assert.match(stripCssComments(read('core.css')), /row\.css/);
});
