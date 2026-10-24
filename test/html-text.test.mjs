import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { escapeHtmlText } from '../scripts/lib/html-text.mjs';

test('site HTML encoding preserves hostile text and double-quoted attribute values', () => {
  for (const value of [
    '\"><img src=x onerror=alert(1)>&\'<<>>""',
    '&quot;&lt;img src=x onerror=alert(1)&gt;',
    'plain Unicode: à ♡',
    42,
  ]) {
    const encoded = escapeHtmlText(value);
    const document = new JSDOM(`<p title="${encoded}">${encoded}</p>`).window.document;
    const element = document.querySelector('p');
    assert.equal(element.textContent, String(value));
    assert.equal(element.getAttribute('title'), String(value));
    assert.equal(element.children.length, 0);
    assert.deepEqual(element.getAttributeNames(), ['title']);
  }
});
