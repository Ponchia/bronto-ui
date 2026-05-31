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

test('renderGlyph({ anim }) adds the registered modifier and staggers reveal', () => {
  const name = GLYPH_NAMES[0];
  const allowed = new Set([
    cls.dotmatrix,
    cls.dotmatrixReveal,
    cls.dotmatrixPulse,
    cls.dotmatrixCell,
    cls.dotmatrixCellHot,
    cls.dotmatrixCellAccent,
  ]);

  const reveal = renderGlyph(name, { anim: 'reveal' });
  assert.match(reveal, new RegExp(`class="${cls.dotmatrix} ${cls.dotmatrixReveal}"`));
  assert.match(reveal, /--i:0/); // first cell
  assert.match(reveal, new RegExp(`--i:${GLYPH_SIZE * GLYPH_SIZE - 1}`)); // last cell

  const pulse = renderGlyph(name, { anim: 'pulse' });
  assert.match(pulse, new RegExp(`class="${cls.dotmatrix} ${cls.dotmatrixPulse}"`));
  assert.doesNotMatch(pulse, /--i:/); // pulse needs no per-cell stagger

  // still only registered classes in both modes
  for (const html of [reveal, pulse]) {
    for (const m of html.matchAll(/class="([^"]*)"/g)) {
      for (const tok of m[1].split(/\s+/).filter(Boolean)) {
        assert.ok(allowed.has(tok), `unregistered class ${tok}`);
      }
    }
  }
});

test('renderGlyph() is decorative by default and labelled on demand', () => {
  const name = GLYPH_NAMES[0];
  assert.match(renderGlyph(name), /aria-hidden="true"/);
  const labelled = renderGlyph(name, { label: 'Status' });
  assert.match(labelled, /role="img"/);
  assert.match(labelled, /aria-label="Status"/);
  assert.doesNotMatch(labelled, /aria-hidden/);
});

test('renderGlyph({ solid }) fuses dots into a square, gapless pixel glyph', () => {
  const name = GLYPH_NAMES[0];
  const s = renderGlyph(name, { solid: true });
  assert.match(s, /--dotmatrix-dot-radius:0/);
  assert.match(s, /--dotmatrix-gap:0/);
  assert.match(s, /background:transparent/); // solid implies glyph-only
  // still emits only registered dot-matrix classes
  for (const m of s.matchAll(/class="([^"]*)"/g)) {
    for (const tok of m[1].split(/\s+/).filter(Boolean)) {
      assert.ok(tok.startsWith('ui-dotmatrix'), `unexpected class ${tok}`);
    }
  }
});

test('renderGlyph() escapes label and sanitizes dot/gap (no CSS/HTML injection)', () => {
  const name = GLYPH_NAMES[0];
  // label: HTML-attribute context — must be escaped, no tag/attr breakout.
  const evilLabel = renderGlyph(name, { label: '"><img src=x onerror=alert(1)>' });
  assert.doesNotMatch(evilLabel, /<img/);
  assert.match(evilLabel, /&quot;&gt;/);

  // dot/gap: inline-CSS context — a `;` would open a second declaration.
  const evilDot = renderGlyph(name, { dot: '1px;position:fixed;inset:0' });
  assert.doesNotMatch(evilDot, /position:fixed/);
  assert.doesNotMatch(evilDot, /--dotmatrix-dot/); // malformed → dropped entirely

  // Well-formed lengths/calc are kept verbatim.
  const ok = renderGlyph(name, { dot: 'calc(0.5rem + 2px)', gap: '0.25rem' });
  assert.match(ok, /--dotmatrix-dot:calc\(0\.5rem \+ 2px\)/);
  assert.match(ok, /--dotmatrix-gap:0\.25rem/);
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
    // A bare placeholder leaves no empty class=""/style="" residue.
    assert.equal(el.getAttribute('class'), null);
    assert.equal(el.getAttribute('style'), null);
  } finally {
    if (prevDocument === undefined) delete globalThis.document;
    else globalThis.document = prevDocument;
  }
});

