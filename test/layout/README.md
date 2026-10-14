# Bronto Layout consumer integration

This directory owns three explicit website layout contracts for the **generated
BrontoUI public site**, not for the BrontoUI library runtime. The reusable
`Bronto Layout website contracts` workflow is now invoked by the main
`CI` workflow for application changes and feeds its `ci-gate`, which
controls whether GitHub Pages may deploy. It also supports manual dispatch.
The workflow builds BrontoUI's output and serves it on
`127.0.0.1:18775` before running the Bronto Layout CLI pinned to the GitHub beta `v0.5.0-beta.0` source commit
`76d252304ab6fd8f1698fd0136b32091cb19f284`.

Because `@ponchia/layout` is published as a **GitHub prerelease, not on the npm registry**, this workflow pins
an immutable public Git commit. Updating it requires review, testing and a
new commit hash; it must not float to `main`.

Checks cover document horizontal overflow, expected visible elements,
horizontal containment and explicit panel alignment for three pages:
the homepage (five widths), the operations page's outer frame shell (four
widths), and the **direct dashboard document** served at
`/demo/service.html` (six widths). The direct dashboard checks contain
16 approved rules, **96 assertions** in the current controlled fixture.

These direct-page checks are intentionally separate from the embedded
iframe. They **do not verify its inner document at the iframe's actual size**,
interactions, frame-specific viewport context, or lazy-loading behavior.
Additional visual assertions, accessibility and cross-browser behavior
remain covered by the existing Playwright suite. Color, paint order and
arbitrary application states are outside these explicitly approved rules.

The workflow also applies an **intentional 320px typography regression to
the generated CSS only**, verifying the historical overhang is detected.
The second negative control moves the dashboard job panel by 8px at
1280 CSS pixels, where it **does not create document overflow**. The
zero-contract audit should still exit 0, but the approved
`demo-toolbar-aligns-with-job-panel` assertion must fail with an 8px
deviation. This is the core semantic relationship Bronto Layout adds
beyond basic document-overflow checks.

Both controls restore generated CSS afterward; tracked BrontoUI source files
are never modified. This is a controlled mutation fixture and must not be counted as
independent real-world accuracy evidence.

CI explicitly selects the installed **stable Google Chrome** binary rather than the preinstalled development Chromium binary, and attempts
startup with its **default sandbox** on a disposable GitHub runner.
It never accepts an arbitrary URL or untrusted workflow parameter, never
uses `--no-sandbox`, and never uploads raw screenshots. If the sandboxed browser
cannot start, the check fails and needs investigation rather than bypass.

After successful PR and main runs, the layout job was promoted into the
same `ci-gate` as the cross-browser E2E and example matrix for changes
classified as application-affecting. A docs-only change may skip layout
checks only after successful classification; an unknown classifier can never
turn missing checks into success. This does not replace the cross-browser
Playwright suite or establish complete visual correctness or accessibility.

Local reproduction after building `npm run site:build`: run the same three
contracts against a locally hosted `_site` and a locally checked out,
built Bronto Layout source at the pinned commit.

## Beta 0.5.0 responsive field trial

The CI-green GitHub beta is pinned by immutable commit, and the same three existing, approved contracts now run with `--fail-on-skip --interior-probes 1 --refine`. This adds bounded intermediate widths without changing the contracts or claiming unsampled widths were verified. A deliberately narrow 395–410 CSS px, **generated-CSS-only** 8px dashboard jobs translation must fail `demo-toolbar-aligns-with-job-panel` at the 403px probe while both 375 and 430px remain healthy. The final test restores CSS before leaving the runner. This is first-party evidence of a real built dashboard; it is not a naturally occurring defect, independent accuracy estimate or a reason to silently accept suggested CSS rules. Existing browser/visual tests remain separate.
