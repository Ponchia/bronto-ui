import {
  hasDom,
  resolveHost,
  noop,
  bindOnce,
  nextFieldUid,
  scrollIntoViewSafe,
  wrapIndex,
  collectHosts,
} from './internal.js';

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
 * optional `data-value`). An optional `.ui-combobox__empty` shows when
 * nothing matches. The behavior owns ids, `aria-expanded`,
 * `aria-controls`, `aria-activedescendant`, roving active option,
 * type-to-filter, full keyboard (Down/Up/Home/End/Enter/Escape/Tab),
 * pointer select, and outside-click close; it emits a `bronto:change`
 * CustomEvent ({ detail: { value } }) on selection. SSR-safe,
 * idempotent per instance; returns a cleanup function.
 *
 * Options are read from the DOM at init; if you replace the listbox contents
 * (e.g. async/remote results) without re-initialising, filtering and keyboard
 * nav act on the stale nodes — re-run initCombobox after mutating the options.
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
    const options = [...list.querySelectorAll('[role="option"], .ui-combobox__option')];

    const listId = list.id || (list.id = `bronto-cb-list-${nextFieldUid()}`);
    options.forEach((o, i) => {
      if (!o.id) o.id = `${listId}-opt-${i}`;
      o.setAttribute('role', 'option');
    });
    list.setAttribute('role', 'listbox');
    // Give the listbox its own accessible name (a bare role=listbox is unnamed
    // to a screen reader) by mirroring the input's name. (a11y review C30.)
    if (!list.hasAttribute('aria-label') && !list.hasAttribute('aria-labelledby')) {
      const name =
        input.getAttribute('aria-label') ||
        input.labels?.[0]?.textContent?.trim() ||
        input.getAttribute('placeholder');
      if (name) list.setAttribute('aria-label', name);
    }
    // A `role="combobox"` with no accessible name is a silent AT failure. A
    // placeholder is not a robust name (it can vanish and is ignored by some
    // AT), so warn unless there is a real label/aria-label/aria-labelledby/title
    // (C7). We can't invent a good name, hence a dev-time warning, not a guess.
    const inputNamed =
      input.hasAttribute('aria-label') ||
      input.hasAttribute('aria-labelledby') ||
      !!input.labels?.length ||
      input.hasAttribute('title');
    if (!inputNamed && typeof console !== 'undefined') {
      console.warn(
        '[bronto] initCombobox(): the combobox input has no accessible name — add a <label>, aria-label, or aria-labelledby (a placeholder is not enough).',
      );
    }
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
