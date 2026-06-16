/**
 * @ponchia/ui/svelte — thin Svelte actions over @ponchia/ui/behaviors.
 *
 * The CSS is the framework; these are optional lifecycle adapters that run the
 * SSR-safe vanilla behavior initializers when a Svelte action mounts and clean
 * them up when the action updates or is destroyed. They do not define markup,
 * own state, or depend on Svelte at runtime.
 *
 *   <script>
 *     import { themeToggle } from '@ponchia/ui/svelte';
 *   </script>
 *
 *   <main use:themeToggle>
 *     <button data-bronto-theme-toggle>Toggle theme</button>
 *   </main>
 *
 * @typedef {import('../behaviors/index.js').Cleanup} Cleanup
 * @typedef {import('../behaviors/index.js').DelegateOpts} DelegateOpts
 * @typedef {import('../behaviors/index.js').ThemeStorageOpts} ThemeStorageOpts
 * @typedef {import('../behaviors/index.js').ToastOpts} ToastOpts
 *
 * @typedef {Document | Element | null | undefined} BrontoActionRoot
 *
 * @typedef {Omit<DelegateOpts, 'root'> & { root?: BrontoActionRoot }} BrontoActionOpts
 *
 * @typedef {Omit<ThemeStorageOpts & DelegateOpts, 'root'> & { root?: BrontoActionRoot }} BrontoThemeActionOpts
 *
 * @typedef {{ init: (opts?: DelegateOpts) => Cleanup | void, opts?: BrontoActionOpts | null | undefined }} BrontoBehaviorParams
 *
 * @typedef {(node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn} BrontoAction
 *
 * @typedef {(node: Element, opts?: BrontoThemeActionOpts | null | undefined) => SvelteActionReturn} BrontoThemeAction
 *
 * @typedef {{ update?: (next?: unknown) => void, destroy: () => void }} SvelteActionReturn
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

function stop(cleanup) {
  if (typeof cleanup === 'function') cleanup();
}

function resolveOpts(node, opts) {
  if (!opts || typeof opts !== 'object') return { root: node };
  if (!('root' in opts)) return { ...opts, root: node };
  return { ...opts, root: opts.root || null };
}

function run(node, init, opts) {
  if (typeof init !== 'function') return () => {};
  const cleanup = init(resolveOpts(node, opts));
  return typeof cleanup === 'function' ? cleanup : () => {};
}

/**
 * Create a Svelte action from any Bronto delegated behavior initializer.
 *
 * @param {(opts?: DelegateOpts) => Cleanup | void} init
 * @returns {BrontoAction}
 */
export function createBrontoAction(init) {
  return (node, opts) => {
    let cleanup = run(node, init, opts);
    return {
      update(next) {
        stop(cleanup);
        cleanup = run(node, init, next);
      },
      destroy() {
        stop(cleanup);
      },
    };
  };
}

/**
 * Generic escape hatch for custom behavior initializers.
 *
 * @param {Element} node
 * @param {BrontoBehaviorParams | null | undefined} params
 * @returns {SvelteActionReturn}
 */
export function brontoBehavior(node, params) {
  let cleanup = run(node, params?.init, params?.opts);
  return {
    update(next) {
      stop(cleanup);
      cleanup = run(node, next?.init, next?.opts);
    },
    destroy() {
      stop(cleanup);
    },
  };
}

export const useBrontoBehavior = brontoBehavior;

/** @type {BrontoThemeAction} */
export const themeToggle = createBrontoAction(initThemeToggle);
/** @type {BrontoAction} */
export const dismissible = createBrontoAction(initDismissible);
/** @type {BrontoAction} */
export const disabledGuard = createBrontoAction(initDisabledGuard);
/** @type {BrontoAction} */
export const disclosure = createBrontoAction(initDisclosure);
/** @type {BrontoAction} */
export const menu = createBrontoAction(initMenu);
/** @type {BrontoAction} */
export const formValidation = createBrontoAction(initFormValidation);
/** @type {BrontoAction} */
export const combobox = createBrontoAction(initCombobox);
/** @type {BrontoAction} */
export const popover = createBrontoAction(initPopover);
/** @type {BrontoAction} */
export const tableSort = createBrontoAction(initTableSort);
/** @type {BrontoAction} */
export const tabs = createBrontoAction(initTabs);
/** @type {BrontoAction} */
export const dialog = createBrontoAction(initDialog);
/** @type {BrontoAction} */
export const modal = createBrontoAction(initModal);
/** @type {BrontoAction} */
export const carousel = createBrontoAction(initCarousel);
/** @type {BrontoAction} */
export const dotGlyph = createBrontoAction(initDotGlyph);
/** @type {BrontoAction} */
export const legend = createBrontoAction(initLegend);
/** @type {BrontoAction} */
export const connectors = createBrontoAction(initConnectors);
/** @type {BrontoAction} */
export const spotlight = createBrontoAction(initSpotlight);
/** @type {BrontoAction} */
export const crosshair = createBrontoAction(initCrosshair);
/** @type {BrontoAction} */
export const command = createBrontoAction(initCommand);
/** @type {BrontoAction} */
export const sources = createBrontoAction(initSources);
/** @type {BrontoAction} */
export const splitter = createBrontoAction(initSplitter);

// Hook-style aliases keep this action surface parallel with React/Solid/Qwik.
/** @type {BrontoThemeAction} */
export const useThemeToggle = themeToggle;
export const useDismissible = dismissible;
export const useDisabledGuard = disabledGuard;
export const useDisclosure = disclosure;
export const useMenu = menu;
export const useFormValidation = formValidation;
export const useCombobox = combobox;
export const usePopover = popover;
export const useTableSort = tableSort;
export const useTabs = tabs;
export const useDialog = dialog;
export const useModal = modal;
export const useCarousel = carousel;
export const useDotGlyph = dotGlyph;
export const useLegend = legend;
export const useConnectors = connectors;
export const useSpotlight = spotlight;
export const useCrosshair = crosshair;
export const useCommand = command;
export const useSources = sources;
export const useSplitter = splitter;

/** The `toast()` imperative (no lifecycle of its own).
 * @returns {(message: string, opts?: ToastOpts) => Cleanup} */
export const useToast = () => toast;

export { applyStoredTheme, toast };
export { cls, ui, cx } from '../classes/index.js';
