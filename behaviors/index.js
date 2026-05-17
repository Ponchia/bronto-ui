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

// Module-global so tab ids stay unique across *every* initTabs() call.
// A per-call counter makes separate islands/roots all mint `bronto-tab-1`,
// which collides aria-controls/aria-labelledby across the document.
let tabUid = 0;

// Same rationale for auto-minted form-field / error-slot ids.
let fieldUid = 0;

// First-toast deferral queue. The very first toast on a brand-new stack
// is appended next frame so AT observes the empty aria-live region
// before its first child. Any further toasts created *before* that frame
// flushes are queued behind it so call order (FIFO) is preserved instead
// of a synchronous later toast jumping ahead of the deferred first one.
const toastQueue = [];
let toastFlushScheduled = false;

// Make delegated initializers idempotent. Re-binding the same logical
// listener on the same host/element tears the previous binding down first,
// so double-init (HMR, framework re-mount, repeated calls) never stacks
// duplicate handlers (the "double-toggle" class of bug). The returned
// cleanup removes the single live binding.
const BOUND = Symbol('bronto-bound');
function bindOnce(target, key, add) {
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
  return bindOnce(host, 'dismissible', () => {
    host.addEventListener('click', onClick);
    return () => host.removeEventListener('click', onClick);
  });
}

/**
 * Wire `[data-bronto-tabs]` groups for full keyboard a11y. The framework
 * ships the look + the ARIA/`.is-active` contract; this adds the WAI-ARIA
 * Tabs pattern: roving `tabindex`, `aria-selected`, Arrow/Home/End
 * navigation with automatic activation, and panel `hidden` sync. Tabs are
 * `.ui-tab[data-tab]`; panels are `.ui-tabs__panel[data-panel]` with
 * matching values. SSR-safe and idempotent (re-init replaces, never
 * stacks, the per-group listeners); returns a cleanup function.
 *
 * Accessibility caveat: this is what makes tabs operable. Do **not**
 * author `hidden` on `.ui-tabs__panel` in server-rendered markup unless
 * `initTabs` is guaranteed to run client-side — without it the panels
 * stay hidden with no keyboard/pointer way to reveal them. Prefer
 * authoring all panels visible and letting `initTabs` add `hidden`.
 */
export function initTabs({ root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;
  const cleanups = [];
  // querySelectorAll only matches descendants, so a `root` that *is* a
  // tab group would be skipped — include it explicitly.
  const groups = [];
  if (host !== document && host.matches?.('[data-bronto-tabs]')) groups.push(host);
  groups.push(...host.querySelectorAll('[data-bronto-tabs]'));
  for (const group of groups) {
    // Own group only — a tab/panel inside a nested [data-bronto-tabs]
    // belongs to that inner group, not this one.
    const owned = (el) => el.closest('[data-bronto-tabs]') === group;
    const tabs = [...group.querySelectorAll('.ui-tab')].filter(owned);
    const panels = [...group.querySelectorAll('.ui-tabs__panel')].filter(owned);
    if (!tabs.length) continue;
    const list = group.querySelector('.ui-tabs__list');
    if (list) list.setAttribute('role', 'tablist');

    // APG: bind each tab to its panel (aria-controls) and back
    // (aria-labelledby), minting stable ids only where absent.
    for (const t of tabs) {
      const p = panels.find((x) => x.dataset.panel === t.dataset.tab);
      if (!p) continue;
      const n = ++tabUid;
      if (!t.id) t.id = `bronto-tab-${n}`;
      if (!p.id) p.id = `bronto-tabpanel-${n}`;
      t.setAttribute('aria-controls', p.id);
      p.setAttribute('aria-labelledby', t.id);
    }

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
      // `tabs` is filtered to this group, so membership (not mere DOM
      // containment) is what isolates nested [data-bronto-tabs] groups.
      const tab = e.target.closest('.ui-tab');
      if (tab && tabs.includes(tab)) {
        select(tab);
        tab.focus();
      }
    };
    const onKey = (e) => {
      const i = tabs.indexOf(e.target.closest('.ui-tab'));
      if (i < 0) return;
      let n = i;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
        n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      else return;
      e.preventDefault();
      select(tabs[n]);
      tabs[n].focus();
    };
    select(tabs.find((t) => t.classList.contains('is-active')) || tabs[0]);
    cleanups.push(
      bindOnce(group, 'tabs', () => {
        group.addEventListener('click', onClick);
        group.addEventListener('keydown', onKey);
        return () => {
          group.removeEventListener('click', onClick);
          group.removeEventListener('keydown', onKey);
        };
      }),
    );
  }
  return () => cleanups.forEach((fn) => fn());
}

