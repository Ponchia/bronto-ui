# Selection states

`@ponchia/ui/css/selection.css` is a tiny, **cross-cutting selection-emphasis
vocabulary** — the carve-out from "brush/lasso". Bronto does **not** do region
selection or hit-testing (that needs your scales and geometry). It ships only
the *states* an item can be in once your code has decided what's selected, so
the same emphasis works on a chart mark, a table row, a list item, or a map
region.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/selection.css';
```

| Class | State |
| --- | --- |
| `ui-sel` | Base — opt the element into the emphasis transitions. |
| `ui-sel--on` | In the selection (accent outline). |
| `ui-sel--off` | Excluded / filtered out (dimmed). |
| `ui-sel--maybe` | A live-brush candidate (dashed outline). |

```html
<rect class="ui-sel ui-sel--on" … />
<tr class="ui-sel ui-sel--off">…</tr>
```

```js
import { ui } from '@ponchia/ui/classes';
el.className = ui.sel({ state: inBrush ? 'maybe' : selected ? 'on' : 'off' });
```

Your code adds/removes these classes from its own brush, filter, or selection
logic — Bronto only styles them. `--off` uses `opacity` (which survives
forced-colors), and `--on` falls back to the system `Highlight` color in
forced-colors so the selection stays visible.

> **Why no brush behavior?** A rectangular brush or lasso must translate a
> dragged region into a data domain (or test points against a polygon), which
> requires owning the chart's scales/geometry — across Bronto's line. Bring your
> own selection logic; use these classes to render the result.
