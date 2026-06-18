import {
  hasDom,
  resolveHost,
  noop,
  bindOnce,
  nextFieldUid,
  scrollIntoViewSafe,
  wrapIndex,
  collectHosts,
  closestSafe,
} from './internal.js';

const COMBOBOX_OPTION_SELECTOR = '[role="option"], .ui-combobox__option';

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

const inputLabel = (input) =>
  input.getAttribute('aria-label') || input.labels?.[0]?.textContent?.trim();

const inputHasAccessibleName = (input) =>
  input.hasAttribute('aria-label') ||
  input.hasAttribute('aria-labelledby') ||
  !!input.labels?.length ||
  input.hasAttribute('title');

function mirrorListboxLabel(input, list) {
  if (list.hasAttribute('aria-label') || list.hasAttribute('aria-labelledby')) return;
  const name = inputLabel(input);
  if (name) list.setAttribute('aria-label', name);
}

function warnNamelessCombobox(input) {
  if (inputHasAccessibleName(input) || typeof console === 'undefined') return;
  console.warn(
    '[bronto] initCombobox(): the combobox input has no accessible name — add a <label>, aria-label, or aria-labelledby (a placeholder is not enough).',
  );
}

function prepareEmptyState(empty) {
  if (!empty) return;
  empty.hidden = true;
  if (!empty.hasAttribute('role')) empty.setAttribute('role', 'status');
}

function liveOptionObserver(box, list, relist) {
  if (!box.hasAttribute('data-bronto-combobox-live')) return null;
  if (typeof MutationObserver !== 'function') return null;
  const observer = new MutationObserver(relist);
  observer.observe(list, { childList: true, subtree: true });
  return observer;
}

function bindComboboxLifecycle({
  box,
  input,
  list,
  empty,
  rememberState,
  restoreState,
  assignListId,
  syncOptions,
  close,
  relist,
  onInput,
  onKey,
  onOptionClick,
  onDocClick,
  resetActive,
}) {
  const state = rememberState();
  const listId = assignListId();
  syncOptions();
  list.setAttribute('role', 'listbox');
  // Give the listbox its own accessible name (a bare role=listbox is unnamed
  // to a screen reader) by mirroring the input's REAL name. (a11y review C30.)
  // The placeholder is deliberately NOT in this chain: the input warning below
  // already rejects a placeholder as an inadequate name, so papering the
  // listbox over with it would contradict that — if there's no real name the
  // listbox stays unnamed and the warning is the signal. (component audit C28.)
  mirrorListboxLabel(input, list);
  // A `role="combobox"` with no accessible name is a silent AT failure. A
  // placeholder is not a robust name (it can vanish and is ignored by some
  // AT), so warn unless there is a real label/aria-label/aria-labelledby/title
  // (C7). We can't invent a good name, hence a dev-time warning, not a guess.
  warnNamelessCombobox(input);
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-controls', listId);
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('autocomplete', 'off');
  // Hide the empty-state at rest: it must only appear once a filter yields no
  // matches, never on an idle combobox. Without this an author who omits
  // `hidden` on `.ui-combobox__empty` ships a box that reads "No matches"
  // before the user has typed anything. (component audit C10.) Make it a
  // status live region so its appearance is announced. (component audit C38.)
  prepareEmptyState(empty);
  close();
  input.addEventListener('input', onInput);
  input.addEventListener('keydown', onKey);
  list.addEventListener('click', onOptionClick);
  document.addEventListener('click', onDocClick);
  // Opt-in: keep options in sync with a list mutated after init (async /
  // remote results). Off by default so the common static case stays free.
  const observer = liveOptionObserver(box, list, relist);
  return () => {
    observer?.disconnect();
    input.removeEventListener('input', onInput);
    input.removeEventListener('keydown', onKey);
    list.removeEventListener('click', onOptionClick);
    document.removeEventListener('click', onDocClick);
    restoreState(state);
    resetActive();
  };
}

