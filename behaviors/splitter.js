import {
  hasDom,
  resolveHost,
  noop,
  bindOnce,
  collectHosts,
  closestSafe,
  isUnavailable,
} from './internal.js';

const SELECTOR = '[data-bronto-splitter]';
const HANDLE_SELECTOR = '.ui-splitter__handle';
const ADJUST_SELECTOR = '[data-bronto-splitter-adjust]';
const DEFAULT_MIN = 20;
const DEFAULT_MAX = 80;
const DEFAULT_VALUE = 50;
const STEP = 2;
const LARGE_STEP = 10;

/**
 * @typedef {object} SplitterResizeDetail
 * @property {number} value The first pane size in percentage points, or CSS pixels for a pixel host.
 * @property {'vertical' | 'horizontal'} orientation Splitter orientation.
 * @property {'px'} [unit] Present for pixel-valued hosts; absent for legacy percentages.
 */

const NUMBER_RE = /^[-+]?(?:(?:\d+\.?\d*)|\.\d+)(?:e[-+]?\d+)?$/i;

const num = (v, fallback) => {
  const value = String(v ?? '').trim();
  if (!NUMBER_RE.test(value)) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const cssNum = (v, fallback) => {
  const n = Number.parseFloat(String(v ?? '').trim());
  return Number.isFinite(n) ? n : fallback;
};

const fmt = (v) => String(Math.round(v * 10) / 10);

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const readCssValue = (splitter) => splitter.style.getPropertyValue('--splitter-pos');

const readOrientation = (splitter, handle) => {
  const data = splitter.getAttribute('data-bronto-splitter')?.trim();
  if (data === 'horizontal' || data === 'vertical') return data;
  if (splitter.classList.contains('ui-splitter--horizontal')) return 'horizontal';
  if (splitter.classList.contains('ui-splitter--vertical')) return 'vertical';
  return handle.getAttribute('aria-orientation') === 'horizontal' ? 'horizontal' : 'vertical';
};

const getView = (el) => el.ownerDocument?.defaultView || null;

const dispatchResize = (splitter, detail) => {
  splitter.dispatchEvent(
    new splitter.ownerDocument.defaultView.CustomEvent('bronto:splitter:resize', {
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

function readRange(handle) {
  const min = num(handle.getAttribute('aria-valuemin'), DEFAULT_MIN);
  return { min, max: Math.max(min, num(handle.getAttribute('aria-valuemax'), DEFAULT_MAX)) };
}

const horizontalKeySign = (orientation, rtl) => (orientation === 'vertical' && rtl ? -1 : 1);

function positionForKey(event, value, bounds, orientation, rtl, step, largeStep) {
  if (event.key === 'Home') return bounds.min;
  if (event.key === 'End') return bounds.max;
  if (event.key === 'PageUp') return value + largeStep;
  if (event.key === 'PageDown') return value - largeStep;
  const backwards = orientation === 'horizontal' ? 'ArrowUp' : 'ArrowLeft';
  const forwards = orientation === 'horizontal' ? 'ArrowDown' : 'ArrowRight';
  if (event.key !== backwards && event.key !== forwards) return null;
  const sign = horizontalKeySign(orientation, rtl);
  return value + (event.key === forwards ? 1 : -1) * sign * (event.shiftKey ? largeStep : step);
}

const keyIgnored = (event) =>
  event.defaultPrevented ||
  event.isComposing ||
  event.keyCode === 229 ||
  event.altKey ||
  event.ctrlKey ||
  event.metaKey;

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
    const pixels = splitter.getAttribute('data-bronto-splitter-unit') === 'px';
    const step = Math.max(0, num(splitter.getAttribute('data-bronto-splitter-step'), STEP));
    const largeStep = Math.max(
      step,
      num(splitter.getAttribute('data-bronto-splitter-large-step'), LARGE_STEP),
    );
    const minAttr = handle.getAttribute('aria-valuemin');
    const maxAttr = handle.getAttribute('aria-valuemax');
    const min = num(minAttr, DEFAULT_MIN);
    const max = Math.max(min, num(maxAttr, DEFAULT_MAX));
    let value = clamp(
      num(handle.getAttribute('aria-valuenow'), cssNum(readCssValue(splitter), DEFAULT_VALUE)),
      min,
      max,
    );
    const syncRangeAttr = (name, authored, normalized) => {
      const parsed = num(authored, Number.NaN);
      if (
        authored === null ||
        !Number.isFinite(parsed) ||
        String(authored).trim() !== fmt(normalized)
      ) {
        handle.setAttribute(name, fmt(normalized));
      }
    };
    let activePointer = null;

    const apply = (next, { emit = true } = {}) => {
      const bounds = readRange(handle);
      value = clamp(next, bounds.min, bounds.max);
      const label = fmt(value);
      splitter.style.setProperty('--splitter-pos', `${label}${pixels ? 'px' : '%'}`);
      handle.setAttribute('aria-valuenow', label);
      if (emit) dispatchResize(splitter, { value, orientation, ...(pixels ? { unit: 'px' } : {}) });
    };

    if (!handle.hasAttribute('role')) handle.setAttribute('role', 'separator');
    if (!handle.hasAttribute('tabindex')) handle.tabIndex = 0;
    if (!handle.hasAttribute('aria-orientation'))
      handle.setAttribute('aria-orientation', orientation);
    syncRangeAttr('aria-valuemin', minAttr, min);
    syncRangeAttr('aria-valuemax', maxAttr, max);
    apply(value, { emit: false });

    const fromPointer = (event) => {
      const rect = splitter.getBoundingClientRect();
      const size = orientation === 'horizontal' ? rect.height : rect.width;
      if (!size) return value;
      if (orientation === 'horizontal') {
        return pixels ? event.clientY - rect.top : ((event.clientY - rect.top) / size) * 100;
      }
      const view = getView(splitter);
      const dir = view?.getComputedStyle?.(splitter).direction;
      const x = dir === 'rtl' ? rect.right - event.clientX : event.clientX - rect.left;
      return pixels ? x : (x / size) * 100;
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
      if (keyIgnored(event) || isUnavailable(handle)) return;
      const current = num(handle.getAttribute('aria-valuenow'), value);
      const rtl = getView(splitter)?.getComputedStyle(splitter).direction === 'rtl';
      const next = positionForKey(
        event,
        current,
        readRange(handle),
        orientation,
        rtl,
        step,
        largeStep,
      );
      if (next === null) return;
      event.preventDefault();
      apply(next);
    };

    const onPointerMove = (event) => {
      if (isUnavailable(handle)) {
        onPointerUp(event);
        return;
      }
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
      const pointer = activePointer;
      activePointer = null;
      if (event.type !== 'lostpointercapture') releasePointer(pointer);
      handle.classList.remove('is-active');
      splitter.ownerDocument.removeEventListener('pointermove', onPointerMove);
      splitter.ownerDocument.removeEventListener('pointerup', onPointerUp);
      splitter.ownerDocument.removeEventListener('pointercancel', onPointerUp);
    };

    const onPointerDown = (event) => {
      if (activePointer !== null || event.defaultPrevented || isUnavailable(handle)) return;
      if (event.isPrimary === false) return;
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

    const onClick = (event) => {
      if (event.defaultPrevented || isUnavailable(handle)) return;
      const control = closestSafe(event.target, ADJUST_SELECTOR);
      if (!control || control.closest(SELECTOR) !== splitter) return;
      const delta = num(control.getAttribute('data-bronto-splitter-adjust'), Number.NaN);
      if (!Number.isFinite(delta) || delta === 0) return;
      event.preventDefault();
      if (isUnavailable(control)) return;
      apply(num(handle.getAttribute('aria-valuenow'), value) + delta);
    };

    handle.addEventListener('keydown', onKeydown);
    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('lostpointercapture', onPointerUp);
    splitter.addEventListener('click', onClick);
    return () => {
      handle.removeEventListener('keydown', onKeydown);
      handle.removeEventListener('pointerdown', onPointerDown);
      handle.removeEventListener('lostpointercapture', onPointerUp);
      splitter.removeEventListener('click', onClick);
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
 * Buttons inside the splitter may set `data-bronto-splitter-adjust="-10"` or
 * `"10"` to provide the required single-pointer, non-drag resize path.
 *
 * Set `data-bronto-splitter-unit="px"` for pixel values and optionally
 * `data-bronto-splitter-step` / `data-bronto-splitter-large-step` for key steps.
 * ARIA bounds and current values are read live so a controlled host can resize
 * its containing viewport or select another pane without stale limits.
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
