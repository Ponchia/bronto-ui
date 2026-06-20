import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import * as behaviorSurface from '../behaviors/index.js';
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
  initSplitter,
  toast,
} from '../behaviors/index.js';

let dom;

const DOM_GLOBALS = [
  'document',
  'window',
  'localStorage',
  'matchMedia',
  'CustomEvent',
  'HTMLElement',
  'Node',
  'MutationObserver',
  'ResizeObserver',
  'requestAnimationFrame',
  'getComputedStyle',
];

const ssrSafeBehaviorNames = Object.keys(behaviorSurface)
  .filter(
    (name) =>
      name === 'applyStoredTheme' ||
      name === 'dismissible' ||
      name === 'toast' ||
      /^init[A-Z]/.test(name),
  )
  .sort();

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
  for (const k of DOM_GLOBALS) delete globalThis[k];
  dom = undefined;
});

test('SSR-safe: public behavior initializers and toast no-op without DOM', () => {
  for (const k of DOM_GLOBALS) delete globalThis[k];
  assert.ok(ssrSafeBehaviorNames.length >= 20, 'expected the full behavior lifecycle surface');

  for (const name of ssrSafeBehaviorNames) {
    const result = name === 'toast' ? behaviorSurface[name]('SSR smoke') : behaviorSurface[name]();
    if (name === 'applyStoredTheme') {
      assert.equal(result, undefined, `${name} is a one-shot no-op`);
    } else {
      assert.equal(typeof result, 'function', `${name} returns a cleanup no-op`);
      assert.doesNotThrow(result, `${name} cleanup no-op is callable`);
    }
  }

  for (const k of DOM_GLOBALS) {
    assert.equal(globalThis[k], undefined, `${k} was not created by no-DOM behavior calls`);
  }
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

test('initThemeToggle reflects aria when the root is the toggle itself', () => {
  const d = mount('<button data-bronto-theme-toggle id="t">x</button>');
  const btn = d.getElementById('t');
  const stop = initThemeToggle({ root: btn });

  assert.equal(btn.getAttribute('aria-pressed'), 'false');
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(d.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(btn.getAttribute('aria-pressed'), 'true');
  stop();
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

test('initThemeToggle cancels handled defaults, resolves text-node targets, and cleans up aria', () => {
  const d = mount(
    '<a href="#native" data-bronto-theme-toggle id="t" aria-pressed="mixed">theme</a>',
  );
  const stop = initThemeToggle();
  const toggle = d.getElementById('t');

  assert.equal(toggle.getAttribute('aria-pressed'), 'false', 'init reflected current theme');
  assert.doesNotThrow(() =>
    d.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })),
  );

  const click = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  assert.equal(toggle.firstChild.dispatchEvent(click), false);
  assert.equal(click.defaultPrevented, true, 'handled link toggle cancelled native default');
  assert.equal(d.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(toggle.getAttribute('aria-pressed'), 'true');

  stop();
  assert.equal(toggle.getAttribute('aria-pressed'), 'mixed', 'authored aria-pressed restored');
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

test('dismissible cancels native defaults only for handled controls', () => {
  const d = mount(
    '<div data-bronto-dismissible id="box"><a id="dismiss" href="#gone" data-bronto-dismiss>x</a></div>' +
      '<a id="noop" href="#noop" data-bronto-dismiss="[[bad">noop</a>',
  );
  const stop = dismissible();

  const dismissClick = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  assert.equal(d.getElementById('dismiss').dispatchEvent(dismissClick), false);
  assert.equal(dismissClick.defaultPrevented, true, 'handled dismissal cancelled link default');
  assert.equal(d.getElementById('box'), null, 'handled target removed');

  const noopClick = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  assert.equal(d.getElementById('noop').dispatchEvent(noopClick), true);
  assert.equal(
    noopClick.defaultPrevented,
    false,
    'unhandled malformed selector left default alone',
  );
  stop();
});

test('dismissible resolves text-node click targets and ignores document clicks', () => {
  const d = mount(
    '<div data-bronto-dismissible id="box"><button data-bronto-dismiss>close</button></div>',
  );
  const stop = dismissible();
  assert.doesNotThrow(() =>
    d.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })),
  );
  assert.ok(d.getElementById('box'), 'document click did not dismiss anything');

  const label = d.querySelector('[data-bronto-dismiss]').firstChild;
  label.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(d.getElementById('box'), null, 'text-node click still resolved the button');
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

test('initDisclosure cancels native defaults and cleanup restores authored state', () => {
  const d = mount(
    '<a id="trigger" href="#native" data-bronto-disclosure aria-controls="p" aria-expanded="true">m</a>' +
      '<div id="p">panel</div>',
  );
  const stop = initDisclosure();
  const trigger = d.getElementById('trigger');
  const panel = d.getElementById('p');

  const click = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  assert.equal(trigger.dispatchEvent(click), false);
  assert.equal(click.defaultPrevented, true, 'handled disclosure cancelled link default');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(panel.hidden, true);

  stop();
  assert.equal(trigger.getAttribute('aria-expanded'), 'true', 'trigger state restored');
  assert.equal(panel.hasAttribute('hidden'), false, 'panel hidden attr restored');
});

test('initDisclosure resolves text-node click targets and ignores document clicks', () => {
  const d = mount(
    '<button data-bronto-disclosure aria-controls="p" aria-expanded="false">toggle</button>' +
      '<div id="p" hidden>panel</div>',
  );
  const stop = initDisclosure();
  const trigger = d.querySelector('[data-bronto-disclosure]');
  assert.doesNotThrow(() =>
    d.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })),
  );
  assert.equal(trigger.getAttribute('aria-expanded'), 'false', 'document click was ignored');

  trigger.firstChild.dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }),
  );
  assert.equal(trigger.getAttribute('aria-expanded'), 'true', 'text-node click toggled');
  assert.equal(d.getElementById('p').hidden, false);
  stop();
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

test('initMenu supports root-self outside click and text-node item activation', () => {
  const d = mount(
    '<details id="menu" data-bronto-menu open><summary>Menu</summary>' +
      '<div class="ui-menu"><button class="ui-menu__item" id="it">Go</button></div>' +
      '</details><button id="outside">x</button>',
  );
  const menu = d.getElementById('menu');
  const stop = initMenu({ root: menu });

  d.getElementById('outside').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(menu.open, false, 'document-level outside click closed a root-scoped menu');

  menu.open = true;
  d.getElementById('it').firstChild.dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true }),
  );
  assert.equal(menu.open, false, 'text-node item click still closed the menu');
  stop();
});

test('initMenu owns Escape for an open menu', () => {
  const d = mount(
    '<details data-bronto-menu open><summary>Menu</summary>' +
      '<div class="ui-menu"><button class="ui-menu__item" id="it">Go</button></div>' +
      '</details>',
  );
  const stop = initMenu();
  const menu = d.querySelector('[data-bronto-menu]');
  const key = new dom.window.KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
    cancelable: true,
  });

  assert.equal(d.getElementById('it').dispatchEvent(key), false);
  assert.equal(key.defaultPrevented, true, 'Escape default was cancelled when menu handled it');
  assert.equal(menu.open, false);
  assert.equal(d.activeElement, d.querySelector('summary'), 'focus returned to summary');
  stop();
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

test('initDialog cancels native defaults only for handled controls', () => {
  const d = mount(
    '<a id="missing" href="#missing" data-bronto-open="missing">missing</a>' +
      '<a id="open" href="#jump" data-bronto-open="dlg">open</a>' +
      '<dialog id="dlg" data-bronto-dialog-light><a id="close" href="#close" data-bronto-close>close</a></dialog>',
  );
  const dlg = stubDialog(d.getElementById('dlg'));
  initDialog();

  const missingEvent = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  assert.equal(d.getElementById('missing').dispatchEvent(missingEvent), true);
  assert.equal(missingEvent.defaultPrevented, false, 'unknown targets keep their native default');

  const openEvent = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  assert.equal(d.getElementById('open').dispatchEvent(openEvent), false);
  assert.equal(openEvent.defaultPrevented, true, 'handled opener default canceled');
  assert.equal(dlg.open, true, 'dialog opened');

  const closeEvent = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  assert.equal(d.getElementById('close').dispatchEvent(closeEvent), false);
  assert.equal(closeEvent.defaultPrevented, true, 'handled closer default canceled');
  assert.equal(dlg.open, false, 'dialog closed');

  d.getElementById('open').dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }),
  );
  const lightEvent = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  assert.equal(dlg.dispatchEvent(lightEvent), false);
  assert.equal(lightEvent.defaultPrevented, true, 'handled backdrop default canceled');
  assert.equal(dlg.open, false, 'light-dismiss closed the dialog');
});

