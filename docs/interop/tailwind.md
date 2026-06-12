# Tailwind v4 bridge and cascade-layer interop

Everything `@ponchia/ui` ships lives inside a single named cascade layer,
`@layer bronto`. This makes coexistence with Tailwind (or any layer-based CSS)
deterministic, but only if you control **layer order**.

Bronto also ships a Tailwind v4 bridge at `@ponchia/ui/tailwind`. It maps
Bronto's CSS custom properties into Tailwind's CSS-first `@theme` namespaces and
defines Bronto-aware variants. The bridge does **not** import the Bronto
component CSS for you; import both when you want both systems.

## The one rule

In CSS, an explicit `@layer` declaration's order beats specificity: later layers
win over earlier layers, and **un-layered styles beat all layered styles**. So:

- Un-layered Tailwind utilities already override `@ponchia/ui` with no
  `!important` and no specificity fight.
- If Tailwind is itself layered (Tailwind v4 default), you must place its layers
  **after** `bronto`.

## Tailwind v4

v4 emits `@layer theme, base, components, utilities;`. Declare `bronto`
**before** Tailwind's utilities so utilities can override components, then import
Tailwind and the Bronto bridge:

```css
/* app.css — order line first, before any @import */
@layer bronto, theme, base, components, utilities;

@import '@ponchia/ui'; /* fills @layer bronto */
@import 'tailwindcss'; /* fills theme/base/components/utilities */
@import '@ponchia/ui/tailwind'; /* adds @theme + @custom-variant bridge */
```

Because the `@layer` statement above fixes the order up front, it does not
matter that `@ponchia/ui` is imported first — `utilities` is declared after
`bronto`, so `class="ui-button px-8"` gives Tailwind's `px-8` the final word.

If you'd rather Tailwind's **Preflight reset not touch** `@ponchia/ui` elements,
keep Preflight (in `base`) before `bronto` instead:

```css
@layer theme, base, bronto, components, utilities;
```

Pick based on which reset you want to win; `@ponchia/ui`'s own reset is inside
`bronto`, so whichever layer is later wins the reset too.

### Theme utilities

The bridge uses Tailwind v4's CSS-first `@theme inline` form, so Bronto tokens
become ordinary Tailwind utilities while still reading the live CSS variables
from the active theme:

```html
<section
  class="bg-bronto-surface text-bronto-text border border-bronto-border p-bronto-lg rounded-bronto-lg"
>
  <button class="bg-bronto-action text-bronto-on-action ring-bronto-focus">Save</button>
</section>
```

Useful namespaces:

| Bronto token family | Tailwind utility examples |
| --- | --- |
| Surface/text/action colours | `bg-bronto-surface`, `text-bronto-text`, `border-bronto-border`, `ring-bronto-focus` |
| Accent ramps | `bg-bronto-accent-1` … `bg-bronto-accent-6` |
| Status colours | `text-bronto-success`, `bg-bronto-warning`, `border-bronto-danger`, `text-bronto-info` |
| Typography | `font-bronto-sans`, `font-bronto-mono`, `font-bronto-display`, `text-bronto-sm` |
| Spacing/radius/shadow/easing | `p-bronto-md`, `gap-bronto-sm`, `rounded-bronto-xl`, `shadow-bronto-raised`, `ease-bronto-standard` |

### Bronto variants

The bridge defines root/theme variants and common Bronto state variants:

```html
<article
  class="bg-bronto-surface bronto-dark:bg-bronto-surface-raised bronto-contrast-more:border-bronto-border-strong"
>
  ...
</article>

<button class="bronto-active:text-bronto-action bronto-busy:opacity-70">Run</button>
```

Available variants:

| Variant | Selector intent |
| --- | --- |
| `bronto-light:*` / `bronto-dark:*` | Descendants under `html[data-theme="light|dark"]` |
| `bronto-oled:*` | Descendants under `[data-surface="oled"]` |
| `bronto-contrast-more:*` | Descendants under `[data-contrast="more"]` |
| `bronto-compact:*` / `bronto-comfortable:*` | Descendants under density presets |
| `bronto-active:*` | `.is-active`, current page, or selected tab state |
| `bronto-open:*` | Native/dialog/popover/open disclosure state |
| `bronto-selected:*` | selected/pressed state |
| `bronto-invalid:*` | invalid field state |
| `bronto-busy:*` | busy/loading state |

### Svelte/Vue component styles

When using `@apply` or `@variant` inside Vue or Svelte component style blocks,
import your app stylesheet with Tailwind's `@reference` directive so Tailwind
can see the Bronto theme variables and custom variants without duplicating CSS
output:

```css
@reference '../app.css';

.panel {
  @apply bg-bronto-surface text-bronto-text bronto-dark:bg-bronto-surface-raised;
}
```

### Package source detection

`@ponchia/ui` components are normal `.ui-*` classes and do not need Tailwind to
scan the package. If your own app builds Tailwind class names inside ignored
generated files or an external package, register those sources with Tailwind's
`@source` directive in your app stylesheet.

## Tailwind v3

v3 (`@tailwind base/components/utilities`) is un-layered by default, so its
utilities **already** beat `@layer bronto` with zero config — just
`@import '@ponchia/ui';` first. If you opt into v3's experimental `cssLayers`,
apply the v4 rule above.

## Override matrix

| You want…                                            | Use                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| Tailwind utilities to win (normal case)              | Nothing — un-layered utilities already beat `@layer bronto`          |
| A full-specificity, layer-free `@ponchia/ui` build   | Import the `@ponchia/ui/css/unlayered/<leaf>.css` escape-hatch paths |
| Per-route CSS splitting + the bundle, no inversion   | Mix freely — every leaf export self-wraps in `@layer bronto`         |
| Tailwind's Preflight to NOT reset `ui-*` elements    | `@layer theme, base, bronto, components, utilities;`                 |
| Bronto tokens as Tailwind utilities                  | `@import '@ponchia/ui/tailwind';` after Tailwind v4                  |
| Vue/Svelte style blocks using Bronto utilities       | `@reference '../app.css';` from the component style block            |

## Gotcha

Do **not** mix `@ponchia/ui` (layered) with `@ponchia/ui/css/unlayered/*` for
the _same_ leaf — the unlayered copy will unconditionally win and you lose the
ordering guarantees. The `unlayered/*` paths are a deliberate, surgical escape
hatch, not a default.
