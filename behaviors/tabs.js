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
    const isNativeDisabled = (tab) => {
      try {
        if (tab.matches?.(':disabled')) return true;
      } catch {
        /* fall through to the native property */
      }
      return Boolean('disabled' in tab && tab.disabled);
    };
    const isReachable = (tab) => !tab.hidden && !isNativeDisabled(tab);
    const isAriaDisabled = (tab) => tab.getAttribute('aria-disabled') === 'true';
    const reachableTabs = () => tabs.filter(isReachable);
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

    let selectedTab = null;
    const syncTabs = (selected, tabStop) => {
      for (const t of tabs) {
        const on = t === selected;
        t.classList.toggle('is-active', on);
        t.setAttribute('role', 'tab');
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = t === tabStop ? 0 : -1;
      }
    };
    const moveTabStop = (tab) => {
      const candidates = reachableTabs();
      const next = candidates.includes(tab) ? tab : candidates[0] || null;
      if (!next) return false;
      syncTabs(selectedTab, next);
      return true;
    };
    const select = (tab) => {
      const candidates = reachableTabs();
      if (!candidates.includes(tab) || isAriaDisabled(tab)) return false;
      selectedTab = tab;
      syncTabs(tab, tab);
      // Only retarget panels when this tab actually controls one. A panel-less
      // tab must not hide every panel; leave the prior panel visible.
      if (!panels.some((p) => p.dataset.panel === tab.dataset.tab)) return true;
      for (const p of panels) {
        p.setAttribute('role', 'tabpanel');
        const shown = p.dataset.panel === tab.dataset.tab;
        p.hidden = !shown;
        // APG: a tabpanel is focusable so keyboard users can reach a text-only
        // panel; hidden panels drop out of the tab order.
        if (shown) p.tabIndex = 0;
        else p.removeAttribute('tabindex');
      }
      return true;
    };
    const onClick = (e) => {
      // `tabs` is filtered to this group, so membership (not mere DOM
      // containment) is what isolates nested [data-bronto-tabs] groups.
      const tab = closestSafe(e.target, '.ui-tab');
      if (tab && tabs.includes(tab)) {
        e.preventDefault();
        const handled = select(tab) || moveTabStop(tab);
        if (handled) tab.focus();
      }
    };
    const onKey = (e) => {
      const candidates = reachableTabs();
      const i = candidates.indexOf(closestSafe(e.target, '.ui-tab'));
      if (i < 0) return;
      const orientation =
        list?.getAttribute('aria-orientation') === 'vertical' ? 'vertical' : 'horizontal';
      const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
      const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
      let n = i;
      if (e.key === nextKey) n = (i + 1) % candidates.length;
      else if (e.key === prevKey) n = (i - 1 + candidates.length) % candidates.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = candidates.length - 1;
      else return;
      e.preventDefault();
      const next = candidates[n];
      if (!select(next)) moveTabStop(next);
      next.focus();
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
        const candidates = reachableTabs();
        const initial =
          candidates.find((t) => t.classList.contains('is-active') && !isAriaDisabled(t)) ||
          candidates.find((t) => !isAriaDisabled(t)) ||
          candidates[0];
        if (initial && !select(initial)) moveTabStop(initial);
        else if (!initial) syncTabs(null, null);
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
