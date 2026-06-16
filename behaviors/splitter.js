import { hasDom, resolveHost, noop, bindOnce, collectHosts } from './internal.js';

const SELECTOR = '[data-bronto-splitter]';
const HANDLE_SELECTOR = '.ui-splitter__handle';
const DEFAULT_MIN = 20;
const DEFAULT_MAX = 80;
const DEFAULT_VALUE = 50;
const STEP = 2;
const LARGE_STEP = 10;

/**
 * @typedef {object} SplitterResizeDetail
 * @property {number} value The first pane size as a 0..100 percentage.
 * @property {'vertical' | 'horizontal'} orientation Splitter orientation.
 */

const num = (v, fallback) => {
  const n = Number.parseFloat(String(v ?? '').trim());
  return Number.isFinite(n) ? n : fallback;
};

const fmt = (v) => String(Math.round(v * 10) / 10);

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const readCssValue = (splitter) => splitter.style.getPropertyValue('--splitter-pos');

const readOrientation = (splitter, handle) => {
  const data = splitter.getAttribute('data-bronto-splitter');
  if (data === 'horizontal' || data === 'vertical') return data;
  if (splitter.classList.contains('ui-splitter--horizontal')) return 'horizontal';
  if (splitter.classList.contains('ui-splitter--vertical')) return 'vertical';
  return handle.getAttribute('aria-orientation') === 'horizontal' ? 'horizontal' : 'vertical';
};

const getView = (el) => el.ownerDocument?.defaultView || null;

const dispatchResize = (splitter, detail) => {
  splitter.dispatchEvent(
    new CustomEvent('bronto:splitter:resize', {
      bubbles: true,
      detail,
    }),
  );
};

const snapshotAttrs = (el, names) => {
  const out = {};
  for (const name of names) {
    out[name] = {
      had: el.hasAttribute(name),
      value: el.getAttribute(name),
    };
  }
  return out;
};

const restoreAttrs = (el, attrs) => {
  for (const [name, attr] of Object.entries(attrs)) {
    if (attr.had) el.setAttribute(name, attr.value);
    else el.removeAttribute(name);
  }
};

const snapshotStyleProp = (el, name) => ({
  value: el.style.getPropertyValue(name),
  priority: el.style.getPropertyPriority(name),
});

const restoreStyleProp = (el, name, prop) => {
  if (prop.value) el.style.setProperty(name, prop.value, prop.priority);
  else el.style.removeProperty(name);
};

