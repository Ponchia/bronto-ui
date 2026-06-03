import { hasDom, resolveHost, noop, bindOnce, nextFieldUid, collectHosts } from './internal.js';

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
  const host = resolveHost(root);
  if (!host) return noop;
  const cleanups = [];
  const groups = collectHosts(host, '[data-bronto-tabs]');
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
      const n = nextFieldUid();
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
      // Only retarget panels when this tab actually controls one. A panel-less
      // tab must NOT hide every panel — leave the prior panel visible (C30).
      if (!panels.some((p) => p.dataset.panel === tab.dataset.tab)) return;
      for (const p of panels) {
        p.setAttribute('role', 'tabpanel');
        const shown = p.dataset.panel === tab.dataset.tab;
        p.hidden = !shown;
        // APG: a tabpanel is focusable so keyboard users can reach a text-only
        // panel; hidden panels drop out of the tab order (C30).
        if (shown) p.tabIndex = 0;
        else p.removeAttribute('tabindex');
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
