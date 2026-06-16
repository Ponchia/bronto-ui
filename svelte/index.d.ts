/**
 * Create a Svelte action from any Bronto delegated behavior initializer.
 *
 * @param {(opts?: DelegateOpts) => Cleanup | void} init
 * @returns {BrontoAction}
 */
export function createBrontoAction(init: (opts?: DelegateOpts) => Cleanup | void): BrontoAction;
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
/** @type {BrontoThemeAction} */
export const themeToggle: BrontoThemeAction;
/** @type {BrontoAction} */
export const dismissible: BrontoAction;
/** @type {BrontoAction} */
export const disabledGuard: BrontoAction;
/** @type {BrontoAction} */
export const disclosure: BrontoAction;
/** @type {BrontoAction} */
export const menu: BrontoAction;
/** @type {BrontoAction} */
export const formValidation: BrontoAction;
/** @type {BrontoAction} */
export const combobox: BrontoAction;
/** @type {BrontoAction} */
export const popover: BrontoAction;
/** @type {BrontoAction} */
export const tableSort: BrontoAction;
/** @type {BrontoAction} */
export const tabs: BrontoAction;
/** @type {BrontoAction} */
export const dialog: BrontoAction;
/** @type {BrontoAction} */
export const modal: BrontoAction;
/** @type {BrontoAction} */
export const carousel: BrontoAction;
/** @type {BrontoAction} */
export const dotGlyph: BrontoAction;
/** @type {BrontoAction} */
export const legend: BrontoAction;
/** @type {BrontoAction} */
export const connectors: BrontoAction;
/** @type {BrontoAction} */
export const spotlight: BrontoAction;
/** @type {BrontoAction} */
export const crosshair: BrontoAction;
/** @type {BrontoAction} */
export const command: BrontoAction;
/** @type {BrontoAction} */
export const sources: BrontoAction;
/** @type {BrontoAction} */
export const splitter: BrontoAction;
/** @type {BrontoThemeAction} */
export const useThemeToggle: BrontoThemeAction;
export const useDismissible: BrontoAction;
export const useDisabledGuard: BrontoAction;
export const useDisclosure: BrontoAction;
export const useMenu: BrontoAction;
export const useFormValidation: BrontoAction;
export const useCombobox: BrontoAction;
export const usePopover: BrontoAction;
export const useTableSort: BrontoAction;
export const useTabs: BrontoAction;
export const useDialog: BrontoAction;
export const useModal: BrontoAction;
export const useCarousel: BrontoAction;
export const useDotGlyph: BrontoAction;
export const useLegend: BrontoAction;
export const useConnectors: BrontoAction;
export const useSpotlight: BrontoAction;
export const useCrosshair: BrontoAction;
export const useCommand: BrontoAction;
export const useSources: BrontoAction;
export const useSplitter: BrontoAction;
export function useToast(): (message: string, opts?: ToastOpts) => Cleanup;
export type Cleanup = import("../behaviors/index.js").Cleanup;
export type DelegateOpts = import("../behaviors/index.js").DelegateOpts;
export type ThemeStorageOpts = import("../behaviors/index.js").ThemeStorageOpts;
export type ToastOpts = import("../behaviors/index.js").ToastOpts;
export type BrontoActionRoot = Document | Element | null | undefined;
export type BrontoActionOpts = Omit<DelegateOpts, "root"> & {
    root?: BrontoActionRoot;
};
export type BrontoThemeActionOpts = Omit<ThemeStorageOpts & DelegateOpts, "root"> & {
    root?: BrontoActionRoot;
};
export type BrontoBehaviorParams = {
    init: (opts?: DelegateOpts) => Cleanup | void;
    opts?: BrontoActionOpts | null | undefined;
};
export type BrontoAction = (node: Element, opts?: BrontoActionOpts | null | undefined) => SvelteActionReturn;
export type BrontoThemeAction = (node: Element, opts?: BrontoThemeActionOpts | null | undefined) => SvelteActionReturn;
export type SvelteActionReturn = {
    update?: (next?: unknown) => void;
    destroy: () => void;
};
import { applyStoredTheme } from '../behaviors/index.js';
import { toast } from '../behaviors/index.js';
export { applyStoredTheme, toast };
export { cls, ui, cx } from "../classes/index.js";
//# sourceMappingURL=index.d.ts.map