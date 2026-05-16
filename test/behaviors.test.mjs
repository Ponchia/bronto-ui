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
  initTabs,
  initFormValidation,
  initCombobox,
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

test('initFormValidation: SSR-safe', () => {
  for (const k of ['document', 'localStorage', 'CustomEvent']) delete globalThis[k];
  assert.doesNotThrow(() => {
    const stop = initFormValidation();
    stop();
  });
});

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
  assert.equal(input.value, 'banana', 'selected data-value');
  assert.equal(changed, 'banana', 'bronto:change emitted');
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

test('initCombobox: SSR-safe', () => {
  for (const k of ['document', 'localStorage', 'CustomEvent']) delete globalThis[k];
  assert.doesNotThrow(() => {
    const stop = initCombobox();
    stop();
  });
});
