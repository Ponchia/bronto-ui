# Examples

Runnable consumer apps, each installing `@ponchia/ui` **from a packed
tarball** (`npm pack`) — exactly how a real consumer gets it, not a
workspace symlink. CI (`.github/workflows/ci.yml` → `examples` job)
packs the package, installs it into each example, and builds them, so a
broken consumer surface fails the build before release.

These are **not** part of the published package (`files` allowlist
excludes them).

`npm run check:examples` keeps this inventory, the CI matrix, browser-smoke
list, smoke-script branches, README rows, and preview ports aligned.

| Example                          | Stack            | Guide                                     |
| -------------------------------- | ---------------- | ----------------------------------------- |
| [`vanilla-vite`](vanilla-vite)   | Vite, no framework | [docs/getting-started/vanilla.md](../docs/getting-started/vanilla.md)   |
| [`astro`](astro)                 | Astro            | [docs/getting-started/astro.md](../docs/getting-started/astro.md)       |
| [`sveltekit`](sveltekit)         | SvelteKit (static) | [docs/getting-started/sveltekit.md](../docs/getting-started/sveltekit.md) |
| [`vue-vite`](vue-vite)           | Vue + Vite       | [docs/getting-started/vue.md](../docs/getting-started/vue.md)           |
| [`react-vite`](react-vite)       | React + Vite     | [docs/getting-started/react-solid.md](../docs/getting-started/react-solid.md) |
| [`solid-vite`](solid-vite)       | Solid + Vite     | [docs/getting-started/react-solid.md](../docs/getting-started/react-solid.md) |
| [`qwik-vite`](qwik-vite)         | Qwik + Vite      | [docs/getting-started/react-solid.md](../docs/getting-started/react-solid.md) |
| [`tailwind-vite`](tailwind-vite) | Tailwind v4 + Vite | [docs/interop/tailwind.md](../docs/interop/tailwind.md)                 |
| [`report-static`](report-static) | Static report + Vite | [docs/reporting.md](../docs/reporting.md) |

## Run one locally

```bash
npm pack                                  # from the repo root → ponchia-ui-X.Y.Z.tgz
cd examples/vanilla-vite
npm install
npm install --no-save ../../ponchia-ui-*.tgz
npm run build && npm run preview
```

Each shows the three integration concerns: load the CSS, the no-flash
inline theme script, and behavior lifecycle wiring with cleanup. The
React/Solid/Qwik/Svelte/Vue examples also exercise the optional binding
subpaths against the packed tarball — the Qwik build additionally proves
the bindings survive the Qwik optimizer's QRL extraction. The Tailwind
example proves the CSS-only `@ponchia/ui/tailwind` bridge through Tailwind's
v4 Vite plugin.
