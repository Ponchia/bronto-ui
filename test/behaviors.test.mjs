import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  applyStoredTheme,
  initThemeToggle,
  dismissible,
  initDisclosure,
  initDialog,
  initTabs,
  toast,
} from '../behaviors/index.js';

let dom;

/** Fresh DOM + globals per test. matchMedia is left undefined on purpose
 *  so the prefers-color-scheme guard is exercised by default. */
function mount(html) {
  // A real origin is required or jsdom's localStorage throws ("opaque origin").
  dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url: 'https://bronto.test/',
  });
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.CustomEvent = dom.window.CustomEvent;
  delete globalThis.matchMedia;
  return dom.window.document;
}

beforeEach(() => dom?.window?.localStorage?.clear());
afterEach(() => {
  for (const k of ['document', 'localStorage', 'CustomEvent', 'matchMedia']) delete globalThis[k];
  dom = undefined;
});

test('SSR-safe: no DOM → no-op and a usable cleanup', () => {
  for (const k of ['document', 'localStorage', 'CustomEvent']) delete globalThis[k];
  assert.doesNotThrow(() => applyStoredTheme());
  const stop = initThemeToggle();
  assert.equal(typeof stop, 'function');
  assert.doesNotThrow(stop);
});

test('applyStoredTheme applies a valid persisted theme only', () => {
  const d = mount('');
  globalThis.localStorage.setItem('bronto-theme', 'dark');
  applyStoredTheme();
  assert.equal(d.documentElement.getAttribute('data-theme'), 'dark');

  d.documentElement.removeAttribute('data-theme');
  globalThis.localStorage.setItem('bronto-theme', 'garbage');
  applyStoredTheme();
  assert.equal(d.documentElement.hasAttribute('data-theme'), false);
});

test('initThemeToggle toggles, persists, reflects aria, emits event', () => {
  const d = mount('<button data-bronto-theme-toggle id="t">x</button>');
  const events = [];
  d.documentElement.addEventListener('bronto:themechange', (e) => events.push(e.detail.theme));

  const stop = initThemeToggle();
  // matchMedia undefined → guard → default 'light'; first click → dark
  d.getElementById('t').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(d.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(globalThis.localStorage.getItem('bronto-theme'), 'dark');
  assert.equal(d.getElementById('t').getAttribute('aria-pressed'), 'true');
  assert.deepEqual(events, ['dark']);

  d.getElementById('t').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(d.documentElement.getAttribute('data-theme'), 'light');
  assert.equal(d.getElementById('t').getAttribute('aria-pressed'), 'false');

  stop();
  d.getElementById('t').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(d.documentElement.getAttribute('data-theme'), 'light', 'no-op after cleanup');
});

test('forced toggle sets a fixed theme and reflects pressed = forced===current', () => {
  const d = mount('<button data-bronto-theme-toggle="dark" id="f">dark</button>');
  initThemeToggle();
  const btn = d.getElementById('f');
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(d.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(btn.getAttribute('aria-pressed'), 'true');
  // Clicking again stays dark (forced), still pressed.
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(d.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(btn.getAttribute('aria-pressed'), 'true');
});

test('dismissible removes target and is cancelable', () => {
  const d = mount(
    '<div data-bronto-dismissible id="box"><button data-bronto-dismiss>x</button></div>'
  );
  const stop = dismissible();

  // Cancel the first attempt.
  d.getElementById('box').addEventListener('bronto:dismiss', (e) => e.preventDefault(), {
    once: true,
  });
  d.querySelector('[data-bronto-dismiss]').dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true })
  );
  assert.ok(d.getElementById('box'), 'cancelled → still present');

  // Second attempt proceeds.
  d.querySelector('[data-bronto-dismiss]').dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true })
  );
  assert.equal(d.getElementById('box'), null, 'removed');
  stop();
});

test('initDisclosure keeps aria-expanded and hidden in sync', () => {
  const d = mount(
    '<button data-bronto-disclosure aria-controls="p" aria-expanded="false">m</button>' +
      '<div id="p" hidden>panel</div>'
  );
  initDisclosure();
  const btn = d.querySelector('[data-bronto-disclosure]');
  const panel = d.getElementById('p');

  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(btn.getAttribute('aria-expanded'), 'true');
  assert.equal(panel.hidden, false);

  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(btn.getAttribute('aria-expanded'), 'false');
  assert.equal(panel.hidden, true);
});

/** jsdom 25 has no <dialog> showModal/close — polyfill the platform API
 *  so the delegation glue (our code) is what's under test. */
function stubDialog(dlg) {
  dlg.showModal = function () {
    this.open = true;
  };
  dlg.close = function () {
    this.open = false;
  };
  return dlg;
}

