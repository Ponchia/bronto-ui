// Shared, dependency-free DOM helpers for the behavior modules.
// Not part of the public @ponchia/ui/behaviors surface (the barrel
// re-exports only the documented behaviors' values — these shared option
// types are re-exported by name from index.js).

/**
 * @typedef {() => void} Cleanup
 *   Cleanup function returned by every initializer; calling it tears down the
 *   behavior's listeners/observers.
 *
 * @typedef {object} DelegateOpts
 * @property {Document | Element | null} [root]
 *   Event-delegation root; also scopes which controls are queried. Default: `document`.
 *   `null` means a scope was requested but is not ready yet, so the behavior no-ops.
 */

export const noop = () => {};

export const hasDom = () => typeof document !== 'undefined';

function isDelegationHost(value) {
  if (!value || typeof value !== 'object') return false;
  if (value.nodeType === 9) {
    return (
      typeof value.addEventListener === 'function' && typeof value.querySelectorAll === 'function'
    );
  }
  if (value.nodeType === 1) {
    return (
      typeof value.addEventListener === 'function' &&
      typeof value.matches === 'function' &&
      typeof value.querySelectorAll === 'function'
    );
  }
  return false;
}

// Resolve the delegation host from an init call's `root` option, distinguishing
// cases so an unattached/null root never silently widens to whole-document
// delegation (the "scoped island hijacks every control" foot-gun):
//   • root absent/undefined → no scope requested → delegate from `fallback`
//     (default `document`). This is the intended global-wiring path.
//   • root === null         → a scope WAS requested but isn't ready yet (e.g. a
//     framework ref still null at mount). Return null so the caller no-ops
//     instead of hijacking the whole document.
//   • root is an element    → use it.
//   • root is anything else → no-op; the public contract is Document | Element.
// The bindings (@ponchia/ui/{react,solid,qwik}) emit `root: null` for the
// not-ready case precisely so this distinction survives across the boundary.
export function resolveHost(root, fallback = document) {
  if (root === null) return null;
  if (root === undefined) return isDelegationHost(fallback) ? fallback : null;
  return isDelegationHost(root) ? root : null;
}

// Monotonic counter for auto-minted field / list ids, shared across
// initFormValidation and initCombobox so separate calls (and separate
// behaviors) never collide on an id.
let fieldUid = 0;
export const nextFieldUid = () => ++fieldUid;

// Make delegated initializers idempotent. Re-binding the same logical
// listener on the same host/element tears the previous binding down first,
// so double-init (HMR, framework re-mount, repeated calls) never stacks
// duplicate handlers (the "double-toggle" class of bug). The returned
// cleanup removes the single live binding.
const BOUND = Symbol('bronto-bound');

export function bindOnce(target, key, add) {
  const reg = target[BOUND] || (target[BOUND] = Object.create(null));
  if (reg[key]) reg[key]();
  const remove = add();
  const cleanup = () => {
    remove();
    if (reg[key] === cleanup) delete reg[key];
  };
  reg[key] = cleanup;
  return cleanup;
}

export function byIdInHost(host, id) {
  if (!id) return null;
  if (host === document) return document.getElementById(id);
  if (host.id === id) return host;
  return (
    Array.from(host.querySelectorAll?.('[id]') || []).find((el) => el.id === id) ||
    document.getElementById(id)
  );
}

export function closestSafe(el, selector) {
  try {
    const start = el?.nodeType === 1 ? el : el?.parentElement;
    return start?.closest?.(selector) ?? null;
  } catch {
    return null;
  }
}

// Collect the hosts an initializer should wire: the descendants matching
// `selector` PLUS `host` itself when it matches (querySelectorAll only sees
// descendants, so a `root` that *is* a target would otherwise be skipped).
// Self-first, null-safe — the shape ~9 delegated behaviors hand-rolled.
export function collectHosts(host, selector) {
  const out = host !== document && host.matches?.(selector) ? [host] : [];
  out.push(...(host.querySelectorAll?.(selector) ?? []));
  return out;
}

// scrollIntoView is a pure affordance and throws in jsdom/layout-less envs;
// never let that break a keyboard/roving handler. (combobox/command/carousel.)
export function scrollIntoViewSafe(el, opts = { block: 'nearest' }) {
  try {
    el?.scrollIntoView(opts);
  } catch {
    /* headless / no layout — the scroll is cosmetic */
  }
}

// The focusable-element selector + "move focus into a container" helper shared
// by the modal and popover focus paths (a dialog/modal must move focus into
// itself on open). Focus the first focusable descendant, else make the
// container programmatically focusable and focus it, so a content-only
// panel/modal still receives focus. (code-quality audit Q4.)
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusInto(container) {
  const first = container.querySelector(FOCUSABLE);
  if (first) {
    first.focus?.();
    return;
  }
  if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
  container.focus?.();
}

// Wrap an index by `delta` within [0, len), the roving keyboard math shared by
// the combobox and command listboxes (a -1 `cur` lands on the first/last as
// before). Only this core is shared — the surrounding setActive/filter/group
// logic diverges between the two for real reasons. (code-quality audit Q12.)
export function wrapIndex(cur, delta, len) {
  let next = cur + delta;
  if (next < 0) next = len - 1;
  if (next >= len) next = 0;
  return next;
}
