import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TARGETS,
  themeObject,
  emitTheme,
  parseBlocks,
  checkSource,
} from '../scripts/emit-theme.mjs';

const THEMES = ['light', 'dark'];
const matrix = Object.keys(TARGETS).flatMap((target) => THEMES.map((theme) => [target, theme]));

// The CI invariant: whatever an author pastes from `emit:theme` IS the current
// token value. If a token regen changes vega/mermaid/d2 and the emitter falls
// behind, this fails — so the helper can never silently hand out stale colours.
for (const [target, theme] of matrix) {
  test(`emit:${target} ${theme} round-trips to the canonical token object`, () => {
    const block = emitTheme(target, theme);
    const [parsed] = parseBlocks(block);
    assert.ok(parsed, 'emitted block is tag-parseable');
    assert.equal(parsed.target, target);
    assert.equal(parsed.theme, theme);
    assert.deepEqual(JSON.parse(parsed.json), themeObject(target, theme));
  });
}

test('emitted block carries start + end sentinels and a const binding', () => {
  const block = emitTheme('vega', 'light');
  assert.match(block, /@ponchia\/ui:inline-theme:start vega light/);
  assert.match(block, /@ponchia\/ui:inline-theme:end/);
  assert.match(block, /const brontoVegaLight = \{/);
});

test('--name overrides the const identifier', () => {
  assert.match(emitTheme('mermaid', 'dark', { name: 'myTheme' }), /const myTheme = \{/);
});

test('checkSource passes on a freshly emitted block', () => {
  const src = `<script>\n${emitTheme('d2', 'light')}\n</script>`;
  assert.deepEqual(checkSource('x.html', src), []);
});

test('checkSource flags a drifted block', () => {
  const drifted = emitTheme('vega', 'light').replace(/#[0-9a-f]{6}/i, '#000000');
  const errors = checkSource('drift.html', drifted);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /drifted from tokens/);
});

test('themeObject rejects unknown target/theme', () => {
  assert.throws(() => themeObject('bogus', 'light'), /unknown target/);
  assert.throws(() => themeObject('vega', 'sepia'), /light.*dark/);
});

test('parseBlocks finds multiple blocks in one source', () => {
  const src = [emitTheme('vega', 'light'), emitTheme('mermaid', 'dark')].join('\n\n');
  const blocks = parseBlocks(src);
  assert.equal(blocks.length, 2);
  assert.deepEqual(
    blocks.map((b) => `${b.target} ${b.theme}`),
    ['vega light', 'mermaid dark'],
  );
});
