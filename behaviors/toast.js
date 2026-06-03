import { hasDom, noop } from './internal.js';

// The tones that have a `.ui-toast--*` rule. The TS type already unions these,
// but a plain-JS / LLM caller can pass any string — and an unknown tone built a
// `.ui-toast--error` class that matches no CSS, yielding a silent neutral toast.
// Validate so an unknown tone degrades to neutral *and warns*, never lies. (C16)
const TOAST_TONES = new Set(['accent', 'success', 'warning', 'danger', 'info']);

// First-toast deferral queue. The very first toast on a brand-new stack
// is appended next frame so AT observes the empty aria-live region
// before its first child. Any further toasts created *before* that frame
// flushes are queued behind it so call order (FIFO) is preserved instead
// of a synchronous later toast jumping ahead of the deferred first one.
const toastQueue = [];

let toastFlushScheduled = false;

function toastStack(isAssertive) {
  const stackSel = isAssertive
    ? '.ui-toast-stack--assertive'
    : '.ui-toast-stack:not(.ui-toast-stack--assertive)';
  let stack = document.querySelector(stackSel);
  const fresh = !stack;
  if (!stack) {
    stack = document.createElement('div');
    stack.className = isAssertive ? 'ui-toast-stack ui-toast-stack--assertive' : 'ui-toast-stack';
    stack.setAttribute('aria-live', isAssertive ? 'assertive' : 'polite');
    if (isAssertive) stack.setAttribute('role', 'alert');
    document.body.appendChild(stack);
  }
  return { stack, fresh };
}

function enqueueToast(place, freshStack) {
  const canDefer = typeof requestAnimationFrame === 'function';
  if (freshStack && canDefer) {
    toastQueue.push(place);
    toastFlushScheduled = true;
    requestAnimationFrame(() => {
      toastFlushScheduled = false;
      for (const fn of toastQueue.splice(0)) fn();
    });
  } else if (toastFlushScheduled) {
    toastQueue.push(place);
  } else {
    place();
  }
}

function toastElement(message, { tone, title }) {
  const el = document.createElement('div');
  const validTone = tone && TOAST_TONES.has(tone) ? tone : null;
  if (tone && !validTone && typeof console !== 'undefined') {
    console.warn(
      `[bronto] toast(): unknown tone "${tone}" — expected ${[...TOAST_TONES].join('/')}. Rendering neutral.`,
    );
  }
  el.className = validTone ? `ui-toast ui-toast--${validTone}` : 'ui-toast';
  // No per-item role: the stack itself is the live region; a nested
  // live region risks double announcement in some SRs.
  if (title) {
    const t = document.createElement('p');
    t.className = 'ui-toast__title';
    t.textContent = title;
    el.appendChild(t);
  }
  const body = document.createElement('div');
  body.textContent = message;
  el.appendChild(body);
  return el;
}

// Remove a toast, animating its exit when — and only when — a transition
// is actually in effect. Detached nodes, reduced-motion, and the no-CSS
// test/SSR env all resolve to instant removal, so the dismiss contract
// (toast gone now, the aria-live stack stays resident) is unchanged there;
// a real browser with motion gets the CSS `.is-leaving` fade-out, with a
// timeout fallback so an interrupted/never-firing transitionend can't strand
// a toast in the live region.
function removeToast(el) {
  const reduce =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cs =
    !reduce && el.isConnected && typeof getComputedStyle === 'function'
      ? getComputedStyle(el)
      : null;
  const dur = cs ? parseFloat(cs.transitionDuration) || 0 : 0;
  if (dur <= 0) {
    el.remove();
    return;
  }
  el.classList.add('is-leaving');
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    el.remove();
  };
  el.addEventListener('transitionend', finish, { once: true });
  const timer = setTimeout(finish, dur * 1000 + 120);
  timer?.unref?.(); // don't keep a Node test process alive
}

function addToastClose(el, dismiss) {
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'ui-toast__close';
  close.setAttribute('aria-label', 'Dismiss');
  close.addEventListener('click', dismiss);
  el.appendChild(close);
}

/**
 * Push a transient toast into a shared, screen-anchored stack. The stack
 * is the `aria-live="polite"` region: it is created once, appended to
 * <body>, and **kept resident even when empty** so the live region is
 * always present before content is inserted (a freshly created region
 * that receives its first child in the same tick is not reliably
 * announced by VoiceOver/NVDA). On first creation the empty region is
 * inserted and the toast is appended on the next frame for the same
 * reason. `tone` is accent/success/warning/danger/info; `title` is an
 * optional uppercase label; `duration` ms before auto-dismiss (0 keeps
 * it until dismissed). Returns a function that dismisses the toast
 * early. SSR-safe (no-op).
 */
export function toast(message, { tone, title, duration = 4000, assertive, closable } = {}) {
  if (!hasDom()) return noop;
  // Errors must interrupt: danger toasts (or an explicit `assertive`)
  // go to a SEPARATE assertive region so they announce immediately,
  // while status toasts stay polite. Two regions — not a per-item
  // role=alert nested in a polite parent — avoids the double
  // announcement that nesting causes in some screen readers.
  const isAssertive = assertive ?? tone === 'danger';
  const { stack, fresh: freshStack } = toastStack(isAssertive);
  const el = toastElement(message, { tone, title });
  // Append after a frame the *first* time so the empty live region is
  // observed by AT before its first child arrives; once the region has
  // been observed, later toasts append synchronously.
  let dismissed = false;
  // `dismissed` guard: a toast dismissed before its frame (e.g.
  // duration:0 + immediate dismiss) must NOT be resurrected into the
  // persistent aria-live region.
  const place = () => {
    if (!dismissed) stack.appendChild(el);
  };
  enqueueToast(place, freshStack);

  let timer;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    if (timer) clearTimeout(timer);
    removeToast(el);
    // The stack is a persistent live region — never removed on drain, so
    // the next toast does not recreate (and thus mis-announce) it.
  };
  // A sticky toast (duration:0) is unusable without a manual close, so
  // it gets a dismiss affordance by default; any toast can opt in via
  // `closable`. The button carries no text node (glyph is a CSS
  // ::before) so the toast's announced/textContent stays the message.
  if (closable ?? duration === 0) addToastClose(el, dismiss);
  if (duration > 0) timer = setTimeout(dismiss, duration);
  return dismiss;
}
