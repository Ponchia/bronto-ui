import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  applyStoredTheme,
  initThemeToggle,
  dismissible,
  initDisclosure,
  initMenu,
  initDialog,
  initModal,
  initTabs,
  initFormValidation,
  initCombobox,
  initPopover,
  initTableSort,
  initCarousel,
  initLegend,
  initConnectors,
  initSpotlight,
  initCrosshair,
  initCommand,
  initDisabledGuard,
  initSources,
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

const childById = (root, id) =>
  Array.from(root.querySelectorAll('[id]')).find((el) => el.id === id);

// Let a MutationObserver callback (microtask) flush before asserting.
const tick = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => dom?.window?.localStorage?.clear());
afterEach(() => {
  for (const k of ['document', 'localStorage', 'CustomEvent', 'matchMedia', 'MutationObserver'])
    delete globalThis[k];
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
    '<div data-bronto-dismissible id="box"><button data-bronto-dismiss>x</button></div>',
  );
  const stop = dismissible();

  // Cancel the first attempt.
  d.getElementById('box').addEventListener('bronto:dismiss', (e) => e.preventDefault(), {
    once: true,
  });
  d.querySelector('[data-bronto-dismiss]').dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true }),
  );
  assert.ok(d.getElementById('box'), 'cancelled → still present');

  // Second attempt proceeds.
  d.querySelector('[data-bronto-dismiss]').dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true }),
  );
  assert.equal(d.getElementById('box'), null, 'removed');
  stop();
});

test('dismissible ignores malformed custom selectors instead of throwing', () => {
  const d = mount(
    '<div data-bronto-dismissible id="box"><button data-bronto-dismiss="[[bad">x</button></div>',
  );
  const stop = dismissible();
  assert.doesNotThrow(() =>
    d
      .querySelector('[data-bronto-dismiss]')
      .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })),
  );
  assert.ok(d.getElementById('box'), 'malformed selector did not remove anything');
  stop();
});

test('initDisclosure keeps aria-expanded and hidden in sync', () => {
  const d = mount(
    '<button data-bronto-disclosure aria-controls="p" aria-expanded="false">m</button>' +
      '<div id="p" hidden>panel</div>',
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

test('initDisclosure scoped root can target document-wide portal panels', () => {
  const d = mount(
    '<section id="scope"><button data-bronto-disclosure aria-controls="outside" aria-expanded="false">m</button></section>' +
      '<div id="outside" hidden>panel</div>',
  );
  initDisclosure({ root: d.getElementById('scope') });
  d.querySelector('[data-bronto-disclosure]').dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true }),
  );
  assert.equal(d.getElementById('outside').hidden, false, 'outside portal panel toggled');
});

test('initDisclosure scoped root resolves duplicate ids inside the root first', () => {
  const d = mount(
    '<div id="dup" hidden>outside</div>' +
      '<section id="scope"><button data-bronto-disclosure aria-controls="dup" aria-expanded="false">m</button>' +
      '<div id="dup" hidden>inside</div></section>',
  );
  const scope = d.getElementById('scope');
  const inside = childById(scope, 'dup');
  initDisclosure({ root: scope });
  scope
    .querySelector('[data-bronto-disclosure]')
    .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(d.getElementById('dup').hidden, true, 'outside duplicate untouched');
  assert.equal(inside.hidden, false, 'inside duplicate toggled');
});

test('explicit root:null no-ops instead of widening to document (scope-not-ready guard)', () => {
  const d = mount(
    '<button data-bronto-disclosure aria-controls="p" aria-expanded="false">m</button>' +
      '<div id="p" hidden>panel</div>',
  );
  // A scope WAS requested (root key present) but the ref is null/not-ready —
  // the behavior must NOT silently hijack the whole document.
  const stop = initDisclosure({ root: null });
  assert.equal(typeof stop, 'function', 'returns a cleanup (noop)');
  const btn = d.querySelector('[data-bronto-disclosure]');
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(
    btn.getAttribute('aria-expanded'),
    'false',
    'document control NOT wired by null root',
  );
  assert.equal(d.getElementById('p').hidden, true, 'panel untouched');

  // Sanity: with no root key at all, the same control IS wired (document scope).
  initDisclosure();
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(btn.getAttribute('aria-expanded'), 'true', 'absent root still wires document');
});

test('initMenu closes the <details> on Escape, outside-click, and item activation', () => {
  const d = mount(
    '<details data-bronto-menu open><summary>Menu</summary>' +
      '<div class="ui-menu"><button class="ui-menu__item" id="it">Go</button></div>' +
      '</details><button id="outside">x</button>',
  );
  const stop = initMenu();
  const menu = d.querySelector('[data-bronto-menu]');
  const item = d.getElementById('it');

  // Escape closes + returns focus to <summary>.
  d.querySelector('summary').dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
  assert.equal(menu.open, false, 'Escape closed it');
  assert.equal(d.activeElement, d.querySelector('summary'), 'focus returned to summary');

  // Activating an item closes it.
  menu.open = true;
  item.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(menu.open, false, 'item activation closed it');

  // Outside click closes it (no focus move).
  menu.open = true;
  d.getElementById('outside').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(menu.open, false, 'outside click closed it');

  // Cleanup detaches listeners.
  stop();
  menu.open = true;
  d.getElementById('outside').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(menu.open, true, 'no-op after cleanup');
});

/** jsdom 25 has no <dialog> showModal/close — polyfill the platform API
 *  so the delegation glue (our code) is what's under test. */
function stubDialog(dlg) {
  dlg.showModal = function () {
    this.open = true;
  };
  dlg.close = function () {
    this.open = false;
    // Real <dialog>.close() fires a `close` event on every path; the
    // focus-return glue depends on it.
    this.dispatchEvent(new dom.window.Event('close'));
  };
  return dlg;
}

test('initDialog opens via data-bronto-open and closes via data-bronto-close', () => {
  const d = mount(
    '<button data-bronto-open="dlg" id="open">open</button>' +
      '<dialog id="dlg"><button data-bronto-close>x</button></dialog>',
  );
  const stop = initDialog();
  const dlg = stubDialog(d.getElementById('dlg'));

  d.getElementById('open').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(dlg.open, true, 'opened');

  d.querySelector('[data-bronto-close]').dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true }),
  );
  assert.equal(dlg.open, false, 'closed');

  stop();
  d.getElementById('open').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(dlg.open, false, 'no-op after cleanup');
});

test('initDialog scoped root can target document-wide portal dialogs', () => {
  const d = mount(
    '<section id="scope"><button data-bronto-open="inside" id="openIn">open</button>' +
      '<dialog id="inside"></dialog>' +
      '<button data-bronto-open="outside" id="openOut">open</button></section>' +
      '<dialog id="outside" data-bronto-dialog-light><button data-bronto-close>x</button></dialog>',
  );
  const inside = stubDialog(d.getElementById('inside'));
  const outside = stubDialog(d.getElementById('outside'));
  initDialog({ root: d.getElementById('scope') });

  d.getElementById('openIn').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(inside.open, true, 'inside dialog opened');

  d.getElementById('openOut').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(outside.open, true, 'outside portal dialog opened');

  d.querySelector('#outside [data-bronto-close]').dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true }),
  );
  assert.equal(outside.open, false, 'outside portal dialog close button works');

  d.getElementById('openOut').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  outside.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(outside.open, false, 'outside portal dialog light-dismiss works');
});

test('initDialog scoped root resolves duplicate ids inside the root first', () => {
  const d = mount(
    '<dialog id="dup"></dialog>' +
      '<section id="scope"><button data-bronto-open="dup">open</button>' +
      '<dialog id="dup"></dialog></section>',
  );
  const scope = d.getElementById('scope');
  const outside = stubDialog(d.getElementById('dup'));
  const inside = stubDialog(childById(scope, 'dup'));
  initDialog({ root: scope });
  scope
    .querySelector('[data-bronto-open]')
    .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(outside.open, false, 'outside duplicate ignored');
  assert.equal(inside.open, true, 'inside duplicate opened');
});

