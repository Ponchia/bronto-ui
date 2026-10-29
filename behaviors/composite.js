// Shared DOM mechanics, not a public widget or a document-wide focus registry.
import { isRendered } from './internal.js';

/** Closed details can still lay out their descendants in some engines. */
function outsideSummary(element, details) {
  const summary = [...details.children].find((child) => child.localName === 'summary');
  return !summary?.contains(element);
}

export function compositeVisible(element) {
  if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  if (element.matches(':disabled')) return false;
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (parent.matches('details:not([open])') && outsideSummary(element, parent)) return false;
  }
  return isRendered(element);
}

/** Preserve author tab stops, including late items and items removed before teardown. */
export function tabStops(root) {
  const saved = new Map([[root, root.getAttribute('tabindex')]]);
  const restoreOne = (element, value) => {
    if (value === null) element.removeAttribute('tabindex');
    else element.setAttribute('tabindex', value);
  };
  const set = (element, value) => {
    if (!saved.has(element)) saved.set(element, element.getAttribute('tabindex'));
    if (element.tabIndex !== value) element.tabIndex = value;
  };
  return {
    set,
    sync(items, active) {
      const retained = new Set([root, ...items]);
      for (const [element, value] of saved) {
        if (retained.has(element)) continue;
        restoreOne(element, value);
        saved.delete(element);
      }
      for (const item of items) set(item, item === active ? 0 : -1);
    },
    restore() {
      for (const [element, value] of saved) restoreOne(element, value);
      saved.clear();
    },
  };
}

export function compositeIndex(key, current, count, vertical, rtl = false) {
  if (!count) return null;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  const previous = vertical ? 'ArrowUp' : 'ArrowLeft';
  const next = vertical ? 'ArrowDown' : 'ArrowRight';
  if (key !== previous && key !== next) return null;
  const direction = !vertical && rtl ? -1 : 1;
  const delta = (key === previous ? -1 : 1) * direction;
  return (current + delta + count) % count;
}

/** A surrounding editor does not own the composite's controls. */
export function editingControl(element, root) {
  const owner = element.closest(
    'input, select, textarea, [contenteditable], [role="combobox"], [role="slider"], [role="spinbutton"], [role="textbox"], [role="tree"], [role="grid"]',
  );
  if (!owner || owner === root || !root.contains(owner)) return false;
  return owner.getAttribute('contenteditable')?.toLowerCase() !== 'false';
}

/** DOM ownership matters before a framework's delegated key handler runs. */
export function nestedComposite(element, root) {
  const owner = element.closest(
    '[role="toolbar"], [role="menu"], [role="listbox"], [data-bronto-toolbar]',
  );
  return owner !== root;
}
