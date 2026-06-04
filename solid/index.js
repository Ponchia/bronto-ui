/**
 * @ponchia/ui/solid — thin Solid bindings over @ponchia/ui/behaviors.
 *
 * The CSS is the framework; these are *optional* primitives that wrap the
 * SSR-safe vanilla `init*` behaviors in Solid's lifecycle (run on mount, clean
 * up on dispose). Thin adapters, not a component library (architecture ADR).
 * `solid-js` is an optional peer dependency.
 *
 * Behaviors delegate from a root (default `document`); call a primitive once in
 * a component that owns the relevant subtree, and pass a root resolver to scope
 * it when the element is assigned by Solid's ref lifecycle.
 *
 *   import { useDialog, useToast } from '@ponchia/ui/solid';
 *   function App() {
 *     useDialog();                 // wires every .ui-modal under document
 *     const toast = useToast();
 *     return <button onClick={() => toast('Saved', { tone: 'success' })}>Save</button>;
 *   }
 *
 * The public types below are JSDoc `@typedef`s; the shipped `index.d.ts` is
 * generated from them (and these signatures) by `tsc --emitDeclarationOnly`.
 *
 * @typedef {import('../behaviors/index.js').Cleanup} Cleanup
 * @typedef {import('../behaviors/index.js').DelegateOpts} DelegateOpts
 * @typedef {import('../behaviors/index.js').ThemeStorageOpts} ThemeStorageOpts
 * @typedef {import('../behaviors/index.js').ToastOpts} ToastOpts
 *
 * @typedef {Document
 *   | Element
 *   | { current: Document | Element | null | undefined }
 *   | (() => Document | Element | null | undefined)
 *   | null
 *   | undefined} BrontoBindingRoot
 */

/**
 * Behavior options with the `root` widened to accept Solid refs/resolvers.
 * @template {DelegateOpts} [T=DelegateOpts]
 * @typedef {Omit<T, 'root'> & { root?: BrontoBindingRoot }} BrontoBindingOpts
 */

/**
 * `BrontoBindingOpts<T>`, or a callback that returns it on mount (after refs).
 * @template {DelegateOpts} [T=DelegateOpts]
 * @typedef {BrontoBindingOpts<T>
 *   | (() => BrontoBindingOpts<T> | null | undefined)
 *   | null
 *   | undefined} BrontoBindingOptsResolver
 */
import { onMount, onCleanup } from 'solid-js';
import {
  applyStoredTheme,
  initThemeToggle,
  dismissible,
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
  toast,
} from '../behaviors/index.js';

function resolveMaybe(v) {
  return typeof v === 'function' ? v() : v;
}

function resolveRoot(root) {
  const value = resolveMaybe(root);
  if (value && typeof value === 'object' && 'current' in value) return value.current;
  return value;
}

function resolveOpts(opts) {
  const value = resolveMaybe(opts);
  if (!value || typeof value !== 'object') return undefined;
  // No `root` key → no scope requested; leave root out so the behavior
  // delegates from `document`. A `root` key that resolves falsy means a scope
  // WAS requested but the ref is not ready: emit `root: null` so the behavior
  // no-ops instead of hijacking the whole document.
  if (!('root' in value)) return { ...value };
  const root = resolveRoot(value.root);
  return { ...value, root: root || null };
}

/** Run a delegated behavior for the component's lifetime (init on mount, its
 *  returned cleanup on dispose). Options resolve on mount, after refs exist.
 * @param {(opts?: DelegateOpts) => Cleanup | void} init
 * @param {BrontoBindingOptsResolver} [opts]
 * @returns {void}
 */
export function useBrontoBehavior(init, opts) {
  onMount(() => {
    const cleanup = init(resolveOpts(opts));
    if (typeof cleanup === 'function') onCleanup(cleanup);
  });
}

/** @type {(opts?: BrontoBindingOptsResolver<ThemeStorageOpts & DelegateOpts>) => void} */
export const useThemeToggle = (opts) => useBrontoBehavior(initThemeToggle, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useDismissible = (opts) => useBrontoBehavior(dismissible, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useDisabledGuard = (opts) => useBrontoBehavior(initDisabledGuard, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useDisclosure = (opts) => useBrontoBehavior(initDisclosure, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useMenu = (opts) => useBrontoBehavior(initMenu, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useFormValidation = (opts) => useBrontoBehavior(initFormValidation, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useCombobox = (opts) => useBrontoBehavior(initCombobox, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const usePopover = (opts) => useBrontoBehavior(initPopover, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useTableSort = (opts) => useBrontoBehavior(initTableSort, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useTabs = (opts) => useBrontoBehavior(initTabs, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useDialog = (opts) => useBrontoBehavior(initDialog, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useModal = (opts) => useBrontoBehavior(initModal, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useCarousel = (opts) => useBrontoBehavior(initCarousel, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useDotGlyph = (opts) => useBrontoBehavior(initDotGlyph, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useLegend = (opts) => useBrontoBehavior(initLegend, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useConnectors = (opts) => useBrontoBehavior(initConnectors, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useSpotlight = (opts) => useBrontoBehavior(initSpotlight, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useCrosshair = (opts) => useBrontoBehavior(initCrosshair, opts);
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useCommand = (opts) => useBrontoBehavior(initCommand, opts);

/** The `toast()` imperative (no lifecycle of its own).
 * @type {() => (message: string, opts?: ToastOpts) => Cleanup} */
export const useToast = () => toast;

// No-flash theme application must run before paint — do it in an inline head
// script, not on mount. Re-exported for manual/SSR-bootstrap use.
export { applyStoredTheme };

// Convenience: the framework-agnostic class contract, re-exported.
export { cls, ui, cx } from '../classes/index.js';