test('initDialog ignores click targets without Element.closest()', () => {
  const d = mount('<span id="text">text</span>');
  const errors = [];
  dom.window.addEventListener('error', (event) => errors.push(event.message));
  const stop = initDialog();

  d.getElementById('text').firstChild.dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }),
  );
  d.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));

  assert.deepEqual(errors, []);
  stop();
});

test('initDialog failed showModal leaves no pending focus-return listener', () => {
  const d = mount(
    '<a id="open" href="#jump" data-bronto-open="dlg">open</a>' +
      '<button id="other">other</button>' +
      '<dialog id="dlg"><button data-bronto-close>x</button></dialog>',
  );
  const opener = d.getElementById('open');
  const other = d.getElementById('other');
  const dlg = d.getElementById('dlg');
  dlg.showModal = () => {
    throw new Error('showModal failed');
  };
  const errors = [];
  dom.window.addEventListener('error', (event) => errors.push(event.message));
  initDialog();

  opener.focus();
  const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  assert.equal(opener.dispatchEvent(event), true);
  assert.equal(event.defaultPrevented, false, 'failed open keeps native default available');
  assert.deepEqual(errors, [], 'showModal failure is contained');

  other.focus();
  dlg.dispatchEvent(new dom.window.Event('close'));
  assert.equal(d.activeElement, other);
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
  assert.equal(a.classList.contains('is-active'), true, 'authored active tab restored');
  assert.equal(b.classList.contains('is-active'), false, 'runtime active tab cleared');
  assert.equal(c.classList.contains('is-active'), false, 'runtime active tab cleared');
  assert.equal(d.querySelector('.ui-tabs__list').hasAttribute('role'), false, 'list role restored');
  for (const tab of [a, b, c]) {
    assert.equal(tab.hasAttribute('id'), false, 'generated tab id restored');
    assert.equal(tab.hasAttribute('role'), false, 'tab role restored');
    assert.equal(tab.hasAttribute('aria-selected'), false, 'selection state restored');
    assert.equal(tab.hasAttribute('aria-controls'), false, 'control relation restored');
    assert.equal(tab.hasAttribute('tabindex'), false, 'roving tabindex restored');
  }
  for (const key of ['a', 'b', 'c']) {
    const p = panel(key);
    assert.equal(p.hidden, false, 'authored panel visibility restored');
    assert.equal(p.hasAttribute('id'), false, 'generated panel id restored');
    assert.equal(p.hasAttribute('role'), false, 'panel role restored');
    assert.equal(p.hasAttribute('aria-labelledby'), false, 'label relation restored');
    assert.equal(p.hasAttribute('tabindex'), false, 'panel tabindex restored');
  }
  b.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(a.classList.contains('is-active'), true, 'click is no-op after cleanup');
  assert.equal(b.classList.contains('is-active'), false, 'listener removed after cleanup');
});

test('initTabs cancels handled native defaults and resolves text-node tab clicks', () => {
  const d = mount(
    '<div data-bronto-tabs><div class="ui-tabs__list">' +
      '<a class="ui-tab is-active" href="#native-a" data-tab="a">Alpha</a>' +
      '<a class="ui-tab" href="#native-b" data-tab="b">Beta</a></div>' +
      '<div class="ui-tabs__panel" data-panel="a">A</div>' +
      '<div class="ui-tabs__panel" data-panel="b">B</div></div>',
  );
  const stop = initTabs();
  const beta = d.querySelector('[data-tab="b"]');
  const alphaPanel = d.querySelector('[data-panel="a"]');
  const betaPanel = d.querySelector('[data-panel="b"]');

  const click = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  assert.equal(beta.firstChild.dispatchEvent(click), false);
  assert.equal(click.defaultPrevented, true, 'handled tab link default was cancelled');
  assert.equal(beta.getAttribute('aria-selected'), 'true');
  assert.equal(alphaPanel.hidden, true);
  assert.equal(betaPanel.hidden, false);
  stop();
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

test('initDialog cleanup removes a pending focus-return listener', () => {
  const d = mount(
    '<button data-bronto-open="dlg" id="open">open</button>' +
      '<button id="other">other</button>' +
      '<dialog id="dlg"><button data-bronto-close>x</button></dialog>',
  );
  const opener = d.getElementById('open');
  const other = d.getElementById('other');
  const dlg = stubDialog(d.getElementById('dlg'));
  const stop = initDialog();

  opener.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  other.focus();
  stop();
  dlg.close();
  assert.equal(d.activeElement, other);
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
  // never announces a dangling empty error association.
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

test('initFormValidation: cleanup restores invalid UI, summary, and generated ids', () => {
  const d = mount(`
    <form data-bronto-validate>
      <div class="ui-field">
        <label class="ui-label">Email <input class="ui-input" name="em" type="email" required /></label>
        <p class="ui-hint" data-bronto-error></p>
      </div>
      <div class="ui-error-summary" data-bronto-error-summary hidden></div>
      <button type="submit">Go</button>
    </form>`);
  const form = d.querySelector('form');
  const input = d.querySelector('input');
  const slot = d.querySelector('[data-bronto-error]');
  const summary = d.querySelector('[data-bronto-error-summary]');
  const stop = initFormValidation();

  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.ok(input.id, 'summary path minted a field id');
  assert.ok(slot.id, 'error slot path minted a slot id');
  assert.equal(summary.hidden, false);
  assert.equal(summary.querySelectorAll('a').length, 1);

  stop();
  assert.equal(input.hasAttribute('aria-invalid'), false, 'invalid marker restored');
  assert.equal(input.hasAttribute('aria-describedby'), false, 'describedby restored');
  assert.equal(input.hasAttribute('id'), false, 'generated field id restored');
  assert.equal(slot.hasAttribute('id'), false, 'generated error slot id restored');
  assert.equal(slot.textContent, '', 'error text restored');
  assert.equal(slot.classList.contains('ui-hint--error'), false, 'error class restored');
  assert.equal(summary.hidden, true, 'summary visibility restored');
  assert.equal(summary.querySelectorAll('a').length, 0, 'generated summary links removed');
  assert.equal(summary.textContent, '', 'summary content restored');
  assert.equal(summary.hasAttribute('role'), false, 'summary role restored');
  assert.equal(summary.hasAttribute('tabindex'), false, 'summary tabindex restored');
});

test('initFormValidation: dynamically handled forms restore noValidate on cleanup', () => {
  const d = mount('<section id="root"></section>');
  const stop = initFormValidation();
  const form = d.createElement('form');
  form.setAttribute('data-bronto-validate', '');
  form.innerHTML = '<input class="ui-input" name="x" required /><button type="submit">Go</button>';
  d.getElementById('root').appendChild(form);

  assert.equal(form.noValidate, false, 'precondition: native validation on');
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(form.noValidate, true, 'delegated submit suppresses native bubbles');
  stop();
  assert.equal(form.noValidate, false, 'prior noValidate restored on cleanup');
});

// SSR-safe contract: with no DOM each arg-less initializer no-ops and returns a
// callable cleanup. One loop over the uniform initializers (theme + toast differ
// — see their own tests above).
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
  initSplitter,
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
  // Input shows the human LABEL; the change event carries the data-value CODE.
  assert.equal(input.value, 'Banana', 'input shows the option label');
  assert.equal(changed, 'banana', 'bronto:change emits the data-value code');
  assert.equal(list.hidden, true, 'closes on select');
  stop();
});

test('initCombobox: empty state, Escape closes, cleanup restores DOM and detaches', () => {
  const d = mount(CB);
  const stop = initCombobox();
  const input = d.querySelector('.ui-combobox__input');
  const list = d.querySelector('.ui-combobox__list');
  const empty = d.querySelector('.ui-combobox__empty');
  const options = [...d.querySelectorAll('.ui-combobox__option')];

  input.value = 'zzz';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(empty.hidden, false, 'empty state shown when nothing matches');
  assert.deepEqual(
    options.filter((o) => !o.hidden).map((o) => o.dataset.value),
    [],
    'filter hides every option',
  );

  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(list.hidden, true, 'Escape closes');

  stop();
  assert.equal(list.hidden, false, 'authored list visibility restored');
  assert.equal(empty.hidden, true, 'authored empty-state visibility restored');
  assert.equal(input.hasAttribute('role'), false, 'input role restored');
  assert.equal(input.hasAttribute('aria-controls'), false, 'aria-controls restored');
  assert.equal(input.hasAttribute('aria-expanded'), false, 'expanded state restored');
  assert.equal(list.hasAttribute('id'), false, 'generated list id restored');
  assert.equal(list.hasAttribute('role'), false, 'list role restored');
  assert.deepEqual(
    options.filter((o) => !o.hidden).map((o) => o.dataset.value),
    ['apple', 'banana', 'cherry'],
    'cleanup restores option visibility',
  );
  assert.equal(
    options.some(
      (o) => o.hasAttribute('id') || o.hasAttribute('role') || o.hasAttribute('aria-selected'),
    ),
    false,
    'generated option ARIA restored',
  );

  input.value = 'ap';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.deepEqual(
    options.filter((o) => !o.hidden).map((o) => o.dataset.value),
    ['apple', 'banana', 'cherry'],
    'input listener removed after cleanup',
  );
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
  assert.equal(list.hasAttribute('id'), false, 'generated live-list id restored');
  assert.equal(list.hasAttribute('role'), false, 'generated live-list role restored');
  assert.equal(li.hasAttribute('id'), false, 'generated async option id restored');
  assert.equal(li.hasAttribute('role'), false, 'generated async option role restored');
  assert.equal(li.hasAttribute('aria-selected'), false, 'generated async selection state restored');
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

test('initCombobox: re-init clears stale active descendant while preserving the binding', () => {
  const d = mount(CB);
  const input = d.querySelector('.ui-combobox__input');
  const list = d.querySelector('.ui-combobox__list');
  initCombobox();

  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.ok(d.querySelector('.ui-combobox__option.is-active'), 'first binding activated an option');
  assert.ok(input.hasAttribute('aria-activedescendant'), 'first binding set activedescendant');

  const stop = initCombobox();
  assert.equal(list.hidden, true, 're-init leaves the popup closed');
  assert.equal(input.getAttribute('aria-expanded'), 'false');
  assert.equal(
    input.hasAttribute('aria-activedescendant'),
    false,
    're-init clears stale activedescendant',
  );
  assert.equal(d.querySelectorAll('.ui-combobox__option.is-active').length, 0);

  input.value = 'ban';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.equal(
    d.querySelector('.ui-combobox__option.is-active')?.textContent,
    'Banana',
    'new binding still activates matching options',
  );
  stop();
});

test('initCombobox resolves text-node option clicks', () => {
  const d = mount(CB);
  const changes = [];
  d.querySelector('[data-bronto-combobox]').addEventListener('bronto:change', (e) =>
    changes.push(e.detail),
  );
  const stop = initCombobox();
  const input = d.querySelector('.ui-combobox__input');
  const banana = [...d.querySelectorAll('.ui-combobox__option')].find((o) =>
    o.textContent.includes('Banana'),
  );

  banana.firstChild.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(input.value, 'Banana');
  assert.deepEqual(changes, [{ value: 'banana', label: 'Banana' }]);
  stop();
});

test('initPopover: toggles panel, manages aria, Escape + outside close', () => {
  const d = mount(
    '<button id="t" data-bronto-popover="pop">Info</button>' +
      '<div class="ui-popover" id="pop" aria-label="Details">Details</div>' +
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

test('initPopover resolves text-node trigger clicks', () => {
  const d = mount(
    '<button id="t" data-bronto-popover="pop">Info</button>' +
      '<div class="ui-popover" id="pop" aria-label="Details">Details</div>',
  );
  const stop = initPopover();
  const trigger = d.getElementById('t');
  const panel = d.getElementById('pop');

  trigger.firstChild.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), true);
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  stop();
});

test('initPopover re-init closes stale open state before rebinding', () => {
  const d = mount(
    '<button id="t" data-bronto-popover="pop">Info</button>' +
      '<div class="ui-popover" id="pop" aria-label="Details">Details</div>',
  );
  const trigger = d.getElementById('t');
  const panel = d.getElementById('pop');
  initPopover();

  trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), true, 'first binding opens');
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');

  const stop = initPopover();
  assert.equal(panel.classList.contains('is-open'), false, 're-init cleanup closes');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');

  trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), true, 'new binding still opens');
  d.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), false, 'new binding closes on Escape');
  stop();
});

