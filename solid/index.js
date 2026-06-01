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
 */
import { onMount, onCleanup } from 'solid-js';
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
 *  returned cleanup on dispose). Options resolve on mount, after refs exist. */
export function useBrontoBehavior(init, opts) {
  onMount(() => {
    const cleanup = init(resolveOpts(opts));
    if (typeof cleanup === 'function') onCleanup(cleanup);
  });
}

export const useThemeToggle = (opts) => useBrontoBehavior(initThemeToggle, opts);
export const useDismissible = (opts) => useBrontoBehavior(dismissible, opts);
export const useDisclosure = (opts) => useBrontoBehavior(initDisclosure, opts);
export const useMenu = (opts) => useBrontoBehavior(initMenu, opts);
export const useFormValidation = (opts) => useBrontoBehavior(initFormValidation, opts);
export const useCombobox = (opts) => useBrontoBehavior(initCombobox, opts);
export const usePopover = (opts) => useBrontoBehavior(initPopover, opts);
export const useTableSort = (opts) => useBrontoBehavior(initTableSort, opts);
export const useTabs = (opts) => useBrontoBehavior(initTabs, opts);
export const useDialog = (opts) => useBrontoBehavior(initDialog, opts);
export const useCarousel = (opts) => useBrontoBehavior(initCarousel, opts);
export const useDotGlyph = (opts) => useBrontoBehavior(initDotGlyph, opts);

/** The `toast()` imperative (no lifecycle of its own). */
export const useToast = () => toast;

// No-flash theme application must run before paint — do it in an inline head
// script, not on mount. Re-exported for manual/SSR-bootstrap use.
export { applyStoredTheme };

// Convenience: the framework-agnostic class contract, re-exported.
export { cls, ui, cx } from '../classes/index.js';
