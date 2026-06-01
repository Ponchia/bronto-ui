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

export type BrontoBindingRoot =
  | Document
  | Element
  | { current: Document | Element | null | undefined }
  | (() => Document | Element | null | undefined)
  | null
  | undefined;

export type BrontoBindingOpts<T extends DelegateOpts = DelegateOpts> = Omit<T, 'root'> & {
  root?: BrontoBindingRoot;
};

export type BrontoBindingOptsResolver<T extends DelegateOpts = DelegateOpts> =
  | BrontoBindingOpts<T>
  | (() => BrontoBindingOpts<T> | null | undefined)
  | null
  | undefined;

/** Run any delegated behavior for the component's lifetime (init on mount,
 *  its returned cleanup on dispose). The behavior is run once. Options resolve
 *  on mount, so scoped roots may be refs or resolver callbacks. */
export declare function useBrontoBehavior(
  init: (opts?: DelegateOpts) => Cleanup | void,
  opts?: BrontoBindingOptsResolver,
): void;

export declare function useThemeToggle(
  opts?: BrontoBindingOptsResolver<ThemeStorageOpts & DelegateOpts>,
): void;
export declare function useDismissible(opts?: BrontoBindingOptsResolver): void;
export declare function useDisclosure(opts?: BrontoBindingOptsResolver): void;
export declare function useMenu(opts?: BrontoBindingOptsResolver): void;
export declare function useFormValidation(opts?: BrontoBindingOptsResolver): void;
export declare function useCombobox(opts?: BrontoBindingOptsResolver): void;
export declare function usePopover(opts?: BrontoBindingOptsResolver): void;
export declare function useTableSort(opts?: BrontoBindingOptsResolver): void;
export declare function useTabs(opts?: BrontoBindingOptsResolver): void;
export declare function useDialog(opts?: BrontoBindingOptsResolver): void;
export declare function useCarousel(opts?: BrontoBindingOptsResolver): void;
export declare function useDotGlyph(opts?: BrontoBindingOptsResolver): void;
export declare function useLegend(opts?: BrontoBindingOptsResolver): void;
export declare function useConnectors(opts?: BrontoBindingOptsResolver): void;
export declare function useSpotlight(opts?: BrontoBindingOptsResolver): void;
export declare function useCrosshair(opts?: BrontoBindingOptsResolver): void;

/** The `toast()` imperative (no lifecycle of its own). */
export declare function useToast(): (message: string, opts?: ToastOpts) => Cleanup;

export { applyStoredTheme } from '../behaviors/index.js';
export { cls, ui, cx } from '../classes/index.js';
