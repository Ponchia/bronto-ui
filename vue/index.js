/**
 * @ponchia/ui/vue — thin Vue directives over @ponchia/ui/behaviors.
 *
 * The CSS is the framework; these are optional lifecycle adapters that run the
 * vanilla behavior initializers from Vue directive hooks. They are plain
 * directive objects, so this module has no runtime dependency on Vue.
 *
 *   import { brontoVue } from '@ponchia/ui/vue';
 *   app.use(brontoVue);
 *
 *   <main v-bronto-theme-toggle>
 *     <button data-bronto-theme-toggle>Toggle theme</button>
 *   </main>
 *
 * @typedef {import('../behaviors/index.js').Cleanup} Cleanup
 * @typedef {import('../behaviors/index.js').DelegateOpts} DelegateOpts
 * @typedef {import('../behaviors/index.js').ThemeStorageOpts} ThemeStorageOpts
 * @typedef {import('../behaviors/index.js').ToastOpts} ToastOpts
 *
 * @typedef {Document | Element | null | undefined} BrontoDirectiveRoot
 *
 * @typedef {Omit<DelegateOpts, 'root'> & { root?: BrontoDirectiveRoot }} BrontoDirectiveOpts
 *
 * @typedef {Omit<ThemeStorageOpts & DelegateOpts, 'root'> & { root?: BrontoDirectiveRoot }} BrontoThemeDirectiveOpts
 *
 * @typedef {{ value?: BrontoDirectiveOpts | null | undefined, oldValue?: BrontoDirectiveOpts | null | undefined }} BrontoDirectiveBinding
 *
 * @typedef {{ value?: BrontoThemeDirectiveOpts | null | undefined, oldValue?: BrontoThemeDirectiveOpts | null | undefined }} BrontoThemeDirectiveBinding
 *
 * @typedef {{ mounted: (el: Element, binding?: BrontoDirectiveBinding) => void, updated: (el: Element, binding?: BrontoDirectiveBinding) => void, beforeUnmount: (el: Element) => void }} BrontoDirective
 *
 * @typedef {{ mounted: (el: Element, binding?: BrontoThemeDirectiveBinding) => void, updated: (el: Element, binding?: BrontoThemeDirectiveBinding) => void, beforeUnmount: (el: Element) => void }} BrontoThemeDirective
 *
 * @typedef {{ directive: (name: string, directive: BrontoDirective | BrontoThemeDirective) => unknown }} BrontoVueApp
 *
 * @typedef {{ install: (app: BrontoVueApp) => void }} BrontoVuePlugin
 */
import {
  applyStoredTheme,
  initThemeToggle,
  dismissible as initDismissible,
  initDisabledGuard,
  initDisclosure,
  initMenu,
  initFormValidation,
  initCombobox,
  initPopover,
  initTableSort,
  initTabs,
  initDialog,
  initModal,
  initCarousel,
  initDotGlyph,
  initLegend,
  initConnectors,
  initSpotlight,
  initCrosshair,
  initCommand,
  initSources,
  initSplitter,
  toast,
} from '../behaviors/index.js';

const cleanups = new WeakMap();

function cleanupMap(el) {
  let map = cleanups.get(el);
  if (!map) {
    map = new Map();
    cleanups.set(el, map);
  }
  return map;
}

function stop(el, key) {
  const map = cleanups.get(el);
  const cleanup = map?.get(key);
  if (typeof cleanup === 'function') cleanup();
  map?.delete(key);
  if (map?.size === 0) cleanups.delete(el);
}

function resolveOpts(el, opts) {
  if (!opts || typeof opts !== 'object') return { root: el };
  if (!('root' in opts)) return { ...opts, root: el };
  return { ...opts, root: opts.root || null };
}

function start(el, key, init, opts) {
  stop(el, key);
  const cleanup = init(resolveOpts(el, opts));
  if (typeof cleanup === 'function') cleanupMap(el).set(key, cleanup);
}

/**
 * Create a Vue directive object from any Bronto delegated behavior initializer.
 *
 * @param {(opts?: DelegateOpts) => Cleanup | void} init
 * @returns {BrontoDirective}
 */
export function createBrontoDirective(init) {
  const key = Symbol('bronto-vue-directive');
  return {
    mounted(el, binding) {
      start(el, key, init, binding?.value);
    },
    updated(el, binding) {
      if (binding?.value === binding?.oldValue) return;
      start(el, key, init, binding?.value);
    },
    beforeUnmount(el) {
      stop(el, key);
    },
  };
}

