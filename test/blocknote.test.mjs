import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/blocknote.css', import.meta.url), 'utf8');
const declared = new Map(
  [...css.matchAll(/^\s*(--bn-[\w-]+):\s*([^;]+);/gm)].map(([, name, value]) => [name, value]),
);

// The colour variables BlockNote 0.54 declares on `.bn-root` (packages/react
// editor/styles.css). A name it adds later falls back to its own default.
const HIGHLIGHTS = ['gray', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
const BLOCKNOTE_COLOURS = [
  'editor-text',
  'editor-background',
  'menu-text',
  'menu-background',
  'tooltip-text',
  'tooltip-background',
  'hovered-text',
  'hovered-background',
  'selected-text',
  'selected-background',
  'disabled-text',
  'disabled-background',
  'shadow',
  'border',
  'side-menu',
  ...HIGHLIGHTS.flatMap((hue) => [`highlights-${hue}-text`, `highlights-${hue}-background`]),
].map((name) => `--bn-colors-${name}`);

test('css/blocknote.css maps every BlockNote colour variable, and the type and radius', () => {
  for (const name of [...BLOCKNOTE_COLOURS, '--bn-font-family', '--bn-border-radius'])
    assert.ok(declared.has(name), `${name} is not mapped`);
});

test('css/blocknote.css points only at bronto tokens, never a literal', () => {
  for (const [name, value] of declared) assert.match(value, /^var\(--/, `${name}: ${value}`);
});

test('css/blocknote.css highlights fall back when css/dataviz.css is not loaded', () => {
  for (const [name, value] of declared)
    if (/var\(--cat-/.test(value))
      assert.match(value, /^var\(--cat-\d-\w+, var\(--[\w-]+\)\)$/, name);
});

test('css/blocknote.css overrides both of BlockNote scheme blocks', () => {
  // BlockNote's dark values sit on `.bn-root[data-color-scheme="dark"]`; a rule of
  // equal specificity imported after it is what replaces them.
  assert.match(css, /^\.bn-root,\n\.bn-root\[data-color-scheme\] \{/m);
});

test('css/blocknote.css draws the nested-block guide in the border token, not the side-menu ink', () => {
  // BlockNote 0.54's guide rule, under .bn-root so it outranks BlockNote's
  // `border-left: 1px solid var(--bn-colors-side-menu)` whatever the order.
  const guide =
    /\.bn-root\s+\.bn-block-group\s+\.bn-block:not\(:has\(\.bn-toggle-wrapper\)\)\s+\.bn-block-group\s+\.bn-block-outer:not\(\[data-prev-depth-changed\]\)::before\s*\{\s*(?:\/\*[\s\S]*?\*\/\s*)?border-left-color:\s*(var\(--[\w-]+\));\s*\}/;
  const match = css.match(guide);
  assert.ok(match, 'the nested-block guide rule is missing or no longer mirrors BlockNote');
  assert.equal(match[1], 'var(--line)');
  assert.equal(
    declared.get('--bn-colors-side-menu'),
    'var(--text-dim)',
    'the handle keeps its ink',
  );
});
