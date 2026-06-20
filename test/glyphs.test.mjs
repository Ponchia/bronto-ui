import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  GLYPHS,
  GLYPH_NAMES,
  GLYPH_SIZE,
  GLYPH_TAGS,
  glyph,
  glyphCells,
  glyphMask,
  findGlyphs,
  renderGlyph,
  renderReadout,
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
  assert.doesNotMatch(evilDot, /position:fixed/); // injection dropped
  // A malformed dot falls back to the safe intrinsic default (0.08em) rather
  // than emitting the payload OR full-bleeding with no dot at all.
  assert.match(evilDot, /--dotmatrix-dot:0\.08em/);

  // Well-formed lengths/calc are kept verbatim.
  const ok = renderGlyph(name, { dot: 'calc(0.5rem + 2px)', gap: '0.25rem' });
  assert.match(ok, /--dotmatrix-dot:calc\(0\.5rem \+ 2px\)/);
  assert.match(ok, /--dotmatrix-gap:0\.25rem/);
});

// The accent (`*`) tone is a real, intentional capability — a curated set of
// two-tone glyphs uses it to lift one feature (the check, the bang) onto the
// `--field-dot-accent` colour. Pin the exact set so a stray `*` in a glyph that
// should be monotone is still caught, but the capability is no longer a
// one-glyph museum piece.
test('only the curated two-tone glyphs use accent dots', () => {
  const TWO_TONE = new Set(['spark', 'warning', 'info']);
  for (const [name, rows] of Object.entries(GLYPHS)) {
    const hasAccent = rows.join('').includes('*');
    if (TWO_TONE.has(name)) assert.ok(hasAccent, `${name} should use accent dots`);
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

test('initDotGlyph leaves unknown placeholders untouched in cell and mask modes', async () => {
  const dom = new JSDOM('<!doctype html><body></body>');
  const prevDocument = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    const { initDotGlyph } = await import('../behaviors/index.js');
    const cell = dom.window.document.createElement('span');
    cell.setAttribute('data-bronto-glyph', 'definitely-not-a-glyph');
    const mask = dom.window.document.createElement('span');
    mask.setAttribute('data-bronto-glyph', 'definitely-not-a-glyph');
    mask.setAttribute('data-bronto-glyph-render', 'mask');
    mask.setAttribute('data-bronto-glyph-label', 'Missing icon');
    mask.setAttribute('data-bronto-glyph-size', '1.5rem');
    dom.window.document.body.append(cell, mask);
    const before = [cell.outerHTML, mask.outerHTML];

    const stop = initDotGlyph({ root: dom.window.document });
    assert.deepEqual([cell.outerHTML, mask.outerHTML], before);
    assert.equal(cell.querySelectorAll('.ui-dotmatrix__cell').length, 0);
    assert.equal(mask.querySelectorAll('.ui-dotmatrix__cell').length, 0);
    assert.equal(cell.getAttribute('class'), null);
    assert.equal(mask.getAttribute('class'), null);
    assert.equal(mask.getAttribute('style'), null);
    assert.equal(mask.getAttribute('role'), null);
    assert.equal(mask.getAttribute('aria-label'), null);

    stop();
    assert.deepEqual([cell.outerHTML, mask.outerHTML], before);
  } finally {
    if (prevDocument === undefined) delete globalThis.document;
    else globalThis.document = prevDocument;
  }
});

test('initDotGlyph re-init replaces the active cell expansion cleanup', async () => {
  const dom = new JSDOM('<!doctype html><body></body>');
  const prevDocument = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    const { initDotGlyph } = await import('../behaviors/index.js');
    const el = dom.window.document.createElement('span');
    el.setAttribute('data-bronto-glyph', GLYPH_NAMES[0]);
    dom.window.document.body.appendChild(el);

    const stop1 = initDotGlyph({ root: dom.window.document });
    assert.equal(
      el.querySelectorAll(':scope > .ui-dotmatrix__cell').length,
      GLYPH_SIZE * GLYPH_SIZE,
    );
    const stop2 = initDotGlyph({ root: dom.window.document });
    assert.equal(
      el.querySelectorAll(':scope > .ui-dotmatrix__cell').length,
      GLYPH_SIZE * GLYPH_SIZE,
      're-init refreshes instead of doubling cells',
    );

    stop2();
    assert.equal(el.querySelectorAll(':scope > .ui-dotmatrix__cell').length, 0);
    assert.ok(!el.classList.contains('ui-dotmatrix'));
    stop1();
    assert.equal(el.querySelectorAll(':scope > .ui-dotmatrix__cell').length, 0);
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

test('the circle-family glyphs ship', () => {
  for (const n of ['circle', 'check-circle', 'x-circle', 'plus-circle', 'minus-circle']) {
    assert.ok(GLYPH_NAMES.includes(n), `${n} present`);
    assert.equal(glyph(n).length, GLYPH_SIZE);
  }
});

test("render: 'mask' returns one .ui-icon node, no cells, currentColor-able", () => {
  const html = renderGlyph('gear', { render: 'mask', label: 'Settings' });
  assert.match(html, /^<span class="ui-icon"/);
  assert.match(html, /role="img" aria-label="Settings"/);
  assert.match(html, /--icon-mask:url\(data:image\/svg\+xml,/);
  assert.ok(!html.includes('ui-dotmatrix__cell')); // one node — the icon-at-scale win
  // Attribute-safe: the mask url() carries no raw quotes/spaces.
  const style = html.match(/style="([^"]*)"/)[1];
  assert.ok(!/[ "']/.test(style), 'mask style attribute is quote/space-safe');
});

test("render: 'mask' size sets --icon-size; decorative when unlabelled; sanitized", () => {
  assert.match(renderGlyph('check', { render: 'mask', size: '2rem' }), /--icon-size:2rem/);
  assert.match(renderGlyph('check', { render: 'mask' }), /aria-hidden="true"/);
  assert.ok(!renderGlyph('check', { render: 'mask', size: 'red;}' }).includes('red'));
  assert.equal(renderGlyph('nope', { render: 'mask' }), '');
});

test('findGlyphs resolves intent words via tags and name substrings', () => {
  assert.deepEqual(findGlyphs('delete'), ['trash']); // alias → glyph
  assert.deepEqual(findGlyphs('chart'), ['bar-chart']); // name substring
  assert.ok(findGlyphs('arrow').length >= 4); // arrow-up/down/left/right
  assert.equal(findGlyphs('').length, GLYPH_NAMES.length); // empty → all
  assert.deepEqual(findGlyphs('definitely-not-a-glyph'), []);
  // Every returned name is real, and the result is sorted.
  const r = findGlyphs('e');
  assert.ok(r.every((n) => GLYPH_NAMES.includes(n)));
  assert.deepEqual(r, [...r].sort());
});

test('GLYPH_TAGS keys are all real glyph names', () => {
  for (const name of Object.keys(GLYPH_TAGS)) assert.ok(GLYPHS[name], `${name} is a glyph`);
});

test('glyphMask returns a mask url() for a known glyph, empty for unknown', () => {
  assert.ok(glyphMask('check').startsWith('url(data:image/svg+xml,'));
  assert.equal(glyphMask('nope'), '');
});

test('the readout face exists: digit-0..9 + colon/comma/period/percent', () => {
  for (let d = 0; d <= 9; d++) assert.ok(GLYPHS[`digit-${d}`], `digit-${d}`);
  for (const p of ['colon', 'comma', 'period', 'percent']) assert.ok(GLYPHS[p], p);
});

test('renderReadout composes a labelled .ui-readout row of decorative glyphs', () => {
  const html = renderReadout('12:48', { label: '12 hours 48' });
  assert.match(html, /^<span class="ui-readout" role="img" aria-label="12 hours 48"/);
  // 5 chars (1,2,:,4,8) → 5 glyph spans, none labelled (decorative).
  assert.equal(html.match(/ui-dotmatrix(?![-_])/g).length, 5);
  assert.ok(!html.includes('aria-label="1"'));
  assert.equal(renderReadout(''), '');
});

test('renderReadout: space → spacer, unknown char dropped, label defaults to text', () => {
  const html = renderReadout('1 %x', {});
  assert.match(html, /aria-label="1 %x"/); // label defaults to raw text
  assert.equal(html.match(/ui-readout__spacer/g).length, 1); // the space
  // 1 and % are known (2 glyphs); the space is a spacer; x is dropped.
  assert.equal(html.match(/ui-dotmatrix(?![-_])/g).length, 2);
});

test("renderReadout passes render:'mask' through to each character", () => {
  const html = renderReadout('42', { render: 'mask', label: '42' });
  assert.equal(html.match(/ui-icon/g).length, 2);
  assert.ok(!html.includes('ui-dotmatrix__cell'));
});

test("initDotGlyph render='mask' makes one .ui-icon node, no cells, and cleans up", async () => {
  const dom = new JSDOM('<!doctype html><body></body>');
  const prevDocument = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    const { initDotGlyph } = await import('../behaviors/index.js');
    const el = dom.window.document.createElement('span');
    el.setAttribute('data-bronto-glyph', 'gear');
    el.setAttribute('data-bronto-glyph-render', 'mask');
    el.setAttribute('data-bronto-glyph-label', 'Settings');
    el.setAttribute('data-bronto-glyph-size', '1.5rem');
    dom.window.document.body.appendChild(el);

    const stop = initDotGlyph({ root: dom.window.document });
    assert.ok(el.classList.contains('ui-icon'));
    assert.equal(el.querySelectorAll('.ui-dotmatrix__cell').length, 0); // not the 256-cell path
    assert.ok(el.style.getPropertyValue('--icon-mask').startsWith('url('));
    assert.equal(el.style.getPropertyValue('--icon-size'), '1.5rem');
    assert.equal(el.getAttribute('role'), 'img');
    assert.equal(el.getAttribute('aria-label'), 'Settings');

    stop();
    assert.ok(!el.classList.contains('ui-icon'));
    assert.equal(el.getAttribute('class'), null);
    assert.equal(el.getAttribute('style'), null);
    assert.equal(el.getAttribute('role'), null);
  } finally {
    if (prevDocument === undefined) delete globalThis.document;
    else globalThis.document = prevDocument;
  }
});

test("initDotGlyph render='mask' re-init replaces the active cleanup", async () => {
  const dom = new JSDOM('<!doctype html><body></body>');
  const prevDocument = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    const { initDotGlyph } = await import('../behaviors/index.js');
    const el = dom.window.document.createElement('span');
    el.setAttribute('data-bronto-glyph', 'gear');
    el.setAttribute('data-bronto-glyph-render', 'mask');
    el.setAttribute('data-bronto-glyph-label', 'Settings');
    dom.window.document.body.appendChild(el);

    const stop1 = initDotGlyph({ root: dom.window.document });
    assert.ok(el.classList.contains('ui-icon'));
    const firstMask = el.style.getPropertyValue('--icon-mask');
    const stop2 = initDotGlyph({ root: dom.window.document });
    assert.ok(el.classList.contains('ui-icon'));
    assert.equal(el.style.getPropertyValue('--icon-mask'), firstMask);

    stop2();
    assert.ok(!el.classList.contains('ui-icon'));
    assert.equal(el.getAttribute('style'), null);
    assert.equal(el.getAttribute('role'), null);
    stop1();
    assert.ok(!el.classList.contains('ui-icon'));
  } finally {
    if (prevDocument === undefined) delete globalThis.document;
    else globalThis.document = prevDocument;
  }
});