/** @type {BrontoThemeDirective} */
export const vThemeToggle = createBrontoDirective(initThemeToggle);
/** @type {BrontoDirective} */
export const vDismissible = createBrontoDirective(initDismissible);
/** @type {BrontoDirective} */
export const vDisabledGuard = createBrontoDirective(initDisabledGuard);
/** @type {BrontoDirective} */
export const vDisclosure = createBrontoDirective(initDisclosure);
/** @type {BrontoDirective} */
export const vMenu = createBrontoDirective(initMenu);
/** @type {BrontoDirective} */
export const vFormValidation = createBrontoDirective(initFormValidation);
/** @type {BrontoDirective} */
export const vCombobox = createBrontoDirective(initCombobox);
/** @type {BrontoDirective} */
export const vPopover = createBrontoDirective(initPopover);
/** @type {BrontoDirective} */
export const vTableSort = createBrontoDirective(initTableSort);
/** @type {BrontoDirective} */
export const vTabs = createBrontoDirective(initTabs);
/** @type {BrontoDirective} */
export const vDialog = createBrontoDirective(initDialog);
/** @type {BrontoDirective} */
export const vModal = createBrontoDirective(initModal);
/** @type {BrontoDirective} */
export const vCarousel = createBrontoDirective(initCarousel);
/** @type {BrontoDirective} */
export const vDotGlyph = createBrontoDirective(initDotGlyph);
/** @type {BrontoDirective} */
export const vLegend = createBrontoDirective(initLegend);
/** @type {BrontoDirective} */
export const vConnectors = createBrontoDirective(initConnectors);
/** @type {BrontoDirective} */
export const vSpotlight = createBrontoDirective(initSpotlight);
/** @type {BrontoDirective} */
export const vCrosshair = createBrontoDirective(initCrosshair);
/** @type {BrontoDirective} */
export const vCommand = createBrontoDirective(initCommand);
/** @type {BrontoDirective} */
export const vSources = createBrontoDirective(initSources);
/** @type {BrontoDirective} */
export const vSplitter = createBrontoDirective(initSplitter);

export const directives = Object.freeze({
  themeToggle: vThemeToggle,
  dismissible: vDismissible,
  disabledGuard: vDisabledGuard,
  disclosure: vDisclosure,
  menu: vMenu,
  formValidation: vFormValidation,
  combobox: vCombobox,
  popover: vPopover,
  tableSort: vTableSort,
  tabs: vTabs,
  dialog: vDialog,
  modal: vModal,
  carousel: vCarousel,
  dotGlyph: vDotGlyph,
  legend: vLegend,
  connectors: vConnectors,
  spotlight: vSpotlight,
  crosshair: vCrosshair,
  command: vCommand,
  sources: vSources,
  splitter: vSplitter,
});

const directiveNames = {
  themeToggle: 'bronto-theme-toggle',
  dismissible: 'bronto-dismissible',
  disabledGuard: 'bronto-disabled-guard',
  disclosure: 'bronto-disclosure',
  menu: 'bronto-menu',
  formValidation: 'bronto-form-validation',
  combobox: 'bronto-combobox',
  popover: 'bronto-popover',
  tableSort: 'bronto-table-sort',
  tabs: 'bronto-tabs',
  dialog: 'bronto-dialog',
  modal: 'bronto-modal',
  carousel: 'bronto-carousel',
  dotGlyph: 'bronto-dot-glyph',
  legend: 'bronto-legend',
  connectors: 'bronto-connectors',
  spotlight: 'bronto-spotlight',
  crosshair: 'bronto-crosshair',
  command: 'bronto-command',
  sources: 'bronto-sources',
  splitter: 'bronto-splitter',
};

const camelizeDirectiveName = (name) => name.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());

/** @type {BrontoVuePlugin} */
export const brontoVue = Object.freeze({
  install(app) {
    for (const [key, directive] of Object.entries(directives)) {
      const name = directiveNames[key];
      app.directive(name, directive);
      app.directive(camelizeDirectiveName(name), directive);
    }
  },
});

export default brontoVue;

/** The `toast()` imperative (no lifecycle of its own).
 * @returns {(message: string, opts?: ToastOpts) => Cleanup} */
export const useToast = () => toast;

export { applyStoredTheme, toast };
export { cls, ui, cx } from '../classes/index.js';
