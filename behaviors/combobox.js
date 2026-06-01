import { hasDom, noop, bindOnce, nextFieldUid } from './internal.js';

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

    const listId = list.id || (list.id = `bronto-cb-list-${nextFieldUid()}`);
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
