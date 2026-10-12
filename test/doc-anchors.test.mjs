import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headingSlug } from '../scripts/lib/doc-anchors.mjs';

const slug = (heading) => headingSlug(heading, new Set());

test("heading IDs match GitHub for the repository's code and punctuation headings", () => {
  for (const [heading, expected] of [
    ['Why resolved colours, not `var(--x)`', 'why-resolved-colours-not-var--x'],
    ['Modal: use native `<dialog>`', 'modal-use-native-dialog'],
    ['2. No-flash theme (inline, in `<head>`)', '2-no-flash-theme-inline-in-head'],
    ['Finding a glyph — `findGlyphs` / `GLYPH_TAGS`', 'finding-a-glyph--findglyphs--glyph_tags'],
    ['Toolstrip — `.ui-toolstrip`', 'toolstrip--ui-toolstrip'],
    ['Legends & data keys', 'legends--data-keys'],
  ]) {
    assert.equal(slug(heading), expected, heading);
  }
});

test('heading IDs use rendered text and preserve inline code literally', () => {
  assert.equal(slug('[API **guide**](https://example.com) and _theme_'), 'api-guide-and-theme');
  assert.equal(slug('<span title="a>b">Markup</span> and `<span>`'), 'markup-and-span');
  assert.equal(slug('`_identifier_` and \\_literal\\_'), '_identifier_-and-_literal_');
  assert.equal(slug('A &amp; B &#x43; &eacute;'), 'a--b-c-é');
  assert.equal(slug('`&amp;`'), 'amp', 'entities inside code are literal text');
});

test('heading IDs preserve GitHub spacing, hyphens and Unicode word characters', () => {
  assert.equal(slug('--root and tail--'), '--root-and-tail--');
  assert.equal(slug('A  B'), 'a--b');
  assert.equal(slug('Crème café 中文 e\u0301 😀'), 'crème-café-中文-e\u0301-');
  assert.equal(slug('foo_bar'), 'foo_bar');
});

test('duplicate headings avoid collisions with previously generated IDs', () => {
  const seen = new Set();
  assert.deepEqual(
    ['Title', 'Title', 'Title-1', 'Title', 'Title-1'].map((heading) => headingSlug(heading, seen)),
    ['title', 'title-1', 'title-1-1', 'title-2', 'title-1-2'],
  );
  assert.equal(headingSlug('Title', new Set()), 'title', 'each document starts a fresh namespace');
});