test('initDialog light-dismiss closes only when opted in via attribute', () => {
  const d = mount(
    '<dialog id="a" data-bronto-dialog-light><p>x</p></dialog><dialog id="b"><p>y</p></dialog>',
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
  // The stack is a persistent aria-live region: the toast is removed but
  // the (now empty) live region must stay resident so the next toast does
  // not recreate — and thus mis-announce — it (a11y H2).
  const after = d.querySelector('.ui-toast-stack');
  assert.ok(after, 'empty live region persists after drain');
  assert.equal(after.childElementCount, 0, 'toast itself was removed');
  assert.equal(after.getAttribute('aria-live'), 'polite');

  const dismiss2 = toast('again', { duration: 0 });
  const stacks = d.querySelectorAll('.ui-toast-stack');
  assert.equal(stacks.length, 1, 'reuses the one resident stack, no duplicate');
  assert.equal(stacks[0], after, 'same live-region node reused');
  dismiss2();
});

test('initTabs: roving tabindex, click + Arrow/Home/End, panel sync', () => {
  const d = mount(
    '<div data-bronto-tabs><div class="ui-tabs__list">' +
      '<button class="ui-tab is-active" data-tab="a">A</button>' +
      '<button class="ui-tab" data-tab="b">B</button>' +
      '<button class="ui-tab" data-tab="c">C</button></div>' +
      '<div class="ui-tabs__panel" data-panel="a">PA</div>' +
      '<div class="ui-tabs__panel" data-panel="b">PB</div>' +
      '<div class="ui-tabs__panel" data-panel="c">PC</div></div>',
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

test('initTabs: nested groups are isolated (own [data-bronto-tabs] only)', () => {
  const d = mount(
    '<div data-bronto-tabs id="outer">' +
      '<div class="ui-tabs__list">' +
      '<button class="ui-tab is-active" data-tab="o1">O1</button>' +
      '<button class="ui-tab" data-tab="o2">O2</button></div>' +
      '<div class="ui-tabs__panel" data-panel="o1">' +
      '<div data-bronto-tabs id="inner"><div class="ui-tabs__list">' +
      '<button class="ui-tab is-active" data-tab="i1">I1</button>' +
      '<button class="ui-tab" data-tab="i2">I2</button></div>' +
      '<div class="ui-tabs__panel" data-panel="i1">PI1</div>' +
      '<div class="ui-tabs__panel" data-panel="i2">PI2</div></div>' +
      '</div>' +
      '<div class="ui-tabs__panel" data-panel="o2">PO2</div></div>',
  );
  initTabs();
  const tab = (id, t) => d.querySelector(`#${id} .ui-tab[data-tab="${t}"]`);
  const o1 = tab('outer', 'o1');
  const o2 = tab('outer', 'o2');
  const i1 = tab('inner', 'i1');
  const i2 = tab('inner', 'i2');

  // Both groups initialise independently.
  assert.equal(o1.getAttribute('aria-selected'), 'true');
  assert.equal(i1.getAttribute('aria-selected'), 'true');

  // ArrowRight on the outer group cycles outer only (o1 → o2), never i1.
  o1.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(o2.getAttribute('aria-selected'), 'true');
  assert.equal(i1.getAttribute('aria-selected'), 'true', 'inner untouched by outer nav');

  // Selecting an inner tab does not change the outer selection.
  i2.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(i2.getAttribute('aria-selected'), 'true');
  assert.equal(o2.getAttribute('aria-selected'), 'true', 'outer untouched by inner');
});

test('initTabs: a root that IS the tab group initialises + wires APG', () => {
  const d = mount(
    '<div data-bronto-tabs id="g"><div class="ui-tabs__list">' +
      '<button class="ui-tab is-active" data-tab="a">A</button>' +
      '<button class="ui-tab" data-tab="b">B</button></div>' +
      '<div class="ui-tabs__panel" data-panel="a">PA</div>' +
      '<div class="ui-tabs__panel" data-panel="b">PB</div></div>',
  );
  const group = d.getElementById('g');
  initTabs({ root: group }); // root === the [data-bronto-tabs] element itself
  const [a, b] = [...group.querySelectorAll('.ui-tab')];
  const pa = group.querySelector('[data-panel="a"]');

  assert.equal(a.getAttribute('aria-selected'), 'true', 'root-self group initialised');
  // APG: tab↔panel cross-links, ids minted where absent.
  assert.ok(a.id && pa.id);
  assert.equal(a.getAttribute('aria-controls'), pa.id);
  assert.equal(pa.getAttribute('aria-labelledby'), a.id);
  b.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(b.getAttribute('aria-selected'), 'true');
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

test('initDialog returns focus to the trigger on close (every path)', () => {
  const d = mount(
    '<button data-bronto-open="dlg" id="open">open</button>' +
      '<dialog id="dlg"><button data-bronto-close>x</button></dialog>',
  );
  initDialog();
  const dlg = stubDialog(d.getElementById('dlg'));
  const opener = d.getElementById('open');

  opener.focus();
  opener.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(dlg.open, true, 'opened');
  // Move focus into the dialog as the browser would.
  d.querySelector('[data-bronto-close]').focus();
  assert.notEqual(d.activeElement, opener, 'focus left the trigger while open');

  d.querySelector('[data-bronto-close]').dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true }),
  );
  assert.equal(dlg.open, false, 'closed');
  assert.equal(d.activeElement, opener, 'focus returned to the trigger on close');
});

test('initThemeToggle is idempotent — re-init does not stack listeners', () => {
  const d = mount('<button data-bronto-theme-toggle id="t">x</button>');
  initThemeToggle();
  initThemeToggle(); // second call must replace, not add a 2nd handler
  d.documentElement.setAttribute('data-theme', 'light');
  d.getElementById('t').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  // A stacked 2nd listener would toggle light→dark→light (net: light).
  assert.equal(d.documentElement.getAttribute('data-theme'), 'dark', 'toggled exactly once');
});

test('initTabs mints globally-unique ids across separate init calls', () => {
  const grp = (n) =>
    `<div data-bronto-tabs id="g${n}"><div class="ui-tabs__list">` +
    `<button class="ui-tab" data-tab="a">A</button></div>` +
    `<div class="ui-tabs__panel" data-panel="a">p</div></div>`;
  const d = mount(grp(1) + grp(2));
  initTabs({ root: d.getElementById('g1') });
  initTabs({ root: d.getElementById('g2') });
  const ids = [...d.querySelectorAll('.ui-tab')].map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, `tab ids unique: ${ids.join(',')}`);
});

test('toast: first-toast rAF insert lands when not dismissed', () => {
  const d = mount('');
  const frames = [];
  globalThis.requestAnimationFrame = (cb) => frames.push(cb);
  try {
    toast('hello', { duration: 0 }); // fresh stack → deferred to next frame
    const stack = d.querySelector('.ui-toast-stack');
    assert.ok(stack, 'live region created synchronously');
    assert.equal(stack.childElementCount, 0, 'toast deferred, not in region yet');
    frames.forEach((cb) => cb());
    assert.equal(stack.childElementCount, 1, 'inserted on the frame');
    assert.match(stack.textContent, /hello/);
  } finally {
    delete globalThis.requestAnimationFrame;
  }
});

test('toast: early dismiss cancels the deferred rAF insert (no zombie)', () => {
  const d = mount('');
  const frames = [];
  globalThis.requestAnimationFrame = (cb) => frames.push(cb);
  try {
    const dismiss = toast('zombie?', { duration: 0 });
    const stack = d.querySelector('.ui-toast-stack');
    assert.equal(stack.childElementCount, 0, 'deferred to next frame');
    dismiss(); // dismissed before the frame fires
    frames.forEach((cb) => cb()); // flush rAF
    assert.equal(
      stack.childElementCount,
      0,
      'dismissed toast must NOT be resurrected into the aria-live region',
    );
    assert.ok(d.querySelector('.ui-toast-stack'), 'persistent live region still present');
  } finally {
    delete globalThis.requestAnimationFrame;
  }
});

test('toast: removes synchronously when no exit transition is in effect', () => {
  // No getComputedStyle (the default test/SSR env) → no measurable
  // transition → the dismiss contract stays synchronous (toast gone now,
  // never flagged .is-leaving).
  const d = mount('');
  const dismiss = toast('bye', { duration: 0 });
  const el = d.querySelector('.ui-toast');
  assert.ok(el, 'toast present');
  dismiss();
  assert.equal(el.classList.contains('is-leaving'), false, 'never flagged leaving without motion');
  assert.equal(d.querySelector('.ui-toast'), null, 'removed synchronously');
});

test('toast: animates its exit and is removed when the transition ends', () => {
  // Simulate a real browser where .ui-toast carries an exit transition.
  const d = mount('');
  globalThis.getComputedStyle = () => ({ transitionDuration: '0.2s' });
  try {
    const dismiss = toast('bye', { duration: 0 });
    const el = d.querySelector('.ui-toast');
    dismiss();
    assert.ok(el.classList.contains('is-leaving'), 'flagged .is-leaving to trigger the fade-out');
    assert.ok(el.isConnected, 'kept resident while it animates out');
    el.dispatchEvent(new dom.window.Event('transitionend'));
    assert.equal(el.isConnected, false, 'removed once the exit transition ends');
    assert.doesNotThrow(dismiss, 'a second dismiss is a harmless no-op');
  } finally {
    delete globalThis.getComputedStyle;
  }
});

test('toast: reduced-motion removes synchronously even with a transition set', () => {
  const d = mount('');
  globalThis.getComputedStyle = () => ({ transitionDuration: '0.2s' });
  globalThis.matchMedia = (q) => ({ matches: q.includes('reduce') });
  try {
    const dismiss = toast('bye', { duration: 0 });
    const el = d.querySelector('.ui-toast');
    dismiss();
    assert.equal(el.classList.contains('is-leaving'), false, 'reduced-motion skips the fade-out');
    assert.equal(el.isConnected, false, 'removed synchronously under reduced-motion');
  } finally {
    delete globalThis.getComputedStyle;
    delete globalThis.matchMedia;
  }
});

test('toast: toasts queued before the first frame keep FIFO order', () => {
  const d = mount('');
  const frames = [];
  globalThis.requestAnimationFrame = (cb) => frames.push(cb);
  try {
    toast('first', { duration: 0 }); // fresh stack → deferred
    toast('second', { duration: 0 }); // before flush → queued behind, not sync-ahead
    const stack = d.querySelector('.ui-toast-stack');
    assert.equal(stack.childElementCount, 0, 'both deferred, region still empty');
    frames.forEach((cb) => cb());
    const texts = [...stack.querySelectorAll('.ui-toast')].map((n) => n.textContent);
    assert.deepEqual(texts, ['first', 'second'], 'call order preserved (no reorder)');
  } finally {
    delete globalThis.requestAnimationFrame;
  }
});

test('toast: danger routes to a separate assertive live region', () => {
  const d = mount('');
  toast('boom', { tone: 'danger', duration: 0 });
  const assertive = d.querySelector('.ui-toast-stack--assertive');
  assert.ok(assertive, 'assertive region created');
  assert.equal(assertive.getAttribute('aria-live'), 'assertive');
  assert.equal(assertive.getAttribute('role'), 'alert');

  // A subsequent polite toast must NOT reuse the assertive region and
  // must keep the polite region polite.
  toast('saved', { tone: 'success', duration: 0 });
  const polite = d.querySelector('.ui-toast-stack:not(.ui-toast-stack--assertive)');
  assert.ok(polite && polite !== assertive, 'distinct polite region');
  assert.equal(polite.getAttribute('aria-live'), 'polite');
});

test('toast: explicit assertive opt overrides tone', () => {
  const d = mount('');
  toast('urgent', { assertive: true, duration: 0 });
  assert.ok(d.querySelector('.ui-toast-stack--assertive'), 'assertive opt honoured');
});

test('toast: sticky toast is closable, button dismisses, text unchanged', () => {
  const d = mount('');
  toast('hi there', { duration: 0 });
  const el = d.querySelector('.ui-toast');
  const btn = el.querySelector('.ui-toast__close');
  assert.ok(btn, 'sticky (duration:0) toast gets a close button by default');
  assert.equal(btn.getAttribute('aria-label'), 'Dismiss');
  assert.equal(el.textContent, 'hi there', 'close button contributes no text node');
  btn.click();
  assert.equal(d.querySelector('.ui-toast'), null, 'close button dismisses the toast');
});

test('toast: auto-dismiss toast has no close button unless opted in', () => {
  const d = mount('');
  globalThis.requestAnimationFrame = (cb) => cb();
  try {
    toast('transient', { duration: 5000 });
    assert.equal(
      d.querySelector('.ui-toast__close'),
      null,
      'non-sticky toast is not closable by default',
    );
    toast('keep', { duration: 5000, closable: true });
    assert.ok(
      d.querySelectorAll('.ui-toast__close').length === 1,
      'closable:true forces a dismiss button',
    );
  } finally {
    delete globalThis.requestAnimationFrame;
  }
});

test('initFormValidation: invalid submit marks fields, fills summary, blocks', () => {
  const d = mount(`
    <form data-bronto-validate>
      <div class="ui-field">
        <label class="ui-label" for="em">Email</label>
        <input class="ui-input" id="em" name="em" type="email" required />
        <p class="ui-hint" data-bronto-error></p>
      </div>
      <div class="ui-error-summary" data-bronto-error-summary hidden></div>
      <button type="submit">Go</button>
    </form>`);
  const stop = initFormValidation();
  const form = d.querySelector('form');
  const input = d.querySelector('#em');

  const ev = new dom.window.Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(ev);

  assert.equal(input.getAttribute('aria-invalid'), 'true', 'invalid field flagged');
  assert.ok(input.getAttribute('aria-describedby'), 'error slot linked via describedby');
  const summary = d.querySelector('[data-bronto-error-summary]');
  assert.equal(summary.hidden, false, 'summary revealed');
  assert.ok(summary.querySelector('a[href="#em"]'), 'summary links to the field');
  assert.equal(ev.defaultPrevented, true, 'submit blocked');

  // Fix + blur → state clears.
  input.value = 'a@b.com';
  input.dispatchEvent(new dom.window.Event('focusout', { bubbles: true }));
  assert.equal(input.hasAttribute('aria-invalid'), false, 'cleared on valid blur');
  // The canonical error node carries BOTH `ui-hint` and `data-bronto-error`.
  // It must be treated as a dedicated error slot: cleared AND unlinked, so AT
  // never announces a dangling empty error association (component audit C6).
  const errNode = d.querySelector('[data-bronto-error]');
  assert.equal(errNode.textContent, '', 'error node cleared when valid');
  assert.equal(
    input.hasAttribute('aria-describedby'),
    false,
    'dedicated error node unlinked when valid (no dangling describedby)',
  );
  stop();
});

test('initFormValidation: a borrowed plain .ui-hint keeps its help text and stays linked', () => {
  // The OTHER slot type: a help hint with NO data-bronto-error node. It is
  // borrowed for the error, then its original help text is restored and it
  // stays linked (it describes the field in the valid state too) — proving the
  // C6 fix did not collapse the two slot types into one.
  const d = mount(`
    <form data-bronto-validate>
      <div class="ui-field">
        <label class="ui-label" for="pw">Password</label>
        <input class="ui-input" id="pw" name="pw" type="text" required />
        <p class="ui-hint" id="pw-help">8+ characters</p>
      </div>
      <button type="submit">Go</button>
    </form>`);
  const stop = initFormValidation();
  const input = d.querySelector('#pw');
  const hint = d.querySelector('#pw-help');

  d.querySelector('form').dispatchEvent(
    new dom.window.Event('submit', { bubbles: true, cancelable: true }),
  );
  assert.notEqual(hint.textContent, '8+ characters', 'help overwritten by the error');
  assert.ok((input.getAttribute('aria-describedby') || '').includes(hint.id), 'linked on error');

  input.value = 'longenough';
  input.dispatchEvent(new dom.window.Event('focusout', { bubbles: true }));
  assert.equal(hint.textContent, '8+ characters', 'help text restored when valid');
  assert.ok(
    (input.getAttribute('aria-describedby') || '').includes(hint.id),
    'help hint stays linked in the valid state',
  );
  stop();
});

test('initFormValidation: valid submit is not blocked', () => {
  const d = mount(`
    <form data-bronto-validate>
      <div class="ui-field">
        <input class="ui-input" id="nm" name="nm" required value="ok" />
        <p class="ui-hint" data-bronto-error></p>
      </div>
      <button type="submit">Go</button>
    </form>`);
  const stop = initFormValidation();
  const ev = new dom.window.Event('submit', { bubbles: true, cancelable: true });
  d.querySelector('form').dispatchEvent(ev);
  assert.equal(ev.defaultPrevented, false, 'valid form submits');
  stop();
});

test('initFormValidation: noValidate is set at init, restored on cleanup', () => {
  const d = mount(`
    <form data-bronto-validate>
      <input class="ui-input" name="x" required />
      <button type="submit">Go</button>
    </form>`);
  const form = d.querySelector('form');
  assert.equal(form.noValidate, false, 'precondition: native validation on');
  const stop = initFormValidation();
  // Must be suppressed at INIT, not deferred to the first submit/blur —
  // otherwise the first invalid real-browser submit shows the UA bubble.
  assert.equal(form.noValidate, true, 'native bubbles suppressed at init');
  stop();
  assert.equal(form.noValidate, false, 'prior noValidate restored on cleanup');
});

// SSR-safe contract: with no DOM each arg-less initializer no-ops and returns a
// callable cleanup. One loop over the uniform initializers (theme + toast differ
// — see their own tests above). (code-quality audit Q14.)
const SSR_INITS = {
  initFormValidation,
  initCombobox,
  initPopover,
  initTableSort,
  initCarousel,
  initLegend,
  initConnectors,
  initSpotlight,
  initCrosshair,
  initCommand,
  initSources,
  initModal,
};
for (const [name, init] of Object.entries(SSR_INITS)) {
  test(`${name}: SSR-safe`, () => {
    for (const k of ['document', 'localStorage', 'CustomEvent']) delete globalThis[k];
    const stop = init();
    assert.equal(typeof stop, 'function', 'returns a callable cleanup');
    assert.doesNotThrow(stop);
  });
}

const CB = `
  <div class="ui-combobox" data-bronto-combobox>
    <input class="ui-input ui-combobox__input" />
    <ul class="ui-combobox__list">
      <li class="ui-combobox__option" data-value="apple">Apple</li>
      <li class="ui-combobox__option" data-value="banana">Banana</li>
      <li class="ui-combobox__option" data-value="cherry">Cherry</li>
    </ul>
    <p class="ui-combobox__empty" hidden>No matches</p>
  </div>`;

test('initCombobox: wires ARIA, filters, keyboard-selects, emits change', () => {
  const d = mount(CB);
  const stop = initCombobox();
  const input = d.querySelector('.ui-combobox__input');
  const list = d.querySelector('.ui-combobox__list');

  assert.equal(input.getAttribute('role'), 'combobox');
  assert.equal(input.getAttribute('aria-expanded'), 'false');
  assert.equal(input.getAttribute('aria-controls'), list.id);
  assert.equal(list.hidden, true);

  // Type → opens + filters.
  input.value = 'an';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(input.getAttribute('aria-expanded'), 'true');
  const shown = [...list.querySelectorAll('.ui-combobox__option')].filter((o) => !o.hidden);
  assert.deepEqual(
    shown.map((o) => o.textContent),
    ['Banana'],
    'only matching option visible',
  );

  // ArrowDown activates, Enter selects, change fires.
  let changed;
  d.querySelector('[data-bronto-combobox]').addEventListener(
    'bronto:change',
    (e) => (changed = e.detail.value),
  );
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.ok(d.querySelector('.ui-combobox__option.is-active'), 'active option set');
  assert.equal(input.getAttribute('aria-activedescendant'), shown[0].id);
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  // Input shows the human LABEL; the change event carries the data-value CODE (C10).
  assert.equal(input.value, 'Banana', 'input shows the option label');
  assert.equal(changed, 'banana', 'bronto:change emits the data-value code');
  assert.equal(list.hidden, true, 'closes on select');
  stop();
});

test('initCombobox: empty state, Escape closes, cleanup detaches', () => {
  const d = mount(CB);
  const stop = initCombobox();
  const input = d.querySelector('.ui-combobox__input');
  const list = d.querySelector('.ui-combobox__list');
  const empty = d.querySelector('.ui-combobox__empty');

  input.value = 'zzz';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(empty.hidden, false, 'empty state shown when nothing matches');

  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(list.hidden, true, 'Escape closes');

  stop();
  input.value = 'a';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(list.hidden, true, 'no-op after cleanup');
});

test('initCombobox: data-bronto-combobox-live re-reads async-added options', async () => {
  const d = mount(`
    <div class="ui-combobox" data-bronto-combobox data-bronto-combobox-live>
      <input class="ui-input ui-combobox__input" aria-label="Fruit" />
      <ul class="ui-combobox__list"></ul>
      <p class="ui-combobox__empty" hidden>No matches</p>
    </div>`);
  globalThis.MutationObserver = dom.window.MutationObserver;
  const stop = initCombobox();
  const input = d.querySelector('.ui-combobox__input');
  const list = d.querySelector('.ui-combobox__list');

  // Results arrive after init (the async/remote case).
  const li = d.createElement('li');
  li.className = 'ui-combobox__option';
  li.dataset.value = 'mango';
  li.textContent = 'Mango';
  list.appendChild(li);
  await tick();

  assert.ok(li.id, 'observer ran syncOptions: new option got an id');
  assert.equal(li.getAttribute('role'), 'option', 'new option got role=option');

  input.value = 'man';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(li.hidden, false, 'async option filters in');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(input.value, 'Mango', 'async option is keyboard-selectable (label shown)');
  stop();
});

test('initCombobox: without the live opt-in, async options stay stale', async () => {
  const d = mount(`
    <div class="ui-combobox" data-bronto-combobox>
      <input class="ui-input ui-combobox__input" aria-label="Fruit" />
      <ul class="ui-combobox__list"></ul>
    </div>`);
  globalThis.MutationObserver = dom.window.MutationObserver;
  const stop = initCombobox();
  const list = d.querySelector('.ui-combobox__list');
  const li = d.createElement('li');
  li.className = 'ui-combobox__option';
  li.textContent = 'Mango';
  list.appendChild(li);
  await tick();
  assert.equal(li.id, '', 'no observer without the opt-in: option left untouched');
  stop();
});

test('initCombobox: a filtered-out active option cannot be Enter-selected (APG)', () => {
  const d = mount(CB);
  const stop = initCombobox();
  const input = d.querySelector('.ui-combobox__input');

  // Open (all shown) and activate the first option (Apple).
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  const apple = d.querySelector('.ui-combobox__option');
  assert.equal(input.getAttribute('aria-activedescendant'), apple.id, 'Apple is active');

  // Filter so Apple is hidden — stale active must be dropped.
  input.value = 'ban';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(apple.hidden, true, 'Apple filtered out');
  assert.equal(
    input.hasAttribute('aria-activedescendant'),
    false,
    'stale activedescendant cleared',
  );

  // Enter must NOT select the hidden Apple.
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.notEqual(input.value, 'apple', 'hidden option is not selectable');
  stop();
});

test('initCombobox: ArrowUp wraps to last, Home/End jump to edges, Tab closes', () => {
  const d = mount(CB);
  const stop = initCombobox();
  const input = d.querySelector('.ui-combobox__input');
  const list = d.querySelector('.ui-combobox__list');
  const opts = [...list.querySelectorAll('.ui-combobox__option')]; // Apple, Banana, Cherry

  // Open with all options shown; nothing active yet.
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(list.hidden, false, 'open');
  assert.equal(input.hasAttribute('aria-activedescendant'), false, 'no active option seeded');

  // ArrowUp with no active option wraps to the LAST (the roving wrapIndex edge).
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  assert.equal(input.getAttribute('aria-activedescendant'), opts[2].id, 'ArrowUp wraps to last');

  // Home jumps to the first, End to the last.
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(input.getAttribute('aria-activedescendant'), opts[0].id, 'Home → first');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(input.getAttribute('aria-activedescendant'), opts[2].id, 'End → last');

  // Tab closes the listbox.
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  assert.equal(list.hidden, true, 'Tab closes');
  stop();
});

test('initPopover: toggles panel, manages aria, Escape + outside close', () => {
  const d = mount(
    '<button id="t" data-bronto-popover="pop">Info</button>' +
      '<div class="ui-popover" id="pop">Details</div>' +
      '<button id="away">elsewhere</button>',
  );
  const stop = initPopover();
  const trigger = d.getElementById('t');
  const panel = d.getElementById('pop');

  trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.ok(panel.classList.contains('is-open'), 'opens (no native Popover in jsdom)');
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(trigger.getAttribute('aria-controls'), 'pop');

  // Toggle closed by re-click.
  trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), false, 're-click closes');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');

  // Reopen, Escape closes.
  trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  d.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), false, 'Escape closes');

  // Reopen, outside click closes.
  trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  d.getElementById('away').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), false, 'outside click closes');

  stop();
  trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), false, 'no-op after cleanup');
});

