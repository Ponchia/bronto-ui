# Build / scripts robustness — bronto-ui correctness review
**Verdict:** I found three confirmed false-negative gates: CSS variable validation, shipped-doc CDN recipe validation, and schema `date-time` validation can all report success on concrete bad inputs. I did not reproduce generated-output nondeterminism for the current key sets, and the round-2 advisory scripts pass in strict mode.

## Confirmed defects
- **[P2] [conf HIGH]** `scripts/check-variables.mjs:51` — nested `var()` fallbacks are not validated.
  - Failure scenario: `color: var(--diff-tint, var(--text-dimm));` exits 0 because the regex consumes only the outer call and treats “has fallback” as valid; the misspelled inner fallback is never checked.
  - Fix direction: parse CSS values with a balanced parser, e.g. `postcss-value-parser`, and recursively validate `var()` fallback references.

- **[P2] [conf HIGH]** `scripts/check-doc-recipes.mjs:52` — CDN recipe checks miss multiline HTML tags.
  - Failure scenario: `<script\n  src="https://cdn.jsdelivr.net/npm/vega@6.2.0">` or multiline `<link ...\n href="...@ponchia/ui@0.6.10/css/report.css">` produces no match because the file is scanned line-by-line, so the check exits 0.
  - Fix direction: run tag extraction over the full document, or parse snippets as HTML, then derive line numbers from match offsets.

- **[P2] [conf HIGH]** `scripts/check-schemas.mjs:132` — `date-time` validation accepts impossible calendar dates.
  - Failure scenario: `"generatedAt": "2026-02-30T00:00:00Z"` passes because `Date.parse` normalizes it instead of rejecting it, giving false confidence for schema examples/fixtures.
  - Fix direction: use Ajv plus `ajv-formats`, or enforce RFC3339 with regex plus calendar-date round-trip validation.

## Lower-confidence / needs-repro
- **[P3] [conf LOW]** `scripts/check-release.mjs:41` / `scripts/changelog-section.mjs:487` — changelog heading matching uses substring `includes`, so a future prerelease heading like `0.6.0-rc.1` could satisfy or shadow stable `0.6.0`; current changelog shape does not reproduce this.

## Notable (not a bug)
- `scripts/audit-selectors.mjs --strict` and `scripts/audit-behavior-exports.mjs --strict` both exit 0 on the current tree; advisory default exit-0 behavior is documented.
- No locale/order instability reproduced for current generated sort keys.
- `check-public-hygiene` could not be exercised here because `npm pack --dry-run` fails in the read-only sandbox before scanning; that failure exits nonzero, not a false pass.