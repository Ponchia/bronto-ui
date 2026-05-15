/**
 * @ponchia/ui — optional behaviors.
 *
 * The framework is CSS-first. This is the sanctioned home for the small
 * amount of JS that genuinely needs scripting (theme persistence, dismiss,
 * disclosure), so consumers don't each reimplement it.
 *
 * Framework-agnostic, dependency-free, side-effect-free on import, and
 * SSR-safe (every entry no-ops without a DOM). Each initializer uses event
 * delegation off a root and returns a cleanup function.
 *
 *   import { applyStoredTheme, initThemeToggle } from '@ponchia/ui/behaviors';
 *   applyStoredTheme();                 // before paint, avoids theme flash
 *   const stop = initThemeToggle();     // wire [data-bronto-theme-toggle]
 */

const THEMES = ['light', 'dark'];
const noop = () => {};
const hasDom = () => typeof document !== 'undefined';

/**
 * Apply the persisted theme to <html data-theme>. Call as early as
 * possible (an inline module in <head>) to avoid a flash before the
 * toggle wires up. No stored value → leaves prefers-color-scheme to act.
 */
export function applyStoredTheme({ storageKey = 'bronto-theme', root } = {}) {
  if (!hasDom()) return;
  const el = root || document.documentElement;
  let stored = null;
  try {
    stored = localStorage.getItem(storageKey);
  } catch {
    /* storage blocked (private mode / sandbox) — fall through to OS default */
  }
  if (stored && THEMES.includes(stored)) el.setAttribute('data-theme', stored);
}

/**
 * Wire `[data-bronto-theme-toggle]` controls. Click toggles light/dark,
 * persists to localStorage, and **always** sets `data-theme` on <html>
 * (a theme is document-global). State is reflected via `aria-pressed`
 * and a `bronto:themechange` CustomEvent ({ detail: { theme } }) is
 * dispatched on <html> so consumers can sync their own UI without
 * racing the click handler. A control may set
 * `data-bronto-theme-toggle="dark"` to force a specific theme.
 *
 * `root` scopes event delegation and which controls are queried/reflected
 * (default `document`); it does not change where the theme is applied.
 */
