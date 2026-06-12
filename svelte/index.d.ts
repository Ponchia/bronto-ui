/**
 * Create a Svelte action from any Bronto delegated behavior initializer.
 *
 * @param {(opts?: DelegateOpts) => Cleanup | void} init
 * @returns {(node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn}
 */
export function createBrontoAction(init: (opts?: DelegateOpts) => Cleanup | void): (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
/**
 * Generic escape hatch for custom behavior initializers.
 *
 * @param {Element} node
 * @param {BrontoBehaviorParams | null | undefined} params
 * @returns {SvelteActionReturn}
 */
export function brontoBehavior(node: Element, params: BrontoBehaviorParams | null | undefined): SvelteActionReturn;
/**
 * Generic escape hatch for custom behavior initializers.
 *
 * @param {Element} node
 * @param {BrontoBehaviorParams | null | undefined} params
 * @returns {SvelteActionReturn}
 */
export function useBrontoBehavior(node: Element, params: BrontoBehaviorParams | null | undefined): SvelteActionReturn;
/** @type {(node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn} */
export const themeToggle: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const dismissible: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const disabledGuard: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const disclosure: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const menu: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const formValidation: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const combobox: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const popover: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const tableSort: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const tabs: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const dialog: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const modal: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const carousel: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const dotGlyph: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const legend: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const connectors: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const spotlight: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const crosshair: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const command: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const sources: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const splitter: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useThemeToggle: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useDismissible: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useDisabledGuard: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useDisclosure: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useMenu: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useFormValidation: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useCombobox: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const usePopover: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useTableSort: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useTabs: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useDialog: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useModal: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useCarousel: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useDotGlyph: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useLegend: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useConnectors: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useSpotlight: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useCrosshair: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useCommand: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useSources: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export const useSplitter: (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export function useToast(): (message: string, opts?: ToastOpts) => Cleanup;
export type Cleanup = import("../behaviors/index.js").Cleanup;
export type DelegateOpts = import("../behaviors/index.js").DelegateOpts;
export type ThemeStorageOpts = import("../behaviors/index.js").ThemeStorageOpts;
export type ToastOpts = import("../behaviors/index.js").ToastOpts;
export type BrontoActionRoot = Document | Element | null | undefined;
export type BrontoActionOpts = Omit<DelegateOpts, "root"> & {
    root?: BrontoActionRoot;
};
export type BrontoBehaviorParams = {
    init: (opts?: DelegateOpts) => Cleanup | void;
    opts?: BrontoActionOpts | null | undefined;
};
export type SvelteActionReturn = {
    update?: (next?: unknown) => void;
    destroy: () => void;
};
import { applyStoredTheme } from '../behaviors/index.js';
import { toast } from '../behaviors/index.js';
export { applyStoredTheme, toast };
export { cls, ui, cx } from "../classes/index.js";
//# sourceMappingURL=index.d.ts.map