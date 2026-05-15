/** @bronto/ui — optional, framework-agnostic behaviors. */

export interface ThemeOpts {
  /** localStorage key for the persisted theme. Default: "bronto-theme". */
  storageKey?: string;
  /** Element to read/write `data-theme` on. Default: <html>. */
  root?: Element;
}

export interface DelegateOpts {
  /** Event-delegation root. Default: document. */
  root?: Document | Element;
}

/** Cleanup function returned by every initializer. */
export type Cleanup = () => void;

/** Apply the persisted theme to <html data-theme>. Call before paint. */
export declare function applyStoredTheme(opts?: ThemeOpts): void;

/** Wire `[data-bronto-theme-toggle]` controls. Returns a cleanup function. */
export declare function initThemeToggle(opts?: ThemeOpts & DelegateOpts): Cleanup;

/** Wire `[data-bronto-dismiss]` controls. Returns a cleanup function. */
export declare function dismissible(opts?: DelegateOpts): Cleanup;

/** Wire `[data-bronto-disclosure]` triggers. Returns a cleanup function. */
export declare function initDisclosure(opts?: DelegateOpts): Cleanup;
