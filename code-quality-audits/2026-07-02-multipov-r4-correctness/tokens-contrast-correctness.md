# Tokens / theme / contrast — bronto-ui correctness review
**Verdict:** I found two reproducible token/theming defects. The core generated token mirrors and renderer base palettes pass their shipped gates; the failures are in blind spots: print cascade with opt-in skins, and chart pattern ink contrast.

## Confirmed defects
- **[P1] [conf HIGH]** `css/skins.css:17` / `css/tokens.css:348` — dark skin accents can override the print palette remap.
  - Failure scenario: with `dist/bronto.css` then `dist/css/skins.css`, `<html data-theme="dark" data-bronto-skin="phosphor-green">` in print keeps `--button-text: #ffffff` from the print block, but `--accent: oklch(84% 0.19 150deg)` from the later dark skin selector. White text on that accent is `1.53:1`; amber CRT is `1.77:1`, e-ink is `1.63:1`.
  - Fix direction: add a print skin block after the dark skin blocks that resets each skin to its light/print-safe accent, or make the token print remap higher-specificity than all skin selectors.

- **[P2] [conf HIGH]** `css/dataviz.css:39` — default chart pattern ink does not meet a usable non-text contrast floor against many shipped chart fills.
  - Failure scenario: documented use `background: var(--chart-5); background-image: var(--chart-pattern-5)` relies on `--chart-pattern-ink`. Light default `rgb(0 0 0 / 0.34)` over `#f0e442` is `2.30:1`; dark default `rgb(255 255 255 / 0.42)` over the same fill is `1.12:1`. Dark series 8 is only `2.80:1`. The “second channel” becomes visually weak.
  - Fix direction: generate per-series pattern ink tokens, or make the pattern API require/set a contrasting ink per fill instead of one global light/dark ink.

## Lower-confidence / needs-repro
- None.

## Notable (not a bug)
- Mermaid/Vega core categorical palettes agree with `tokens/charts.json` for light/dark. I did not count missing skin-specific renderer palettes as a defect because the docs state resolved renderer themes do not live-reskin from later CSS `--accent` overrides.