test('initPopover cleanup restores generated trigger and detached panel state', () => {
  const d = mount(
    '<button id="t" data-bronto-popover="pop">Info</button>' +
      '<div class="ui-popover" id="pop" aria-label="Details">Details</div>',
  );
  const trigger = d.getElementById('t');
  const panel = d.getElementById('pop');
  const stop = initPopover();

  assert.equal(trigger.getAttribute('aria-haspopup'), 'dialog', 'resting popup relation seeded');
  assert.equal(trigger.getAttribute('aria-controls'), 'pop');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');

  trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), true, 'opened');
  assert.equal(panel.getAttribute('role'), 'dialog', 'panel role generated');
  assert.equal(panel.getAttribute('tabindex'), '-1', 'content-only panel is focusable');
  assert.notEqual(panel.style.maxBlockSize, '', 'placement style generated');

  panel.remove();
  stop();
  assert.equal(trigger.hasAttribute('aria-haspopup'), false, 'generated haspopup restored');
  assert.equal(trigger.hasAttribute('aria-controls'), false, 'generated controls restored');
  assert.equal(trigger.hasAttribute('aria-expanded'), false, 'generated expanded restored');
  assert.equal(panel.classList.contains('is-open'), false, 'generated open class restored');
  assert.equal(panel.hasAttribute('role'), false, 'generated role restored');
  assert.equal(panel.hasAttribute('tabindex'), false, 'generated tabindex restored');
  assert.equal(panel.style.maxBlockSize, '', 'placement max size restored');
  assert.equal(panel.style.top, '', 'placement top restored');
  assert.equal(panel.style.left, '', 'placement left restored');
});

test('initPopover seeds and cleans up when root is the trigger itself', () => {
  const d = mount(
    '<button id="t" data-bronto-popover="pop">Info</button>' +
      '<div class="ui-popover" id="pop" aria-label="Details"><button>Focus</button></div>',
  );
  const trigger = d.getElementById('t');
  const panel = d.getElementById('pop');
  const stop = initPopover({ root: trigger });

  assert.equal(trigger.getAttribute('aria-haspopup'), 'dialog');
  assert.equal(trigger.getAttribute('aria-controls'), 'pop');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');

  trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), true, 'root trigger still opens');
  stop();
  assert.equal(trigger.hasAttribute('aria-haspopup'), false);
  assert.equal(trigger.hasAttribute('aria-controls'), false);
  assert.equal(trigger.hasAttribute('aria-expanded'), false);
  assert.equal(panel.classList.contains('is-open'), false);
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
  assert.equal(nameBtn.type, 'button', 'sort control is not an accidental submit');
  assert.equal(scoreBtn.type, 'button', 'sort control is not an accidental submit');
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

test('initTableSort resolves text-node sort clicks', () => {
  const d = mount(TBL);
  const stop = initTableSort();
  const table = d.querySelector('table');
  const names = () => [...table.tBodies[0].rows].map((r) => r.children[1].textContent);
  const nameBtn = table.querySelector('.ui-table__sort');

  nameBtn.firstChild.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(names(), ['Ann', 'Bob', 'Cy']);
  assert.equal(nameBtn.closest('th').getAttribute('aria-sort'), 'ascending');
  stop();
});

test('initTableSort: invalid root no-ops instead of widening or traversing text', () => {
  const d = mount(TBL);
  const table = d.querySelector('table');
  const names = () => [...table.tBodies[0].rows].map((r) => r.children[1].textContent);
  const stop = initTableSort({ root: 'not-a-dom-root' });

  table
    .querySelector('.ui-table__sort')
    .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

  assert.deepEqual(names(), ['Bob', 'Ann', 'Cy'], 'invalid root leaves the table unwired');
  assert.equal(typeof stop, 'function');
  stop();
});

