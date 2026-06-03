import { hasDom, resolveHost, noop, bindOnce, byIdInHost } from './internal.js';

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
 *
 * Escape returns focus to the trigger; closing via outside-click leaves focus
 * where the click landed (treated as deliberate intent to move on).
 */
export function initPopover({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
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
    if (trigger && host.contains(trigger)) {
      const panel = byIdInHost(host, trigger.getAttribute('data-bronto-popover'));
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

  // Seed resting ARIA on every trigger and keep it in sync when the UA itself
  // toggles a native popover (light-dismiss / Escape on the `popover` attribute
  // never routes through close(), so aria-expanded would otherwise go stale).
  const seedTeardowns = [];
  const seed = () => {
    for (const trigger of host.querySelectorAll('[data-bronto-popover]')) {
      const panel = byIdInHost(host, trigger.getAttribute('data-bronto-popover'));
      if (!panel) continue;
      if (!trigger.hasAttribute('aria-haspopup')) trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-controls', panel.id);
      if (!trigger.hasAttribute('aria-expanded')) trigger.setAttribute('aria-expanded', 'false');
      if (panel.hasAttribute('popover')) {
        const onToggle = (e) => {
          const isOpen = e.newState === 'open';
          trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
          if (!isOpen && openPanel === panel) openPanel = openTrigger = null;
        };
        panel.addEventListener('toggle', onToggle);
        seedTeardowns.push(() => panel.removeEventListener('toggle', onToggle));
      }
    }
  };

  return bindOnce(host, 'popover', () => {
    seed();
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    view?.addEventListener('scroll', onReflow, true);
    view?.addEventListener('resize', onReflow);
    return () => {
      for (const t of seedTeardowns.splice(0)) t();
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      view?.removeEventListener('scroll', onReflow, true);
      view?.removeEventListener('resize', onReflow);
    };
  });
}
