import { test } from 'node:test';
import assert from 'node:assert/strict';
import tokens, { cssVars, themeColor } from '../tokens/index.js';

test('themeColor resolves palettes', () => {
  assert.equal(themeColor('dark').accent, '#ff3b41');
  assert.equal(themeColor('light').accent, '#d71921');
});

test('themeColor falls back to light for unknown/empty', () => {
  assert.equal(themeColor('nope').bg, themeColor('light').bg);
  assert.equal(themeColor().bg, themeColor('light').bg);
});

test('cssVars mirror is keyed by real custom-property names', () => {
  assert.equal(cssVars.global['--radius-xl'], '4px');
  assert.equal(cssVars.light['--panel'], '#ffffff');
  assert.equal(cssVars.dark['--bg'], '#121212');
});

test('tokens is the -- stripped ergonomic view; default export === tokens', async () => {
  assert.equal(tokens.scale['radius-xl'], '4px');
  assert.equal(tokens.color.dark.accent, '#ff3b41');
  const mod = await import('../tokens/index.js');
  assert.equal(mod.default, mod.tokens);
});

// The tap-target floors are the one part of the scale where the value is a
// standard rather than a taste, so they are pinned literally. Both clamp in px
// against the rem: a bare rem cannot survive a re-pointed root font size, and a
// bare rem is exactly how the 44px floor silently became 43.5px under Bronto's
// own `html { font-size: 0.9375rem }`.
test('tap-target floors clamp in px so a re-pointed root cannot shrink them', () => {
  assert.equal(cssVars.global['--tap-target'], 'max(44px, 2.9rem)');
  assert.equal(cssVars.global['--tap-target-min'], 'max(24px, 1.6rem)');
});

test('safe-area tokens route env() through an overrideable property', () => {
  for (const side of ['top', 'right', 'bottom', 'left']) {
    assert.equal(cssVars.global[`--safe-area-${side}`], `env(safe-area-inset-${side}, 0px)`);
  }
});

// A surface that anchors to the viewport edge and never reads an inset is the
// bug this set exists to prevent, and it is invisible on every desktop runner.
// Enumerate the anchored surfaces explicitly so ADDING one without an inset is
// what fails, rather than something nobody notices until a phone.
test('every viewport-anchored surface reads a safe-area inset', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const anchored = [
    ['app.css', '.ui-app-rail'],
    ['app.css', '.ui-app-topbar'],
    ['site.css', '.ui-siteheader--sticky'],
    ['site.css', '.ui-skiplink:focus'],
    ['feedback.css', '.ui-toast-stack'],
    ['feedback.css', '.ui-toast-stack--assertive'],
    ['overlay.css', '.ui-modal--drawer'],
    ['overlay.css', '.ui-lightbox'],
  ];
  for (const [file, selector] of anchored) {
    const src = readFileSync(fileURLToPath(new URL(`../css/${file}`, import.meta.url)), 'utf8');
    const start = src.indexOf(`\n${selector} {`);
    assert.ok(start > 0, `${file} must still define ${selector}`);
    const block = src.slice(start, src.indexOf('}', start));
    assert.match(block, /var\(--safe-area-(?:top|right|bottom|left)\)/, `${selector} (${file})`);
  }
});

// The token only helps if the coarse-pointer rules actually consume it. This
// walks every `@media (pointer: coarse)` block and fails on a floor written as a
// bare length — the shape the bug had.
test('no coarse-pointer floor is written as a bare length', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const dir = fileURLToPath(new URL('../css/', import.meta.url));
  const offenders = [];
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.css'))) {
    const src = readFileSync(dir + file, 'utf8');
    for (const open of src.matchAll(/@media \(pointer: coarse\)[^{]*\{/g)) {
      let depth = 0;
      let i = open.index + open[0].length - 1;
      const start = i;
      do {
        if (src[i] === '{') depth += 1;
        else if (src[i] === '}') depth -= 1;
        i += 1;
      } while (depth > 0 && i < src.length);
      for (const decl of src.slice(start, i).matchAll(/min-(?:block|inline)-size:\s*([^;]+);/g)) {
        if (/^[\d.]+(?:r?em|px)$/.test(decl[1].trim()))
          offenders.push(`${file} — ${decl[0].trim()}`);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `coarse-pointer floors must use var(--tap-target) / var(--tap-target-min):\n${offenders.join('\n')}`,
  );
});