function wireSplitter(splitter) {
  const handle = splitter.querySelector(HANDLE_SELECTOR);
  if (!handle) return noop;

  return bindOnce(splitter, 'splitter', () => {
    const handleAttrs = snapshotAttrs(handle, [
      'role',
      'tabindex',
      'aria-orientation',
      'aria-valuemin',
      'aria-valuemax',
      'aria-valuenow',
    ]);
    const splitterPos = snapshotStyleProp(splitter, '--splitter-pos');
    const orientation = readOrientation(splitter, handle);
    const min = num(handle.getAttribute('aria-valuemin'), DEFAULT_MIN);
    const max = Math.max(min, num(handle.getAttribute('aria-valuemax'), DEFAULT_MAX));
    let value = clamp(
      num(handle.getAttribute('aria-valuenow'), num(readCssValue(splitter), DEFAULT_VALUE)),
      min,
      max,
    );
    let activePointer = null;

    const apply = (next, { emit = true } = {}) => {
      value = clamp(next, min, max);
      const label = fmt(value);
      splitter.style.setProperty('--splitter-pos', `${label}%`);
      handle.setAttribute('aria-valuenow', label);
      if (emit) dispatchResize(splitter, { value, orientation });
    };

    if (!handle.hasAttribute('role')) handle.setAttribute('role', 'separator');
    if (!handle.hasAttribute('tabindex')) handle.tabIndex = 0;
    if (!handle.hasAttribute('aria-orientation'))
      handle.setAttribute('aria-orientation', orientation);
    if (!handle.hasAttribute('aria-valuemin')) handle.setAttribute('aria-valuemin', fmt(min));
    if (!handle.hasAttribute('aria-valuemax')) handle.setAttribute('aria-valuemax', fmt(max));
    apply(value, { emit: false });

    const fromPointer = (event) => {
      const rect = splitter.getBoundingClientRect();
      const size = orientation === 'horizontal' ? rect.height : rect.width;
      if (!size) return value;
      if (orientation === 'horizontal') {
        return ((event.clientY - rect.top) / size) * 100;
      }
      const view = getView(splitter);
      const dir = view?.getComputedStyle?.(splitter).direction;
      const x = dir === 'rtl' ? rect.right - event.clientX : event.clientX - rect.left;
      return (x / size) * 100;
    };

    const capturePointer = (pointerId) => {
      if (pointerId === undefined || pointerId === null) return;
      try {
        handle.setPointerCapture?.(pointerId);
      } catch {
        /* Pointer capture is an affordance; drag still works through document listeners. */
      }
    };

    const releasePointer = (pointerId = activePointer) => {
      if (pointerId === undefined || pointerId === null) return;
      try {
        if (!handle.hasPointerCapture || handle.hasPointerCapture(pointerId)) {
          handle.releasePointerCapture?.(pointerId);
        }
      } catch {
        /* The element may have been removed or capture may already be gone. */
      }
    };

    const onKeydown = (event) => {
      let next = value;
      if (event.key === 'Home') next = min;
      else if (event.key === 'End') next = max;
      else if (event.key === 'PageUp') next += LARGE_STEP;
      else if (event.key === 'PageDown') next -= LARGE_STEP;
      else if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
        next += event.shiftKey ? LARGE_STEP : STEP;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
        next -= event.shiftKey ? LARGE_STEP : STEP;
      else return;
      event.preventDefault();
      apply(next);
    };

    const onPointerMove = (event) => {
      if (
        activePointer !== null &&
        event.pointerId !== undefined &&
        event.pointerId !== activePointer
      )
        return;
      apply(fromPointer(event));
    };

    const onPointerUp = (event) => {
      if (
        activePointer !== null &&
        event.pointerId !== undefined &&
        event.pointerId !== activePointer
      )
        return;
      releasePointer(event.pointerId);
      activePointer = null;
      handle.classList.remove('is-active');
      splitter.ownerDocument.removeEventListener('pointermove', onPointerMove);
      splitter.ownerDocument.removeEventListener('pointerup', onPointerUp);
      splitter.ownerDocument.removeEventListener('pointercancel', onPointerUp);
    };

    const onPointerDown = (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      activePointer = event.pointerId ?? null;
      capturePointer(activePointer);
      handle.classList.add('is-active');
      apply(fromPointer(event));
      splitter.ownerDocument.addEventListener('pointermove', onPointerMove);
      splitter.ownerDocument.addEventListener('pointerup', onPointerUp);
      splitter.ownerDocument.addEventListener('pointercancel', onPointerUp);
    };

    handle.addEventListener('keydown', onKeydown);
    handle.addEventListener('pointerdown', onPointerDown);
    return () => {
      handle.removeEventListener('keydown', onKeydown);
      handle.removeEventListener('pointerdown', onPointerDown);
      splitter.ownerDocument.removeEventListener('pointermove', onPointerMove);
      splitter.ownerDocument.removeEventListener('pointerup', onPointerUp);
      splitter.ownerDocument.removeEventListener('pointercancel', onPointerUp);
      releasePointer();
      handle.classList.remove('is-active');
      activePointer = null;
      restoreAttrs(handle, handleAttrs);
      restoreStyleProp(splitter, '--splitter-pos', splitterPos);
    };
  });
}

/**
 * Wire focusable ARIA splitters. Each `[data-bronto-splitter]` host contains
 * two `.ui-splitter__pane` elements separated by one `.ui-splitter__handle`
 * (`role="separator"`). The behavior keeps `--splitter-pos` and
 * `aria-valuenow` in sync for keyboard and pointer resizing, then dispatches
 * `bronto:splitter:resize` with `{ value, orientation }`.
 *
 * Bronto owns the control affordance only. The host owns pane content,
 * persistence, min/max policy, collapse behavior, and any saved layout state.
 * SSR-safe and idempotent per splitter; returns a cleanup function.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initSplitter({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const splitters = collectHosts(host, SELECTOR);
  if (!splitters.length) return noop;
  const cleanups = splitters.map(wireSplitter).filter(Boolean);
  return () => cleanups.forEach((fn) => fn());
}
