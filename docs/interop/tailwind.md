# Tailwind / cascade-layer interop

Everything `@ponchia/ui` ships lives inside a single named cascade layer,
`@layer bronto`. This makes coexistence with Tailwind (or any
layer-based CSS) deterministic, but only if you control **layer order**.

## The one rule

In CSS, an explicit `@layer` declaration's order beats specificity:
later layers win over earlier layers, and **un-layered styles beat all
layered styles**. So:

- Un-layered Tailwind utilities already override `@ponchia/ui` with no
  `!important` and no specificity fight.
- If Tailwind is itself layered (Tailwind v4 default), you must place
  its layers **after** `bronto`.

## Tailwind v4

v4 emits `@layer theme, base, components, utilities;`. Declare `bronto`
**before** Tailwind's utilities so utilities can override components:

```css
/* app.css — order line first, before any @import */
@layer bronto, theme, base, components, utilities;

@import '@ponchia/ui'; /* fills @layer bronto */
@import 'tailwindcss'; /* fills theme/base/components/utilities */
```

Because the `@layer` statement above fixes the order up front, it does
not matter that `@ponchia/ui` is imported first — `utilities` is
declared after `bronto`, so `class="ui-button px-8"` gives Tailwind's
`px-8` the final word.

If you'd rather Tailwind's **Preflight reset not touch** `@ponchia/ui`
elements, keep Preflight (in `base`) before `bronto` instead:

```css
@layer theme, base, bronto, components, utilities;
```

Pick based on which reset you want to win; `@ponchia/ui`'s own reset is
inside `bronto`, so whichever layer is later wins the reset too.

## Tailwind v3

v3 (`@tailwind base/components/utilities`) is un-layered by default, so
its utilities **already** beat `@layer bronto` with zero config — just
`@import '@ponchia/ui';` first. If you opt into v3's experimental
`cssLayers`, apply the v4 rule above.

## Override matrix

| You want…                                            | Use                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| Tailwind utilities to win (normal case)              | Nothing — un-layered utilities already beat `@layer bronto`          |
| A full-specificity, layer-free `@ponchia/ui` build   | Import the `@ponchia/ui/css/unlayered/<leaf>.css` escape-hatch paths |
| Per-route CSS splitting + the bundle, no inversion   | Mix freely — every leaf export self-wraps in `@layer bronto`         |
| Tailwind's Preflight to NOT reset `ui-*` elements    | `@layer theme, base, bronto, components, utilities;`                 |

## Gotcha

Do **not** mix `@ponchia/ui` (layered) with
`@ponchia/ui/css/unlayered/*` for the _same_ leaf — the unlayered copy
will unconditionally win and you lose the ordering guarantees. The
`unlayered/*` paths are a deliberate, surgical escape hatch, not a
default.
