/**
 * @typedef {object} ToastOpts
 * @property {'accent' | 'success' | 'warning' | 'danger' | 'info'} [tone] Status tone — maps to `ui-toast--<tone>`.
 * @property {string} [title] Optional uppercase label rendered above the message.
 * @property {number} [duration] Auto-dismiss delay in ms. `0` keeps it until dismissed. Default: `4000`.
 * @property {boolean} [assertive] Route to the assertive live region so AT interrupts immediately. Defaults to `true` when `tone === 'danger'`.
 * @property {boolean} [closable] Render a dismiss button on the toast.
 */
/**
 * Push a transient toast into a shared, screen-anchored stack. The stack
 * is the `aria-live="polite"` region: it is created once, appended to
 * <body>, and **kept resident even when empty** so the live region is
 * always present before content is inserted (a freshly created region
 * that receives its first child in the same tick is not reliably
 * announced by VoiceOver/NVDA). On first creation the empty region is
 * inserted and the toast is appended on the next frame for the same
 * reason. `tone` is accent/success/warning/danger/info; `title` is an
 * optional uppercase label; `duration` ms before auto-dismiss (0 keeps
 * it until dismissed). Returns a function that dismisses the toast
 * early. SSR-safe (no-op).
 *
 * @param {string} message
 * @param {ToastOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function toast(message: string, { tone, title, duration, assertive, closable }?: ToastOpts): import("./internal.js").Cleanup;
export type ToastOpts = {
    /**
     * Status tone — maps to `ui-toast--<tone>`.
     */
    tone?: "accent" | "success" | "warning" | "danger" | "info" | undefined;
    /**
     * Optional uppercase label rendered above the message.
     */
    title?: string | undefined;
    /**
     * Auto-dismiss delay in ms. `0` keeps it until dismissed. Default: `4000`.
     */
    duration?: number | undefined;
    /**
     * Route to the assertive live region so AT interrupts immediately. Defaults to `true` when `tone === 'danger'`.
     */
    assertive?: boolean | undefined;
    /**
     * Render a dismiss button on the toast.
     */
    closable?: boolean | undefined;
};
//# sourceMappingURL=toast.d.ts.map