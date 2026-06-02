/**
 * @ponchia/ui/qwik — thin Qwik bindings over @ponchia/ui/behaviors.
 *
 * The CSS is the framework; these are *optional* hooks that wrap the SSR-safe
 * vanilla `init*` behaviors in Qwik's client lifecycle. Thin adapters, not a
 * component library (architecture ADR). `@builder.io/qwik` is an optional peer
 * dependency.
 *
 * Qwik is resumable: nothing runs until needed, and our behaviors are exactly
 * the kind of "enhance on the client" glue that fits — they `useVisibleTask$`
 * (run when the owning component first becomes visible) and register cleanup,
 * so a server-rendered page stays zero-JS until interaction. Each hook inlines
 * its specific behavior so the Qwik optimizer can resolve the import inside the
 * extracted task segment.
 *
 *   import { component$ } from '@builder.io/qwik';
 *   import { useDialog, useToast } from '@ponchia/ui/qwik';
 *   export default component$(() => {
 *     useDialog();                 // wires every .ui-modal under document
 *     const toast = useToast();
 *     return <button onClick$={() => toast('Saved', { tone: 'success' })}>Save</button>;
 *   });
 *
 * Scope a behavior to a subtree by passing a Qwik signal:
 *   const root = useSignal();
 *   useDialog({ root });           // <section ref={root}> … </section>
 *
 * @typedef {import('../behaviors/index.js').Cleanup} Cleanup
 * @typedef {import('../behaviors/index.js').DelegateOpts} DelegateOpts
 * @typedef {import('../behaviors/index.js').ThemeStorageOpts} ThemeStorageOpts
 * @typedef {import('../behaviors/index.js').ToastOpts} ToastOpts
 *
 * @typedef {Document
 *   | Element
 *   | { value: Document | Element | null | undefined }
 *   | { current: Document | Element | null | undefined }
 *   | (() => Document | Element | null | undefined)
 *   | null
 *   | undefined} BrontoBindingRoot
 */

/**
 * @template {DelegateOpts} [T=DelegateOpts]
 * @typedef {Omit<T, 'root'> & { root?: BrontoBindingRoot }} BrontoBindingOpts
 */

/**
 * @template {DelegateOpts} [T=DelegateOpts]
 * @typedef {BrontoBindingOpts<T>
 *   | (() => BrontoBindingOpts<T> | null | undefined)
 *   | null
 *   | undefined} BrontoBindingOptsResolver
 */
import { useVisibleTask$ } from '@builder.io/qwik';
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
  initLegend,
  initConnectors,
  initSpotlight,
  initCrosshair,
  initCommand,
  toast,
} from '../behaviors/index.js';

function resolveMaybe(v) {
  return typeof v === 'function' ? v() : v;
}

function resolveRoot(root) {
  const value = resolveMaybe(root);
  if (value && typeof value === 'object') {
    if ('value' in value) return value.value; // Qwik signal (useSignal)
    if ('current' in value) return value.current; // generic ref shape
  }
  return value;
}

function resolveOpts(opts) {
  const value = resolveMaybe(opts);
  if (!value || typeof value !== 'object') return undefined;
  const root = resolveRoot(value.root);
  return root ? { ...value, root } : { ...value, root: undefined };
}

/** Run a delegated behavior on visible and register its cleanup on dispose.
 *  `init` and `opts` are resolved inside the visible task, so a Qwik-signal
 *  root is read after the element is assigned. Shared, non-QRL, so the
 *  optimizer keeps the captured behavior import inside the task segment. */
function start(init, opts, ctx) {
  const cleanup = init(resolveOpts(opts));
  if (typeof cleanup === 'function') ctx.cleanup(cleanup);
}

/** Generic escape hatch. NOTE for Qwik: prefer the specific `use*` hooks
 *  below — they inline a statically-imported behavior so the optimizer can
 *  serialize the task. Passing a runtime function here is only safe when it
 *  is itself optimizer-visible (a module import).
 *  @param {(opts?: DelegateOpts) => Cleanup | void} init
 *  @param {BrontoBindingOptsResolver} [opts]
 *  @returns {void} */
export function useBrontoBehavior(init, opts) {
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(init, opts, ctx));
}

/** @param {BrontoBindingOptsResolver<ThemeStorageOpts & DelegateOpts>} [opts] @returns {void} */
export const useThemeToggle = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initThemeToggle, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useDismissible = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(dismissible, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useDisclosure = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initDisclosure, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useMenu = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initMenu, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useFormValidation = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initFormValidation, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useCombobox = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initCombobox, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const usePopover = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initPopover, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useTableSort = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initTableSort, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useTabs = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initTabs, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useDialog = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initDialog, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useCarousel = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initCarousel, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useDotGlyph = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initDotGlyph, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useLegend = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initLegend, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useConnectors = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initConnectors, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useSpotlight = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initSpotlight, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useCrosshair = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initCrosshair, opts, ctx));
/** @param {BrontoBindingOptsResolver} [opts] @returns {void} */
export const useCommand = (opts) =>
  // eslint-disable-next-line qwik/no-use-visible-task -- delegated DOM glue + cleanup
  useVisibleTask$((ctx) => start(initCommand, opts, ctx));

/** The `toast()` imperative (no lifecycle of its own).
 *  @returns {(message: string, opts?: ToastOpts) => Cleanup} */
export const useToast = () => toast;

// No-flash theme application must run before paint — do it in an inline head
// script, not on visible. Re-exported for manual/SSR-bootstrap use.
export { applyStoredTheme };

// Convenience: the framework-agnostic class contract, re-exported.
export { cls, ui, cx } from '../classes/index.js';
