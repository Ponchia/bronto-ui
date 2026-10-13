# Bronto Layout consumer integration

This directory owns three explicit website layout contracts for the **generated
BrontoUI public site**, not for the BrontoUI library runtime. The separate,
experimental Bronto Layout website contracts GitHub Actions workflow builds
BrontoUI's public output and serves it on `127.0.0.1:18775` before running the
public Bronto Layout CLI pinned to commit
`9b39ed8586f5fff3c1d47d0ec1a141fd9790b2fd`.

Because `@ponchia/layout` is **not yet published to npm**, this workflow pins
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

The workflow is deliberately **not yet a required branch gate**. After it
passes on real pull requests and main without flakes, consider integrating it
into `ci-gate` with an explicit release/maintenance decision. It must not
replace the existing cross-browser Playwright suite.

Local reproduction after building `npm run site:build`: run the same three
contracts against a locally hosted `_site` and a locally checked out,
built Bronto Layout source at the pinned commit.