/**
 * Wire native <dialog> open/close glue (the one bit <dialog> can't do
 * declaratively). Click `[data-bronto-open="dialogId"]` calls
 * `showModal()` on `#dialogId`; click `[data-bronto-close]` closes the
 * nearest enclosing <dialog>. Clicking the backdrop of a dialog that has
 * `[data-bronto-dialog-light]` closes it too. On open the trigger is
 * remembered and focus is returned to it on *every* close path (Esc,
 * close button, backdrop light-dismiss, programmatic) via the native
 * `close` event, so keyboard/SR users are never dropped at `<body>`.
 * SSR-safe and idempotent; returns cleanup.
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
      if (dlg && typeof dlg.showModal === 'function' && !dlg.open) {
        dlg.addEventListener(
          'close',
          () => {
            if (opener.isConnected && typeof opener.focus === 'function') opener.focus();
          },
          { once: true },
        );
        dlg.showModal();
      }
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
  return bindOnce(host, 'dialog', () => {
    host.addEventListener('click', onClick);
    return () => host.removeEventListener('click', onClick);
  });
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
  const stackSel = isAssertive
    ? '.ui-toast-stack--assertive'
    : '.ui-toast-stack:not(.ui-toast-stack--assertive)';
  let stack = document.querySelector(stackSel);
  const freshStack = !stack;
  if (!stack) {
    stack = document.createElement('div');
    stack.className = isAssertive ? 'ui-toast-stack ui-toast-stack--assertive' : 'ui-toast-stack';
    stack.setAttribute('aria-live', isAssertive ? 'assertive' : 'polite');
    if (isAssertive) stack.setAttribute('role', 'alert');
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = tone ? `ui-toast ui-toast--${tone}` : 'ui-toast';
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
  const canDefer = typeof requestAnimationFrame === 'function';
  if (freshStack && canDefer) {
    toastQueue.push(place);
    toastFlushScheduled = true;
    requestAnimationFrame(() => {
      toastFlushScheduled = false;
      for (const fn of toastQueue.splice(0)) fn();
    });
  } else if (toastFlushScheduled) {
    // A first-frame deferral is in flight — queue behind it so FIFO
    // order holds and the region still isn't populated synchronously.
    toastQueue.push(place);
  } else {
    place();
  }

  let timer;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    if (timer) clearTimeout(timer);
    el.remove();
    // The stack is a persistent live region — never removed on drain, so
    // the next toast does not recreate (and thus mis-announce) it.
  };
  // A sticky toast (duration:0) is unusable without a manual close, so
  // it gets a dismiss affordance by default; any toast can opt in via
  // `closable`. The button carries no text node (glyph is a CSS
  // ::before) so the toast's announced/textContent stays the message.
  if (closable ?? duration === 0) {
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'ui-toast__close';
    close.setAttribute('aria-label', 'Dismiss');
    close.addEventListener('click', dismiss);
    el.appendChild(close);
  }
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
  return bindOnce(host, 'disclosure', () => {
    host.addEventListener('click', onClick);
    return () => host.removeEventListener('click', onClick);
  });
}

/**
 * Dropdown-menu close affordances for a native `<details data-bronto-menu>`
 * holding a `.ui-menu`. `<details>` alone won't close on Escape, on an
 * outside click, or when a `.ui-menu__item` is activated — this adds
 * exactly those, returning focus to the `<summary>` on Esc/activate.
 *
 * Deliberately NOT a full WAI-ARIA menu (no arrow-key roving): the items
 * are real buttons, Tab-reachable; this is a disclosure of actions, and
 * over-claiming `role="menu"` semantics would be worse. SSR-safe,
 * idempotent; returns a cleanup function.
 */
