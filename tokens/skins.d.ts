/** @ponchia/ui — GENERATED from tokens/skins.js by scripts/gen-skins.mjs.
 *  Do not edit by hand; run `npm run skins:build`. Drift-checked in CI. */

/** Every display-colorway name @ponchia/ui ships (literal union). Use as a
 *  type for a `data-bronto-skin` value (`const s: SkinName = 'amber-crt'`). */
export type SkinName =
  | 'amber-crt'
  | 'e-ink'
  | 'phosphor-green';

/** A colorway: a display label + per-theme custom-property overrides (CSS
 *  value strings). `light`/`dark` always set `--accent`; `dark` may add a
 *  display knob such as `--dotmatrix-glow`. */
export interface Skin {
  label: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

/** The frozen name→colorway registry. */
export declare const skins: Record<SkinName, Skin>;

/** Every colorway name, frozen and sorted. */
export declare const SKIN_NAMES: readonly SkinName[];

declare const _default: Record<SkinName, Skin>;
export default _default;