test('initPopover scoped root can target document-wide portal panels', () => {
  const d = mount(
    '<section id="scope"><button id="t" data-bronto-popover="outside">Info</button></section>' +
      '<div class="ui-popover" id="outside">Details</div><button id="away">Away</button>',
  );
  const panel = d.getElementById('outside');
  initPopover({ root: d.getElementById('scope') });
  d.getElementById('t').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), true, 'outside portal panel opened');
  d.getElementById('away').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), false, 'outside click closes portal panel');

  d.getElementById('t').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  d.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), false, 'Escape closes portal panel');
});

test('initPopover scoped root resolves duplicate ids inside the root first', () => {
  const d = mount(
    '<div class="ui-popover" id="dup">Outside</div>' +
      '<section id="scope"><button id="t" data-bronto-popover="dup">Info</button>' +
      '<div class="ui-popover" id="dup">Inside</div></section>',
  );
  const scope = d.getElementById('scope');
  const outside = d.getElementById('dup');
  const inside = childById(scope, 'dup');
  initPopover({ root: scope });
  d.getElementById('t').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(outside.classList.contains('is-open'), false, 'outside duplicate ignored');
  assert.equal(inside.classList.contains('is-open'), true, 'inside duplicate opened');
});

const TBL = `
  <table class="ui-table ui-table--selectable" data-bronto-sortable>
    <thead><tr>
      <th class="ui-table__select"><input type="checkbox" data-bronto-select-all /></th>
      <th><button class="ui-table__sort" data-sort>Name</button></th>
      <th class="is-num"><button class="ui-table__sort" data-sort="num">Score</button></th>
    </tr></thead>
    <tbody>
      <tr><td><input type="checkbox" data-bronto-select /></td><td>Bob</td><td class="is-num">30</td></tr>
      <tr><td><input type="checkbox" data-bronto-select /></td><td>Ann</td><td class="is-num">9</td></tr>
      <tr><td><input type="checkbox" data-bronto-select /></td><td>Cy</td><td class="is-num">100</td></tr>
    </tbody>
  </table>`;