test('initDotGlyph cleanup only removes the cells it appended', async () => {
  const dom = new JSDOM('<!doctype html><body></body>');
  const prevDocument = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    const { initDotGlyph } = await import('../behaviors/index.js');
    const el = dom.window.document.createElement('span');
    el.setAttribute('data-bronto-glyph', GLYPH_NAMES[0]);
    // A pre-existing nested dot matrix the consumer authored themselves.
    const nested = dom.window.document.createElement('div');
    nested.className = 'ui-dotmatrix';
    nested.innerHTML = '<span class="ui-dotmatrix__cell"></span>';
    el.appendChild(nested);
    dom.window.document.body.appendChild(el);

    const stop = initDotGlyph({ root: dom.window.document });
    // Appended GLYPH_SIZE² direct-child cells, plus the 1 nested cell.
    assert.equal(
      el.querySelectorAll(':scope > .ui-dotmatrix__cell').length,
      GLYPH_SIZE * GLYPH_SIZE,
    );

    stop();
    // The consumer's nested matrix and its cell survive untouched.
    assert.equal(el.querySelectorAll(':scope > .ui-dotmatrix__cell').length, 0);
    assert.equal(nested.querySelectorAll('.ui-dotmatrix__cell').length, 1);
    assert.ok(el.contains(nested));
  } finally {
    if (prevDocument === undefined) delete globalThis.document;
    else globalThis.document = prevDocument;
  }
});

test('initDotGlyph honours data-bronto-glyph-solid and restores on cleanup', async () => {
  const dom = new JSDOM('<!doctype html><body></body>');
  const prevDocument = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    const { initDotGlyph } = await import('../behaviors/index.js');
    const el = dom.window.document.createElement('span');
    el.setAttribute('data-bronto-glyph', GLYPH_NAMES[0]);
    el.setAttribute('data-bronto-glyph-solid', '');
    dom.window.document.body.appendChild(el);

    const stop = initDotGlyph({ root: dom.window.document });
    assert.equal(el.style.getPropertyValue('--dotmatrix-dot-radius'), '0');
    assert.equal(el.style.getPropertyValue('--dotmatrix-gap'), '0');

    stop();
    assert.equal(el.style.getPropertyValue('--dotmatrix-dot-radius'), '');
    assert.equal(el.style.getPropertyValue('--dotmatrix-gap'), '');
    assert.equal(el.getAttribute('style'), null); // no empty style residue
  } finally {
    if (prevDocument === undefined) delete globalThis.document;
    else globalThis.document = prevDocument;
  }
});

test('initDotGlyph honours data-bronto-glyph-anim (reveal stagger + pulse) and restores', async () => {
  const dom = new JSDOM('<!doctype html><body></body>');
  const prevDocument = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    const { initDotGlyph } = await import('../behaviors/index.js');

    // reveal: adds the modifier class + a per-cell --i stagger.
    const rev = dom.window.document.createElement('span');
    rev.setAttribute('data-bronto-glyph', GLYPH_NAMES[0]);
    rev.setAttribute('data-bronto-glyph-anim', 'reveal');
    dom.window.document.body.appendChild(rev);
    // pulse: adds the modifier class, no per-cell stagger.
    const pul = dom.window.document.createElement('span');
    pul.setAttribute('data-bronto-glyph', GLYPH_NAMES[0]);
    pul.setAttribute('data-bronto-glyph-anim', 'pulse');
    dom.window.document.body.appendChild(pul);

    const stop = initDotGlyph({ root: dom.window.document });
    assert.ok(rev.classList.contains('ui-dotmatrix--reveal'));
    const cells = rev.querySelectorAll(':scope > .ui-dotmatrix__cell');
    assert.equal(cells[0].style.getPropertyValue('--i'), '0');
    assert.equal(cells[cells.length - 1].style.getPropertyValue('--i'), String(cells.length - 1));
    assert.ok(pul.classList.contains('ui-dotmatrix--pulse'));
    assert.equal(
      pul.querySelector(':scope > .ui-dotmatrix__cell').style.getPropertyValue('--i'),
      '',
    );

    stop();
    assert.ok(!rev.classList.contains('ui-dotmatrix--reveal')); // class we added is removed
    assert.ok(!pul.classList.contains('ui-dotmatrix--pulse'));
    assert.equal(rev.getAttribute('class'), null); // no empty residue
  } finally {
    if (prevDocument === undefined) delete globalThis.document;
    else globalThis.document = prevDocument;
  }
});
