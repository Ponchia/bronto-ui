import {
  hasDom,
  resolveHost,
  noop,
  bindOnce,
  nextFieldUid,
  collectHosts,
  closestSafe,
} from './internal.js';

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
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initTabs({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const cleanups = [];
  const groups = collectHosts(host, '[data-bronto-tabs]');
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

  for (const group of groups) {
    // Own group only — a tab/panel inside a nested [data-bronto-tabs]
    // belongs to that inner group, not this one.
    const owned = (el) => el.closest('[data-bronto-tabs]') === group;
    const tabs = [...group.querySelectorAll('.ui-tab')].filter(owned);
    const panels = [...group.querySelectorAll('.ui-tabs__panel')].filter(owned);
    if (!tabs.length) continue;
    const list = [...group.querySelectorAll('.ui-tabs__list')].find(owned);
    const rememberState = () => ({
      list: list ? snapshotAttrs(list, ['role']) : null,
      tabs: new Map(
        tabs.map((tab) => [
          tab,
          {
            active: tab.classList.contains('is-active'),
            attrs: snapshotAttrs(tab, ['id', 'role', 'aria-selected', 'aria-controls', 'tabindex']),
          },
        ]),
      ),
      panels: new Map(
        panels.map((panel) => [
          panel,
          {
            hidden: panel.hidden,
            attrs: snapshotAttrs(panel, ['id', 'role', 'aria-labelledby', 'tabindex']),
          },
        ]),
      ),
    });
    const restoreState = (state) => {
      if (list && state.list) restoreAttrs(list, state.list);
      for (const tab of tabs) {
        const tabState = state.tabs.get(tab);
        if (!tabState) continue;
        tab.classList.toggle('is-active', tabState.active);
        restoreAttrs(tab, tabState.attrs);
      }
      for (const panel of panels) {
        const panelState = state.panels.get(panel);
        if (!panelState) continue;
        panel.hidden = panelState.hidden;
        restoreAttrs(panel, panelState.attrs);
      }
    };

    const select = (tab) => {
      for (const t of tabs) {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('role', 'tab');
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      }
      // Only retarget panels when this tab actually controls one. A panel-less
      // tab must not hide every panel; leave the prior panel visible.
      if (!panels.some((p) => p.dataset.panel === tab.dataset.tab)) return;
      for (const p of panels) {
        p.setAttribute('role', 'tabpanel');
        const shown = p.dataset.panel === tab.dataset.tab;
        p.hidden = !shown;
        // APG: a tabpanel is focusable so keyboard users can reach a text-only
        // panel; hidden panels drop out of the tab order.
        if (shown) p.tabIndex = 0;
        else p.removeAttribute('tabindex');
      }
    };
    const onClick = (e) => {
      // `tabs` is filtered to this group, so membership (not mere DOM
      // containment) is what isolates nested [data-bronto-tabs] groups.
      const tab = closestSafe(e.target, '.ui-tab');
      if (tab && tabs.includes(tab)) {
        e.preventDefault();
        select(tab);
        tab.focus();
      }
    };
    const onKey = (e) => {
      const i = tabs.indexOf(closestSafe(e.target, '.ui-tab'));
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
    cleanups.push(
      bindOnce(group, 'tabs', () => {
        const state = rememberState();
        if (list) list.setAttribute('role', 'tablist');

        // APG: bind each tab to its panel (aria-controls) and back
        // (aria-labelledby), minting stable ids only where absent.
        for (const t of tabs) {
          const p = panels.find((x) => x.dataset.panel === t.dataset.tab);
          if (!p) continue;
          const n = nextFieldUid();
          if (!t.id) t.id = `bronto-tab-${n}`;
          if (!p.id) p.id = `bronto-tabpanel-${n}`;
          t.setAttribute('aria-controls', p.id);
          p.setAttribute('aria-labelledby', t.id);
        }
        select(tabs.find((t) => t.classList.contains('is-active')) || tabs[0]);
        group.addEventListener('click', onClick);
        group.addEventListener('keydown', onKey);
        return () => {
          group.removeEventListener('click', onClick);
          group.removeEventListener('keydown', onKey);
          restoreState(state);
        };
      }),
    );
  }
  return () => cleanups.forEach((fn) => fn());
}