test('initTableSort: cycles aria-sort and reorders rows (string + numeric)', () => {
  const d = mount(TBL);
  const stop = initTableSort();
  const table = d.querySelector('table');
  const names = () => [...table.tBodies[0].rows].map((r) => r.children[1].textContent);
  const nameBtn = table.querySelectorAll('.ui-table__sort')[0];
  const scoreBtn = table.querySelectorAll('.ui-table__sort')[1];

  // Sortable headers are seeded aria-sort="none" on init (announced sortable).
  assert.equal(nameBtn.closest('th').getAttribute('aria-sort'), 'none', 'seeded none');
  assert.equal(scoreBtn.closest('th').getAttribute('aria-sort'), 'none', 'seeded none');

  nameBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(names(), ['Ann', 'Bob', 'Cy'], 'ascending string sort');
  assert.equal(nameBtn.closest('th').getAttribute('aria-sort'), 'ascending');
  nameBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(names(), ['Cy', 'Bob', 'Ann'], 'descending on re-click');
  assert.equal(nameBtn.closest('th').getAttribute('aria-sort'), 'descending');

  scoreBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(names(), ['Ann', 'Bob', 'Cy'], 'numeric sort (9,30,100) not lexical');
  // The other sortable header resets to "none" (stays advertised as sortable),
  // not removed — APG: a sortable column always carries aria-sort.
  assert.equal(
    nameBtn.closest('th').getAttribute('aria-sort'),
    'none',
    'other header reset to none',
  );
  assert.equal(
    scoreBtn.closest('th').getAttribute('aria-sort'),
    'ascending',
    'active header sorted',
  );
  stop();
});

