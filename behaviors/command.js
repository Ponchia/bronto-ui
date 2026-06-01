import { hasDom, noop, bindOnce, nextFieldUid } from './internal.js';

/**
 * Command palette — filter + keyboard-navigate a DOM-authored command list.
 * The CSS shell (`.ui-command`) is opt-in; this wires the listbox behavior the
 * shell needs. Bronto filters and navigates; the HOST owns the action registry,
 * permission checks, routing, async effects, and command execution (it listens
 * for `bronto:command:select`). There is no global Cmd/Ctrl+K — open the palette
 * yourself (e.g. a `<dialog>` via `initDialog`).
 *
 * Markup: `[data-bronto-command]` wrapping an `<input>` (`.ui-command__input`)
 * and a list (`.ui-command__list`) of `.ui-command__item` rows (optional
 * `data-value`), interleaved with `.ui-command__group` labels and an optional
 * `.ui-command__empty`. The behavior owns ids, `role=combobox/listbox/option`,
 * `aria-activedescendant`, a roving active item, substring filtering (hiding
 * empty groups), full keyboard (Down/Up/Home/End/Enter/Escape), and pointer
 * select. It emits `bronto:command:select` ({ detail: { value, label } }) on
 * choose and `bronto:command:close` on Escape. SSR-safe, idempotent per
 * instance; returns a cleanup function.
 */
export function initCommand({ root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;
  const palettes = [];
  if (host !== document && host.matches?.('[data-bronto-command]')) palettes.push(host);
  palettes.push(...(host.querySelectorAll?.('[data-bronto-command]') ?? []));
  const cleanups = [];

  for (const box of palettes) {
    const input = box.querySelector('.ui-command__input, input');
    const list = box.querySelector('.ui-command__list, [role="listbox"]');
    if (!input || !list) continue;
    const empty = box.querySelector('.ui-command__empty');
    const items = [...list.querySelectorAll('.ui-command__item, [role="option"]')];
    const groups = [...list.querySelectorAll('.ui-command__group')];

    const listId = list.id || (list.id = `bronto-cmd-${nextFieldUid()}`);
    items.forEach((it, i) => {
      if (!it.id) it.id = `${listId}-opt-${i}`;
      it.setAttribute('role', 'option');
    });
    groups.forEach((g) => g.setAttribute('role', 'presentation'));
    list.setAttribute('role', 'listbox');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-controls', listId);
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('autocomplete', 'off');

    let active = -1;
    const visible = () => items.filter((it) => !it.hidden);

    const setActive = (item) => {
      items.forEach((it) => {
        it.classList.toggle('is-active', it === item);
        it.setAttribute('aria-selected', String(it === item));
      });
      if (item) {
        active = items.indexOf(item);
        input.setAttribute('aria-activedescendant', item.id);
        try {
          item.scrollIntoView({ block: 'nearest' });
        } catch {
          /* headless — scrollIntoView is a pure affordance */
        }
      } else {
        active = -1;
        input.removeAttribute('aria-activedescendant');
      }
    };

    // Hide a group whose items are all filtered out.
    const syncGroups = () => {
      for (const g of groups) {
        let any = false;
        for (
          let n = g.nextElementSibling;
          n && !n.matches('.ui-command__group');
          n = n.nextElementSibling
        ) {
          if (n.matches('.ui-command__item, [role="option"]') && !n.hidden) any = true;
        }
        g.hidden = !any;
      }
    };

    const filter = () => {
      const q = input.value.trim().toLowerCase();
      let any = false;
      for (const it of items) {
        const match = !q || it.textContent.toLowerCase().includes(q);
        it.hidden = !match;
        if (match) any = true;
      }
      syncGroups();
      if (empty) empty.hidden = any;
      const vis = visible();
      setActive(vis[0] || null);
    };

    const move = (delta) => {
      const vis = visible();
      if (!vis.length) return;
      const cur = vis.indexOf(items[active]);
      let next = cur + delta;
      if (next < 0) next = vis.length - 1;
      if (next >= vis.length) next = 0;
      setActive(vis[next]);
    };

    const choose = (item) => {
      if (!item || item.hidden) return;
      // Label = the command name only — strip the shortcut/meta hints so the
      // host doesn't get "Open settings G S".
      const clone = item.cloneNode(true);
      clone.querySelectorAll('.ui-command__shortcut, .ui-command__meta').forEach((n) => n.remove());
      const label = clone.textContent.replace(/\s+/g, ' ').trim();
      box.dispatchEvent(
        new CustomEvent('bronto:command:select', {
          detail: { value: item.dataset.value ?? label, label },
          bubbles: true,
        }),
      );
    };

    const onInput = () => filter();
    const onKey = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          move(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          move(-1);
          break;
        case 'Home': {
          const v = visible();
          if (v.length) {
            setActive(v[0]);
            e.preventDefault();
          }
          break;
        }
        case 'End': {
          const v = visible();
          if (v.length) {
            setActive(v[v.length - 1]);
            e.preventDefault();
          }
          break;
        }
        case 'Enter':
          if (active >= 0 && !items[active].hidden) {
            choose(items[active]);
            e.preventDefault();
          }
          break;
        case 'Escape':
          box.dispatchEvent(new CustomEvent('bronto:command:close', { bubbles: true }));
          break;
        default:
          break;
      }
    };
    const onClick = (e) => {
      const item = e.target.closest('.ui-command__item, [role="option"]');
      if (item && list.contains(item)) choose(item);
    };

    const bound = bindOnce(box, 'command', () => {
      input.addEventListener('input', onInput);
      input.addEventListener('keydown', onKey);
      list.addEventListener('click', onClick);
      return () => {
        input.removeEventListener('input', onInput);
        input.removeEventListener('keydown', onKey);
        list.removeEventListener('click', onClick);
      };
    });
    // Seed the initial active item (first visible).
    filter();
    cleanups.push(bound);
  }

  return () => cleanups.forEach((fn) => fn());
}