export function initMenu({ root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;
  const openMenus = () => host.querySelectorAll?.('[data-bronto-menu][open]') ?? [];
  const shut = (menu) => {
    if (!menu || !menu.open) return;
    menu.open = false;
    menu.querySelector('summary')?.focus();
  };
  const onClick = (e) => {
    const menu = e.target.closest('[data-bronto-menu]');
    // Activate an item → close its menu (and return focus to summary).
    if (menu && e.target.closest('.ui-menu__item')) {
      shut(menu);
      return;
    }
    // Click outside any open menu → close them all (no focus move).
    for (const m of openMenus()) if (!m.contains(e.target)) m.open = false;
  };
  const onKey = (e) => {
    if (e.key !== 'Escape') return;
    const menu = e.target.closest?.('[data-bronto-menu][open]') || openMenus()[0];
    shut(menu);
  };
  return bindOnce(host, 'menu', () => {
    host.addEventListener('click', onClick);
    host.addEventListener('keydown', onKey);
    return () => {
      host.removeEventListener('click', onClick);
      host.removeEventListener('keydown', onKey);
    };
  });
}

/**
 * Accessible form validation glue for `<form data-bronto-validate>`.
 * Progressive enhancement over the native Constraint Validation API —
 * the framework already ships the `[aria-invalid]` / `.ui-hint--error`
 * styling; this wires the a11y plumbing every consumer would otherwise
 * re-implement (and usually get wrong):
 *
 *  - suppresses the native error bubbles (`form.noValidate`),
 *  - on blur and on submit sets `aria-invalid` and writes the browser's
 *    `validationMessage` into the field's error slot
 *    (`[data-bronto-error]` inside the `.ui-field`, falling back to a
 *    `.ui-hint`), linked via `aria-describedby`,
 *  - on an invalid submit, fills the form's
 *    `[data-bronto-error-summary]` (a `.ui-error-summary`) with
 *    in-page links to each bad field, focuses it, and blocks submit.
 *
 * Pure enhancement: with JS off the form still submits and the browser
 * validates natively. SSR-safe, idempotent; returns a cleanup function.
 */
export function initFormValidation({ root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;

  const ensureId = (el, prefix) => {
    if (!el.id) el.id = `${prefix}-${++fieldUid}`;
    return el.id;
  };

  const slotFor = (control) => {
    const field = control.closest('.ui-field');
    if (!field) return null;
    return field.querySelector('[data-bronto-error]') || field.querySelector('.ui-hint');
  };

  const link = (control, slot) => {
    const slotId = ensureId(slot, 'bronto-err');
    const ids = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (!ids.includes(slotId)) {
      ids.push(slotId);
      control.setAttribute('aria-describedby', ids.join(' '));
    }
  };

  const validateField = (control) => {
    if (!control.willValidate) return true;
    const ok = control.validity.valid;
    const slot = slotFor(control);
    if (ok) {
      control.removeAttribute('aria-invalid');
      if (slot) {
        slot.textContent = '';
        if (slot.classList.contains('ui-hint')) slot.classList.remove('ui-hint--error');
      }
    } else {
      control.setAttribute('aria-invalid', 'true');
      if (slot) {
        slot.textContent = control.validationMessage;
        if (slot.classList.contains('ui-hint')) slot.classList.add('ui-hint--error');
        link(control, slot);
      }
    }
    return ok;
  };

  const controlsOf = (form) =>
    [...form.elements].filter(
      (el) => el.willValidate && el.type !== 'submit' && el.type !== 'button',
    );

  const refreshSummary = (form, invalid) => {
    const summary = form.querySelector('[data-bronto-error-summary]');
    if (!summary) return;
    if (!invalid.length) {
      summary.hidden = true;
      summary.replaceChildren();
      return;
    }
    const title = document.createElement('p');
    title.className = 'ui-error-summary__title';
    title.textContent = 'There is a problem';
    const list = document.createElement('ul');
    list.className = 'ui-error-summary__list';
    for (const c of invalid) {
      const id = ensureId(c, 'bronto-field');
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${id}`;
      a.textContent = c.validationMessage;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        c.focus();
      });
      li.appendChild(a);
      list.appendChild(li);
    }
    summary.replaceChildren(title, list);
    summary.setAttribute('role', 'alert');
    summary.tabIndex = -1;
    summary.hidden = false;
  };

  const onSubmit = (e) => {
    const form = e.target.closest?.('[data-bronto-validate]');
    if (!form) return;
    form.noValidate = true;
    const invalid = controlsOf(form).filter((c) => !validateField(c));
    refreshSummary(form, invalid);
    if (invalid.length) {
      e.preventDefault();
      const summary = form.querySelector('[data-bronto-error-summary]');
      (summary && !summary.hidden ? summary : invalid[0]).focus();
    }
  };

  const onBlur = (e) => {
    const control = e.target;
    if (!control.willValidate) return;
    const form = control.closest?.('[data-bronto-validate]');
    if (!form) return;
    form.noValidate = true;
    validateField(control);
    const summary = form.querySelector('[data-bronto-error-summary]');
    if (summary && !summary.hidden)
      refreshSummary(
        form,
        controlsOf(form).filter((c) => !c.validity.valid),
      );
  };

  return bindOnce(host, 'formValidation', () => {
    // Suppress native bubbles UP FRONT for forms present at init. The
    // in-handler `noValidate = true` only fires after the first
    // submit/blur, so the very first invalid real-browser submit would
    // otherwise show the native UA bubble instead of the Bronto
    // summary — contradicting the documented contract. (Forms added
    // after init are still covered by the in-handler set.)
    // Feature-detect rather than `instanceof Element` — `Element` is not
    // a guaranteed global (SSR / the no-DOM test env), and `host` is
    // either `document` (no `.matches`) or a root Element.
    const selfForm =
      typeof host.matches === 'function' && host.matches('[data-bronto-validate]') ? [host] : [];
    const forms = [...selfForm, ...(host.querySelectorAll?.('[data-bronto-validate]') ?? [])];
    const priorNoValidate = new Map();
    for (const f of forms) {
      priorNoValidate.set(f, f.noValidate);
      f.noValidate = true;
    }
    host.addEventListener('submit', onSubmit, true);
    host.addEventListener('focusout', onBlur);
    return () => {
      host.removeEventListener('submit', onSubmit, true);
      host.removeEventListener('focusout', onBlur);
      for (const [f, v] of priorNoValidate) f.noValidate = v;
    };
  });
}

/**
 * Editable combobox with a filtered listbox popup, implementing the
 * WAI-ARIA APG combobox pattern (the widget the framework most lacked
 * and consumers most often build badly). Dependency-free, no
 * positioning library — the list is CSS-anchored under the input.
 *
 * Markup: `[data-bronto-combobox]` wrapping an `<input role="combobox">`
 * (`.ui-combobox__input`) and a `<ul role="listbox">`
 * (`.ui-combobox__list`) of `<li role="option">` (`.ui-combobox__option`,
 * optional `data-value`). An optional `.ui-combobox__empty` shows when
 * nothing matches. The behavior owns ids, `aria-expanded`,
 * `aria-controls`, `aria-activedescendant`, roving active option,
 * type-to-filter, full keyboard (Down/Up/Home/End/Enter/Escape/Tab),
 * pointer select, and outside-click close; it emits a `bronto:change`
 * CustomEvent ({ detail: { value } }) on selection. SSR-safe,
 * idempotent per instance; returns a cleanup function.
 */
export function initCombobox({ root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;
  const boxes = [];
  if (host !== document && host.matches?.('[data-bronto-combobox]')) boxes.push(host);
  boxes.push(...(host.querySelectorAll?.('[data-bronto-combobox]') ?? []));
  const cleanups = [];

  for (const box of boxes) {
    const input = box.querySelector('[role="combobox"], .ui-combobox__input');
    const list = box.querySelector('[role="listbox"], .ui-combobox__list');
    if (!input || !list) continue;
    const empty = box.querySelector('.ui-combobox__empty');
    const options = [...list.querySelectorAll('[role="option"], .ui-combobox__option')];

    const listId = list.id || (list.id = `bronto-cb-list-${++fieldUid}`);
    options.forEach((o, i) => {
      if (!o.id) o.id = `${listId}-opt-${i}`;
      o.setAttribute('role', 'option');
    });
    list.setAttribute('role', 'listbox');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-controls', listId);
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('autocomplete', 'off');
    list.hidden = true;

    let active = -1;
    const visible = () => options.filter((o) => !o.hidden);

    const setActive = (opt) => {
      options.forEach((o) => o.classList.remove('is-active'));
      if (opt) {
        opt.classList.add('is-active');
        input.setAttribute('aria-activedescendant', opt.id);
        // jsdom's scrollIntoView throws "Not implemented"; it is a
        // pure affordance, so never let it break keyboard nav.
        try {
          opt.scrollIntoView({ block: 'nearest' });
        } catch {
          /* non-DOM/headless environment — ignore */
        }
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    };

    const open = () => {
      if (!list.hidden) return;
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      active = -1;
      setActive(null);
    };

    const filter = () => {
      const q = input.value.trim().toLowerCase();
      let any = false;
      for (const o of options) {
        const match = !q || o.textContent.toLowerCase().includes(q);
        o.hidden = !match;
        if (match) any = true;
      }
      if (empty) empty.hidden = any;
      // The active option may have just been filtered out — drop the
      // stale activedescendant so Enter can't select a hidden option.
      if (active >= 0 && options[active]?.hidden) {
        active = -1;
        setActive(null);
      }
      open();
    };

    const select = (opt) => {
      input.value = opt.dataset.value ?? opt.textContent.trim();
      options.forEach((o) => o.setAttribute('aria-selected', String(o === opt)));
      close();
      input.focus();
      box.dispatchEvent(
        new CustomEvent('bronto:change', {
          detail: { value: input.value },
          bubbles: true,
        }),
      );
    };

    const move = (delta) => {
      const vis = visible();
      if (!vis.length) return;
      open();
      const curIdx = vis.indexOf(options[active]);
      let next = curIdx + delta;
      if (next < 0) next = vis.length - 1;
      if (next >= vis.length) next = 0;
      active = options.indexOf(vis[next]);
      setActive(options[active]);
    };

    const onInput = () => filter();
    const onKey = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          list.hidden ? filter() : move(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          move(-1);
          break;
        case 'Home':
          if (!list.hidden) {
            e.preventDefault();
            const v = visible();
            if (v.length) {
              active = options.indexOf(v[0]);
              setActive(options[active]);
            }
          }
          break;
        case 'End':
          if (!list.hidden) {
            e.preventDefault();
            const v = visible();
            if (v.length) {
              active = options.indexOf(v[v.length - 1]);
              setActive(options[active]);
            }
          }
          break;
        case 'Enter':
          if (!list.hidden && active >= 0 && !options[active].hidden) {
            e.preventDefault();
            select(options[active]);
          }
          break;
        case 'Escape':
          if (!list.hidden) {
            e.preventDefault();
            close();
          }
          break;
        case 'Tab':
          close();
          break;
        default:
          break;
      }
    };
    const onOptionClick = (e) => {
      const opt = e.target.closest('[role="option"], .ui-combobox__option');
      if (opt) select(opt);
    };
    const onDocClick = (e) => {
      if (!box.contains(e.target)) close();
    };

    const bound = bindOnce(box, 'combobox', () => {
      input.addEventListener('input', onInput);
      input.addEventListener('keydown', onKey);
      list.addEventListener('click', onOptionClick);
      document.addEventListener('click', onDocClick);
      return () => {
        input.removeEventListener('input', onInput);
        input.removeEventListener('keydown', onKey);
        list.removeEventListener('click', onOptionClick);
        document.removeEventListener('click', onDocClick);
      };
    });
    cleanups.push(bound);
  }

  return () => cleanups.forEach((fn) => fn());
}

/**
 * Collision-aware popover, dependency-free. A `[data-bronto-popover]`
 * trigger toggles the `.ui-popover` panel whose id it names. The panel
 * is placed under the trigger and **flips above** when it would
 * overflow the viewport, with its inline edge clamped on-screen — the
 * thing the CSS-only tooltip can't do near edges / inside scroll
 * containers. If the panel has the native `popover` attribute and the
 * Popover API is available it is shown in the top layer (never
 * clipped); otherwise an `.is-open` class is toggled. Manages
 * `aria-expanded` / `aria-controls`, closes on Escape and outside
 * click, and re-positions on scroll/resize while open. SSR-safe,
 * idempotent; returns a cleanup function.
 */
export function initPopover({ root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;
  const view = document.defaultView;
  const GAP = 8;
  let openPanel = null;
  let openTrigger = null;

  const place = (trigger, panel) => {
    const r = trigger.getBoundingClientRect();
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;
    const vw = view?.innerWidth ?? 0;
    const vh = view?.innerHeight ?? 0;
    let top = r.bottom + GAP;
    if (top + ph > vh && r.top - GAP - ph >= 0) top = r.top - GAP - ph;
    let left = r.left;
    if (vw) left = Math.max(GAP, Math.min(left, vw - pw - GAP));
    panel.style.top = `${Math.max(GAP, top)}px`;
    panel.style.left = `${left}px`;
  };

  const close = () => {
    if (!openPanel) return;
    const panel = openPanel;
    const trigger = openTrigger;
    openPanel = openTrigger = null;
    if (panel.hasAttribute('popover') && typeof panel.hidePopover === 'function') {
      try {
        panel.hidePopover();
      } catch {
        /* already hidden */
      }
    } else {
      panel.classList.remove('is-open');
    }
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  };

  const open = (trigger, panel) => {
    close();
    trigger.setAttribute('aria-controls', panel.id);
    trigger.setAttribute('aria-expanded', 'true');
    if (panel.hasAttribute('popover') && typeof panel.showPopover === 'function') {
      try {
        panel.showPopover();
      } catch {
        panel.classList.add('is-open');
      }
    } else {
      panel.classList.add('is-open');
    }
    openPanel = panel;
    openTrigger = trigger;
    place(trigger, panel);
  };

  const onClick = (e) => {
    const trigger = e.target.closest?.('[data-bronto-popover]');
    if (trigger) {
      const panel = document.getElementById(trigger.getAttribute('data-bronto-popover'));
      if (!panel) return;
      e.preventDefault();
      if (openPanel === panel) close();
      else open(trigger, panel);
      return;
    }
    if (openPanel && !openPanel.contains(e.target)) close();
  };
  const onKey = (e) => {
    if (e.key === 'Escape' && openPanel) {
      const t = openTrigger;
      close();
      t?.focus?.();
    }
  };
  const onReflow = () => {
    if (openPanel && openTrigger) place(openTrigger, openPanel);
  };

  return bindOnce(host, 'popover', () => {
    host.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    view?.addEventListener('scroll', onReflow, true);
    view?.addEventListener('resize', onReflow);
    return () => {
      host.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      view?.removeEventListener('scroll', onReflow, true);
      view?.removeEventListener('resize', onReflow);
    };
  });
}

/**
 * Client-side sortable + selectable data table. Wires
 * `[data-bronto-sortable]`:
 *
 *  - clicking a header's `.ui-table__sort` (or a `th[data-sort]`)
 *    sorts the tbody by that column, cycling `aria-sort`
 *    none → ascending → descending and clearing the other headers.
 *    Numeric columns (`data-sort="num"` or `.is-num` cells) sort
 *    numerically; everything else, locale string compare.
 *  - a `[data-bronto-select-all]` checkbox toggles every
 *    `[data-bronto-select]` row checkbox and the rows'
 *    `aria-selected`; toggling a row keeps the header checkbox's
 *    checked/indeterminate state in sync. Emits `bronto:selectionchange`
 *    ({ detail: { count } }) on the table.
 *
 * SSR-safe, idempotent per table; returns a cleanup function.
 */
export function initTableSort({ root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;
  const tables = [];
  if (host !== document && host.matches?.('[data-bronto-sortable]')) tables.push(host);
  tables.push(...(host.querySelectorAll?.('[data-bronto-sortable]') ?? []));
  const cleanups = [];

  for (const table of tables) {
    const tbody = table.tBodies[0];
    if (!tbody) continue;

    const colIndex = (th) => [...th.parentElement.children].indexOf(th);
    const cellText = (row, i) => row.children[i]?.textContent.trim() ?? '';

    const sortBy = (th, numeric) => {
      const headers = th.closest('tr').querySelectorAll('th');
      const dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
      headers.forEach((h) => h.removeAttribute('aria-sort'));
      th.setAttribute('aria-sort', dir);
      const i = colIndex(th);
      const sign = dir === 'ascending' ? 1 : -1;
      const rows = [...tbody.rows].filter((r) => !r.classList.contains('ui-table__empty'));
      rows.sort((a, b) => {
        const x = cellText(a, i);
        const y = cellText(b, i);
        const cmp = numeric
          ? (parseFloat(x.replace(/[^\d.-]/g, '')) || 0) -
            (parseFloat(y.replace(/[^\d.-]/g, '')) || 0)
          : x.localeCompare(y);
        return cmp * sign;
      });
      rows.forEach((r) => tbody.appendChild(r));
    };

    const allBox = table.querySelector('[data-bronto-select-all]');
    const rowBoxes = () => [...table.querySelectorAll('[data-bronto-select]')];
    const syncAll = () => {
      const boxes = rowBoxes();
      const on = boxes.filter((b) => b.checked).length;
      if (allBox) {
        allBox.checked = on > 0 && on === boxes.length;
        allBox.indeterminate = on > 0 && on < boxes.length;
      }
      table.dispatchEvent(
        new CustomEvent('bronto:selectionchange', { detail: { count: on }, bubbles: true }),
      );
    };
    const markRow = (box) => {
      const tr = box.closest('tr');
      if (tr) tr.setAttribute('aria-selected', String(box.checked));
    };

    const onClick = (e) => {
      const sorter = e.target.closest('.ui-table__sort, th[data-sort]');
      if (sorter && table.contains(sorter)) {
        const th = sorter.closest('th');
        const numeric =
          (sorter.getAttribute('data-sort') || th.getAttribute('data-sort')) === 'num' ||
          th.classList.contains('is-num');
        sortBy(th, numeric);
      }
    };
    const onChange = (e) => {
      const t = e.target;
      if (t.matches?.('[data-bronto-select-all]')) {
        rowBoxes().forEach((b) => {
          b.checked = t.checked;
          markRow(b);
        });
        syncAll();
      } else if (t.matches?.('[data-bronto-select]')) {
        markRow(t);
        syncAll();
      }
    };

    const bound = bindOnce(table, 'tableSort', () => {
      table.addEventListener('click', onClick);
      table.addEventListener('change', onChange);
      return () => {
        table.removeEventListener('click', onClick);
        table.removeEventListener('change', onChange);
      };
    });
    cleanups.push(bound);
  }

  return () => cleanups.forEach((fn) => fn());
}