test('initTableSort: numeric sort keeps the sign on U+2212, accounting parens, and data-sort-value (C3)', () => {
  // P/L column mixing a Unicode minus (−), accounting parentheses, a thousands
  // separator, and a data-sort-value escape hatch. The losses must sort below
  // the gains, not above them.
  const d = mount(`
    <table class="ui-table" data-bronto-sortable>
      <thead><tr>
        <th><button class="ui-table__sort" data-sort>Row</button></th>
        <th class="is-num"><button class="ui-table__sort" data-sort="num">P/L</button></th>
      </tr></thead>
      <tbody>
        <tr><td>gain</td><td class="is-num">1,200</td></tr>
        <tr><td>uniminus</td><td class="is-num">−5</td></tr>
        <tr><td>parens</td><td class="is-num">(50)</td></tr>
        <tr><td>override</td><td class="is-num" data-sort-value="-999">N/A</td></tr>
      </tbody>
    </table>`);
  const stop = initTableSort();
  const table = d.querySelector('table');
  const order = () => [...table.tBodies[0].rows].map((r) => r.children[0].textContent);
  const btn = table.querySelector('.ui-table__sort[data-sort="num"]');
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  // ascending: -999, -50, -5, 1200
  assert.deepEqual(order(), ['override', 'parens', 'uniminus', 'gain'], 'sign-aware ascending');
  stop();
});

test('initTableSort: data-sort-value escape hatch accepts a European decimal comma (C5)', () => {
  // A column where the display text is European decimal ("3,5" = 3.5). Without
  // the escape hatch the parser drops the comma → 35, mis-ranking it. The
  // data-sort-value attribute must sort the rows by the real magnitude, and it
  // must accept a comma decimal in the attribute itself, not just a dot.
  const d = mount(`
    <table class="ui-table" data-bronto-sortable>
      <thead><tr>
        <th><button class="ui-table__sort" data-sort>Row</button></th>
        <th class="is-num"><button class="ui-table__sort" data-sort="num">Val</button></th>
      </tr></thead>
      <tbody>
        <tr><td>big</td><td class="is-num" data-sort-value="35">35,0</td></tr>
        <tr><td>mid</td><td class="is-num" data-sort-value="3,5">3,5</td></tr>
        <tr><td>small</td><td class="is-num" data-sort-value="0.5">0,5</td></tr>
      </tbody>
    </table>`);
  const stop = initTableSort();
  const table = d.querySelector('table');
  const order = () => [...table.tBodies[0].rows].map((r) => r.children[0].textContent);
  const btn = table.querySelector('.ui-table__sort[data-sort="num"]');
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  // ascending by true value: 0.5, 3.5, 35 — NOT 3.5→35 collapsed by comma-drop.
  assert.deepEqual(order(), ['small', 'mid', 'big'], 'comma-decimal escape hatch sorts by value');
  stop();
});

