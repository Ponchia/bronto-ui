import { hasDom, resolveHost, noop, bindOnce } from './internal.js';

const THEMES = ['light', 'dark'];

/**
 * Apply the persisted theme to <html data-theme>. Call as early as
 * possible (an inline module in <head>) to avoid a flash before the
 * toggle wires up. No stored value → leaves prefers-color-scheme to act.
 */
export function applyStoredTheme({ storageKey = 'bronto-theme', root } = {}) {
  if (!hasDom()) return;
  const el = resolveHost(root, document.documentElement);
  if (!el) return;
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
  const host = resolveHost(root);
  if (!host) return noop;
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
      new CustomEvent('bronto:themechange', { detail: { theme: next }, bubbles: true }),
    );
  };

  applyStoredTheme({ storageKey });
  reflect();
  return bindOnce(host, 'themeToggle', () => {
    host.addEventListener('click', onClick);
    return () => host.removeEventListener('click', onClick);
  });
}
