import { hasDom, noop, bindOnce, nextFieldUid } from './internal.js';

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
 *    `.ui-hint`), linked via `aria-describedby`,
 *  - on an invalid submit, fills the form's
 *    `[data-bronto-error-summary]` (a `.ui-error-summary`) with
 *    in-page links to each bad field, focuses it, and blocks submit.
 *
 * Pure enhancement: with JS off the form still submits and the browser
 * validates natively. SSR-safe, idempotent; returns a cleanup function.
 */
export function initFormValidation({ root } = {}) {
  if (!hasDom()) return noop;
  const host = root || document;

  const ensureId = (el, prefix) => {
    if (!el.id) el.id = `${prefix}-${nextFieldUid()}`;
    return el.id;
  };

  const slotFor = (control) => {
    const field = control.closest('.ui-field');
    if (!field) return null;
    return field.querySelector('[data-bronto-error]') || field.querySelector('.ui-hint');
  };

  const link = (control, slot) => {
    const slotId = ensureId(slot, 'bronto-err');
    const ids = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (!ids.includes(slotId)) {
      ids.push(slotId);
      control.setAttribute('aria-describedby', ids.join(' '));
    }
  };

  const validateField = (control) => {
    if (!control.willValidate) return true;
    const ok = control.validity.valid;
    const slot = slotFor(control);
    if (ok) {
      control.removeAttribute('aria-invalid');
      if (slot) {
        slot.textContent = '';
        if (slot.classList.contains('ui-hint')) slot.classList.remove('ui-hint--error');
      }
    } else {
      control.setAttribute('aria-invalid', 'true');
      if (slot) {
        slot.textContent = control.validationMessage;
        if (slot.classList.contains('ui-hint')) slot.classList.add('ui-hint--error');
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
    // Feature-detect rather than `instanceof Element` — `Element` is not
    // a guaranteed global (SSR / the no-DOM test env), and `host` is
    // either `document` (no `.matches`) or a root Element.
    const selfForm =
      typeof host.matches === 'function' && host.matches('[data-bronto-validate]') ? [host] : [];
    const forms = [...selfForm, ...(host.querySelectorAll?.('[data-bronto-validate]') ?? [])];
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
