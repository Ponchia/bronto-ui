You are reviewing the `@ponchia/ui` (bronto-ui) design system from the
**ACCESSIBILITY (a11y / WCAG)** point of view. READ-ONLY: do not modify files.

The project claims WCAG conformance, "colour is rationed and structure carries meaning",
dark mode, RTL, and monochrome-with-one-accent. Stress-test those claims:
- Contrast: how is contrast guaranteed given a monochrome canvas + a single re-skinnable
  `--accent`? Read `docs/contrast.md`, `css/tokens.css`, `css/skins.css`, `tokens/skins.*`,
  and any contrast-checking in `scripts/` and `test/`. Do the amber-CRT / phosphor-green /
  e-ink colorways actually keep AA/AAA contrast, or can a colorway break it?
- Focus visibility & keyboard operability: `css/state.css`, `css/forms.css`, `css/navigation.css`,
  `css/overlay.css`, `css/command.css`, `css/disclosure.css`. Are `:focus-visible` rings present
  and never removed? Any `outline:none` without a replacement?
- Semantics/ARIA in the JS behaviors: `behaviors/` (dialogs, toasts, disclosure, menus, tabs).
  Focus trapping, `aria-*`, `role`, ESC handling, focus restore, `aria-live` for toasts.
- `prefers-reduced-motion` handling in `css/motion.css` and animated components.
- RTL correctness (logical properties vs physical), and forms accessibility (labels, error
  association, required, `:user-invalid`).
- Reduced-transparency / forced-colors (Windows high-contrast) support.

Read real files across `css/`, `behaviors/`, `docs/contrast.md`, `test/` (look for axe / contrast tests).

--- OUTPUT CONTRACT ---
One report on a multi-POV panel; a synthesizer merges it, so be concrete and self-contained.
Ground EVERY claim in a `file:line` you actually opened. Produce your report as your FINAL
ANSWER in EXACTLY this Markdown structure:

# Accessibility (a11y / WCAG) — bronto-ui review
**Verdict:** one paragraph.
**Grade:** letter A–F + half-sentence why.
## Strengths
- bullets, each citing `path:line`.
## Weaknesses / risks
- bullets; prefix severity [P0]/[P1]/[P2]/[P3]; cite `path:line`; say what breaks & who is hurt.
## Top recommendations
1..6 ranked, concrete, actionable.
## Notable observations
- surprising / clever / worth knowing.
Evidence-dense, no filler, no restating this prompt.