test('initTableSort: select-all + row selection stay in sync', () => {
  const d = mount(TBL);
  const stop = initTableSort();
  const table = d.querySelector('table');
  const all = table.querySelector('[data-bronto-select-all]');
  const rows = [...table.querySelectorAll('[data-bronto-select]')];

  let count;
  table.addEventListener('bronto:selectionchange', (e) => (count = e.detail.count));

  all.checked = true;
  all.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.ok(
    rows.every((b) => b.checked),
    'select-all checks every row',
  );
  assert.equal(count, 3);
  assert.equal(rows[0].closest('tr').getAttribute('aria-selected'), 'true');

  rows[0].checked = false;
  rows[0].dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(all.indeterminate, true, 'header goes indeterminate on partial');
  assert.equal(count, 2);
  stop();
});

const CAR = `
  <div class="ui-carousel" data-bronto-carousel data-bronto-carousel-label="Photos">
    <div class="ui-carousel__stage">
      <div class="ui-carousel__viewport">
        <div class="ui-carousel__slide"><img src="a" alt="A" /></div>
        <div class="ui-carousel__slide"><img src="b" alt="B" /></div>
        <div class="ui-carousel__slide"><img src="c" alt="C" /></div>
      </div>
      <button class="ui-carousel__prev" data-bronto-carousel-prev></button>
      <button class="ui-carousel__next" data-bronto-carousel-next></button>
      <p class="ui-carousel__status"></p>
    </div>
    <ul class="ui-carousel__thumbs">
      <li><button class="ui-carousel__thumb"><img src="a" alt="" /></button></li>
      <li><button class="ui-carousel__thumb"><img src="b" alt="" /></button></li>
      <li><button class="ui-carousel__thumb"><img src="c" alt="" /></button></li>
    </ul>
  </div>`;

test('initCarousel: wires ARIA + counter, next advances index, emits change', () => {
  const d = mount(CAR);
  const stop = initCarousel();
  const vp = d.querySelector('.ui-carousel__viewport');
  const status = d.querySelector('.ui-carousel__status');
  const prev = d.querySelector('[data-bronto-carousel-prev]');
  const next = d.querySelector('[data-bronto-carousel-next]');
  const thumbs = [...d.querySelectorAll('.ui-carousel__thumb')];

  assert.equal(vp.getAttribute('role'), 'group');
  assert.equal(vp.getAttribute('aria-roledescription'), 'carousel');
  assert.equal(vp.getAttribute('aria-label'), 'Photos');
  assert.equal(vp.tabIndex, 0);
  assert.equal(status.getAttribute('aria-live'), 'polite');
  assert.equal(status.textContent, '1 / 3');
  assert.equal(thumbs[0].getAttribute('aria-current'), 'true');
  assert.equal(prev.disabled, true, 'prev disabled at start when not looping');
  assert.equal(next.disabled, false);

  let changed;
  d.querySelector('[data-bronto-carousel]').addEventListener(
    'bronto:change',
    (e) => (changed = e.detail.index),
  );
  next.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(status.textContent, '2 / 3');
  assert.equal(changed, 1, 'bronto:change carries the new index');
  assert.equal(thumbs[1].getAttribute('aria-current'), 'true');
  assert.equal(thumbs[0].hasAttribute('aria-current'), false, 'active thumb moved');
  assert.equal(prev.disabled, false);
  stop();
});

test('initCarousel: thumb click jumps; next clamps at the end (no loop)', () => {
  const d = mount(CAR);
  initCarousel();
  const status = d.querySelector('.ui-carousel__status');
  const next = d.querySelector('[data-bronto-carousel-next]');
  const thumbs = [...d.querySelectorAll('.ui-carousel__thumb')];

  thumbs[2].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(status.textContent, '3 / 3', 'thumb jumps to its index');
  assert.equal(next.disabled, true, 'next disabled at the end');

  next.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(status.textContent, '3 / 3', 'clamped — no wrap without loop');
});

test('initCarousel: keyboard Arrow/Home/End navigate the focused viewport', () => {
  const d = mount(CAR);
  initCarousel();
  const vp = d.querySelector('.ui-carousel__viewport');
  const status = d.querySelector('.ui-carousel__status');
  const key = (k) =>
    vp.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true }));

  key('ArrowRight');
  assert.equal(status.textContent, '2 / 3');
  key('End');
  assert.equal(status.textContent, '3 / 3');
  key('Home');
  assert.equal(status.textContent, '1 / 3');
  key('ArrowLeft');
  assert.equal(status.textContent, '1 / 3', 'clamped at the start');
});

test('initCarousel: data-bronto-carousel-loop wraps at both ends', () => {
  const d = mount(
    CAR.replace('data-bronto-carousel ', 'data-bronto-carousel data-bronto-carousel-loop '),
  );
  initCarousel();
  const status = d.querySelector('.ui-carousel__status');
  const prev = d.querySelector('[data-bronto-carousel-prev]');
  const next = d.querySelector('[data-bronto-carousel-next]');

  assert.equal(prev.disabled, false, 'looping carousel never disables the ends');
  prev.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(status.textContent, '3 / 3', 'prev from the first wraps to the last');
  next.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(status.textContent, '1 / 3', 'next from the last wraps to the first');
});

test('initCarousel: idempotent re-init does not stack, cleanup detaches', () => {
  const d = mount(CAR);
  initCarousel();
  const stop = initCarousel(); // must replace, not add a 2nd handler
  const status = d.querySelector('.ui-carousel__status');
  const next = d.querySelector('[data-bronto-carousel-next]');

  next.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(status.textContent, '2 / 3', 'advanced exactly once');

  stop();
  next.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(status.textContent, '2 / 3', 'no-op after cleanup');
});

const legendMarkup = `
  <ul class="ui-legend ui-legend--interactive" data-bronto-legend>
    <li><button class="ui-legend__item" aria-pressed="true" data-series="a">
      <span class="ui-legend__swatch"></span><span class="ui-legend__label">A</span>
    </button></li>
    <li><button class="ui-legend__item" aria-pressed="true" data-series="b">
      <span class="ui-legend__swatch"></span><span class="ui-legend__label">B</span>
    </button></li>
  </ul>`;

test('initLegend: click toggles aria-pressed + is-inactive and emits bronto:legend:toggle', () => {
  const d = mount(legendMarkup);
  initLegend();
  const btn = d.querySelectorAll('.ui-legend__item')[0];
  const events = [];
  d.addEventListener('bronto:legend:toggle', (e) => events.push(e.detail));

  // Click on an inner span — delegation must still resolve the item button.
  btn
    .querySelector('.ui-legend__swatch')
    .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(btn.getAttribute('aria-pressed'), 'false');
  assert.ok(btn.classList.contains('is-inactive'));
  assert.deepEqual(events.at(-1), { series: 'a', active: false });

  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(btn.getAttribute('aria-pressed'), 'true');
  assert.ok(!btn.classList.contains('is-inactive'));
  assert.deepEqual(events.at(-1), { series: 'a', active: true });
});

