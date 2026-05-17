/** @ponchia/ui — optional, framework-agnostic behaviors. */

/** Cleanup function returned by every initializer. */
export type Cleanup = () => void;

export interface ThemeStorageOpts {
  /** localStorage key for the persisted theme. Default: "bronto-theme". */
  storageKey?: string;
}

export interface ApplyThemeOpts extends ThemeStorageOpts {
  /** Element to set `data-theme` on. Default: <html>. */
  root?: Element;
}

export interface DelegateOpts {
  /** Event-delegation root; also scopes which controls are queried. Default: document. */
  root?: Document | Element;
}

/** `bronto:themechange` CustomEvent detail. */
export interface ThemeChangeDetail {
  theme: 'light' | 'dark';
}

/** Apply the persisted theme to <html data-theme>. Call before paint. */
export declare function applyStoredTheme(opts?: ApplyThemeOpts): void;

/**
 * Wire `[data-bronto-theme-toggle]` controls. Theme is always applied to
 * <html>; `root` only scopes delegation/queried controls. Dispatches
 * `bronto:themechange` on <html>. Returns a cleanup function.
 */
export declare function initThemeToggle(opts?: ThemeStorageOpts & DelegateOpts): Cleanup;

/** Wire `[data-bronto-dismiss]` controls. Returns a cleanup function. */
export declare function dismissible(opts?: DelegateOpts): Cleanup;

/** Wire `[data-bronto-disclosure]` triggers. Returns a cleanup function. */
export declare function initDisclosure(opts?: DelegateOpts): Cleanup;

/**
 * Close affordances (Escape, outside-click, close-on-activate) for a
 * native `<details data-bronto-menu>` dropdown holding a `.ui-menu`.
 * Not a full ARIA menu by design. Returns a cleanup function.
 */
export declare function initMenu(opts?: DelegateOpts): Cleanup;

/**
 * Accessible validation glue for `<form data-bronto-validate>`:
 * progressive enhancement over the Constraint Validation API. Sets
 * `aria-invalid`, writes `validationMessage` into the field's
 * `[data-bronto-error]` / `.ui-hint` slot (linked via
 * `aria-describedby`), and on invalid submit fills the form's
 * `[data-bronto-error-summary]` with focusable links and blocks submit.
 * Works without JS (native validation). Returns a cleanup function.
 */
export declare function initFormValidation(opts?: DelegateOpts): Cleanup;

/**
 * Editable combobox with a filtered listbox popup (WAI-ARIA APG
 * pattern), dependency-free and CSS-anchored. Wires
 * `[data-bronto-combobox]` (input `role=combobox` +
 * `.ui-combobox__list` of `role=option`): ids, `aria-expanded` /
 * `aria-controls` / `aria-activedescendant`, type-to-filter, full
 * keyboard, pointer select, outside-click close. Emits `bronto:change`
 * ({ detail: { value } }) on selection. SSR-safe, idempotent per
 * instance. Returns a cleanup function.
 */
export declare function initCombobox(opts?: DelegateOpts): Cleanup;

/**
 * Collision-aware popover, dependency-free. A `[data-bronto-popover]`
 * trigger toggles the `.ui-popover` panel it names; the panel flips
 * above when it would overflow the viewport and its inline edge is
 * clamped on-screen. Uses the native top layer when the panel has
 * `popover` and the Popover API exists, else an `.is-open` class.
 * Manages `aria-expanded`/`aria-controls`, Escape + outside-click
 * close, scroll/resize reposition. Returns a cleanup function.
 */
export declare function initPopover(opts?: DelegateOpts): Cleanup;

/**
 * Client-side sortable + selectable data table for
 * `[data-bronto-sortable]`. Header `.ui-table__sort` / `th[data-sort]`
 * cycles `aria-sort` and reorders the tbody (numeric- or
 * locale-string-aware); `[data-bronto-select-all]` toggles
 * `[data-bronto-select]` rows + `aria-selected` with synced
 * checked/indeterminate state. Emits `bronto:selectionchange`
 * ({ detail: { count } }). SSR-safe, idempotent per table. Returns a
 * cleanup function.
 */
export declare function initTableSort(opts?: DelegateOpts): Cleanup;

/**
 * Wire `[data-bronto-tabs]` groups with the WAI-ARIA Tabs keyboard
 * pattern (roving tabindex, Arrow/Home/End, aria-selected, panel sync).
 * Returns a cleanup function.
 */
export declare function initTabs(opts?: DelegateOpts): Cleanup;

/**
 * Wire native <dialog> open/close glue: `[data-bronto-open="id"]`,
 * `[data-bronto-close]`, and backdrop light-dismiss for dialogs marked
 * `[data-bronto-dialog-light]`. Returns a cleanup function.
 */
export declare function initDialog(opts?: DelegateOpts): Cleanup;

export interface ToastOpts {
  /** Status tone — maps to `ui-toast--<tone>`. */
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'info';
  /** Optional uppercase label rendered above the message. */
  title?: string;
  /** Auto-dismiss delay in ms. 0 keeps it until dismissed. Default: 4000. */
  duration?: number;
  /**
   * Route to the assertive live region so AT interrupts immediately.
   * Defaults to `true` when `tone === 'danger'`.
   */
  assertive?: boolean;
  /** Render a dismiss button on the toast. */
  closable?: boolean;
}

/**
 * Push a transient toast into a shared, body-anchored stack. Returns a
 * function that dismisses it early. No-op (returns noop) without a DOM.
 */
export declare function toast(message: string, opts?: ToastOpts): Cleanup;