test('initDialog opens via data-bronto-open and closes via data-bronto-close', () => {
  const d = mount(
    '<button data-bronto-open="dlg" id="open">open</button>' +
      '<dialog id="dlg"><button data-bronto-close>x</button></dialog>'
  );
  const stop = initDialog();
  const dlg = stubDialog(d.getElementById('dlg'));

  d.getElementById('open').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(dlg.open, true, 'opened');

  d.querySelector('[data-bronto-close]').dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true })
  );
  assert.equal(dlg.open, false, 'closed');

  stop();
  d.getElementById('open').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(dlg.open, false, 'no-op after cleanup');
});

test('initDialog light-dismiss closes only when opted in via attribute', () => {
  const d = mount(
    '<dialog id="a" data-bronto-dialog-light><p>x</p></dialog><dialog id="b"><p>y</p></dialog>'
  );
  initDialog();
  const a = stubDialog(d.getElementById('a'));
  const b = stubDialog(d.getElementById('b'));
  a.showModal();
  b.showModal();

  // Click on the dialog element itself == backdrop.
  a.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(a.open, false, 'opted-in dialog closes on backdrop');

  b.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(b.open, true, 'plain dialog ignores backdrop click');
});

test('toast mounts a shared stack, applies tone/title, and dismisses', () => {
  const d = mount('');
  const dismiss = toast('saved', { tone: 'success', title: 'OK', duration: 0 });

  const stack = d.querySelector('.ui-toast-stack');
  assert.ok(stack, 'stack created');
  assert.equal(stack.getAttribute('aria-live'), 'polite');
  const el = stack.querySelector('.ui-toast');
  assert.ok(el.classList.contains('ui-toast--success'), 'tone class applied');
  assert.equal(el.querySelector('.ui-toast__title').textContent, 'OK');
  assert.match(el.textContent, /saved/);

  dismiss();
  assert.equal(d.querySelector('.ui-toast-stack'), null, 'empty stack is removed');
});

test('initTabs: roving tabindex, click + Arrow/Home/End, panel sync', () => {
  const d = mount(
    '<div data-bronto-tabs><div class="ui-tabs__list">' +
      '<button class="ui-tab is-active" data-tab="a">A</button>' +
      '<button class="ui-tab" data-tab="b">B</button>' +
      '<button class="ui-tab" data-tab="c">C</button></div>' +
      '<div class="ui-tabs__panel" data-panel="a">PA</div>' +
      '<div class="ui-tabs__panel" data-panel="b">PB</div>' +
      '<div class="ui-tabs__panel" data-panel="c">PC</div></div>'
  );
  const stop = initTabs();
  const [a, b, c] = [...d.querySelectorAll('.ui-tab')];
  const panel = (k) => d.querySelector(`[data-panel="${k}"]`);

  // Initial: a selected, roving tabindex, only panel a visible.
  assert.equal(a.getAttribute('aria-selected'), 'true');
  assert.equal(a.tabIndex, 0);
  assert.equal(b.tabIndex, -1);
  assert.equal(panel('a').hidden, false);
  assert.equal(panel('b').hidden, true);
  assert.equal(d.querySelector('.ui-tabs__list').getAttribute('role'), 'tablist');

  // Click selects b.
  b.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(b.getAttribute('aria-selected'), 'true');
  assert.equal(a.getAttribute('aria-selected'), 'false');
  assert.equal(panel('b').hidden, false);
  assert.equal(panel('a').hidden, true);

  // ArrowRight from b → c (automatic activation).
  b.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(c.getAttribute('aria-selected'), 'true');
  assert.equal(panel('c').hidden, false);

  // ArrowRight wraps c → a; Home → a; End → c.
  c.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(a.getAttribute('aria-selected'), 'true');
  a.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(c.getAttribute('aria-selected'), 'true');

  stop();
  a.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(c.getAttribute('aria-selected'), 'true', 'no-op after cleanup');
});

test('toast is SSR-safe and returns a usable cleanup', () => {
  for (const k of ['document', 'localStorage', 'CustomEvent']) delete globalThis[k];
  const dismiss = toast('x');
  assert.equal(typeof dismiss, 'function');
  assert.doesNotThrow(dismiss);
});

test('prefers-color-scheme is honored when matchMedia exists and no attr/storage', () => {
  const d = mount('<button data-bronto-theme-toggle id="t">x</button>');
  globalThis.matchMedia = () => ({ matches: true }); // prefers dark
  initThemeToggle();
  // current() → no attr, no storage → prefersDark() true → 'dark'; click → 'light'
  d.getElementById('t').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(d.documentElement.getAttribute('data-theme'), 'light');
});
