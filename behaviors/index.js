/**
 * @ponchia/ui — optional behaviors.
 *
 * The framework is CSS-first. This is the sanctioned home for the small
 * amount of JS that genuinely needs scripting (theme persistence, dismiss,
 * disclosure), so consumers don't each reimplement it.
 *
 * Framework-agnostic, dependency-free, side-effect-free on import, and
 * SSR-safe (every entry no-ops without a DOM). Each initializer uses event
 * delegation off a root and returns a cleanup function.
 *
 *   import { applyStoredTheme, initThemeToggle } from '@ponchia/ui/behaviors';
 *   applyStoredTheme();                 // before paint, avoids theme flash
 *   const stop = initThemeToggle();     // wire [data-bronto-theme-toggle]
 *
 * The public option/detail types are JSDoc `@typedef`s on the modules below,
 * re-exported here by name; the shipped `index.d.ts` is generated from this
 * source by `tsc --emitDeclarationOnly` (so the declarations cannot drift).
 *
 * @typedef {import('./internal.js').Cleanup} Cleanup
 * @typedef {import('./internal.js').DelegateOpts} DelegateOpts
 * @typedef {import('./theme.js').ThemeStorageOpts} ThemeStorageOpts
 * @typedef {import('./theme.js').ApplyThemeOpts} ApplyThemeOpts
 * @typedef {import('./theme.js').ThemeChangeDetail} ThemeChangeDetail
 * @typedef {import('./toast.js').ToastOpts} ToastOpts
 * @typedef {import('./legend.js').LegendToggleDetail} LegendToggleDetail
 * @typedef {import('./crosshair.js').CrosshairMoveDetail} CrosshairMoveDetail
 * @typedef {import('./command.js').CommandSelectDetail} CommandSelectDetail
 */
export { applyStoredTheme, initThemeToggle } from './theme.js';
export { dismissible } from './dismissible.js';
export { initTabs } from './tabs.js';
export { initDialog } from './dialog.js';
export { toast } from './toast.js';
export { initDisclosure } from './disclosure.js';
export { initMenu } from './menu.js';
export { initFormValidation } from './forms.js';
export { initCombobox } from './combobox.js';
export { initPopover } from './popover.js';
export { initTableSort } from './table.js';
export { initCarousel } from './carousel.js';
export { initDotGlyph } from './glyph.js';
export { initLegend } from './legend.js';
export { initConnectors } from './connectors.js';
export { initSpotlight } from './spotlight.js';
export { initCrosshair } from './crosshair.js';
export { initCommand } from './command.js';
