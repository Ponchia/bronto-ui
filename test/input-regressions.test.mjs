import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { initCombobox, initCommand, initDialog } from '../behaviors/index.js';

let dom;
let stop;
const widgets = [
  { name: 'combobox', init: initCombobox, item: 'option', event: 'bronto:change' },
  { name: 'command', init: initCommand, item: 'item', event: 'bronto:command:select' },
];

function mount(markup) {
  dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`, {
    url: 'https://bronto.test/',
  });
  globalThis.document = dom.window.document;
  globalThis.CustomEvent = dom.window.CustomEvent;
  // Deliberately no global MutationObserver: each widget owns its document.
  return dom.window.document;
}

function widgetMarkup({ name, item }) {
  return `<div data-bronto-${name} data-bronto-combobox-live>
    <input class="ui-${name}__input" aria-label="Fruit" />
    <ul class="ui-${name}__list">
      <li class="ui-${name}__${item}" data-value="apple">Apple</li>
      <li class="ui-${name}__${item}" data-value="banana">Banana</li>
    </ul>
    <p class="ui-${name}__empty" hidden>No matches</p>
  </div>`;
}

function key(input, name, extra = {}) {
  const event = new dom.window.KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    cancelable: true,
    ...extra,
  });
  input.dispatchEvent(event);
  return event;
}

function filter(input, value) {
  input.value = value;
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  stop?.();
  stop = undefined;
  dom?.window.close();
  delete globalThis.document;
  delete globalThis.CustomEvent;
  delete globalThis.MutationObserver;
});

for (const widget of widgets) {
  test(`${widget.name}: composition and text-editing keys never choose, move, or close`, () => {
    const d = mount(widgetMarkup(widget));
    stop = widget.init();
    const input = d.querySelector('input');
    const events = [];
    d.addEventListener(widget.event, (e) => events.push(e.type));
    d.addEventListener('bronto:command:close', (e) => events.push(e.type));
    filter(input, '');
    key(input, 'ArrowDown');
    const active = input.getAttribute('aria-activedescendant');
    assert.ok(active);
    for (const extra of [
      { isComposing: true },
      { keyCode: 229 },
      { ctrlKey: true },
      { metaKey: true },
      { altKey: true },
      { shiftKey: true },
    ]) {
      for (const name of ['ArrowDown', 'ArrowUp', 'Enter', 'Escape']) {
        assert.equal(key(input, name, extra).defaultPrevented, false, name);
        assert.equal(input.getAttribute('aria-activedescendant'), active, name);
        assert.equal(input.value, '');
        assert.deepEqual(events, []);
      }
    }
    key(input, 'Enter');
    assert.deepEqual(events, [widget.event], 'ordinary Enter still commits');
  });

  test(`${widget.name}: respects key events already handled by the host`, () => {
    const d = mount(widgetMarkup(widget));
    const input = d.querySelector('input');
    input.addEventListener('keydown', (event) => event.preventDefault());
    stop = widget.init();
    filter(input, '');
    const before = input.getAttribute('aria-activedescendant');
    const events = [];
    d.addEventListener(widget.event, (e) => events.push(e.type));
    d.addEventListener('bronto:command:close', (e) => events.push(e.type));
    for (const name of ['ArrowDown', 'ArrowUp', 'Enter', 'Escape']) key(input, name);
    assert.equal(input.getAttribute('aria-activedescendant'), before);
    assert.equal(input.value, '');
    assert.deepEqual(events, []);
  });

  test(`${widget.name}: disabled options are discoverable but cannot commit`, () => {
    const d = mount(widgetMarkup(widget));
    stop = widget.init();
    const input = d.querySelector('input');
    const item = d.querySelector('li');
    item.setAttribute('aria-disabled', 'true');
    const events = [];
    d.addEventListener(widget.event, (e) => events.push(e.detail));
    filter(input, 'Apple');
    if (widget.name === 'combobox') key(input, 'ArrowDown');
    assert.equal(input.getAttribute('aria-activedescendant'), item.id);
    key(input, 'Enter');
    item.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    assert.deepEqual(events, [], 'neither keyboard nor pointer can select a disabled row');
    item.removeAttribute('aria-disabled');
    key(input, 'Enter');
    assert.deepEqual(events, [{ value: 'apple', label: 'Apple' }]);
  });

  test(`${widget.name}: disabled or readonly inputs cannot commit a pending option`, () => {
    const d = mount(widgetMarkup(widget));
    stop = widget.init();
    const input = d.querySelector('input');
    const item = d.querySelector('li');
    const events = [];
    d.addEventListener(widget.event, (e) => events.push(e.detail));
    filter(input, 'Apple');
    if (widget.name === 'combobox') key(input, 'ArrowDown');
    for (const attribute of ['readonly', 'disabled', 'aria-disabled']) {
      input.setAttribute(attribute, 'true');
      key(input, 'Enter');
      item.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      assert.deepEqual(events, [], attribute);
      input.removeAttribute(attribute);
    }
    key(input, 'Enter');
    assert.equal(events.length, 1);
  });
}

test('combobox: live prepends/replacements mint unique IDs and restore removed nodes', async () => {
  const d = mount(widgetMarkup(widgets[0]));
  globalThis.MutationObserver = dom.window.MutationObserver;
  stop = initCombobox();
  const input = d.querySelector('input');
  const list = d.querySelector('ul');
  const original = list.firstElementChild;
  const originalId = original.id;
  filter(input, 'Banana');
  const added = d.createElement('li');
  added.className = 'ui-combobox__option';
  added.textContent = 'Apricot';
  list.prepend(added);
  await tick();
  assert.ok(added.id, 'the live observer prepared the new option');
  assert.notEqual(added.id, originalId, 'prepending never reuses a surviving option ID');
  assert.equal(original.id, originalId, 'existing IDs stay stable');
  assert.equal(added.hidden, true, 'the live list retains the current query');
  original.remove();
  await tick();
  assert.equal(original.hidden, false, 'a detached option is not left filtered');
  assert.equal(original.id, '', 'a detached option loses its generated ID');
  assert.equal(original.hasAttribute('role'), false);
  list.append(original);
  await tick();
  assert.equal(new Set([...list.children].map((item) => item.id)).size, list.children.length);
  stop();
  stop = undefined;
  assert.ok([...list.children].every((item) => !item.id && !item.hasAttribute('role')));
});

test('combobox: closing also hides its empty state, including Shift+Tab', () => {
  const d = mount(widgetMarkup(widgets[0]));
  stop = initCombobox();
  const input = d.querySelector('input');
  const empty = d.querySelector('p');
  for (const name of ['Escape', 'Tab']) {
    filter(input, 'no such fruit');
    assert.equal(empty.hidden, false);
    key(input, name, { shiftKey: name === 'Tab' });
    assert.equal(d.querySelector('ul').hidden, true);
    assert.equal(empty.hidden, true, name);
  }
});

test('dialog: padding is not the backdrop and host-canceled clicks stay canceled', () => {
  const d = mount(
    '<button data-bronto-open="dlg">Open</button><dialog id="dlg" aria-label="Edit" data-bronto-dialog-light><p>Content</p></dialog>',
  );
  const dialog = d.querySelector('dialog');
  dialog.getBoundingClientRect = () => ({
    left: 100,
    right: 400,
    top: 100,
    bottom: 300,
    width: 300,
    height: 200,
  });
  dialog.showModal = () => {
    dialog.open = true;
  };
  dialog.close = () => {
    dialog.open = false;
  };
  stop = initDialog();
  dialog.showModal();
  dialog.dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true, clientX: 110, clientY: 110 }),
  );
  assert.equal(dialog.open, true, 'clicking padding must not discard the dialog');
  dialog.dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true, clientX: 10, clientY: 10 }),
  );
  assert.equal(dialog.open, false, 'a true backdrop click closes');
  const opener = d.querySelector('button');
  opener.addEventListener('click', (e) => e.preventDefault());
  opener.click();
  assert.equal(dialog.open, false, 'host retains control of a canceled action');
});

test('combobox: live observation uses the owning window without a global observer', async () => {
  const d = mount(widgetMarkup(widgets[0]));
  stop = initCombobox();
  const replacement = d.createElement('li');
  replacement.className = 'ui-combobox__option';
  replacement.textContent = 'Pear';
  d.querySelector('ul').replaceChildren(replacement);
  await tick();
  assert.ok(replacement.id);
  assert.equal(replacement.getAttribute('role'), 'option');
});

for (const widget of widgets) {
  test(`${widget.name}: a row moved outside the list cannot be chosen by stale active state`, () => {
    const d = mount(widgetMarkup(widget));
    stop = widget.init();
    const input = d.querySelector('input');
    const item = d.querySelector('li');
    const events = [];
    d.addEventListener(widget.event, (e) => events.push(e.detail));
    filter(input, 'Apple');
    if (widget.name === 'combobox') key(input, 'ArrowDown');
    d.body.append(item);
    key(input, 'Enter');
    assert.deepEqual(events, []);
  });

  test(`${widget.name}: inherited disabled state and canceled pointer actions cannot select`, () => {
    const d = mount(`<fieldset>${widgetMarkup(widget)}</fieldset>`);
    stop = widget.init();
    const input = d.querySelector('input');
    const item = d.querySelector('li');
    const events = [];
    d.addEventListener(widget.event, (e) => events.push(e.detail));
    filter(input, 'Apple');
    if (widget.name === 'combobox') key(input, 'ArrowDown');
    d.querySelector('fieldset').disabled = true;
    key(input, 'Enter');
    item.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    assert.deepEqual(events, [], 'native disabled fieldsets apply to the input');
    d.querySelector('fieldset').disabled = false;
    d.querySelector('ul').setAttribute('aria-disabled', 'true');
    key(input, 'Enter');
    assert.deepEqual(events, [], 'inherited ARIA state applies to the option');
    d.querySelector('ul').removeAttribute('aria-disabled');
    item.addEventListener('click', (e) => e.preventDefault());
    item.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    assert.deepEqual(events, [], 'already canceled pointer selection stays canceled');
    key(input, 'Enter');
    assert.equal(events.length, 1, 'the pending item remains selectable when enabled');
  });
}
