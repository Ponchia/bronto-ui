import { hasDom, resolveHost, noop, bindOnce, byIdInHost, focusInto } from './internal.js';

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
 * The trigger advertises `aria-haspopup="dialog"`, so on open the panel is
 * given `role="dialog"` (unless the author set a role) and focus is moved into
 * it — the first focusable descendant, or the panel itself. It is a *non-modal*
 * dialog: the rest of the page stays interactive and there is no focus trap.
 * Author an accessible name on the panel (`aria-label` / `aria-labelledby`); a
 * dev-time `console.warn` fires when it is missing.
 *
 * Escape returns focus to the trigger; closing via outside-click leaves focus
 * where the click landed (treated as deliberate intent to move on).
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initPopover({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;
  const view = document.defaultView;
  const GAP = 8;
  let openPanel = null;
  let openTrigger = null;

  // The trigger advertises `aria-haspopup="dialog"`, so the open panel must BE a
  // dialog: a role, an accessible name, and focus moved into it (C6) — see the
  // shared `focusInto` in internal.js.

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
    // Only steal focus back to the trigger when focus is still inside the panel
    // (Escape / programmatic re-toggle). An outside-click leaves focus where the
    // click landed — deliberate intent to move on, per the doc contract.
    const focusWasInside = panel.contains(document.activeElement);
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
    if (focusWasInside && trigger?.isConnected) trigger.focus?.();
  };

  const open = (trigger, panel) => {
    close();
    // Live up to the advertised `aria-haspopup="dialog"`: give the panel a
    // dialog role (unless the author set one) so AT announces it as the promised
    // dialog rather than a generic group (C6).
    if (!panel.hasAttribute('role')) panel.setAttribute('role', 'dialog');
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
    focusInto(panel);
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
    // close() returns focus to the trigger because focus is inside the panel.
    if (e.key !== 'Escape' || !openPanel) return;
    // A popover open *inside* a <dialog>/modal owns this Escape. Without this,
    // the same keypress closed BOTH: we hidePopover() the panel synchronously,
    // the browser's close-request then finds the dialog as the new topmost
    // element and dismisses it too. preventDefault() stops that native
    // close-request and stopPropagation() keeps it off other delegated keydown
    // listeners (e.g. initModal's), so only the popover closes — the documented
    // "popover + dialog open together" contract.
    e.preventDefault();
    e.stopPropagation();
    close();
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
      // A dialog with no accessible name is announced as just "dialog". We can't
      // invent a good name, so warn the author at dev time (C6).
      const named =
        panel.hasAttribute('aria-label') ||
        panel.hasAttribute('aria-labelledby') ||
        panel.hasAttribute('title');
      if (!named && typeof console !== 'undefined') {
        console.warn(
          `[bronto] initPopover(): panel #${panel.id} has no accessible name — add aria-label or aria-labelledby so it is announced as a named dialog.`,
        );
      }
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
