/**
 * Create a Vue directive object from any Bronto delegated behavior initializer.
 *
 * @param {(opts?: DelegateOpts) => Cleanup | void} init
 * @returns {BrontoDirective}
 */
export function createBrontoDirective(init: (opts?: DelegateOpts) => Cleanup | void): BrontoDirective;
/** @type {BrontoDirective} */
export const vThemeToggle: BrontoDirective;
export const vDismissible: BrontoDirective;
export const vDisabledGuard: BrontoDirective;
export const vDisclosure: BrontoDirective;
export const vMenu: BrontoDirective;
export const vFormValidation: BrontoDirective;
export const vCombobox: BrontoDirective;
export const vPopover: BrontoDirective;
export const vTableSort: BrontoDirective;
export const vTabs: BrontoDirective;
export const vDialog: BrontoDirective;
export const vModal: BrontoDirective;
export const vCarousel: BrontoDirective;
export const vDotGlyph: BrontoDirective;
export const vLegend: BrontoDirective;
export const vConnectors: BrontoDirective;
export const vSpotlight: BrontoDirective;
export const vCrosshair: BrontoDirective;
export const vCommand: BrontoDirective;
export const vSources: BrontoDirective;
export const vSplitter: BrontoDirective;
export const directives: Readonly<{
    themeToggle: BrontoDirective;
    dismissible: BrontoDirective;
    disabledGuard: BrontoDirective;
    disclosure: BrontoDirective;
    menu: BrontoDirective;
    formValidation: BrontoDirective;
    combobox: BrontoDirective;
    popover: BrontoDirective;
    tableSort: BrontoDirective;
    tabs: BrontoDirective;
    dialog: BrontoDirective;
    modal: BrontoDirective;
    carousel: BrontoDirective;
    dotGlyph: BrontoDirective;
    legend: BrontoDirective;
    connectors: BrontoDirective;
    spotlight: BrontoDirective;
    crosshair: BrontoDirective;
    command: BrontoDirective;
    sources: BrontoDirective;
    splitter: BrontoDirective;
}>;
export const brontoVue: Readonly<{
    install(app: any): void;
}>;
export default brontoVue;
export function useToast(): (message: string, opts?: ToastOpts) => Cleanup;
export type Cleanup = import("../behaviors/index.js").Cleanup;
export type DelegateOpts = import("../behaviors/index.js").DelegateOpts;
export type ThemeStorageOpts = import("../behaviors/index.js").ThemeStorageOpts;
export type ToastOpts = import("../behaviors/index.js").ToastOpts;
export type BrontoDirectiveRoot = Document | Element | null | undefined;
export type BrontoDirectiveOpts = Omit<DelegateOpts, "root"> & {
    root?: BrontoDirectiveRoot;
};
export type BrontoDirectiveBinding = {
    value?: BrontoDirectiveOpts | null | undefined;
    oldValue?: BrontoDirectiveOpts | null | undefined;
};
export type BrontoDirective = {
    mounted: (el: Element, binding?: BrontoDirectiveBinding) => void;
    updated: (el: Element, binding?: BrontoDirectiveBinding) => void;
    beforeUnmount: (el: Element) => void;
};
import { applyStoredTheme } from '../behaviors/index.js';
import { toast } from '../behaviors/index.js';
export { applyStoredTheme, toast };
export { cls, ui, cx } from "../classes/index.js";
//# sourceMappingURL=index.d.ts.map