import { hasDom, resolveHost, noop, bindOnce, nextFieldUid, collectHosts } from './internal.js';

function snapshotAttrs(el, names) {
  const out = {};
  for (const name of names) {
    out[name] = {
      had: el.hasAttribute(name),
      value: el.getAttribute(name),
    };
  }
  return out;
}

function restoreAttrs(el, attrs) {
  for (const [name, attr] of Object.entries(attrs)) {
    if (attr.had) el.setAttribute(name, attr.value);
    else el.removeAttribute(name);
  }
}

function createValidationState() {
  return {
    priorNoValidate: new Map(),
    controlState: new Map(),
    slotState: new Map(),
    summaryState: new Map(),
    // Borrowed `.ui-hint` help text is restored after an invalid field becomes valid.
    hintHelp: new WeakMap(),
  };
}

function suppressNativeValidation(form, state) {
  if (!state.priorNoValidate.has(form)) state.priorNoValidate.set(form, form.noValidate);
  form.noValidate = true;
}

function rememberControl(control, state) {
  if (!state.controlState.has(control)) {
    state.controlState.set(
      control,
      snapshotAttrs(control, ['aria-invalid', 'aria-describedby', 'id']),
    );
  }
}

function rememberSlot(slot, state) {
  if (!state.slotState.has(slot)) {
    state.slotState.set(slot, {
      attrs: snapshotAttrs(slot, ['id']),
      text: slot.textContent,
      hadErrorClass: slot.classList.contains('ui-hint--error'),
    });
  }
}

function rememberSummary(summary, state) {
  if (!state.summaryState.has(summary)) {
    state.summaryState.set(summary, {
      attrs: snapshotAttrs(summary, ['role', 'tabindex']),
      children: [...summary.childNodes],
      hidden: summary.hidden,
    });
  }
}

function ensureId(el, prefix) {
  if (!el.id) el.id = `${prefix}-${nextFieldUid()}`;
  return el.id;
}

function slotFor(control) {
  const field = control.closest('.ui-field');
  if (!field) return null;
  const dedicated = field.querySelector('[data-bronto-error]');
  if (dedicated) return dedicated;
  return field.querySelector('.ui-hint');
}

function link(control, slot) {
  const slotId = ensureId(slot, 'bronto-err');
  const ids = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  if (!ids.includes(slotId)) {
    ids.push(slotId);
    control.setAttribute('aria-describedby', ids.join(' '));
  }
}

function unlink(control, slot) {
  if (!slot.id) return;
  const ids = (control.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter((id) => id && id !== slot.id);
  if (ids.length) control.setAttribute('aria-describedby', ids.join(' '));
  else control.removeAttribute('aria-describedby');
}

function slotKind(slot) {
  // Decide the slot TYPE by `[data-bronto-error]`, not by `.ui-hint`: canonical
  // dedicated error markup can carry both.
  const dedicated = !!slot?.matches?.('[data-bronto-error]');
  const hasHintClass = !!slot?.classList.contains('ui-hint');
  return { hasHintClass, borrowedHint: hasHintClass && !dedicated };
}

function clearFieldError(control, slot, kind, state) {
  control.removeAttribute('aria-invalid');
  if (!slot) return;
  if (kind.hasHintClass) slot.classList.remove('ui-hint--error');
  if (kind.borrowedHint) {
    slot.textContent = state.hintHelp.get(slot) ?? '';
    return;
  }
  slot.textContent = '';
  unlink(control, slot);
}

function showFieldError(control, slot, kind, state) {
  control.setAttribute('aria-invalid', 'true');
  if (!slot) return;
  if (kind.borrowedHint && !state.hintHelp.has(slot)) state.hintHelp.set(slot, slot.textContent);
  slot.textContent = control.validationMessage;
  if (kind.hasHintClass) slot.classList.add('ui-hint--error');
  link(control, slot);
}

function validateField(control, state) {
  if (!control.willValidate) return true;
  rememberControl(control, state);
  const ok = control.validity.valid;
  const slot = slotFor(control);
  if (slot) rememberSlot(slot, state);
  const kind = slotKind(slot);
  if (ok) clearFieldError(control, slot, kind, state);
  else showFieldError(control, slot, kind, state);
  return ok;
}

function controlsOf(form) {
  return [...form.elements].filter(
    (el) => el.willValidate && el.type !== 'submit' && el.type !== 'button',
  );
}

function summaryItem(control) {
  const id = ensureId(control, 'bronto-field');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = `#${id}`;
  a.textContent = control.validationMessage;
  a.addEventListener('click', (e) => {
    e.preventDefault();
    control.focus();
  });
  li.appendChild(a);
  return li;
}

function refreshSummary(form, invalid, state) {
  const summary = form.querySelector('[data-bronto-error-summary]');
  if (!summary) return;
  rememberSummary(summary, state);
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
  list.append(...invalid.map(summaryItem));
  summary.replaceChildren(title, list);
  summary.setAttribute('role', 'alert');
  summary.tabIndex = -1;
  summary.hidden = false;
}

function restoreValidationState(state) {
  for (const [form, noValidate] of state.priorNoValidate) form.noValidate = noValidate;
  for (const [summary, snapshot] of state.summaryState) {
    summary.replaceChildren(...snapshot.children);
    summary.hidden = snapshot.hidden;
    restoreAttrs(summary, snapshot.attrs);
  }
  for (const [slot, snapshot] of state.slotState) {
    slot.textContent = snapshot.text;
    slot.classList.toggle('ui-hint--error', snapshot.hadErrorClass);
    restoreAttrs(slot, snapshot.attrs);
  }
  for (const [control, attrs] of state.controlState) restoreAttrs(control, attrs);
}

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
  let state = createValidationState();

  const onSubmit = (event) => {
    const form = event.target.closest?.('[data-bronto-validate]');
    if (!form) return;
    suppressNativeValidation(form, state);
    const invalid = controlsOf(form).filter((control) => !validateField(control, state));
    refreshSummary(form, invalid, state);
    if (invalid.length) {
      event.preventDefault();
      const summary = form.querySelector('[data-bronto-error-summary]');
      (summary && !summary.hidden ? summary : invalid[0]).focus();
    }
  };

  const onBlur = (event) => {
    const control = event.target;
    if (!control.willValidate) return;
    const form = control.closest?.('[data-bronto-validate]');
    if (!form) return;
    suppressNativeValidation(form, state);
    validateField(control, state);
    const summary = form.querySelector('[data-bronto-error-summary]');
    if (summary && !summary.hidden) {
      refreshSummary(
        form,
        controlsOf(form).filter((candidate) => !candidate.validity.valid),
        state,
      );
    }
  };

  return bindOnce(host, 'formValidation', () => {
    // Suppress native bubbles UP FRONT for forms present at init. The
    // in-handler `noValidate = true` only fires after the first
    // submit/blur, so the very first invalid real-browser submit would
    // otherwise show the native UA bubble instead of the Bronto
    // summary — contradicting the documented contract. (Forms added
    // after init are still covered by the in-handler set.)
    const forms = collectHosts(host, '[data-bronto-validate]');
    state = createValidationState();
    for (const form of forms) {
      suppressNativeValidation(form, state);
    }
    host.addEventListener('submit', onSubmit, true);
    host.addEventListener('focusout', onBlur);
    return () => {
      host.removeEventListener('submit', onSubmit, true);
      host.removeEventListener('focusout', onBlur);
      restoreValidationState(state);
      state = createValidationState();
    };
  });
}