test('initLegend: falls back to the 0-based index when data-series is absent', () => {
  const d = mount(`
    <ul class="ui-legend ui-legend--interactive" data-bronto-legend>
      <li><button class="ui-legend__item" aria-pressed="true"><span class="ui-legend__label">A</span></button></li>
      <li><button class="ui-legend__item" aria-pressed="true"><span class="ui-legend__label">B</span></button></li>
    </ul>`);
  initLegend();
  const second = d.querySelectorAll('.ui-legend__item')[1];
  const events = [];
  d.addEventListener('bronto:legend:toggle', (e) => events.push(e.detail));
  second.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(events.at(-1), { series: 1, active: false });
});

test('initLegend: idempotent (re-init replaces, never stacks) and cleanup stops it', () => {
  const d = mount(legendMarkup);
  initLegend();
  const stop = initLegend(); // must replace, not add a 2nd handler
  const btn = d.querySelectorAll('.ui-legend__item')[0];
  let count = 0;
  d.addEventListener('bronto:legend:toggle', () => count++);

  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(count, 1, 'fires exactly once');

  stop();
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(count, 1, 'no-op after cleanup');
});

test('initConnectors: draws a path with d and an end marker', () => {
  const d = mount(
    '<div style="position:relative"><span id="a">a</span><span id="b">b</span>' +
      '<svg class="ui-connector" data-bronto-connector data-from="a" data-to="b" data-end="arrow"></svg></div>',
  );
  const stop = initConnectors();
  const svg = d.querySelector('.ui-connector');
  const path = svg.querySelector('.ui-connector__path');
  assert.ok(path, 'path element created');
  assert.ok(path.getAttribute('d'), 'path has d');
  // a plain (non-draw) connector must NOT carry pathLength (it would reframe a dash)
  assert.equal(path.hasAttribute('pathLength'), false);
  assert.ok(svg.querySelector('.ui-connector__end'), 'arrow end created');
  assert.equal(typeof stop, 'function');
  assert.doesNotThrow(stop);
});

test('initConnectors: data-end="none" draws no end marker; missing target is skipped', () => {
  const d = mount(
    '<div style="position:relative"><span id="a">a</span><span id="b">b</span>' +
      '<svg class="ui-connector" data-bronto-connector data-from="a" data-to="b" data-end="none"></svg>' +
      '<svg class="ui-connector" data-bronto-connector data-from="a" data-to="missing"></svg></div>',
  );
  initConnectors();
  const [first, second] = d.querySelectorAll('.ui-connector');
  assert.ok(first.querySelector('.ui-connector__path'), 'first drawn');
  assert.equal(first.querySelector('.ui-connector__end'), null, 'no end marker');
  assert.equal(second.querySelector('.ui-connector__path'), null, 'missing target → skipped');
});

test('initConnectors: pathLength is set only for draw connectors (dashed keeps its user-unit dasharray)', () => {
  const d = mount(
    '<div style="position:relative"><span id="a">a</span><span id="b">b</span>' +
      '<svg class="ui-connector ui-connector--dashed" data-bronto-connector data-from="a" data-to="b"></svg>' +
      '<svg class="ui-connector ui-connector--draw" data-bronto-connector data-from="a" data-to="b"></svg></div>',
  );
  initConnectors();
  const [dashed, draw] = d.querySelectorAll('.ui-connector');
  assert.equal(dashed.querySelector('.ui-connector__path').hasAttribute('pathLength'), false);
  assert.equal(draw.querySelector('.ui-connector__path').getAttribute('pathLength'), '1');
});

test('initSpotlight: sets the cutout custom properties from the target', () => {
  const d = mount(
    '<button id="t">t</button>' +
      '<div class="ui-spotlight" data-bronto-spotlight data-target="t"><div class="ui-spotlight__hole"></div></div>',
  );
  const stop = initSpotlight();
  const spot = d.querySelector('.ui-spotlight');
  // jsdom getBoundingClientRect is all-zero, but the props must be set (px units).
  assert.match(spot.style.getPropertyValue('--spot-w'), /px$/);
  assert.match(spot.style.getPropertyValue('--spot-x'), /px$/);
  assert.equal(typeof stop, 'function');
  assert.doesNotThrow(stop);
});

test('initCrosshair: wires a plot without throwing and cleans up', () => {
  const d = mount(
    '<figure data-bronto-crosshair><div class="ui-crosshair">' +
      '<div class="ui-crosshair__line ui-crosshair__line--x"></div></div></figure>',
  );
  const stop = initCrosshair();
  const plot = d.querySelector('[data-bronto-crosshair]');
  // jsdom getBoundingClientRect is all-zero → onMove guards out, but must not throw.
  assert.doesNotThrow(() =>
    plot.dispatchEvent(new dom.window.MouseEvent('pointermove', { clientX: 5, clientY: 5 })),
  );
  assert.equal(typeof stop, 'function');
  assert.doesNotThrow(stop);
});

const SOURCES = `
  <main data-bronto-sources>
    <p>
      Claim <a class="ui-citation" href="#s1" aria-label="Source 1">[1]</a>
      <button type="button" data-bronto-source-ref="s2">Preview source 2</button>
    </p>
    <ol class="ui-source-list">
      <li class="ui-source-list__item">
        <article id="s1" class="ui-source-card ui-src--verified">
          <h3 class="ui-source-card__title">Incident review</h3>
          <p class="ui-source-card__origin">ops export</p>
          <p class="ui-source-card__time">2026-06-09</p>
          <p class="ui-source-card__excerpt">Rollback restored service.</p>
        </article>
      </li>
      <li class="ui-source-list__item">
        <article id="s2" class="ui-source-card ui-src--generated">
          <h3 class="ui-source-card__title">Model summary</h3>
          <p class="ui-source-card__excerpt">Error rate doubled.</p>
        </article>
      </li>
    </ol>
  </main>`;

test('initSources: seeds source preview metadata and focuses the referenced card', () => {
  const d = mount(SOURCES);
  const island = d.querySelector('[data-bronto-sources]');
  const ref = d.querySelector('.ui-citation');
  const source = d.getElementById('s1');
  const events = [];
  island.addEventListener('bronto:source:focus', (e) => events.push(e.detail));

  const stop = initSources();
  assert.equal(ref.getAttribute('aria-describedby'), 's1');
  assert.match(ref.getAttribute('title'), /Incident review/);
  assert.match(ref.getAttribute('title'), /Rollback restored service/);
  assert.equal(source.getAttribute('tabindex'), '-1');

  ref.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(d.activeElement, source, 'source card receives focus');
  assert.ok(source.classList.contains('is-source-active'), 'source card is highlighted');
  assert.deepEqual(
    events.map((e) => [e.id, e.citation, e.source]),
    [['s1', ref, source]],
  );

  stop();
  assert.equal(ref.hasAttribute('aria-describedby'), false, 'cleanup restores describedby');
  assert.equal(ref.hasAttribute('title'), false, 'cleanup restores title');
  assert.equal(source.hasAttribute('tabindex'), false, 'cleanup restores tabindex');
  assert.equal(source.classList.contains('is-source-active'), false, 'cleanup clears highlight');
});

test('initSources: supports button refs, scoped duplicate ids, idempotence, cleanup, and root:null', () => {
  const d = mount(`
    <article id="dup" class="ui-source-card">outside</article>
    <main id="scope" data-bronto-sources>
      <button type="button" data-bronto-source-ref="#dup">Inside source</button>
      <article id="dup" class="ui-source-card">
        <h3 class="ui-source-card__title">Scoped source</h3>
      </article>
    </main>`);
  const scope = d.getElementById('scope');
  const inside = childById(scope, 'dup');
  const button = scope.querySelector('[data-bronto-source-ref]');
  let count = 0;
  scope.addEventListener('bronto:source:focus', () => count++);

  const noopStop = initSources({ root: null });
  button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(count, 0, 'root:null does not widen to document');
  noopStop();

  initSources({ root: scope });
  const stop = initSources({ root: scope }); // replaces instead of stacking
  button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(count, 1, 'fires once after re-init');
  assert.equal(d.activeElement, inside, 'duplicate id inside the scope wins');
  assert.equal(d.getElementById('dup').classList.contains('is-source-active'), false);
  assert.ok(inside.classList.contains('is-source-active'));

  stop();
  button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(count, 1, 'cleanup removes listener');
});

