/**
 * @ponchia/ui/react — thin React bindings over @ponchia/ui/behaviors.
 *
 * The CSS is the framework; these are *optional* hooks that wrap the SSR-safe
 * vanilla `init*` behaviors in a component lifecycle (run on mount, clean up on
 * unmount). They are deliberately thin adapters — not a component library — per
 * the architecture ADR. `react` is an optional peer dependency.
 *
 * The behaviors delegate from a root (default `document`), so call a hook once
 * near the relevant subtree; pass `{ root: ref.current }` to scope it. The root
 * is captured on mount — keep it stable (a ref), like any effect dependency.
 *
 *   import { useDialog, useToast } from '@ponchia/ui/react';
 *   function App() {
 *     useDialog();                 // wires every .ui-modal under document
 *     const toast = useToast();
 *     return <button onClick={() => toast('Saved', { tone: 'success' })}>Save</button>;
 *   }
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
  toast,
} from '../behaviors/index.js';

/** Run a delegated behavior for the component's lifetime (init on mount, its
 *  returned cleanup on unmount). The behavior is run once; `opts` is captured
 *  on mount — pass a stable root (a ref) if you scope it. */
export function useBrontoBehavior(init, opts) {
  useEffect(() => init(opts), []); // eslint-disable-line react-hooks/exhaustive-deps -- delegated once on mount
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

// No-flash theme application has to run before paint; do it in an inline head
// script, not an effect. Re-exported for manual/SSR-bootstrap use.
export { applyStoredTheme };

// Convenience: the framework-agnostic class contract, re-exported so a React
// consumer needs one import.
export { cls, ui, cx } from '../classes/index.js';
