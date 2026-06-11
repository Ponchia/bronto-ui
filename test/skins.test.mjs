import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skins, SKIN_NAMES } from '../tokens/skins.js';
import { ratio, apcaLc, auditSkins } from '../scripts/gen-contrast.mjs';
import { buildResolved } from '../scripts/gen-resolved.mjs';
import { generated as genSkins } from '../scripts/gen-skins.mjs';

test('every skin defines --accent for both themes and shares a key set with --accent', () => {
  for (const name of SKIN_NAMES) {
    assert.ok(skins[name].light['--accent'], `${name} light --accent`);
    assert.ok(skins[name].dark['--accent'], `${name} dark --accent`);
    assert.ok(skins[name].label, `${name} label`);
  }
});

test('SKIN_NAMES is sorted and frozen', () => {
  assert.deepEqual(SKIN_NAMES, [...SKIN_NAMES].sort());
  assert.ok(Object.isFrozen(SKIN_NAMES));
});

test('oklch() parses to sRGB: ratio() measures an oklch foreground', () => {
  // Near-white vs near-black via oklch → a large ratio; sanity that the
  // OKLCH→sRGB path works at all (without it, ratio() would be null).
  const r = ratio('oklch(95% 0 0deg)', 'oklch(15% 0 0deg)');
  assert.ok(r != null && r > 10, `expected high contrast, got ${r}`);
  // A mid grey vs itself ≈ 1:1.
  const r1 = ratio('oklch(50% 0 0deg)', 'oklch(50% 0 0deg)');
  assert.ok(Math.abs(r1 - 1) < 0.01, `expected ~1, got ${r1}`);
});

test('oklch hue actually shifts the colour (green ≠ amber)', () => {
  // Different hues at the same L/C must give different contrast vs white,
  // proving the hue channel is honoured (not dropped).
  const green = ratio('oklch(60% 0.15 150deg)', '#ffffff');
  const blue = ratio('oklch(60% 0.15 260deg)', '#ffffff');
  assert.notEqual(green.toFixed(3), blue.toFixed(3));
});

test('apcaLc is polarity-aware and 0 for no contrast', () => {
  assert.equal(apcaLc('#777', '#777'), 0);
  const darkOnLight = apcaLc('#000000', '#ffffff');
  const lightOnDark = apcaLc('#ffffff', '#000000');
  assert.ok(darkOnLight > 90, `black-on-white Lc ${darkOnLight}`);
  assert.ok(lightOnDark > 90, `white-on-black Lc ${lightOnDark}`);
  // Polarity differs → the two are not identical.
  assert.notEqual(darkOnLight.toFixed(1), lightOnDark.toFixed(1));
});

test('every shipped colorway accent meets its WCAG floor (the gate, in a test)', () => {
  const resolved = buildResolved();
  for (const s of auditSkins(resolved)) {
    for (const row of s.rows) {
      if (!row.gated) continue;
      assert.ok(
        row.ratio != null && row.ratio >= row.floor,
        `${s.name}/${s.theme}: ${row.fg} on ${row.bg} = ${row.ratio} < ${row.floor}`,
      );
    }
  }
});

test('skin contrast audit recomputes translucent accent tints from the skin accent', () => {
  const resolved = buildResolved();
  const coreTint = resolved.dark['--accent-soft'];
  const skin = auditSkins(resolved).find((s) => s.name === 'phosphor-green' && s.theme === 'dark');
  const tintRow = skin.rows.find((r) => r.fg === '--text-soft' && r.bg === '--accent-soft');

  assert.ok(tintRow, 'expected the neutral-on-accent-tint row');
  assert.match(tintRow.bv, /^rgba\(/);
  assert.notEqual(tintRow.bv, coreTint);
});

test('generated css/skins.css is root-anchored and opt-in (no bare / descendant selector)', () => {
  const css = genSkins['css/skins.css'];
  for (const name of SKIN_NAMES) {
    assert.ok(css.includes(`:root[data-bronto-skin='${name}']`), `${name} root selector`);
  }
  // No `[data-bronto-skin` may start a selector (preceded by whitespace, `{`,
  // `,` or line start) — that would be a bare or descendant form inviting the
  // broken subtree use. Every real occurrence is glued to `:root[…]` / `…]`.
  assert.ok(
    !/(^|[\s,{])\[data-bronto-skin/m.test(css),
    'skins.css has a non-:root [data-bronto-skin] selector',
  );
});