/**
 * Editable combobox with a filtered listbox popup, implementing the
 * WAI-ARIA APG combobox pattern (the widget the framework most lacked
 * and consumers most often build badly). Dependency-free, no
 * positioning library — the list is CSS-anchored under the input.
 *
 * The input MUST have an accessible name — a `<label>`, `aria-label`, or
 * `aria-labelledby` (a placeholder does not count). A nameless `role="combobox"`
 * is a silent screen-reader failure, so the behavior warns at dev time when it
 * finds one, and mirrors the input's name onto the listbox.
 *
 * Markup: `[data-bronto-combobox]` wrapping an `<input role="combobox">`
 * (`.ui-combobox__input`) and a `<ul role="listbox">`
 * (`.ui-combobox__list`) of `<li role="option">` (`.ui-combobox__option`,
 * optional `data-value`). An optional `.ui-combobox__empty` (hidden at rest)
 * shows when nothing matches. The behavior owns ids, `aria-expanded`,
 * `aria-controls`, `aria-activedescendant`, roving active option,
 * type-to-filter, full keyboard (Down/Up/Home/End/Enter/Escape/Tab),
 * pointer select, and outside-click close. On select the **visible input shows
 * the option's text label**, while the emitted `bronto:change` CustomEvent
 * carries the option's `data-value` code: `{ detail: { value, label } }` (value
 * falls back to the label when there is no `data-value`). SSR-safe, idempotent
 * per instance; returns a cleanup function.
 *
 * Single-select APG deviations (intentional, for a filtering text combobox):
 * ArrowDown on a CLOSED list opens + filters rather than pre-activating the
 * first option, and Tab closes the list without committing the merely-highlighted
 * option (only Enter/click commits). Both are safe for single-select.
 *
 * Options are read from the DOM at init; if you replace the listbox contents
 * (e.g. async/remote results), either re-run initCombobox, or add
 * `data-bronto-combobox-live` to the `[data-bronto-combobox]` host so a
 * MutationObserver re-reads the options in place (opt-in — off by default so
 * the common static case stays observer-free).
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initCombobox({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const boxes = collectHosts(host, '[data-bronto-combobox]');
  const cleanups = [];

  for (const box of boxes) {
    const input = box.querySelector('[role="combobox"], .ui-combobox__input');
    const list = box.querySelector('[role="listbox"], .ui-combobox__list');
    if (!input || !list) continue;
    const empty = box.querySelector('.ui-combobox__empty');
    const optionStates = new WeakMap();
    let listId = '';

    const rememberOptionState = (option) => {
      if (optionStates.has(option)) return;
      optionStates.set(option, {
        hidden: option.hidden,
        active: option.classList.contains('is-active'),
        attrs: snapshotAttrs(option, ['id', 'role', 'aria-selected']),
      });
    };

    const rememberState = () => ({
      input: snapshotAttrs(input, [
        'role',
        'aria-controls',
        'aria-autocomplete',
        'aria-expanded',
        'aria-activedescendant',
        'autocomplete',
      ]),
      list: {
        hidden: list.hidden,
        attrs: snapshotAttrs(list, ['id', 'role', 'aria-label']),
      },
      empty: empty
        ? {
            hidden: empty.hidden,
            attrs: snapshotAttrs(empty, ['role']),
          }
        : null,
      options: optionStates,
    });

    const restoreState = (state) => {
      restoreAttrs(input, state.input);
      list.hidden = state.list.hidden;
      restoreAttrs(list, state.list.attrs);
      if (empty && state.empty) {
        empty.hidden = state.empty.hidden;
        restoreAttrs(empty, state.empty.attrs);
      }
      for (const option of options) {
        const optionState = state.options.get(option);
        if (!optionState) continue;
        option.hidden = optionState.hidden;
        option.classList.toggle('is-active', optionState.active);
        restoreAttrs(option, optionState.attrs);
      }
    };

    // Re-readable so the opt-in MutationObserver (`data-bronto-combobox-live`)
    // can pick up async/replaced option nodes without a full re-init. `visible`,
    // `filter`, `move`, etc. close over this binding, so reassigning it is enough.
    let options = [];
    const syncOptions = () => {
      options = [...list.querySelectorAll(COMBOBOX_OPTION_SELECTOR)];
      options.forEach((o, i) => {
        rememberOptionState(o);
        if (!o.id) o.id = `${listId}-opt-${i}`;
        o.setAttribute('role', 'option');
      });
    };

    let active = -1;
    const visible = () => options.filter((o) => !o.hidden);

    const setActive = (opt) => {
      options.forEach((o) => o.classList.remove('is-active'));
      if (opt) {
        opt.classList.add('is-active');
        input.setAttribute('aria-activedescendant', opt.id);
        scrollIntoViewSafe(opt);
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
      // Show the human LABEL in the input; emit the `data-value` CODE in the
      // event. The natural pattern is code in `data-value`, label in the text —
      // putting the code in the visible input silently shows the user a raw code.
      // (component audit C10.)
      const label = opt.textContent.trim();
      const value = opt.dataset.value ?? label;
      input.value = label;
      options.forEach((o) => o.setAttribute('aria-selected', String(o === opt)));
      close();
      input.focus();
      box.dispatchEvent(
        new CustomEvent('bronto:change', {
          detail: { value, label },
          bubbles: true,
        }),
      );
    };

    const move = (delta) => {
      const vis = visible();
      if (!vis.length) return;
      open();
      const next = wrapIndex(vis.indexOf(options[active]), delta, vis.length);
      active = options.indexOf(vis[next]);
      setActive(options[active]);
    };
    const activateEdge = (which) => {
      if (list.hidden) return false;
      const v = visible();
      if (!v.length) return true;
      active = options.indexOf(which === 'first' ? v[0] : v[v.length - 1]);
      setActive(options[active]);
      return true;
    };
    const selectActive = () => {
      if (list.hidden || active < 0 || options[active].hidden) return false;
      select(options[active]);
      return true;
    };
    const closeIfOpen = () => {
      if (list.hidden) return false;
      close();
      return true;
    };

    // Live re-sync after the option nodes change under us. The active option may
    // be gone, so drop it; re-filter against the current input only while open.
    const relist = () => {
      syncOptions();
      active = -1;
      setActive(null);
      if (!list.hidden) filter();
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
          if (activateEdge('first')) e.preventDefault();
          break;
        case 'End':
          if (activateEdge('last')) e.preventDefault();
          break;
        case 'Enter':
          if (selectActive()) e.preventDefault();
          break;
        case 'Escape':
          if (closeIfOpen()) e.preventDefault();
          break;
        case 'Tab':
          close();
          break;
        default:
          break;
      }
    };
    const onOptionClick = (e) => {
      const opt = closestSafe(e.target, COMBOBOX_OPTION_SELECTOR);
      if (opt) select(opt);
    };
    const onDocClick = (e) => {
      if (!box.contains(e.target)) close();
    };
    const assignListId = () => {
      listId = list.id || (list.id = `bronto-cb-list-${nextFieldUid()}`);
      return listId;
    };

    const bound = bindOnce(box, 'combobox', () =>
      bindComboboxLifecycle({
        box,
        input,
        list,
        empty,
        rememberState,
        restoreState,
        assignListId,
        syncOptions,
        close,
        relist,
        onInput,
        onKey,
        onOptionClick,
        onDocClick,
        resetActive: () => {
          active = -1;
        },
      }),
    );
    cleanups.push(bound);
  }

  return () => cleanups.forEach((fn) => fn());
}
