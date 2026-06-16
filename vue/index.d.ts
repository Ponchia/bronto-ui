/**
 * Create a Vue directive object from any Bronto delegated behavior initializer.
 *
 * @param {(opts?: DelegateOpts) => Cleanup | void} init
 * @returns {BrontoDirective}
 */
export function createBrontoDirective(init: (opts?: DelegateOpts) => Cleanup | void): BrontoDirective;
/** @type {BrontoThemeDirective} */
export const vThemeToggle: BrontoThemeDirective;
/** @type {BrontoDirective} */
export const vDismissible: BrontoDirective;
/** @type {BrontoDirective} */
export const vDisabledGuard: BrontoDirective;
/** @type {BrontoDirective} */
export const vDisclosure: BrontoDirective;
/** @type {BrontoDirective} */
export const vMenu: BrontoDirective;
/** @type {BrontoDirective} */
export const vFormValidation: BrontoDirective;
/** @type {BrontoDirective} */
export const vCombobox: BrontoDirective;
/** @type {BrontoDirective} */
export const vPopover: BrontoDirective;
/** @type {BrontoDirective} */
export const vTableSort: BrontoDirective;
/** @type {BrontoDirective} */
export const vTabs: BrontoDirective;
/** @type {BrontoDirective} */
export const vDialog: BrontoDirective;
/** @type {BrontoDirective} */
export const vModal: BrontoDirective;
/** @type {BrontoDirective} */
export const vCarousel: BrontoDirective;
/** @type {BrontoDirective} */
export const vDotGlyph: BrontoDirective;
/** @type {BrontoDirective} */
export const vLegend: BrontoDirective;
/** @type {BrontoDirective} */
export const vConnectors: BrontoDirective;
/** @type {BrontoDirective} */
export const vSpotlight: BrontoDirective;
/** @type {BrontoDirective} */
export const vCrosshair: BrontoDirective;
/** @type {BrontoDirective} */
export const vCommand: BrontoDirective;
/** @type {BrontoDirective} */
export const vSources: BrontoDirective;
/** @type {BrontoDirective} */
export const vSplitter: BrontoDirective;
export const directives: Readonly<{
    themeToggle: BrontoThemeDirective;
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
/** @type {BrontoVuePlugin} */
export const brontoVue: BrontoVuePlugin;
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
export type BrontoThemeDirectiveOpts = Omit<ThemeStorageOpts & DelegateOpts, "root"> & {
    root?: BrontoDirectiveRoot;
};
export type BrontoDirectiveBinding = {
    value?: BrontoDirectiveOpts | null | undefined;
    oldValue?: BrontoDirectiveOpts | null | undefined;
};
export type BrontoThemeDirectiveBinding = {
    value?: BrontoThemeDirectiveOpts | null | undefined;
    oldValue?: BrontoThemeDirectiveOpts | null | undefined;
};
export type BrontoDirective = {
    mounted: (el: Element, binding?: BrontoDirectiveBinding) => void;
    updated: (el: Element, binding?: BrontoDirectiveBinding) => void;
    beforeUnmount: (el: Element) => void;
};
export type BrontoThemeDirective = {
    mounted: (el: Element, binding?: BrontoThemeDirectiveBinding) => void;
    updated: (el: Element, binding?: BrontoThemeDirectiveBinding) => void;
    beforeUnmount: (el: Element) => void;
};
export type BrontoVueApp = {
    directive: (name: string, directive: BrontoDirective | BrontoThemeDirective) => unknown;
};
export type BrontoVuePlugin = {
    install: (app: BrontoVueApp) => void;
};
import { applyStoredTheme } from '../behaviors/index.js';
import { toast } from '../behaviors/index.js';
export { applyStoredTheme, toast };
export { cls, ui, cx } from "../classes/index.js";
//# sourceMappingURL=index.d.ts.map