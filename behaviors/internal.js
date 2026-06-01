// Shared, dependency-free DOM helpers for the behavior modules.
// Not part of the public @ponchia/ui/behaviors surface (the barrel
// re-exports only the documented behaviors).

export const noop = () => {};

export const hasDom = () => typeof document !== 'undefined';

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
    return el.closest(selector);
  } catch {
    return null;
  }
}
