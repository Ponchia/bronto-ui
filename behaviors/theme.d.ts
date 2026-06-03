/**
 * @typedef {object} ThemeStorageOpts
 * @property {string} [storageKey] localStorage key for the persisted theme. Default: `"bronto-theme"`.
 *
 * @typedef {ThemeStorageOpts & { root?: Element }} ApplyThemeOpts
 *   `root` is the element to set `data-theme` on. Default: `<html>`.
 *
 * @typedef {object} ThemeChangeDetail
 * @property {'light' | 'dark'} theme `bronto:themechange` CustomEvent detail.
 */
/**
 * Apply the persisted theme to <html data-theme>. Call as early as
 * possible (an inline module in <head>) to avoid a flash before the
 * toggle wires up. No stored value → leaves prefers-color-scheme to act.
 *
 * @param {ApplyThemeOpts} [opts]
 * @returns {void}
 */
export function applyStoredTheme({ storageKey, root }?: ApplyThemeOpts): void;
/**
 * Wire `[data-bronto-theme-toggle]` controls. Click toggles light/dark,
 * persists to localStorage, and **always** sets `data-theme` on <html>
 * (a theme is document-global). State is reflected via `aria-pressed`
 * and a `bronto:themechange` CustomEvent ({ detail: { theme } }) is
 * dispatched on <html> so consumers can sync their own UI without
 * racing the click handler. A control may set
 * `data-bronto-theme-toggle="dark"` to force a specific theme.
 *
 * `root` scopes event delegation and which controls are queried/reflected
 * (default `document`); it does not change where the theme is applied.
 *
 * @param {ThemeStorageOpts & import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initThemeToggle({ storageKey, root }?: ThemeStorageOpts & import("./internal.js").DelegateOpts): import("./internal.js").Cleanup;
export type ThemeStorageOpts = {
    /**
     * localStorage key for the persisted theme. Default: `"bronto-theme"`.
     */
    storageKey?: string | undefined;
};
/**
 * `root` is the element to set `data-theme` on. Default: `<html>`.
 */
export type ApplyThemeOpts = ThemeStorageOpts & {
    root?: Element;
};
export type ThemeChangeDetail = {
    /**
     * `bronto:themechange` CustomEvent detail.
     */
    theme: "light" | "dark";
};
//# sourceMappingURL=theme.d.ts.map