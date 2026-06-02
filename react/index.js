/**
 * @ponchia/ui/react — thin React bindings over @ponchia/ui/behaviors.
 *
 * The CSS is the framework; these are *optional* hooks that wrap the SSR-safe
 * vanilla `init*` behaviors in a component lifecycle (run on mount, clean up on
 * unmount). They are deliberately thin adapters — not a component library — per
 * the architecture ADR. `react` is an optional peer dependency.
 *
 * The behaviors delegate from a root (default `document`), so call a hook once
 * near the relevant subtree; pass `{ root: ref }` or a resolver callback to
 * scope it. The options resolve on mount, after refs have been assigned.
 *
 *   import { useDialog, useToast } from '@ponchia/ui/react';
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
 * @template {DelegateOpts} [T=DelegateOpts]
 * @typedef {Omit<T, 'root'> & { root?: BrontoBindingRoot }} BrontoBindingOpts
 */

/**
 * @template {DelegateOpts} [T=DelegateOpts]
 * @typedef {BrontoBindingOpts<T>
 *   | (() => BrontoBindingOpts<T> | null | undefined)
 *   | null
 *   | undefined} BrontoBindingOptsResolver
 */
import { useEffect } from 'react';
import {
  applyStoredTheme,
  initThemeToggle,
  dismissible,
  initDisclosure,
  initMenu,
  initFormValidation,
  initCombobox,
  initPopover,
  initTableSort,
  initTabs,
  initDialog,
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
  const root = resolveRoot(value.root);
  return root ? { ...value, root } : { ...value, root: undefined };
}

/** Run a delegated behavior for the component's lifetime (init on mount, its
 *  returned cleanup on unmount). The behavior is run once; `opts` resolves
 *  on mount so refs are usable for scoped roots.
 *  @param {(opts?: DelegateOpts) => Cleanup | void} init
 *  @param {BrontoBindingOptsResolver} [opts]
 *  @returns {void} */
export function useBrontoBehavior(init, opts) {
  useEffect(() => init(resolveOpts(opts)), []); // eslint-disable-line react-hooks/exhaustive-deps -- delegated once on mount
}

/** @param {BrontoBindingOptsResolver<ThemeStorageOpts & DelegateOpts>} [opts] @returns {void} */
export const useThemeToggle = (opts) => useBrontoBehavior(initThemeToggle, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useDismissible = (opts) => useBrontoBehavior(dismissible, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useDisclosure = (opts) => useBrontoBehavior(initDisclosure, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useMenu = (opts) => useBrontoBehavior(initMenu, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useFormValidation = (opts) => useBrontoBehavior(initFormValidation, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useCombobox = (opts) => useBrontoBehavior(initCombobox, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const usePopover = (opts) => useBrontoBehavior(initPopover, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useTableSort = (opts) => useBrontoBehavior(initTableSort, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useTabs = (opts) => useBrontoBehavior(initTabs, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useDialog = (opts) => useBrontoBehavior(initDialog, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useCarousel = (opts) => useBrontoBehavior(initCarousel, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useDotGlyph = (opts) => useBrontoBehavior(initDotGlyph, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useLegend = (opts) => useBrontoBehavior(initLegend, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useConnectors = (opts) => useBrontoBehavior(initConnectors, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useSpotlight = (opts) => useBrontoBehavior(initSpotlight, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useCrosshair = (opts) => useBrontoBehavior(initCrosshair, opts);
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useCommand = (opts) => useBrontoBehavior(initCommand, opts);

/** The `toast()` imperative (no lifecycle of its own).
 *  @returns {(message: string, opts?: ToastOpts) => Cleanup} */
export const useToast = () => toast;

// No-flash theme application has to run before paint; do it in an inline head
// script, not an effect. Re-exported for manual/SSR-bootstrap use.
export { applyStoredTheme };

// Convenience: the framework-agnostic class contract, re-exported so a React
// consumer needs one import.
export { cls, ui, cx } from '../classes/index.js';