const CMD = `
  <div class="ui-command" data-bronto-command>
    <input class="ui-command__input" aria-label="Command" />
    <ul class="ui-command__list">
      <li class="ui-command__group">Nav</li>
      <li class="ui-command__item" data-value="home"><span>Go home</span></li>
      <li class="ui-command__item" data-value="settings"><span>Open settings</span></li>
      <li class="ui-command__group">Acts</li>
      <li class="ui-command__item" data-value="new"><span>New invoice</span></li>
    </ul>
    <p class="ui-command__empty" hidden>No commands</p>
  </div>`;

test('initCommand: ARIA, filter (with group hide), roving nav, select + close events', () => {
  const d = mount(CMD);
  const stop = initCommand();
  const box = d.querySelector('[data-bronto-command]');
  const input = d.querySelector('.ui-command__input');
  const list = d.querySelector('.ui-command__list');
  const items = [...d.querySelectorAll('.ui-command__item')];
  const groups = [...d.querySelectorAll('.ui-command__group')];

  assert.equal(input.getAttribute('role'), 'combobox');
  assert.equal(list.getAttribute('role'), 'listbox');
  assert.equal(input.getAttribute('aria-controls'), list.id);
  // Seeded: first item active.
  assert.ok(items[0].classList.contains('is-active'));
  assert.equal(input.getAttribute('aria-activedescendant'), items[0].id);

  // Filter → only "settings" matches; the "Acts" group (no match) is hidden.
  input.value = 'settings';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.deepEqual(
    items.filter((it) => !it.hidden).map((it) => it.dataset.value),
    ['settings'],
  );
  assert.equal(groups[1].hidden, true, 'empty group hidden');
  assert.ok(items[1].classList.contains('is-active'), 'active moves to first visible');

  // No match → empty shown.
  input.value = 'zzz';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(d.querySelector('.ui-command__empty').hidden, false);

  // Clear → all visible; ArrowDown rovs, Enter selects, event fires.
  input.value = '';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  let picked;
  box.addEventListener('bronto:command:select', (e) => (picked = e.detail));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(picked.value, 'settings');
  assert.equal(picked.label, 'Open settings');

  // Escape emits close.
  let closed = false;
  box.addEventListener('bronto:command:close', () => (closed = true));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(closed, true);

  // Pointer select.
  picked = undefined;
  items[2].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(picked.value, 'new');

  stop();
});

test('initCommand: ArrowUp wraps to last, Home/End jump to edges', () => {
  const d = mount(CMD);
  const stop = initCommand();
  const input = d.querySelector('.ui-command__input');
  const items = [...d.querySelectorAll('.ui-command__item')]; // home, settings, new

  // Seeded active = first item.
  assert.ok(items[0].classList.contains('is-active'), 'first item seeded active');

  // ArrowUp from the first item wraps to the last.
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  assert.ok(items[2].classList.contains('is-active'), 'ArrowUp wraps to last');
  assert.equal(input.getAttribute('aria-activedescendant'), items[2].id);

  // Home → first, End → last.
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.ok(items[0].classList.contains('is-active'), 'Home → first');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.ok(items[2].classList.contains('is-active'), 'End → last');

  stop();
});

test('initModal: inert traps focus, returns it on close, Escape only signals', async () => {
  const d = mount(`
    <button id="opener">Open</button>
    <aside id="bg"><a href="#">background link</a></aside>
    <div class="ui-modal" data-bronto-modal>
      <button id="ok">OK</button>
    </div>`);
  globalThis.MutationObserver = dom.window.MutationObserver;
  const stop = initModal();
  const opener = d.getElementById('opener');
  opener.focus();
  const modal = d.querySelector('.ui-modal');

  // Consumer opens (owns the class); behavior traps focus.
  modal.classList.add('is-open');
  await tick();
  assert.equal(d.activeElement.id, 'ok', 'focus moved into the modal');
  assert.equal(d.getElementById('opener').inert, true, 'opener sibling inert');
  assert.equal(d.getElementById('bg').inert, true, 'background sibling inert');

  // Escape requests close (cancelable event) but never changes visibility.
  let reason = null;
  modal.addEventListener('bronto:modal:close', (e) => (reason = e.detail.reason));
  d.getElementById('ok').dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
  assert.equal(reason, 'escape', 'Escape emits bronto:modal:close');
  assert.ok(modal.classList.contains('is-open'), 'open/close state stays the consumer’s');

  // Consumer closes → inert released, focus returned to the opener.
  modal.classList.remove('is-open');
  await tick();
  assert.equal(d.getElementById('bg').inert, false, 'inert released on close');
  assert.equal(d.activeElement.id, 'opener', 'focus returned to opener');

  // Cleanup releases any live trap and detaches.
  modal.classList.add('is-open');
  await tick();
  stop();
  assert.equal(d.getElementById('bg').inert, false, 'cleanup un-inerts');
});

// ---------------------------------------------------------------------------
// initDisabledGuard — aria-disabled controls become keyboard-inert, not just
// pointer-inert (component audit C4). Capturing listeners must swallow the
// activation before any component handler sees it.
// ---------------------------------------------------------------------------
test('disabled guard blocks click + Enter/Space on aria-disabled controls', () => {
  const d = mount(
    '<button id="dead" aria-disabled="true">Dead</button>' + '<button id="live">Live</button>',
  );
  const stop = initDisabledGuard();

  let deadFired = 0;
  let liveFired = 0;
  d.getElementById('dead').addEventListener('click', () => deadFired++);
  d.getElementById('live').addEventListener('click', () => liveFired++);

  const deadClick = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  d.getElementById('dead').dispatchEvent(deadClick);
  assert.equal(deadFired, 0, 'capturing guard swallows the click before the handler');
  assert.equal(deadClick.defaultPrevented, true, 'click default is prevented');

  for (const key of ['Enter', ' ']) {
    const e = new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    d.getElementById('dead').dispatchEvent(e);
    assert.equal(e.defaultPrevented, true, `${JSON.stringify(key)} activation is blocked`);
  }

  // Enabled controls are untouched.
  const liveClick = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  d.getElementById('live').dispatchEvent(liveClick);
  assert.equal(liveFired, 1, 'enabled control still fires');
  assert.equal(liveClick.defaultPrevented, false);
  stop();
});

test('disabled guard lets Tab pass so focus can move PAST the control', () => {
  const d = mount('<a id="dead" href="#x" aria-disabled="true">Dead link</a>');
  const stop = initDisabledGuard();
  const tab = new dom.window.KeyboardEvent('keydown', {
    key: 'Tab',
    bubbles: true,
    cancelable: true,
  });
  d.getElementById('dead').dispatchEvent(tab);
  assert.equal(tab.defaultPrevented, false, 'Tab must not be swallowed');
  stop();
});

test('disabled guard scopes to its root and cleans up', () => {
  const d = mount(
    '<div id="scope"><button id="inside" aria-disabled="true">In</button></div>' +
      '<button id="outside" aria-disabled="true">Out</button>',
  );
  const stop = initDisabledGuard({ root: d.getElementById('scope') });

  const outsideClick = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  d.getElementById('outside').dispatchEvent(outsideClick);
  assert.equal(outsideClick.defaultPrevented, false, 'controls outside the root are not guarded');

  const insideClick = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  d.getElementById('inside').dispatchEvent(insideClick);
  assert.equal(insideClick.defaultPrevented, true, 'controls inside the root are guarded');

  stop();
  const afterCleanup = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  d.getElementById('inside').dispatchEvent(afterCleanup);
  assert.equal(afterCleanup.defaultPrevented, false, 'cleanup detaches the guard');
});