test('initTableSort: numeric sort keeps the sign on U+2212, accounting parens, and data-sort-value', () => {
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

test('initTableSort: data-sort-value escape hatch accepts a European decimal comma', () => {
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

test('initTableSort: cleanup restores sort order, selection state, and generated attrs', () => {
  const d = mount(TBL);
  const stop = initTableSort();
  const table = d.querySelector('table');
  const names = () => [...table.tBodies[0].rows].map((r) => r.children[1].textContent);
  const [nameBtn, scoreBtn] = [...table.querySelectorAll('.ui-table__sort')];
  const all = table.querySelector('[data-bronto-select-all]');
  const rowBoxes = [...table.querySelectorAll('[data-bronto-select]')];

  nameBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(names(), ['Ann', 'Bob', 'Cy'], 'sort mutates row order');
  all.checked = true;
  all.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.ok(
    rowBoxes.every((box) => box.checked),
    'selection mutates row checkboxes',
  );
  assert.ok(
    [...table.tBodies[0].rows].every((row) => row.getAttribute('aria-selected') === 'true'),
    'selection mutates row aria-selected',
  );

  stop();
  assert.deepEqual(names(), ['Bob', 'Ann', 'Cy'], 'authored row order restored');
  for (const btn of [nameBtn, scoreBtn]) {
    assert.equal(btn.hasAttribute('type'), false, 'generated sorter type restored');
    assert.equal(btn.closest('th').hasAttribute('aria-sort'), false, 'header aria-sort restored');
  }
  assert.equal(all.checked, false, 'select-all checked state restored');
  assert.equal(all.indeterminate, false, 'select-all indeterminate state restored');
  assert.ok(
    rowBoxes.every((box) => !box.checked),
    'row checked state restored',
  );
  assert.ok(
    [...table.tBodies[0].rows].every((row) => !row.hasAttribute('aria-selected')),
    'row aria-selected restored',
  );

  nameBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(names(), ['Bob', 'Ann', 'Cy'], 'sort listener removed after cleanup');
  all.checked = true;
  all.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.ok(
    rowBoxes.every((box) => !box.checked),
    'selection listener removed after cleanup',
  );
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
  assert.ok(
    thumbs.every((b) => b.type === 'button'),
    'thumbnail controls are not accidental submits',
  );
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

test('initCarousel resolves text-node control clicks', () => {
  const d = mount(
    CAR.replace('data-bronto-carousel-next></button>', 'data-bronto-carousel-next>Next</button>')
      .replace(
        '<button class="ui-carousel__thumb"><img src="b" alt="" /></button>',
        '<button class="ui-carousel__thumb">Two</button>',
      )
      .replace(
        '<button class="ui-carousel__thumb"><img src="c" alt="" /></button>',
        '<button class="ui-carousel__thumb">Three</button>',
      ),
  );
  const stop = initCarousel();
  const status = d.querySelector('.ui-carousel__status');
  const next = d.querySelector('[data-bronto-carousel-next]');
  const thumbs = [...d.querySelectorAll('.ui-carousel__thumb')];

  next.firstChild.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(status.textContent, '2 / 3');
  thumbs[2].firstChild.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(status.textContent, '3 / 3');
  stop();
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

test('initCarousel: idempotent re-init does not stack, cleanup restores and detaches', () => {
  const d = mount(CAR);
  initCarousel();
  const stop = initCarousel(); // must replace, not add a 2nd handler
  const status = d.querySelector('.ui-carousel__status');
  const next = d.querySelector('[data-bronto-carousel-next]');

  next.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(status.textContent, '2 / 3', 'advanced exactly once');

  stop();
  assert.equal(status.textContent, '', 'cleanup restores authored empty status');
  next.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(status.textContent, '', 'no-op after cleanup');
});

test('initCarousel: cleanup restores generated ARIA, controls, status, and active thumb', () => {
  const d = mount(`
    <div class="ui-carousel" data-bronto-carousel data-bronto-carousel-label="Photos">
      <div class="ui-carousel__viewport" role="region" aria-label="Authored carousel" tabindex="-1">
        <div class="ui-carousel__slide" role="listitem" aria-label="Authored slide"><img src="a" alt="A" /></div>
        <div class="ui-carousel__slide"><img src="b" alt="B" /></div>
      </div>
      <button data-bronto-carousel-prev></button>
      <button data-bronto-carousel-next></button>
      <p class="ui-carousel__status" aria-live="off"><span>authored</span></p>
      <button class="ui-carousel__thumb">A</button>
      <button class="ui-carousel__thumb" aria-current="page">B</button>
    </div>`);
  const stop = initCarousel();
  const vp = d.querySelector('.ui-carousel__viewport');
  const slides = [...d.querySelectorAll('.ui-carousel__slide')];
  const prev = d.querySelector('[data-bronto-carousel-prev]');
  const next = d.querySelector('[data-bronto-carousel-next]');
  const status = d.querySelector('.ui-carousel__status');
  const thumbs = [...d.querySelectorAll('.ui-carousel__thumb')];

  assert.equal(vp.getAttribute('role'), 'group');
  assert.equal(slides[1].getAttribute('role'), 'group');
  assert.equal(prev.getAttribute('type'), 'button');
  assert.equal(prev.disabled, true);
  assert.equal(next.getAttribute('aria-label'), 'Next');
  assert.equal(status.getAttribute('aria-live'), 'polite');
  assert.equal(status.textContent, '1 / 2');
  assert.equal(thumbs[0].getAttribute('aria-current'), 'true');
  assert.equal(thumbs[1].hasAttribute('aria-current'), false);

  stop();
  assert.equal(vp.getAttribute('role'), 'region');
  assert.equal(vp.getAttribute('aria-label'), 'Authored carousel');
  assert.equal(vp.getAttribute('tabindex'), '-1');
  assert.equal(slides[0].getAttribute('role'), 'listitem');
  assert.equal(slides[0].getAttribute('aria-label'), 'Authored slide');
  assert.equal(slides[1].hasAttribute('role'), false);
  assert.equal(slides[1].hasAttribute('aria-label'), false);
  assert.equal(prev.hasAttribute('type'), false);
  assert.equal(prev.disabled, false);
  assert.equal(next.hasAttribute('aria-label'), false);
  assert.equal(status.getAttribute('aria-live'), 'off');
  assert.equal(status.innerHTML, '<span>authored</span>');
  assert.equal(thumbs[0].hasAttribute('aria-current'), false);
  assert.equal(thumbs[1].getAttribute('aria-current'), 'page');
});

test('initCarousel: re-init preserves the live current slide after navigation', () => {
  const d = mount(CAR);
  initCarousel();
  const status = d.querySelector('.ui-carousel__status');
  const prev = d.querySelector('[data-bronto-carousel-prev]');
  const next = d.querySelector('[data-bronto-carousel-next]');
  const thumbs = [...d.querySelectorAll('.ui-carousel__thumb')];

  next.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(status.textContent, '2 / 3');
  assert.equal(thumbs[1].getAttribute('aria-current'), 'true');

  const stop = initCarousel();
  assert.equal(status.textContent, '2 / 3', 're-init keeps the rendered index');
  assert.equal(thumbs[1].getAttribute('aria-current'), 'true');
  assert.equal(prev.disabled, false);
  assert.equal(next.disabled, false);

  next.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(status.textContent, '3 / 3', 'new binding still advances once');
  assert.equal(thumbs[2].getAttribute('aria-current'), 'true');
  stop();
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

test('initLegend resolves text-node item clicks', () => {
  const d = mount(legendMarkup);
  const stop = initLegend();
  const btn = d.querySelectorAll('.ui-legend__item')[1];
  const labelText = btn.querySelector('.ui-legend__label').firstChild;

  labelText.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(btn.getAttribute('aria-pressed'), 'false');
  assert.equal(btn.classList.contains('is-inactive'), true);
  stop();
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

test('initLegend: role=button entries get tabindex and keyboard activation', () => {
  const d = mount(`
    <ul class="ui-legend ui-legend--interactive" data-bronto-legend>
      <li><span class="ui-legend__item" role="button" aria-pressed="true" data-series="a">
        <span class="ui-legend__label">A</span>
      </span></li>
    </ul>`);
  initLegend();
  const item = d.querySelector('.ui-legend__item');
  const events = [];
  d.addEventListener('bronto:legend:toggle', (e) => events.push(e.detail));

  assert.equal(item.tabIndex, 0);
  item.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  assert.equal(item.getAttribute('aria-pressed'), 'false');
  assert.deepEqual(events.at(-1), { series: 'a', active: false });

  item.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(item.getAttribute('aria-pressed'), 'true');
  assert.deepEqual(events.at(-1), { series: 'a', active: true });
});

test('initLegend: a root that is the legend normalizes and cleans up role=button entries', () => {
  const d = mount(`
    <ul id="legend-root" class="ui-legend ui-legend--interactive" data-bronto-legend>
      <li><span class="ui-legend__item" role="button" aria-pressed="true" data-series="a">
        <span class="ui-legend__label">A</span>
      </span></li>
    </ul>`);
  const legend = d.getElementById('legend-root');
  const item = d.querySelector('.ui-legend__item');
  const events = [];
  legend.addEventListener('bronto:legend:toggle', (e) => events.push(e.detail));

  const stop = initLegend({ root: legend });
  assert.equal(item.getAttribute('tabindex'), '0', 'scoped legend root is normalized');

  item.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  assert.equal(item.getAttribute('aria-pressed'), 'false');
  assert.equal(item.classList.contains('is-inactive'), true);
  assert.deepEqual(events.at(-1), { series: 'a', active: false });

  stop();
  assert.equal(item.hasAttribute('tabindex'), false, 'generated tabindex restored');
  assert.equal(item.getAttribute('aria-pressed'), 'true', 'pressed state restored');
  assert.equal(item.classList.contains('is-inactive'), false, 'inactive state restored');

  item.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  assert.equal(events.length, 1, 'cleanup removes listener');
});

test('initLegend: cleanup restores detached generated button type and toggle state', () => {
  const d = mount(`
    <form>
      <ul class="ui-legend ui-legend--interactive" data-bronto-legend>
        <li><button class="ui-legend__item" aria-pressed="true" data-series="a">
          <span class="ui-legend__label">A</span>
        </button></li>
      </ul>
    </form>`);
  const item = d.querySelector('.ui-legend__item');

  const stop = initLegend();
  assert.equal(item.getAttribute('type'), 'button', 'button type is generated');

  item.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(item.getAttribute('aria-pressed'), 'false');
  assert.equal(item.classList.contains('is-inactive'), true);

  item.remove();
  stop();
  assert.equal(item.hasAttribute('type'), false, 'detached generated type restored');
  assert.equal(item.getAttribute('aria-pressed'), 'true', 'detached pressed state restored');
  assert.equal(item.classList.contains('is-inactive'), false, 'detached inactive state restored');
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

test('initLegend: nested scoped and global bindings do not double-toggle one event', () => {
  const d = mount(`
    <section>
      <ul id="scoped-legend" class="ui-legend ui-legend--interactive" data-bronto-legend>
        <li><button class="ui-legend__item" aria-pressed="true" data-series="a">
          <span class="ui-legend__label">A</span>
        </button></li>
      </ul>
    </section>`);
  const legend = d.getElementById('scoped-legend');
  const item = legend.querySelector('.ui-legend__item');
  let count = 0;
  d.addEventListener('bronto:legend:toggle', () => count++);

  const stopGlobal = initLegend();
  const stopScoped = initLegend({ root: legend });
  item.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(item.getAttribute('aria-pressed'), 'false', 'event toggles exactly once');
  assert.equal(count, 1, 'one toggle event emitted');

  stopScoped();
  stopGlobal();
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
  stop();
  assert.equal(svg.querySelector('.ui-connector__path'), null, 'generated path removed on cleanup');
  assert.equal(svg.querySelector('.ui-connector__end'), null, 'generated end removed on cleanup');
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

test('initConnectors: cleanup restores authored path and end nodes', () => {
  const d = mount(
    '<div style="position:relative"><span id="a">a</span><span id="b">b</span>' +
      '<svg class="ui-connector ui-connector--draw" data-bronto-connector data-from="a" data-to="b">' +
      '<path class="ui-connector__path" d="M1,1L2,2" pathLength="7" data-authored="path"></path>' +
      '<path class="ui-connector__end" d="M2,2L3,3" data-authored="end"></path>' +
      '</svg></div>',
  );
  const svg = d.querySelector('.ui-connector');
  const path = svg.querySelector('.ui-connector__path');
  const end = svg.querySelector('.ui-connector__end');

  const stop = initConnectors();
  assert.notEqual(path.getAttribute('d'), 'M1,1L2,2', 'path d is generated while active');
  assert.equal(path.getAttribute('pathLength'), '1', 'draw pathLength generated while active');
  assert.notEqual(end.getAttribute('d'), 'M2,2L3,3', 'end d is generated while active');

  stop();
  assert.equal(svg.querySelector('.ui-connector__path'), path, 'authored path node preserved');
  assert.equal(svg.querySelector('.ui-connector__end'), end, 'authored end node preserved');
  assert.equal(path.getAttribute('d'), 'M1,1L2,2');
  assert.equal(path.getAttribute('pathLength'), '7');
  assert.equal(path.getAttribute('data-authored'), 'path');
  assert.equal(end.getAttribute('d'), 'M2,2L3,3');
  assert.equal(end.getAttribute('data-authored'), 'end');
});

test('initConnectors: cleanup disconnects observers/listeners and stops redraws', () => {
  const d = mount(
    '<div id="wrap" style="position:relative"><span id="a">a</span><span id="b">b</span>' +
      '<svg class="ui-connector" data-bronto-connector data-from="a" data-to="b"></svg></div>',
  );
  const view = d.defaultView;
  const observed = [];
  const instances = [];
  view.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      instances.push(this);
    }
    observe(el) {
      observed.push(el.id || el.className || el.tagName);
    }
    disconnect() {
      this.disconnected = true;
    }
  };

  const added = [];
  const removed = [];
  const add = view.addEventListener.bind(view);
  const remove = view.removeEventListener.bind(view);
  view.addEventListener = (type, listener, options) => {
    added.push({ type, options });
    return add(type, listener, options);
  };
  view.removeEventListener = (type, listener, options) => {
    removed.push({ type, options });
    return remove(type, listener, options);
  };

  const svg = d.querySelector('.ui-connector');
  const a = d.getElementById('a');
  const b = d.getElementById('b');
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 });
  a.getBoundingClientRect = () => ({ left: 10, top: 20, width: 20, height: 10 });
  let bLeft = 100;
  b.getBoundingClientRect = () => ({ left: bLeft, top: 20, width: 20, height: 10 });

  const stop = initConnectors();
  const path = svg.querySelector('.ui-connector__path');
  assert.equal(path.getAttribute('d'), 'M30,25L100,25');
  assert.deepEqual(observed, ['wrap', 'a', 'b']);
  assert.equal(instances.length, 1, 'ResizeObserver installed');
  assert.ok(added.some((e) => e.type === 'resize'));
  assert.ok(added.some((e) => e.type === 'scroll' && e.options === true));

  stop();
  assert.equal(instances[0].disconnected, true, 'ResizeObserver disconnected');
  assert.ok(removed.some((e) => e.type === 'resize'));
  assert.ok(removed.some((e) => e.type === 'scroll' && e.options === true));
  assert.equal(path.isConnected, false, 'cleanup removes generated path from the SVG');
  assert.equal(svg.querySelector('.ui-connector__end'), null, 'cleanup removes generated end');

  bLeft = 150;
  view.dispatchEvent(new dom.window.Event('resize'));
  view.dispatchEvent(new dom.window.Event('scroll'));
  assert.equal(path.getAttribute('d'), 'M30,25L100,25', 'cleanup stops redraws');
});

test('initConnectors: re-run after all connectors are removed cleans the previous binding', () => {
  const d = mount(
    '<div id="wrap" style="position:relative"><span id="a">a</span><span id="b">b</span>' +
      '<svg class="ui-connector" data-bronto-connector data-from="a" data-to="b"></svg></div>',
  );
  const view = d.defaultView;
  const instances = [];
  view.ResizeObserver = class {
    constructor() {
      this.disconnected = false;
      instances.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  };

  const svg = d.querySelector('.ui-connector');
  const a = d.getElementById('a');
  const b = d.getElementById('b');
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 });
  a.getBoundingClientRect = () => ({ left: 10, top: 20, width: 20, height: 10 });
  let bLeft = 100;
  b.getBoundingClientRect = () => ({ left: bLeft, top: 20, width: 20, height: 10 });

  initConnectors({ root: d.getElementById('wrap') });
  const path = svg.querySelector('.ui-connector__path');
  assert.equal(path.getAttribute('d'), 'M30,25L100,25');

  svg.remove();
  const stop = initConnectors({ root: d.getElementById('wrap') });
  assert.equal(instances[0].disconnected, true, 'previous ResizeObserver disconnected');

  bLeft = 150;
  view.dispatchEvent(new dom.window.Event('resize'));
  view.dispatchEvent(new dom.window.Event('scroll'));
  assert.equal(path.getAttribute('d'), 'M30,25L100,25', 'detached connector no longer redraws');
  assert.doesNotThrow(stop);
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
  stop();
  assert.equal(spot.style.getPropertyValue('--spot-x'), '');
  assert.equal(spot.style.getPropertyValue('--spot-y'), '');
  assert.equal(spot.style.getPropertyValue('--spot-w'), '');
  assert.equal(spot.style.getPropertyValue('--spot-h'), '');
});

test('initSpotlight: cleanup restores authored cutout custom properties', () => {
  const d = mount(
    '<button id="t">t</button>' +
      '<div class="ui-spotlight" data-bronto-spotlight data-target="t" style="--spot-x: 1px; --spot-y: 2px; --spot-w: 3px; --spot-h: 4px"><div class="ui-spotlight__hole"></div></div>',
  );
  const target = d.getElementById('t');
  target.getBoundingClientRect = () => ({
    left: 20,
    top: 30,
    right: 80,
    bottom: 90,
    width: 60,
    height: 60,
  });
  const spot = d.querySelector('.ui-spotlight');

  const stop = initSpotlight();
  assert.equal(spot.style.getPropertyValue('--spot-x'), '20px');
  assert.equal(spot.style.getPropertyValue('--spot-w'), '60px');

  stop();
  assert.equal(spot.style.getPropertyValue('--spot-x'), '1px');
  assert.equal(spot.style.getPropertyValue('--spot-y'), '2px');
  assert.equal(spot.style.getPropertyValue('--spot-w'), '3px');
  assert.equal(spot.style.getPropertyValue('--spot-h'), '4px');
});

test('initSpotlight: re-run after all spotlights are removed cleans the previous binding', () => {
  const d = mount(
    '<div id="wrap"><button id="t">t</button>' +
      '<div class="ui-spotlight" data-bronto-spotlight data-target="t"><div class="ui-spotlight__hole"></div></div></div>',
  );
  const view = d.defaultView;
  const instances = [];
  view.MutationObserver = class {
    constructor() {
      this.disconnected = false;
      instances.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  };

  const spot = d.querySelector('.ui-spotlight');
  const target = d.getElementById('t');
  let left = 10;
  target.getBoundingClientRect = () => ({
    left,
    top: 20,
    right: left + 30,
    bottom: 30,
    width: 30,
    height: 10,
  });

  initSpotlight({ root: d.getElementById('wrap') });
  assert.equal(spot.style.getPropertyValue('--spot-x'), '10px');

  spot.remove();
  const stop = initSpotlight({ root: d.getElementById('wrap') });
  assert.equal(instances[0].disconnected, true, 'previous MutationObserver disconnected');

  left = 80;
  view.dispatchEvent(new dom.window.Event('resize'));
  view.dispatchEvent(new dom.window.Event('scroll'));
  assert.equal(spot.style.getPropertyValue('--spot-x'), '', 'detached spotlight no longer moves');
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

test('initCrosshair: emits pixel/fraction details, leave, and detaches on cleanup', () => {
  const d = mount(
    '<figure data-bronto-crosshair><div class="ui-crosshair">' +
      '<div class="ui-crosshair__line ui-crosshair__line--x"></div></div></figure>',
  );
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  const plot = d.querySelector('[data-bronto-crosshair]');
  const overlay = d.querySelector('.ui-crosshair');
  plot.getBoundingClientRect = () => ({
    left: 10,
    top: 20,
    right: 210,
    bottom: 120,
    width: 200,
    height: 100,
  });

  const moves = [];
  const bubbledMoves = [];
  let leaves = 0;
  let bubbledLeaves = 0;
  plot.addEventListener('bronto:crosshair:move', (e) => moves.push(e.detail));
  d.body.addEventListener('bronto:crosshair:move', (e) => bubbledMoves.push(e.detail));
  plot.addEventListener('bronto:crosshair:leave', () => leaves++);
  d.body.addEventListener('bronto:crosshair:leave', () => bubbledLeaves++);

  const stop = initCrosshair();
  plot.dispatchEvent(new dom.window.MouseEvent('pointermove', { clientX: 60, clientY: 45 }));
  assert.equal(overlay.style.getPropertyValue('--crosshair-x'), '50px');
  assert.equal(overlay.style.getPropertyValue('--crosshair-y'), '25px');
  assert.equal(overlay.dataset.readoutInline, 'after');
  assert.equal(overlay.dataset.readoutBlock, 'below');
  assert.equal(overlay.classList.contains('is-active'), true);
  assert.deepEqual(moves, [{ x: 50, y: 25, fx: 0.25, fy: 0.25 }]);
  assert.deepEqual(bubbledMoves, moves);

  plot.dispatchEvent(new dom.window.MouseEvent('pointermove', { clientX: 190, clientY: 115 }));
  assert.equal(overlay.dataset.readoutInline, 'before');
  assert.equal(overlay.dataset.readoutBlock, 'above');
  assert.deepEqual(moves.at(-1), { x: 180, y: 95, fx: 0.9, fy: 0.95 });

  plot.dispatchEvent(new dom.window.MouseEvent('pointerleave'));
  assert.equal(overlay.classList.contains('is-active'), false);
  assert.equal(leaves, 1);
  assert.equal(bubbledLeaves, 1);

  stop();
  plot.dispatchEvent(new dom.window.MouseEvent('pointermove', { clientX: 90, clientY: 70 }));
  plot.dispatchEvent(new dom.window.MouseEvent('pointerleave'));
  assert.equal(moves.length, 2, 'move listener removed');
  assert.equal(leaves, 1, 'leave listener removed');
});

test('initCrosshair: cleanup restores active overlay state when stopped mid-hover', () => {
  const d = mount(
    '<figure data-bronto-crosshair><div class="ui-crosshair">' +
      '<div class="ui-crosshair__line ui-crosshair__line--x"></div></div></figure>',
  );
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  const plot = d.querySelector('[data-bronto-crosshair]');
  const overlay = d.querySelector('.ui-crosshair');
  plot.getBoundingClientRect = () => ({
    left: 10,
    top: 20,
    right: 210,
    bottom: 120,
    width: 200,
    height: 100,
  });

  const stop = initCrosshair();
  plot.dispatchEvent(new dom.window.MouseEvent('pointermove', { clientX: 60, clientY: 45 }));
  assert.equal(overlay.classList.contains('is-active'), true);
  assert.equal(overlay.style.getPropertyValue('--crosshair-x'), '50px');
  assert.equal(overlay.style.getPropertyValue('--crosshair-y'), '25px');
  assert.equal(overlay.dataset.readoutInline, 'after');
  assert.equal(overlay.dataset.readoutBlock, 'below');

  stop();
  assert.equal(overlay.classList.contains('is-active'), false, 'active state restored');
  assert.equal(overlay.style.getPropertyValue('--crosshair-x'), '', 'x position restored');
  assert.equal(overlay.style.getPropertyValue('--crosshair-y'), '', 'y position restored');
  assert.equal(overlay.hasAttribute('data-readout-inline'), false, 'inline flip restored');
  assert.equal(overlay.hasAttribute('data-readout-block'), false, 'block flip restored');
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

test('initSources resolves text-node citation and button clicks', () => {
  const d = mount(SOURCES);
  const island = d.querySelector('[data-bronto-sources]');
  const citation = d.querySelector('.ui-citation');
  const button = d.querySelector('[data-bronto-source-ref]');
  const events = [];
  island.addEventListener('bronto:source:focus', (e) => events.push(e.detail.id));
  const click = (target) => {
    const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
    const allowed = target.dispatchEvent(event);
    return { allowed, defaultPrevented: event.defaultPrevented };
  };

  const stop = initSources();
  const citationClick = click(citation.firstChild);
  assert.equal(d.activeElement, d.getElementById('s1'));
  assert.deepEqual(citationClick, { allowed: true, defaultPrevented: false });

  const buttonClick = click(button.firstChild);
  assert.equal(d.activeElement, d.getElementById('s2'));
  assert.deepEqual(buttonClick, { allowed: false, defaultPrevented: true });
  assert.deepEqual(events, ['s1', 's2']);
  stop();
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

test('initSources: cleanup clears detached generated highlight and restores authored active source', () => {
  const d = mount(`
    <main data-bronto-sources>
      <button type="button" data-bronto-source-ref="s2">Preview source 2</button>
      <article id="s1" class="ui-source-card is-source-active">
        <h3 class="ui-source-card__title">Authored active</h3>
      </article>
      <article id="s2" class="ui-source-card">
        <h3 class="ui-source-card__title">Generated active</h3>
      </article>
    </main>`);
  const button = d.querySelector('[data-bronto-source-ref]');
  const authored = d.getElementById('s1');
  const generated = d.getElementById('s2');

  const stop = initSources();
  button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(authored.classList.contains('is-source-active'), false, 'active source moved');
  assert.equal(generated.classList.contains('is-source-active'), true, 'new source highlighted');
  assert.equal(generated.getAttribute('tabindex'), '-1', 'generated source made focusable');

  generated.remove();
  stop();
  assert.equal(
    generated.classList.contains('is-source-active'),
    false,
    'detached generated highlight cleared',
  );
  assert.equal(generated.hasAttribute('tabindex'), false, 'detached tabindex restored');
  assert.equal(
    authored.classList.contains('is-source-active'),
    true,
    'authored active source restored',
  );
  assert.equal(button.hasAttribute('aria-describedby'), false, 'metadata restored');
});

test('initSplitter: keyboard syncs CSS/ARIA and cleanup restores generated state', () => {
  const d = mount(`
    <div class="ui-splitter ui-splitter--vertical" data-bronto-splitter style="--splitter-pos: 40%">
      <section id="primary" class="ui-splitter__pane">Files</section>
      <div class="ui-splitter__handle" aria-controls="primary" aria-label="Resize file pane"></div>
      <section class="ui-splitter__pane">Editor</section>
    </div>`);
  const splitter = d.querySelector('[data-bronto-splitter]');
  const handle = d.querySelector('.ui-splitter__handle');
  const values = [];
  splitter.addEventListener('bronto:splitter:resize', (e) => values.push(e.detail));

  const stop = initSplitter();
  assert.equal(handle.getAttribute('role'), 'separator');
  assert.equal(handle.tabIndex, 0);
  assert.equal(handle.getAttribute('aria-orientation'), 'vertical');
  assert.equal(handle.getAttribute('aria-valuemin'), '20');
  assert.equal(handle.getAttribute('aria-valuemax'), '80');
  assert.equal(handle.getAttribute('aria-valuenow'), '40');
  assert.equal(splitter.style.getPropertyValue('--splitter-pos'), '40%');

  handle.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
  );
  assert.equal(handle.getAttribute('aria-valuenow'), '42');
  assert.equal(splitter.style.getPropertyValue('--splitter-pos'), '42%');
  handle.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true, bubbles: true }),
  );
  assert.equal(handle.getAttribute('aria-valuenow'), '32');
  handle.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(handle.getAttribute('aria-valuenow'), '20');
  handle.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(handle.getAttribute('aria-valuenow'), '80');
  assert.deepEqual(
    values.map((v) => [v.value, v.orientation]),
    [
      [42, 'vertical'],
      [32, 'vertical'],
      [20, 'vertical'],
      [80, 'vertical'],
    ],
  );

  stop();
  assert.equal(handle.hasAttribute('role'), false, 'cleanup restores generated role');
  assert.equal(handle.hasAttribute('tabindex'), false, 'cleanup restores generated tabindex');
  assert.equal(
    handle.hasAttribute('aria-orientation'),
    false,
    'cleanup restores generated orientation',
  );
  assert.equal(handle.hasAttribute('aria-valuemin'), false, 'cleanup restores generated min');
  assert.equal(handle.hasAttribute('aria-valuemax'), false, 'cleanup restores generated max');
  assert.equal(handle.hasAttribute('aria-valuenow'), false, 'cleanup restores generated value');
  assert.equal(splitter.style.getPropertyValue('--splitter-pos'), '40%', 'authored CSS restored');
  handle.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
  );
  assert.equal(
    splitter.style.getPropertyValue('--splitter-pos'),
    '40%',
    'keyboard handler removed',
  );
  assert.equal(
    handle.hasAttribute('aria-valuenow'),
    false,
    'cleanup leaves generated value absent',
  );
});

test('initSplitter: pointer drag calculates percentages and detaches on cleanup', () => {
  const d = mount(`
    <div class="ui-splitter ui-splitter--horizontal" data-bronto-splitter="horizontal" style="--splitter-pos: 30%">
      <section id="top-pane" class="ui-splitter__pane">Top</section>
      <div
        class="ui-splitter__handle"
        aria-controls="top-pane"
        aria-label="Resize top pane"
        aria-valuemin="10"
        aria-valuemax="90"
      ></div>
      <section class="ui-splitter__pane">Bottom</section>
    </div>`);
  const splitter = d.querySelector('[data-bronto-splitter]');
  const handle = d.querySelector('.ui-splitter__handle');
  splitter.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: 200,
    bottom: 200,
    width: 200,
    height: 200,
  });
  const events = [];
  splitter.addEventListener('bronto:splitter:resize', (e) => events.push(e.detail));

  const stop = initSplitter({ root: splitter });
  handle.dispatchEvent(
    new dom.window.MouseEvent('pointerdown', { bubbles: true, button: 0, clientY: 50 }),
  );
  assert.equal(handle.classList.contains('is-active'), true, 'drag state set on pointerdown');
  d.dispatchEvent(new dom.window.MouseEvent('pointermove', { bubbles: true, clientY: 120 }));
  assert.equal(handle.getAttribute('aria-valuenow'), '60');
  assert.equal(splitter.style.getPropertyValue('--splitter-pos'), '60%');
  d.dispatchEvent(new dom.window.MouseEvent('pointerup', { bubbles: true, clientY: 120 }));
  assert.equal(handle.classList.contains('is-active'), false, 'drag state cleared on pointerup');
  assert.deepEqual(
    events.map((v) => [v.value, v.orientation]),
    [
      [25, 'horizontal'],
      [60, 'horizontal'],
    ],
  );

  stop();
  assert.equal(splitter.style.getPropertyValue('--splitter-pos'), '30%', 'authored CSS restored');
  assert.equal(handle.hasAttribute('role'), false, 'cleanup restores generated role');
  assert.equal(handle.hasAttribute('tabindex'), false, 'cleanup restores generated tabindex');
  assert.equal(
    handle.hasAttribute('aria-orientation'),
    false,
    'cleanup restores generated orientation',
  );
  assert.equal(handle.getAttribute('aria-valuemin'), '10', 'authored min preserved');
  assert.equal(handle.getAttribute('aria-valuemax'), '90', 'authored max preserved');
  assert.equal(handle.hasAttribute('aria-valuenow'), false, 'cleanup restores generated value');
  d.dispatchEvent(new dom.window.MouseEvent('pointermove', { bubbles: true, clientY: 20 }));
  assert.equal(splitter.style.getPropertyValue('--splitter-pos'), '30%', 'drag handler removed');
  assert.equal(
    handle.hasAttribute('aria-valuenow'),
    false,
    'cleanup leaves generated value absent',
  );
});

test('initSplitter: cleanup releases active pointer capture during a drag', () => {
  const d = mount(`
    <div class="ui-splitter" data-bronto-splitter style="--splitter-pos: 40%">
      <section id="left-pane" class="ui-splitter__pane">Left</section>
      <div class="ui-splitter__handle" aria-controls="left-pane" aria-label="Resize left pane"></div>
      <section class="ui-splitter__pane">Right</section>
    </div>`);
  const splitter = d.querySelector('[data-bronto-splitter]');
  const handle = d.querySelector('.ui-splitter__handle');
  splitter.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: 200,
    bottom: 200,
    width: 200,
    height: 200,
  });

  const captured = [];
  const released = [];
  handle.setPointerCapture = (id) => captured.push(id);
  handle.hasPointerCapture = (id) => captured.includes(id) && !released.includes(id);
  handle.releasePointerCapture = (id) => released.push(id);

  const stop = initSplitter({ root: splitter });
  const down = new dom.window.MouseEvent('pointerdown', {
    bubbles: true,
    button: 0,
    clientX: 90,
  });
  Object.defineProperty(down, 'pointerId', { value: 7 });
  handle.dispatchEvent(down);
  assert.deepEqual(captured, [7], 'pointer capture started');
  assert.equal(handle.classList.contains('is-active'), true, 'drag state is active');

  stop();
  assert.deepEqual(released, [7], 'cleanup released active pointer capture');
  assert.equal(handle.classList.contains('is-active'), false, 'cleanup clears drag state');
  assert.equal(splitter.style.getPropertyValue('--splitter-pos'), '40%', 'authored CSS restored');
  assert.equal(handle.hasAttribute('aria-valuenow'), false, 'cleanup restores generated value');
  d.dispatchEvent(new dom.window.MouseEvent('pointermove', { bubbles: true, clientX: 120 }));
  assert.equal(
    splitter.style.getPropertyValue('--splitter-pos'),
    '40%',
    'document drag handler removed',
  );
  assert.equal(
    handle.hasAttribute('aria-valuenow'),
    false,
    'cleanup leaves generated value absent',
  );
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

test('initCommand: cleanup restores filtering, active state, and generated ARIA', () => {
  const d = mount(CMD);
  const input = d.querySelector('.ui-command__input');
  const list = d.querySelector('.ui-command__list');
  const items = [...d.querySelectorAll('.ui-command__item')];
  const groups = [...d.querySelectorAll('.ui-command__group')];
  const empty = d.querySelector('.ui-command__empty');
  const stop = initCommand();

  assert.ok(list.id, 'list id generated');
  assert.ok(items[0].id, 'item id generated');
  assert.equal(input.getAttribute('role'), 'combobox');
  assert.ok(items[0].classList.contains('is-active'), 'first item seeded active');

  input.value = 'zzzz';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.deepEqual(
    items.filter((it) => !it.hidden).map((it) => it.dataset.value),
    [],
    'filter hides every command',
  );
  assert.deepEqual(
    groups.map((g) => g.hidden),
    [true, true],
    'filter hides empty groups',
  );
  assert.equal(empty.hidden, false, 'empty state shown');

  stop();
  assert.deepEqual(
    items.filter((it) => !it.hidden).map((it) => it.dataset.value),
    ['home', 'settings', 'new'],
    'cleanup restores command visibility',
  );
  assert.deepEqual(
    groups.map((g) => g.hidden),
    [false, false],
    'cleanup restores group visibility',
  );
  assert.equal(empty.hidden, true, 'cleanup restores empty state');
  assert.equal(input.hasAttribute('role'), false, 'input role restored');
  assert.equal(input.hasAttribute('aria-controls'), false, 'aria-controls restored');
  assert.equal(input.hasAttribute('aria-activedescendant'), false, 'active descendant restored');
  assert.equal(list.hasAttribute('id'), false, 'generated list id restored');
  assert.equal(list.hasAttribute('role'), false, 'list role restored');
  assert.equal(
    items.some((it) => it.classList.contains('is-active')),
    false,
    'active class restored',
  );
  assert.equal(
    items.some((it) => it.hasAttribute('id')),
    false,
    'generated item ids restored',
  );
  assert.equal(
    items.some((it) => it.hasAttribute('role')),
    false,
    'item roles restored',
  );
  assert.equal(
    groups.some((g) => g.hasAttribute('role')),
    false,
    'group roles restored',
  );
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

test('initCommand resolves text-node item clicks', () => {
  const d = mount(CMD);
  const box = d.querySelector('[data-bronto-command]');
  const items = [...d.querySelectorAll('.ui-command__item')];
  let picked;
  box.addEventListener('bronto:command:select', (e) => (picked = e.detail));

  const stop = initCommand();
  items[1]
    .querySelector('span')
    .firstChild.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(picked, { value: 'settings', label: 'Open settings' });
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

test('initModal: cleanup restores generated attrs on a detached content-only modal', () => {
  const d = mount(`
    <button id="opener">Open</button>
    <aside id="bg"><a href="#">background link</a></aside>
    <div id="content-modal" class="ui-modal is-open" data-bronto-modal aria-label="Content modal"></div>`);
  globalThis.MutationObserver = dom.window.MutationObserver;
  const opener = d.getElementById('opener');
  const bg = d.getElementById('bg');
  const modal = d.getElementById('content-modal');
  opener.focus();

  const stop = initModal();
  assert.equal(modal.getAttribute('role'), 'dialog', 'dialog role generated');
  assert.equal(modal.getAttribute('aria-modal'), 'true', 'modal state generated');
  assert.equal(modal.getAttribute('tabindex'), '-1', 'content-only modal made focusable');
  assert.equal(bg.inert, true, 'background inerted');

  modal.remove();
  stop();
  assert.equal(bg.inert, false, 'detached cleanup releases inert background');
  assert.equal(modal.hasAttribute('role'), false, 'generated role restored');
  assert.equal(modal.hasAttribute('aria-modal'), false, 'generated aria-modal restored');
  assert.equal(modal.hasAttribute('tabindex'), false, 'generated tabindex restored');
});

test('initModal: Escape is owned by the topmost active controlled modal', async () => {
  const d = mount(`
    <button id="opener">Open</button>
    <div id="outer" class="ui-modal is-open" data-bronto-modal aria-label="Outer">
      <button id="outer-ok">Outer ok</button>
      <div id="inner" class="ui-modal is-open" data-bronto-modal aria-label="Inner">
        <button id="inner-ok">Inner ok</button>
      </div>
    </div>`);
  globalThis.MutationObserver = dom.window.MutationObserver;
  const opener = d.getElementById('opener');
  const outer = d.getElementById('outer');
  const inner = d.getElementById('inner');
  let outerCount = 0;
  let innerCount = 0;
  outer.addEventListener('bronto:modal:close', (e) => {
    if (e.target === outer) outerCount++;
  });
  inner.addEventListener('bronto:modal:close', (e) => {
    if (e.target === inner) innerCount++;
  });
  opener.focus();

  const stop = initModal();
  await tick();
  d.getElementById('inner-ok').dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  );
  assert.equal(innerCount, 1, 'top modal receives Escape');
  assert.equal(outerCount, 0, 'outer modal does not double-handle inner Escape');

  inner.classList.remove('is-open');
  await tick();
  d.getElementById('outer-ok').dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  );
  assert.equal(outerCount, 1, 'outer becomes topmost after inner closes');
  stop();
});

test('initModal lets an open nested popover own Escape', async () => {
  const d = mount(`
    <button id="opener">Open</button>
    <div class="ui-modal is-open" data-bronto-modal aria-label="Settings">
      <button id="t" data-bronto-popover="pop">More</button>
      <div class="ui-popover" id="pop" aria-label="More details"><button id="inner">Inner</button></div>
    </div>`);
  globalThis.MutationObserver = dom.window.MutationObserver;
  const opener = d.getElementById('opener');
  const modal = d.querySelector('.ui-modal');
  const trigger = d.getElementById('t');
  const panel = d.getElementById('pop');
  opener.focus();
  let reason = null;
  modal.addEventListener('bronto:modal:close', (e) => (reason = e.detail.reason));

  const stopModal = initModal();
  const stopPopover = initPopover();
  await tick();
  trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(panel.classList.contains('is-open'), true, 'nested popover opened');

  d.getElementById('inner').dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  );
  assert.equal(reason, null, 'modal close was not requested');
  assert.equal(modal.classList.contains('is-open'), true, 'modal remains open');
  assert.equal(panel.classList.contains('is-open'), false, 'popover closes');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  stopPopover();
  stopModal();
});

// ---------------------------------------------------------------------------
// initDisabledGuard — aria-disabled controls become keyboard-inert, not just
// pointer-inert. Capturing listeners must swallow the
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

test('disabled guard resolves text-node targets and stops activation handlers', () => {
  const d = mount(
    '<div id="scope"><button id="dead" aria-disabled="true"><span>Dead</span></button></div>',
  );
  const scope = d.getElementById('scope');
  const dead = d.getElementById('dead');
  let targetFired = 0;
  let bubbleFired = 0;
  dead.addEventListener('click', () => targetFired++);
  scope.addEventListener('click', () => bubbleFired++);

  const stop = initDisabledGuard({ root: scope });
  const click = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  const allowed = dead.querySelector('span').firstChild.dispatchEvent(click);
  assert.equal(allowed, false, 'disabled text-node click is canceled');
  assert.equal(click.defaultPrevented, true, 'text-node click default is prevented');
  assert.equal(targetFired, 0, 'target activation listener is skipped');
  assert.equal(bubbleFired, 0, 'bubbling handlers are skipped');

  stop();
});
