import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { initToolbar, initActionMenu, initSplitter } from '../behaviors/index.js';

let dom;
let cleanups = [];
function mount(markup) {
  dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`, {
    url: 'https://bronto.test/',
    pretendToBeVisual: true,
  });
  globalThis.document = dom.window.document;
  return dom.window.document;
}
function key(element, value, options = {}) {
  const event = new dom.window.KeyboardEvent('keydown', {
    key: value,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  element.dispatchEvent(event);
  return event;
}
function pointer(element, type, pointerId, options = {}) {
  const event = new dom.window.Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { pointerId, button: 0, clientX: 200, clientY: 60, ...options });
  element.dispatchEvent(event);
  return event;
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 25));
afterEach(() => {
  cleanups.reverse().forEach((stop) => stop());
  cleanups = [];
  dom?.window.close();
  delete globalThis.document;
});
const toolbar = `<button id="before">Before</button><div data-bronto-toolbar aria-label="Editing">
  <button id="first" tabindex="3">First</button><button disabled>Unavailable</button>
  <button id="last">Last</button><input aria-label="Filter" value="words" />
  <div role="menu"><button role="menuitem" id="nested">Nested</button></div>
</div><button id="after">After</button>`;

test('workspace behaviors: SSR and null roots never widen ownership', () => {
  for (const init of [initToolbar, initActionMenu]) assert.doesNotThrow(() => init()());
  const d = mount(toolbar);
  cleanups.push(initToolbar({ root: null }));
  assert.equal(d.querySelector('[data-bronto-toolbar]').hasAttribute('role'), false);
});

test('initToolbar: one entry, remembered focus, native fields and exact cleanup', () => {
  const d = mount(toolbar);
  const root = d.querySelector('[data-bronto-toolbar]');
  const stop = initToolbar();
  cleanups.push(stop);
  assert.equal(root.tabIndex, 0);
  assert.equal(d.querySelector('#first').tabIndex, -1);
  root.focus();
  assert.equal(d.activeElement.id, 'first');
  key(d.activeElement, 'ArrowRight');
  assert.equal(d.activeElement.id, 'last');
  key(d.activeElement, 'End');
  assert.equal(d.activeElement.localName, 'input');
  assert.equal(key(d.activeElement, 'Home').defaultPrevented, false);
  d.querySelector('#after').focus();
  d.querySelector('input').focus();
  key(d.activeElement, 'Tab', { shiftKey: true });
  assert.equal(d.activeElement.id, 'last');
  stop();
  assert.equal(root.hasAttribute('role'), false);
  assert.equal(root.hasAttribute('tabindex'), false);
  assert.equal(d.querySelector('#first').getAttribute('tabindex'), '3');
  assert.equal(d.querySelector('#last').hasAttribute('tabindex'), false);
});

test('initToolbar: ignores composition, editing shortcuts and nested owners', () => {
  const d = mount(toolbar);
  cleanups.push(initToolbar({ ownsKey: (event) => event.target.id === 'last' }));
  const first = d.querySelector('#first');
  first.focus();
  for (const options of [
    { isComposing: true },
    { keyCode: 229 },
    { ctrlKey: true },
    { metaKey: true },
    { altKey: true },
    { shiftKey: true },
  ]) {
    assert.equal(key(first, 'ArrowRight', options).defaultPrevented, false);
    assert.equal(d.activeElement, first);
  }
  const nested = d.querySelector('#nested');
  nested.focus();
  assert.equal(key(nested, 'ArrowRight').defaultPrevented, false);
  const last = d.querySelector('#last');
  last.focus();
  assert.equal(key(last, 'ArrowRight').defaultPrevented, false);
  first.addEventListener('keydown', (event) => event.preventDefault());
  first.focus();
  key(first, 'ArrowRight');
  assert.equal(d.activeElement, first);
});

test('initToolbar: direction, orientation and late items retain their authored state', async () => {
  const d = mount(toolbar);
  const root = d.querySelector('[data-bronto-toolbar]');
  root.style.direction = 'rtl';
  const stop = initToolbar();
  cleanups.push(stop);
  d.querySelector('#last').focus();
  key(d.activeElement, 'ArrowRight');
  assert.equal(d.activeElement.id, 'first');
  root.setAttribute('aria-orientation', 'vertical');
  key(d.activeElement, 'ArrowDown');
  assert.equal(d.activeElement.id, 'last');
  const late = d.createElement('button');
  late.textContent = 'Late';
  late.tabIndex = 4;
  root.append(late);
  await tick();
  key(d.activeElement, 'End');
  assert.equal(d.activeElement, late);
  late.remove();
  await tick();
  assert.equal(late.tabIndex, 4);
  stop();
  assert.equal(root.getAttribute('aria-orientation'), 'vertical');
});

const menu = `<button id="origin">Open</button><div data-bronto-action-menu aria-label="Actions">
  <button role="menuitem" id="one">One</button><button role="menuitem" aria-disabled="true" id="disabled">Disabled</button>
  <button role="menuitem" hidden>Hidden</button><button role="menuitem" id="two">Two</button>
</div><input id="handoff" aria-label="Editor" /><button id="next">Next</button>`;

async function openMenu(options = {}) {
  const d = mount(menu);
  const root = d.querySelector('[data-bronto-action-menu]');
  const invoker = d.querySelector('#origin');
  invoker.focus();
  const closes = [];
  const stop = initActionMenu({
    root,
    invoker,
    onClose: (detail) => closes.push(detail),
    ...options,
  });
  cleanups.push(stop);
  await tick();
  return { d, root, invoker, closes, stop };
}

test('initActionMenu: arrows reach aria-disabled actions but activation cannot escape the guard', async () => {
  const { d, root, closes } = await openMenu();
  assert.equal(d.activeElement.id, 'one');
  key(d.activeElement, 'ArrowDown');
  assert.equal(d.activeElement.id, 'disabled');
  let invoked = 0;
  d.querySelector('#disabled').addEventListener('click', () => invoked++);
  assert.equal(key(d.activeElement, 'Enter').defaultPrevented, true);
  d.activeElement.click();
  assert.equal(invoked, 0);
  assert.equal(closes.length, 0);
  key(d.activeElement, 'ArrowDown');
  assert.equal(d.activeElement.id, 'two');
  key(d.activeElement, 'Home');
  assert.equal(d.activeElement.id, 'one');
  key(d.activeElement, 'End');
  assert.equal(d.activeElement.id, 'two');
  key(d.activeElement, 'Escape');
  assert.equal(closes[0].reason, 'escape');
  assert.equal(d.activeElement.id, 'origin');
  assert.equal(root.tabIndex, -1);
});

test('initActionMenu: cancelled and composing keys do not close or navigate', async () => {
  const { d, closes } = await openMenu();
  const item = d.activeElement;
  for (const options of [
    { isComposing: true },
    { keyCode: 229 },
    { ctrlKey: true },
    { metaKey: true },
    { altKey: true },
  ]) {
    assert.equal(key(item, 'Escape', options).defaultPrevented, false);
  }
  item.addEventListener('keydown', (event) => event.preventDefault());
  key(item, 'Escape');
  assert.equal(closes.length, 0);
});

test('initActionMenu: host tab order is honored and cleanup cannot steal a deliberate handoff', async () => {
  const { d, closes, stop } = await openMenu({ tabTarget: () => document.querySelector('#next') });
  const event = key(d.activeElement, 'Tab');
  assert.equal(event.defaultPrevented, true);
  assert.equal(closes[0].reason, 'tab');
  assert.equal(d.activeElement.id, 'next');
  stop();
  assert.equal(d.activeElement.id, 'next');
});

test('initActionMenu: native Tab fallback restores the invoker without canceling browser navigation', async () => {
  const { d, closes } = await openMenu();
  const event = key(d.activeElement, 'Tab', { shiftKey: true });
  assert.equal(event.defaultPrevented, false);
  assert.deepEqual(closes[0], { reason: 'tab', backwards: true });
  assert.equal(d.activeElement.id, 'origin');
});

test('initActionMenu: deferred selection respects cancellation and a new editor focus', async () => {
  const { d, closes, stop } = await openMenu();
  d.querySelector('#one').addEventListener('click', (event) => event.preventDefault());
  d.querySelector('#one').click();
  await tick();
  assert.equal(closes.length, 0);
  d.querySelector('#two').addEventListener('click', () => d.querySelector('#handoff').focus());
  d.querySelector('#two').click();
  await tick();
  assert.equal(closes[0].reason, 'select');
  assert.equal(d.activeElement.id, 'handoff');
  stop();
  assert.equal(d.activeElement.id, 'handoff');
});

test('initActionMenu: capture-level outside press dismisses even when the target stops bubbling', async () => {
  const { d, closes } = await openMenu();
  d.querySelector('#next').addEventListener('pointerdown', (event) => event.stopPropagation());
  pointer(d.querySelector('#next'), 'pointerdown', 3);
  assert.equal(closes[0].reason, 'outside');
});

test('initActionMenu: dynamic removal and empty menus recover focus; teardown releases new rows', async () => {
  const { d, root, stop } = await openMenu();
  const previous = d.activeElement;
  previous.remove();
  await tick();
  assert.equal(d.activeElement.id, 'disabled');
  assert.equal(previous.hasAttribute('tabindex'), false);
  root.replaceChildren();
  await tick();
  assert.equal(d.activeElement, root);
  const item = d.createElement('button');
  item.setAttribute('role', 'menuitem');
  item.textContent = 'New';
  root.append(item);
  await tick();
  assert.equal(d.activeElement, item);
  stop();
  assert.equal(item.hasAttribute('tabindex'), false);
});

test('initActionMenu: reinitialization is idempotent and an old cleanup leaves the new listener live', async () => {
  const { root, invoker, stop } = await openMenu();
  const closes = [];
  cleanups.push(initActionMenu({ root, invoker, onClose: (detail) => closes.push(detail) }));
  stop();
  await tick();
  key(document.activeElement, 'Escape');
  assert.equal(closes.length, 1);
});

function splitterMarkup(extra = '') {
  return `<div data-bronto-splitter ${extra} style="--splitter-pos: 40%">
    <section class="ui-splitter__pane">Files</section>
    <div class="ui-splitter__handle" aria-label="Files"></div>
    <section class="ui-splitter__pane">Editor</section></div>`;
}
function split(extra = '') {
  const d = mount(splitterMarkup(extra));
  const root = d.querySelector('[data-bronto-splitter]');
  root.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 200, right: 1000 });
  const handle = d.querySelector('.ui-splitter__handle');
  cleanups.push(initSplitter());
  return { d, root, handle };
}

test('initSplitter: second pointers and lost capture cannot hijack or continue a resize', () => {
  const { d, handle } = split();
  pointer(handle, 'pointerdown', 1, { clientX: 400 });
  pointer(handle, 'pointerdown', 2, { clientX: 700 });
  pointer(d, 'pointermove', 2, { clientX: 800 });
  assert.equal(handle.getAttribute('aria-valuenow'), '40');
  pointer(d, 'pointermove', 1, { clientX: 500 });
  assert.equal(handle.getAttribute('aria-valuenow'), '50');
  pointer(handle, 'lostpointercapture', 1);
  pointer(d, 'pointermove', 1, { clientX: 700 });
  assert.equal(handle.getAttribute('aria-valuenow'), '50');
  assert.equal(handle.classList.contains('is-active'), false);
});

test('initSplitter: pixel units and live bounds follow a controlled pane without cached values', () => {
  const { root, handle } = split('data-bronto-splitter-unit="px" data-bronto-splitter-step="16"');
  handle.setAttribute('aria-valuemin', '240');
  handle.setAttribute('aria-valuemax', '640');
  handle.setAttribute('aria-valuenow', '340');
  const changes = [];
  root.addEventListener('bronto:splitter:resize', (event) => changes.push(event.detail));
  key(handle, 'ArrowRight');
  assert.equal(root.style.getPropertyValue('--splitter-pos'), '356px');
  handle.setAttribute('aria-valuemax', '360');
  key(handle, 'ArrowRight');
  assert.equal(handle.getAttribute('aria-valuenow'), '360');
  assert.deepEqual(changes.at(-1), { value: 360, orientation: 'vertical', unit: 'px' });
  handle.setAttribute('aria-valuenow', '250');
  key(handle, 'ArrowLeft');
  assert.equal(handle.getAttribute('aria-valuenow'), '240');
});

test('initSplitter: respects orientation, direction, composition and disabled controls', () => {
  const { root, handle } = split();
  assert.equal(key(handle, 'ArrowDown').defaultPrevented, false);
  root.style.direction = 'rtl';
  key(handle, 'ArrowLeft');
  assert.equal(handle.getAttribute('aria-valuenow'), '42');
  assert.equal(key(handle, 'ArrowLeft', { isComposing: true }).defaultPrevented, false);
  handle.setAttribute('aria-disabled', 'true');
  key(handle, 'End');
  pointer(handle, 'pointerdown', 1, { clientX: 800 });
  assert.equal(handle.getAttribute('aria-valuenow'), '42');
});

test('initActionMenu: an immediate Escape after opening has no animation-frame gap', () => {
  const d = mount(menu);
  const root = d.querySelector('[data-bronto-action-menu]');
  const invoker = d.querySelector('#origin');
  invoker.focus();
  const reasons = [];
  cleanups.push(
    initActionMenu({ root, invoker, onClose: (detail) => reasons.push(detail.reason) }),
  );
  assert.equal(d.activeElement.id, 'one');
  key(d.activeElement, 'Escape');
  assert.deepEqual(reasons, ['escape']);
  assert.equal(d.activeElement, invoker);
});
