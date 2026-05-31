import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  GLYPHS,
  GLYPH_NAMES,
  GLYPH_SIZE,
  glyph,
  glyphCells,
  renderGlyph,
} from '../glyphs/glyphs.js';
import { cls } from '../classes/index.js';

test('every glyph is a GLYPH_SIZE×GLYPH_SIZE bitmap over [.#*]', () => {
  for (const [name, rows] of Object.entries(GLYPHS)) {
    assert.equal(rows.length, GLYPH_SIZE, `${name}: row count`);
    for (const [i, row] of rows.entries()) {
      assert.equal(row.length, GLYPH_SIZE, `${name}: row ${i} width`);
      assert.match(row, /^[.#*]+$/, `${name}: row ${i} alphabet`);
    }
  }
});

test('GLYPH_NAMES mirrors the GLYPHS keys, sorted and frozen', () => {
  assert.deepEqual([...GLYPH_NAMES], Object.keys(GLYPHS).sort());
  assert.ok(Object.isFrozen(GLYPH_NAMES));
  assert.ok(Object.isFrozen(GLYPHS));
});

test('glyph() returns the bitmap, or undefined for an unknown name', () => {
  assert.equal(glyph(GLYPH_NAMES[0]), GLYPHS[GLYPH_NAMES[0]]);
  assert.equal(glyph('definitely-not-a-glyph'), undefined);
});

test('glyphCells() yields one descriptor per cell with correct tones', () => {
  for (const name of GLYPH_NAMES) {
    const cells = glyphCells(name);
    assert.equal(cells.length, GLYPH_SIZE * GLYPH_SIZE, `${name}: cell count`);
    const flat = GLYPHS[name].join('');
    cells.forEach((cell, i) => {
      const ch = flat[i];
      assert.equal(cell.on, ch !== '.', `${name}: cell ${i} on`);
      if (ch === '#') assert.equal(cell.tone, 'hot');
      else if (ch === '*') assert.equal(cell.tone, 'accent');
      else assert.equal(cell.tone, undefined);
    });
  }
  assert.deepEqual(glyphCells('definitely-not-a-glyph'), []);
});

test('renderGlyph() emits only registered dot-matrix classes', () => {
  const allowed = new Set([
    cls.dotmatrix,
    cls.dotmatrixCell,
    cls.dotmatrixCellHot,
    cls.dotmatrixCellAccent,
  ]);
  for (const name of GLYPH_NAMES) {
    const html = renderGlyph(name);
    for (const m of html.matchAll(/class="([^"]*)"/g)) {
      for (const tok of m[1].split(/\s+/).filter(Boolean)) {
        assert.ok(allowed.has(tok), `${name}: unregistered class ${tok}`);
      }
    }
  }
  assert.equal(renderGlyph('definitely-not-a-glyph'), '');
});

test('renderGlyph() is decorative by default and labelled on demand', () => {
  const name = GLYPH_NAMES[0];
  assert.match(renderGlyph(name), /aria-hidden="true"/);
  const labelled = renderGlyph(name, { label: 'Status' });
  assert.match(labelled, /role="img"/);
  assert.match(labelled, /aria-label="Status"/);
  assert.doesNotMatch(labelled, /aria-hidden/);
});

test('spark is the accent demo; no other glyph uses accent dots', () => {
  for (const [name, rows] of Object.entries(GLYPHS)) {
    const hasAccent = rows.join('').includes('*');
    if (name === 'spark') assert.ok(hasAccent, 'spark should use accent dots');
    else assert.ok(!hasAccent, `${name} should not use accent dots`);
  }
});

test('initDotGlyph expands a placeholder and cleans up', async () => {
  const dom = new JSDOM('<!doctype html><body></body>');
  const prevDocument = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    const { initDotGlyph } = await import('../behaviors/index.js');
    const name = GLYPH_NAMES[0];
    const el = dom.window.document.createElement('span');
    el.setAttribute('data-bronto-glyph', name);
    dom.window.document.body.appendChild(el);

    const stop = initDotGlyph({ root: dom.window.document });
    assert.ok(el.classList.contains('ui-dotmatrix'));
    assert.equal(el.getAttribute('aria-hidden'), 'true');
    assert.equal(el.querySelectorAll('.ui-dotmatrix__cell').length, GLYPH_SIZE * GLYPH_SIZE);

    stop();
    assert.equal(el.querySelectorAll('.ui-dotmatrix__cell').length, 0);
    assert.ok(!el.classList.contains('ui-dotmatrix'));
    assert.equal(el.getAttribute('aria-hidden'), null);
  } finally {
    if (prevDocument === undefined) delete globalThis.document;
    else globalThis.document = prevDocument;
  }
});