export function initThemeToggle({ storageKey = 'bronto-theme', root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;
  const docEl = document.documentElement;

  const prefersDark = () =>
    typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;

  const current = () => {
    const attr = docEl.getAttribute('data-theme');
    if (THEMES.includes(attr)) return attr;
    return prefersDark() ? 'dark' : 'light';
  };

  const reflect = () => {
    const c = current();
    host.querySelectorAll('[data-bronto-theme-toggle]').forEach((el) => {
      const forced = el.getAttribute('data-bronto-theme-toggle');
      // A forced control is "pressed" when its theme is the active one;
      // a plain toggle reflects whether dark is active.
      const pressed = THEMES.includes(forced) ? c === forced : c === 'dark';
      el.setAttribute('aria-pressed', String(pressed));
    });
  };

  const onClick = (e) => {
    const trigger = e.target.closest('[data-bronto-theme-toggle]');
    if (!trigger || !host.contains(trigger)) return;
    const forced = trigger.getAttribute('data-bronto-theme-toggle');
    const next = THEMES.includes(forced) ? forced : current() === 'dark' ? 'light' : 'dark';
    docEl.setAttribute('data-theme', next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* storage blocked — theme still applies for this session */
    }
    reflect();
    docEl.dispatchEvent(
      new CustomEvent('bronto:themechange', { detail: { theme: next }, bubbles: true })
    );
  };

  applyStoredTheme({ storageKey });
  reflect();
  host.addEventListener('click', onClick);
  return () => host.removeEventListener('click', onClick);
}

/**
 * Click on `[data-bronto-dismiss]` removes the nearest ancestor matching
 * `[data-bronto-dismissible]` (or the selector given as the attribute
 * value). Emits a cancelable `bronto:dismiss` event first.
 */
export function dismissible({ root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;
  const onClick = (e) => {
    const btn = e.target.closest('[data-bronto-dismiss]');
    if (!btn || !host.contains(btn)) return;
    const sel = btn.getAttribute('data-bronto-dismiss');
    const target = sel ? btn.closest(sel) : btn.closest('[data-bronto-dismissible]');
    if (!target) return;
    const ev = new CustomEvent('bronto:dismiss', { bubbles: true, cancelable: true });
    if (target.dispatchEvent(ev)) target.remove();
  };
  host.addEventListener('click', onClick);
  return () => host.removeEventListener('click', onClick);
}

/**
 * Wire `[data-bronto-tabs]` groups for full keyboard a11y. The framework
 * ships the look + the ARIA/`.is-active` contract; this adds the WAI-ARIA
 * Tabs pattern: roving `tabindex`, `aria-selected`, Arrow/Home/End
 * navigation with automatic activation, and panel `hidden` sync. Tabs are
 * `.ui-tab[data-tab]`; panels are `.ui-tabs__panel[data-panel]` with
 * matching values. SSR-safe; returns a cleanup function.
 */
export function initTabs({ root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;
  const cleanups = [];
  for (const group of host.querySelectorAll('[data-bronto-tabs]')) {
    // Own group only — a tab/panel inside a nested [data-bronto-tabs]
    // belongs to that inner group, not this one.
    const owned = (el) => el.closest('[data-bronto-tabs]') === group;
    const tabs = [...group.querySelectorAll('.ui-tab')].filter(owned);
    const panels = [...group.querySelectorAll('.ui-tabs__panel')].filter(owned);
    if (!tabs.length) continue;
    const list = group.querySelector('.ui-tabs__list');
    if (list) list.setAttribute('role', 'tablist');

    const select = (tab) => {
      for (const t of tabs) {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('role', 'tab');
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      }
      for (const p of panels) {
        p.setAttribute('role', 'tabpanel');
        p.hidden = p.dataset.panel !== tab.dataset.tab;
      }
    };
    const onClick = (e) => {
      const tab = e.target.closest('.ui-tab');
      if (tab && group.contains(tab)) {
        select(tab);
        tab.focus();
      }
    };
    const onKey = (e) => {
      const i = tabs.indexOf(e.target.closest('.ui-tab'));
      if (i < 0) return;
      let n = i;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      else return;
      e.preventDefault();
      select(tabs[n]);
      tabs[n].focus();
    };
    group.addEventListener('click', onClick);
    group.addEventListener('keydown', onKey);
    select(tabs.find((t) => t.classList.contains('is-active')) || tabs[0]);
    cleanups.push(() => {
      group.removeEventListener('click', onClick);
      group.removeEventListener('keydown', onKey);
    });
  }
  return () => cleanups.forEach((fn) => fn());
}

/**
 * Wire native <dialog> open/close glue (the one bit <dialog> can't do
 * declaratively). Click `[data-bronto-open="dialogId"]` calls
 * `showModal()` on `#dialogId`; click `[data-bronto-close]` closes the
 * nearest enclosing <dialog>. Clicking the backdrop of a dialog that has
 * `[data-bronto-dialog-light]` closes it too. SSR-safe; returns cleanup.
 *
 * `root` scopes which triggers are delegated (default `document`); the
 * dialog itself is still resolved by id document-wide, because a modal
 * <dialog> is promoted to the top layer and is inherently document-global
 * (same model as `initThemeToggle`, where `root` scopes controls but the
 * theme applies to <html>).
 */
export function initDialog({ root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;
  const onClick = (e) => {
    const opener = e.target.closest('[data-bronto-open]');
    if (opener && host.contains(opener)) {
      const dlg = document.getElementById(opener.getAttribute('data-bronto-open'));
      if (dlg && typeof dlg.showModal === 'function' && !dlg.open) dlg.showModal();
      return;
    }
    const closer = e.target.closest('[data-bronto-close]');
    if (closer && host.contains(closer)) {
      const dlg = closer.closest('dialog');
      if (dlg && dlg.open) dlg.close();
      return;
    }
    // Light-dismiss: a click whose target is the <dialog> itself is the
    // backdrop (content sits in child elements).
    const dlg = e.target;
    if (
      dlg.tagName === 'DIALOG' &&
      dlg.open &&
      dlg.hasAttribute('data-bronto-dialog-light') &&
      host.contains(dlg)
    ) {
      dlg.close();
    }
  };
  host.addEventListener('click', onClick);
  return () => host.removeEventListener('click', onClick);
}

/**
 * Push a transient toast into a shared, screen-anchored stack (created
 * once and appended to <body>, `aria-live="polite"`). `tone` is one of
 * accent/success/warning/danger; `title` is an optional uppercase label;
 * `duration` ms before auto-dismiss (0 keeps it until dismissed). Returns
 * a function that dismisses the toast early. SSR-safe (no-op).
 */
export function toast(message, { tone, title, duration = 4000 } = {}) {
  if (!hasDom()) return noop;
  let stack = document.querySelector('.ui-toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'ui-toast-stack';
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = tone ? `ui-toast ui-toast--${tone}` : 'ui-toast';
  el.setAttribute('role', 'status');
  if (title) {
    const t = document.createElement('p');
    t.className = 'ui-toast__title';
    t.textContent = title;
    el.appendChild(t);
  }
  const body = document.createElement('div');
  body.textContent = message;
  el.appendChild(body);
  stack.appendChild(el);

  let timer;
  const dismiss = () => {
    if (timer) clearTimeout(timer);
    el.remove();
    if (stack && !stack.childElementCount) stack.remove();
  };
  if (duration > 0) timer = setTimeout(dismiss, duration);
  return dismiss;
}

/**
 * Disclosure: a `[data-bronto-disclosure]` trigger toggles the element
 * referenced by its `aria-controls` id, keeping `aria-expanded` and the
 * panel's `hidden` attribute in sync.
 */
export function initDisclosure({ root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;
  const onClick = (e) => {
    const trigger = e.target.closest('[data-bronto-disclosure]');
    if (!trigger || !host.contains(trigger)) return;
    const id = trigger.getAttribute('aria-controls');
    const panel = id && document.getElementById(id);
    if (!panel) return;
    const open = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!open));
    panel.hidden = open;
  };
  host.addEventListener('click', onClick);
  return () => host.removeEventListener('click', onClick);
}
