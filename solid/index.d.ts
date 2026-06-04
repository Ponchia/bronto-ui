/** Run a delegated behavior for the component's lifetime (init on mount, its
 *  returned cleanup on dispose). Options resolve on mount, after refs exist.
 * @param {(opts?: DelegateOpts) => Cleanup | void} init
 * @param {BrontoBindingOptsResolver} [opts]
 * @returns {void}
 */
export function useBrontoBehavior(init: (opts?: DelegateOpts) => Cleanup | void, opts?: BrontoBindingOptsResolver): void;
/** @type {(opts?: BrontoBindingOptsResolver<ThemeStorageOpts & DelegateOpts>) => void} */
export const useThemeToggle: (opts?: BrontoBindingOptsResolver<ThemeStorageOpts & DelegateOpts>) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useDismissible: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useDisabledGuard: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useDisclosure: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useMenu: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useFormValidation: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useCombobox: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const usePopover: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useTableSort: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useTabs: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useDialog: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useModal: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useCarousel: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useDotGlyph: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useLegend: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useConnectors: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useSpotlight: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useCrosshair: (opts?: BrontoBindingOptsResolver) => void;
/** @type {(opts?: BrontoBindingOptsResolver) => void} */
export const useCommand: (opts?: BrontoBindingOptsResolver) => void;
/** The `toast()` imperative (no lifecycle of its own).
 * @type {() => (message: string, opts?: ToastOpts) => Cleanup} */
export const useToast: () => (message: string, opts?: ToastOpts) => Cleanup;
export { applyStoredTheme };
export type Cleanup = import("../behaviors/index.js").Cleanup;
export type DelegateOpts = import("../behaviors/index.js").DelegateOpts;
export type ThemeStorageOpts = import("../behaviors/index.js").ThemeStorageOpts;
export type ToastOpts = import("../behaviors/index.js").ToastOpts;
export type BrontoBindingRoot = Document | Element | {
    current: Document | Element | null | undefined;
} | (() => Document | Element | null | undefined) | null | undefined;
/**
 * Behavior options with the `root` widened to accept Solid refs/resolvers.
 */
export type BrontoBindingOpts<T extends DelegateOpts = import("../behaviors/internal.js").DelegateOpts> = Omit<T, "root"> & {
    root?: BrontoBindingRoot;
};
/**
 * `BrontoBindingOpts<T>`, or a callback that returns it on mount (after refs).
 */
export type BrontoBindingOptsResolver<T extends DelegateOpts = import("../behaviors/internal.js").DelegateOpts> = BrontoBindingOpts<T> | (() => BrontoBindingOpts<T> | null | undefined) | null | undefined;
import { applyStoredTheme } from '../behaviors/index.js';
export { cls, ui, cx } from "../classes/index.js";
//# sourceMappingURL=index.d.ts.map