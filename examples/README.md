# Examples

Runnable integration examples, each installing `@ponchia/ui` **from a packed
tarball** (`npm pack`). They exercise the package files and exports that an npm
consumer receives. CI (`.github/workflows/ci.yml` → `examples` job)
packs the package, installs it into each example, and builds them, so a
broken consumer surface fails the build before release.

These source projects are available in the repository and are not part of the
published npm package. The public website's [curated examples](https://ponchia.github.io/bronto-ui/examples/)
show complete interface compositions; these small apps focus on integration
and regression checks.

`npm run check:examples` keeps this inventory, the CI matrix, browser-smoke
list, smoke-script branches, README rows, preview ports, and the cross-browser
packed-example smoke command aligned.

The default packed-example gate (`npm run test:examples`) builds every example
from the tarball and smokes runtime examples in Chromium. For a deeper local
consumer pass, run `npm run test:examples:cross-browser` to exercise every
packed example in Chromium, Firefox, and WebKit; pass example names after `--`
to narrow the run. Manual CI dispatches opt into that same cross-browser packed
example path. `npm run test:examples:visual` adds desktop + mobile
screenshot/layout health smokes (blank, under-painted, and horizontal overflow
detection) without committing platform-specific PNG baselines.

| Example                          | Stack            | Guide                                     |
| -------------------------------- | ---------------- | ----------------------------------------- |
| [`vanilla-vite`](vanilla-vite)   | Vite, no framework | [docs/getting-started/vanilla.md](../docs/getting-started/vanilla.md)   |
| [`astro`](astro)                 | Astro            | [docs/getting-started/astro.md](../docs/getting-started/astro.md)       |
| [`sveltekit`](sveltekit)         | SvelteKit (static) | [docs/getting-started/sveltekit.md](../docs/getting-started/sveltekit.md) |
| [`react-vite`](react-vite)       | React + Vite     | [docs/getting-started/react-solid.md](../docs/getting-started/react-solid.md) |
| [`tailwind-vite`](tailwind-vite) | Tailwind v4 + Vite | [docs/interop/tailwind.md](../docs/interop/tailwind.md)                 |
| [`report-static`](report-static) | Static report + Vite | [docs/reporting.md](../docs/reporting.md) |
| [`annotations-vite`](annotations-vite) | UI frame + independent Annotations | [Annotation migration](../docs/migrations/0.16-to-0.17.md) |

## Verify an example

From a repository checkout with Node.js 22 and `npm ci` already run:

```bash
npm run test:examples -- vanilla-vite
```

The runner creates a fresh tarball, installs and builds the example in a
temporary directory, and checks it in a browser. Omit the name to run all
examples. Browser checks need the Playwright browser and system dependencies;
see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Open an example locally

From the repository root:

```bash
npm pack
```

Use the **exact tarball filename** printed by that command in the installation
below, replacing `X.Y.Z`. Avoid a wildcard: old package versions may still be
present in the checkout.

```bash
cd examples/vanilla-vite
npm install --no-save ../../ponchia-ui-X.Y.Z.tgz
npm run build
npm run preview
```

The installation also installs the example's own dependencies. Open the local
URL printed by the preview command. To change the example interactively, use
`npm run dev` instead. The installed tarball is a snapshot: repack and reinstall
after changing library source.

Each example shows the three integration concerns: load the CSS, the no-flash
inline theme script, and behavior lifecycle wiring with cleanup. The
React and Svelte examples exercise scoped vanilla behavior initialization and
cleanup in their normal framework lifecycle. The Tailwind
example proves the CSS-only `@ponchia/ui/tailwind` bridge through Tailwind's
v4 Vite plugin.
