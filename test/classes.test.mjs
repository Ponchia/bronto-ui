import { test } from 'node:test';
import assert from 'node:assert/strict';
import ui, { ui as uiNamed, cls, cx } from '../classes/index.js';

test('cx flattens nested arrays at any depth and skips falsy', () => {
  assert.equal(cx(['a', [false, 'b'], [['c']]]), 'a b c');
  assert.equal(cx('x', null, undefined, false, 0, '', 'y'), 'x y');
  assert.equal(cx(), '');
});

test('cls is the frozen registry', () => {
  assert.ok(Object.isFrozen(cls));
  assert.equal(cls.button, 'ui-button');
});

test('default export === named ui', () => {
  assert.equal(ui, uiNamed);
});

test('recipes emit only registry classes', () => {
  assert.equal(ui.button(), 'ui-button');
  assert.equal(ui.button({ variant: 'ghost' }), 'ui-button ui-button--ghost');
  assert.equal(ui.button({ variant: 'danger', icon: true }), 'ui-button ui-button--danger ui-button--icon');
  assert.equal(ui.badge({ tone: 'success' }), 'ui-badge ui-badge--success');
  assert.equal(ui.dot({ tone: 'accent', live: true }), 'ui-dot ui-dot--accent ui-dot--live');
  assert.equal(ui.table({ density: 'dense', lined: true }), 'ui-table ui-table--dense ui-table--lined');
  assert.equal(ui.card({ accent: true, interactive: true }), 'ui-card ui-card--accent ui-card--interactive');
});

test('unknown option values are ignored, not emitted', () => {
  assert.equal(ui.button({ variant: 'bogus' }), 'ui-button');
  assert.equal(ui.badge({ tone: 'bogus' }), 'ui-badge');
});
