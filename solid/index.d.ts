/** @ponchia/ui/solid — thin Solid bindings over the SSR-safe behaviors.
 *  Optional peer dep `solid-js`. Primitives run a delegated behavior for the
 *  component's lifetime; they take the same options as the behavior and return
 *  void (the cleanup is wired to dispose). See behaviors/index.d.ts. */
import type {
  Cleanup,
  DelegateOpts,
  ThemeStorageOpts,
  ToastOpts,
} from '../behaviors/index.js';

/** Run any delegated behavior for the component's lifetime (init on mount,
 *  its returned cleanup on dispose). */
export declare function useBrontoBehavior(
  init: (opts?: DelegateOpts) => Cleanup | void,
  opts?: DelegateOpts,
): void;

export declare function useThemeToggle(opts?: ThemeStorageOpts & DelegateOpts): void;
export declare function useDismissible(opts?: DelegateOpts): void;
export declare function useDisclosure(opts?: DelegateOpts): void;
export declare function useMenu(opts?: DelegateOpts): void;
export declare function useFormValidation(opts?: DelegateOpts): void;
export declare function useCombobox(opts?: DelegateOpts): void;
export declare function usePopover(opts?: DelegateOpts): void;
export declare function useTableSort(opts?: DelegateOpts): void;
export declare function useTabs(opts?: DelegateOpts): void;
export declare function useDialog(opts?: DelegateOpts): void;
export declare function useCarousel(opts?: DelegateOpts): void;
export declare function useDotGlyph(opts?: DelegateOpts): void;

/** The `toast()` imperative (no lifecycle of its own). */
export declare function useToast(): (message: string, opts?: ToastOpts) => Cleanup;

export { applyStoredTheme } from '../behaviors/index.js';
export { cls, ui, cx } from '../classes/index.js';
