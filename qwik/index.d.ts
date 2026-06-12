/** Generic escape hatch. NOTE for Qwik: prefer the specific `use*` hooks
 *  below — they inline a statically-imported behavior so the optimizer can
 *  serialize the task. Passing a runtime function here is only safe when it
 *  is itself optimizer-visible (a module import).
 *  @param {(opts?: DelegateOpts) => Cleanup | void} init
 *  @param {BrontoBindingOptsResolver} [opts]
 *  @returns {void} */
export function useBrontoBehavior(init: (opts?: DelegateOpts) => Cleanup | void, opts?: BrontoBindingOptsResolver): void;
export function useThemeToggle(opts?: BrontoBindingOptsResolver<ThemeStorageOpts & DelegateOpts>): void;
export function useDismissible(opts?: BrontoBindingOptsResolver): void;
export function useDisabledGuard(opts?: BrontoBindingOptsResolver): void;
export function useDisclosure(opts?: BrontoBindingOptsResolver): void;
export function useMenu(opts?: BrontoBindingOptsResolver): void;
export function useFormValidation(opts?: BrontoBindingOptsResolver): void;
export function useCombobox(opts?: BrontoBindingOptsResolver): void;
export function usePopover(opts?: BrontoBindingOptsResolver): void;
export function useTableSort(opts?: BrontoBindingOptsResolver): void;
export function useTabs(opts?: BrontoBindingOptsResolver): void;
export function useDialog(opts?: BrontoBindingOptsResolver): void;
export function useModal(opts?: BrontoBindingOptsResolver): void;
export function useCarousel(opts?: BrontoBindingOptsResolver): void;
export function useDotGlyph(opts?: BrontoBindingOptsResolver): void;
export function useLegend(opts?: BrontoBindingOptsResolver): void;
export function useConnectors(opts?: BrontoBindingOptsResolver): void;
export function useSpotlight(opts?: BrontoBindingOptsResolver): void;
export function useCrosshair(opts?: BrontoBindingOptsResolver): void;
export function useCommand(opts?: BrontoBindingOptsResolver): void;
export function useSources(opts?: BrontoBindingOptsResolver): void;
export function useSplitter(opts?: BrontoBindingOptsResolver): void;
export function useToast(): (message: string, opts?: ToastOpts) => Cleanup;
export { applyStoredTheme };
export type Cleanup = import("../behaviors/index.js").Cleanup;
export type DelegateOpts = import("../behaviors/index.js").DelegateOpts;
export type ThemeStorageOpts = import("../behaviors/index.js").ThemeStorageOpts;
export type ToastOpts = import("../behaviors/index.js").ToastOpts;
export type BrontoBindingRoot = Document | Element | {
    value: Document | Element | null | undefined;
} | {
    current: Document | Element | null | undefined;
} | (() => Document | Element | null | undefined) | null | undefined;
export type BrontoBindingOpts<T extends DelegateOpts = import("../behaviors/internal.js").DelegateOpts> = Omit<T, "root"> & {
    root?: BrontoBindingRoot;
};
export type BrontoBindingOptsResolver<T extends DelegateOpts = import("../behaviors/internal.js").DelegateOpts> = BrontoBindingOpts<T> | (() => BrontoBindingOpts<T> | null | undefined) | null | undefined;
import { applyStoredTheme } from '../behaviors/index.js';
export { cls, ui, cx } from "../classes/index.js";
//# sourceMappingURL=index.d.ts.map