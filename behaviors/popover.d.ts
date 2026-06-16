/**
 * Collision-aware popover, dependency-free. A `[data-bronto-popover]`
 * trigger toggles the `.ui-popover` panel whose id it names. The panel
 * is placed under the trigger and **flips above** when it would
 * overflow the viewport, with its inline edge clamped on-screen and tall
 * panels constrained to scroll inside the viewport — the thing the CSS-only
 * tooltip can't do near edges / inside scroll containers. If the panel has
 * the native `popover` attribute and the
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
export function initPopover({ root }?: import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
//# sourceMappingURL=popover.d.ts.map