# Bullet

`@ponchia/ui/css/bullet.css` is an opt-in **bullet graph** — Stephen Few's
compact "is this measure inside its qualitative budget, and how does it compare
to target?" figure. A thin measure bar sits over 2–3 grayscale qualitative range
bands, with a perpendicular target tick. It is the canonical SLO / error-budget
figure that `ui-meter` (a single label|bar|value reading) structurally cannot
encode — a bullet carries the bands and the target too. Few designed it grayscale
on purpose, which is exactly the Nothing palette.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/bullet.css';
```

## How it behaves

- **Bands** are a grayscale gradient with hard stops at `--band-lo` and
  `--band-hi` — the qualitative ranges (e.g. poor / ok / good).
- **The measure** is a thin dark bar whose length is the normalised reading `--v`.
- **The target** is a full-height tick at `--t`; shape (not colour) distinguishes
  it from the measure, per Few's grayscale rule.

## Wiring — the host normalises every value to 0..1

Identical contract to `ui-spark`: Bronto paints geometry, the host does the
arithmetic. Set the normalised values as custom properties; the figure refuses
raw values and scale computation.

```html
<figure>
  <div
    class="ui-bullet"
    style="--band-lo: 0.6; --band-hi: 0.85"
    role="img"
    aria-label="uptime 99.62%, below the 99.9% target, in the warning band"
  >
    <div class="ui-bullet__measure ui-bullet__measure--neg" style="--v: 0.62"></div>
    <div class="ui-bullet__target" style="--t: 0.9"></div>
  </div>
  <figcaption class="ui-bullet__label"><span>Uptime</span><span>99.62%</span></figcaption>
</figure>
```

The `.ui-bullet__label` row is optional — use it, a `<figcaption>`, or your own
caption. Either way the **reading lives in text**, never in colour alone.

## Class reference

| Class                        | Role                                                          |
| ---------------------------- | ------------------------------------------------------------ |
| `.ui-bullet`                 | The track + qualitative range bands (`--b1` / `--b2`).       |
| `.ui-bullet__measure`        | The measure bar; length is `--v` (0..1).                     |
| `.ui-bullet__measure--accent`| Paint the measure in the rationed accent (emphasis).         |
| `.ui-bullet__measure--pos`   | Paint the measure in the success tone.                       |
| `.ui-bullet__measure--neg`   | Paint the measure in the danger tone.                        |
| `.ui-bullet__target`         | The full-height target tick at `--t` (0..1).                 |
| `.ui-bullet__label`          | Optional caption row (label + reading, in mono).             |

| Custom property | On                    | Meaning                                                  |
| --------------- | --------------------- | -------------------------------------------------------- |
| `--v`           | `.ui-bullet__measure` | **Required.** Normalised measure (0..1).                 |
| `--t`           | `.ui-bullet__target`  | Normalised target position (0..1); omit to drop the tick.|
| `--band-lo`     | `.ui-bullet`          | Lower band boundary (0..1, default `0.5`).               |
| `--band-hi`     | `.ui-bullet`          | Upper band boundary (0..1, default `0.8`, ≥ `--band-lo`).|

## Accessibility & robustness

- A bare bullet is **opaque to assistive tech**, so `.ui-bullet` MUST carry a
  host-written `role="img"` + `aria-label` that states the reading, the target,
  and the band — colour is never the only channel (WCAG 1.4.1).
- Under `forced-colors` the band gradient flattens, so the track gains a border
  and the marks repaint in the system text colour; the band meaning is carried by
  the required label.
- Bands + marks are `print-color-adjust: exact`, so the figure survives the print
  economy.
- Relationship to `ui-meter` (report.css): a meter is a labelled progress reading;
  reach for a bullet when you also need a target and qualitative bands.
