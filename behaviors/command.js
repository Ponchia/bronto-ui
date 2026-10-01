import {
  hasDom,
  resolveHost,
  noop,
  bindOnce,
  nextFieldUid,
  collectHosts,
  scrollIntoViewSafe,
  wrapIndex,
  closestSafe,
} from './internal.js';

const localeOf = (el) => {
  const locale =
    closestSafe(el, '[lang]')?.getAttribute('lang')?.trim() ||
    el?.ownerDocument?.documentElement?.getAttribute('lang')?.trim();
  return locale || undefined;
};

const lowerForSearch = (value, locale) => {
  const text = String(value ?? '');
  if (!locale) return text.toLowerCase();
  try {
    return text.toLocaleLowerCase(locale);
  } catch {
    return text.toLowerCase();
  }
};

/**
 * @typedef {object} CommandSelectDetail
 * @property {string} value The chosen command's value.
 * @property {string} label The chosen command's visible label.
 */

/**
 * @typedef {object} CommandOpts
 * @property {Document | Element | null} [root]
 *   Event-delegation root; also scopes which palettes are queried. Default: `document`.
 *   `null` means a scope was requested but is not ready yet, so the behavior no-ops.
 * @property {(item: HTMLElement, query: string) => boolean} [match]
 *   Decides whether an item stays visible for a query. `query` is the trimmed
 *   input, lower-cased in the palette's locale; an empty query shows every item.
 *   Default: the item's text contains the query. Use it to match on keywords
 *   (`data-keywords`, say) or to keep a row such as "Search everything" visible
 *   for every query. Not called in headless mode.
 * @property {boolean} [headless]
 *   The host renders the result set. Bronto never hides an item or group; it
 *   reads the list live, so the host can replace rows on every keystroke
 *   without re-running `initCommand`. It still owns ids, roles, the roving
 *   active item, the keyboard, pointer select and the empty state's live
 *   region. After the query changes, the first row the host renders becomes
 *   active.
 */

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
 * `aria-activedescendant`, a roving active item, filtering (substring by
 * default, `match` to replace it, hiding empty groups), keyboard list
 * navigation (Down/Up/Enter/Escape), and pointer select. It emits
 * `bronto:command:select` ({ detail: { value, label } }) on choose and
 * `bronto:command:close` on Escape. SSR-safe, idempotent per instance; returns
 * a cleanup function.
 *
 * Items are read from the DOM at init; re-run initCommand after replacing the
 * command list so filtering/navigation see the current nodes — or pass
 * `headless: true` and render the results yourself.
 *
 * @param {CommandOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initCommand({ root, match, headless = false } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const palettes = collectHosts(host, '[data-bronto-command]');
  const cleanups = [];
  const ITEM = '.ui-command__item, [role="option"]';

  const firstTextNode = (el) => {
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.nodeValue.trim()) return node;
      if (node.nodeType === 1) {
        const child = firstTextNode(node);
        if (child) return child;
      }
    }
    return null;
  };

  const refreshLiveText = (el) => {
    const node = firstTextNode(el);
    if (!node) return;
    const text = node.nodeValue;
    node.nodeValue = '';
    node.nodeValue = text;
  };

  for (const box of palettes) {
    const input = box.querySelector('.ui-command__input, input');
    const list = box.querySelector('.ui-command__list, [role="listbox"]');
    if (!input || !list) continue;
    const locale = localeOf(box);
    const initialItems = [...list.querySelectorAll(ITEM)];
    const initialGroups = [...list.querySelectorAll('.ui-command__group')];
    // Headless reads the host's current rows; otherwise the rows at init.
    const itemsNow = () => (headless ? [...list.querySelectorAll(ITEM)] : initialItems);
    const groupsNow = () =>
      headless ? [...list.querySelectorAll('.ui-command__group')] : initialGroups;
    const emptyNow = () => box.querySelector('.ui-command__empty');

    // Everything this instance changes is recorded the first time it is
    // touched, so cleanup restores rows the host added after init as well.
    const touched = new Map();
    const touch = (el, names) => {
      let saved = touched.get(el);
      if (!saved) {
        saved = {
          hidden: el.hidden,
          active: el.classList.contains('is-active'),
          attrs: {},
        };
        touched.set(el, saved);
      }
      for (const name of names) {
        if (name in saved.attrs) continue;
        saved.attrs[name] = { had: el.hasAttribute(name), value: el.getAttribute(name) };
      }
    };
    const restore = () => {
      for (const [el, saved] of touched) {
        el.hidden = saved.hidden;
        el.classList.toggle('is-active', saved.active);
        for (const [name, attr] of Object.entries(saved.attrs)) {
          if (attr.had) el.setAttribute(name, attr.value);
          else el.removeAttribute(name);
        }
      }
      touched.clear();
    };

    const optionIdBase = `bronto-cmd-opt-${nextFieldUid()}`;
    let nextOption = 0;
    const prepared = new WeakSet();
    const prepareItem = (it) => {
      if (prepared.has(it)) return;
      prepared.add(it);
      touch(it, ['id', 'role', 'aria-selected']);
      if (!it.id) it.id = `${optionIdBase}-${nextOption++}`;
      it.setAttribute('role', 'option');
    };
    const prepareGroup = (g) => {
      if (prepared.has(g)) return;
      prepared.add(g);
      touch(g, ['role']);
      g.setAttribute('role', 'presentation');
    };
    const prepareEmpty = (el) => {
      if (!el || prepared.has(el)) return;
      prepared.add(el);
      touch(el, ['role', 'aria-live']);
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
    };
    const prepareRows = () => {
      itemsNow().forEach(prepareItem);
      groupsNow().forEach(prepareGroup);
      prepareEmpty(emptyNow());
    };

    let activeItem = null;
    const visible = () => itemsNow().filter((it) => !it.hidden);

    const setActive = (item) => {
      for (const it of itemsNow()) {
        prepareItem(it);
        it.classList.toggle('is-active', it === item);
        it.setAttribute('aria-selected', String(it === item));
      }
      activeItem = item;
      if (item) {
        input.setAttribute('aria-activedescendant', item.id);
        scrollIntoViewSafe(item);
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    };

    // Hide a group whose items are all filtered out.
    const syncGroups = () => {
      for (const g of groupsNow()) {
        let any = false;
        for (
          let n = g.nextElementSibling;
          n && !n.matches('.ui-command__group');
          n = n.nextElementSibling
        ) {
          if (n.matches(ITEM) && !n.hidden) any = true;
        }
        g.hidden = !any;
      }
    };

    const matches = match
      ? (it, q) => !q || Boolean(match(it, q))
      : (it, q) => !q || lowerForSearch(it.textContent, locale).includes(q);

    const filter = () => {
      const q = lowerForSearch(input.value.trim(), locale);
      let any = false;
      for (const it of itemsNow()) {
        const shown = matches(it, q);
        it.hidden = !shown;
        if (shown) any = true;
      }
      syncGroups();
      const empty = emptyNow();
      if (empty) {
        empty.hidden = any;
        if (!any) refreshLiveText(empty);
      }
      setActive(visible()[0] || null);
    };

    // Headless: the host re-renders after the query changes, so the first row
    // it renders becomes active then; a row that disappears hands its place to
    // the first one left. An empty state the host reveals is announced.
    let queryChanged = false;
    let emptyShown = false;
    const onRowsChanged = () => {
      prepareRows();
      const rows = visible();
      if (queryChanged || !activeItem || !rows.includes(activeItem)) {
        queryChanged = false;
        setActive(rows[0] || null);
      }
      const empty = emptyNow();
      const shown = Boolean(empty && !empty.hidden);
      if (shown && !emptyShown) refreshLiveText(empty);
      emptyShown = shown;
    };

    const move = (delta) => {
      queryChanged = false;
      const vis = visible();
      if (!vis.length) return;
      setActive(vis[wrapIndex(vis.indexOf(activeItem), delta, vis.length)]);
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

    const onInput = () => {
      if (headless) queryChanged = true;
      else filter();
    };
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
        case 'Enter':
          if (activeItem && activeItem.isConnected && !activeItem.hidden) {
            choose(activeItem);
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
      const item = closestSafe(e.target, ITEM);
      if (item && list.contains(item)) choose(item);
    };

    const bound = bindOnce(box, 'command', () => {
      touch(input, [
        'role',
        'aria-controls',
        'aria-autocomplete',
        'aria-expanded',
        'aria-activedescendant',
        'autocomplete',
      ]);
      touch(list, ['id', 'role']);
      const listId = list.id || (list.id = `bronto-cmd-${nextFieldUid()}`);
      prepareRows();
      list.setAttribute('role', 'listbox');
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-controls', listId);
      input.setAttribute('aria-autocomplete', 'list');
      input.setAttribute('aria-expanded', 'true');
      input.setAttribute('autocomplete', 'off');
      input.addEventListener('input', onInput);
      input.addEventListener('keydown', onKey);
      list.addEventListener('click', onClick);
      let observer = null;
      if (headless) {
        // The palette's own window, so a palette in another realm still observes.
        const Observer = box.ownerDocument?.defaultView?.MutationObserver;
        observer = Observer ? new Observer(onRowsChanged) : null;
        observer?.observe(box, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['hidden'],
        });
        const empty = emptyNow();
        emptyShown = Boolean(empty && !empty.hidden);
        setActive(visible()[0] || null);
      } else {
        // Seed the initial active item (first visible).
        filter();
      }
      return () => {
        observer?.disconnect();
        input.removeEventListener('input', onInput);
        input.removeEventListener('keydown', onKey);
        list.removeEventListener('click', onClick);
        restore();
        activeItem = null;
      };
    });
    cleanups.push(bound);
  }

  return () => cleanups.forEach((fn) => fn());
}
