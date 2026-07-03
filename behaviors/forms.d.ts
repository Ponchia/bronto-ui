/**
 * @typedef {object} FormValidationOpts
 * @property {Document | Element | null} [root]
 *   Event-delegation root; default: `document`.
 * @property {string} [summaryTitle]
 *   Localized validation-summary title. A summary/form
 *   `data-bronto-error-summary-title` attribute overrides it, and an authored
 *   `.ui-error-summary__title` child is preserved.
 */
/**
 * Accessible form validation glue for `<form data-bronto-validate>`.
 * Progressive enhancement over the native Constraint Validation API —
 * the framework already ships the `[aria-invalid]` / `.ui-hint--error`
 * styling; this wires the a11y plumbing every consumer would otherwise
 * re-implement (and usually get wrong):
 *
 *  - suppresses the native error bubbles (`form.noValidate`),
 *  - on blur and on submit sets `aria-invalid` and writes the browser's
 *    `validationMessage` into the field's error slot
 *    (`[data-bronto-error]` inside the `.ui-field`, falling back to a
 *    `.ui-hint`), linked via `aria-describedby`. When it falls back to a
 *    `.ui-hint` the original help text is snapshotted and restored once the
 *    field is valid again (so the error does not eat the help permanently); a
 *    dedicated empty `[data-bronto-error]` node is still the recommended slot,
 *  - on an invalid submit, fills the form's
 *    `[data-bronto-error-summary]` (a `.ui-error-summary`) with
 *    in-page links to each bad field, focuses it, and blocks submit.
 *
 * Pure enhancement: with JS off the form still submits and the browser
 * validates natively. SSR-safe, idempotent; returns a cleanup function.
 *
 * @param {FormValidationOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initFormValidation({ root, summaryTitle }?: FormValidationOpts): import("./internal.js").Cleanup;
export type FormValidationOpts = {
    /**
     * Event-delegation root; default: `document`.
     */
    root?: Document | Element | null | undefined;
    /**
     * Localized validation-summary title. A summary/form
     * `data-bronto-error-summary-title` attribute overrides it, and an authored
     * `.ui-error-summary__title` child is preserved.
     */
    summaryTitle?: string | undefined;
};
//# sourceMappingURL=forms.d.ts.map