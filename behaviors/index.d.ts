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
 * Wire native <dialog> open/close glue: `[data-bronto-open="id"]`,
 * `[data-bronto-close]`, and backdrop light-dismiss for dialogs marked
 * `[data-bronto-dialog-light]`. Returns a cleanup function.
 */
export declare function initDialog(opts?: DelegateOpts): Cleanup;

export interface ToastOpts {
  /** Status tone — maps to `ui-toast--<tone>`. */
  tone?: 'accent' | 'success' | 'warning' | 'danger';
  /** Optional uppercase label rendered above the message. */
  title?: string;
  /** Auto-dismiss delay in ms. 0 keeps it until dismissed. Default: 4000. */
  duration?: number;
}

/**
 * Push a transient toast into a shared, body-anchored stack. Returns a
 * function that dismisses it early. No-op (returns noop) without a DOM.
 */
export declare function toast(message: string, opts?: ToastOpts): Cleanup;
