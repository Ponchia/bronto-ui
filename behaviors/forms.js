import { hasDom, resolveHost, noop, bindOnce, nextFieldUid, collectHosts } from './internal.js';

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
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initFormValidation({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;

  const ensureId = (el, prefix) => {
    if (!el.id) el.id = `${prefix}-${nextFieldUid()}`;
    return el.id;
  };

  // When the field has no dedicated `[data-bronto-error]` node we fall back to
  // the shared `.ui-hint` help slot. Snapshot its original help text the first
  // time we overwrite it with an error, so the valid branch can RESTORE the help
  // rather than blanking it permanently (component-audit C8).
  const hintHelp = new WeakMap();

  const slotFor = (control) => {
    const field = control.closest('.ui-field');
    if (!field) return null;
    const dedicated = field.querySelector('[data-bronto-error]');
    if (dedicated) return dedicated;
    return field.querySelector('.ui-hint');
  };

  const link = (control, slot) => {
    const slotId = ensureId(slot, 'bronto-err');
    const ids = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (!ids.includes(slotId)) {
      ids.push(slotId);
      control.setAttribute('aria-describedby', ids.join(' '));
    }
  };

  const unlink = (control, slot) => {
    if (!slot.id) return;
    const ids = (control.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter((id) => id && id !== slot.id);
    if (ids.length) control.setAttribute('aria-describedby', ids.join(' '));
    else control.removeAttribute('aria-describedby');
  };

  const validateField = (control) => {
    if (!control.willValidate) return true;
    const ok = control.validity.valid;
    const slot = slotFor(control);
    const isHint = slot?.classList.contains('ui-hint');
    if (ok) {
      control.removeAttribute('aria-invalid');
      if (slot) {
        if (isHint) {
          // Restore the snapshotted help text (or clear if there was none); a
          // help-bearing hint stays linked via aria-describedby (it describes
          // the field in the valid state too).
          slot.textContent = hintHelp.get(slot) ?? '';
          slot.classList.remove('ui-hint--error');
        } else {
          // Dedicated error node: clear it and drop the now-stale describedby
          // so AT doesn't announce an empty error association.
          slot.textContent = '';
          unlink(control, slot);
        }
      }
    } else {
      control.setAttribute('aria-invalid', 'true');
      if (slot) {
        if (isHint && !hintHelp.has(slot)) hintHelp.set(slot, slot.textContent);
        slot.textContent = control.validationMessage;
        if (isHint) slot.classList.add('ui-hint--error');
        link(control, slot);
      }
    }
    return ok;
  };

  const controlsOf = (form) =>
    [...form.elements].filter(
      (el) => el.willValidate && el.type !== 'submit' && el.type !== 'button',
    );

  const refreshSummary = (form, invalid) => {
    const summary = form.querySelector('[data-bronto-error-summary]');
    if (!summary) return;
    if (!invalid.length) {
      summary.hidden = true;
      summary.replaceChildren();
      return;
    }
    const title = document.createElement('p');
    title.className = 'ui-error-summary__title';
    title.textContent = 'There is a problem';
    const list = document.createElement('ul');
    list.className = 'ui-error-summary__list';
    for (const c of invalid) {
      const id = ensureId(c, 'bronto-field');
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${id}`;
      a.textContent = c.validationMessage;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        c.focus();
      });
      li.appendChild(a);
      list.appendChild(li);
    }
    summary.replaceChildren(title, list);
    summary.setAttribute('role', 'alert');
    summary.tabIndex = -1;
    summary.hidden = false;
  };

  const onSubmit = (e) => {
    const form = e.target.closest?.('[data-bronto-validate]');
    if (!form) return;
    form.noValidate = true;
    const invalid = controlsOf(form).filter((c) => !validateField(c));
    refreshSummary(form, invalid);
    if (invalid.length) {
      e.preventDefault();
      const summary = form.querySelector('[data-bronto-error-summary]');
      (summary && !summary.hidden ? summary : invalid[0]).focus();
    }
  };

  const onBlur = (e) => {
    const control = e.target;
    if (!control.willValidate) return;
    const form = control.closest?.('[data-bronto-validate]');
    if (!form) return;
    form.noValidate = true;
    validateField(control);
    const summary = form.querySelector('[data-bronto-error-summary]');
    if (summary && !summary.hidden)
      refreshSummary(
        form,
        controlsOf(form).filter((c) => !c.validity.valid),
      );
  };

  return bindOnce(host, 'formValidation', () => {
    // Suppress native bubbles UP FRONT for forms present at init. The
    // in-handler `noValidate = true` only fires after the first
    // submit/blur, so the very first invalid real-browser submit would
    // otherwise show the native UA bubble instead of the Bronto
    // summary — contradicting the documented contract. (Forms added
    // after init are still covered by the in-handler set.)
    const forms = collectHosts(host, '[data-bronto-validate]');
    const priorNoValidate = new Map();
    for (const f of forms) {
      priorNoValidate.set(f, f.noValidate);
      f.noValidate = true;
    }
    host.addEventListener('submit', onSubmit, true);
    host.addEventListener('focusout', onBlur);
    return () => {
      host.removeEventListener('submit', onSubmit, true);
      host.removeEventListener('focusout', onBlur);
      for (const [f, v] of priorNoValidate) f.noValidate = v;
    };
  });
}
