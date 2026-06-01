# Examples

Runnable consumer apps, each installing `@ponchia/ui` **from a packed
tarball** (`npm pack`) — exactly how a real consumer gets it, not a
workspace symlink. CI (`.github/workflows/ci.yml` → `examples` job)
packs the package, installs it into each example, and builds them, so a
broken consumer surface fails the build before release.

These are **not** part of the published package (`files` allowlist
excludes them).

| Example                          | Stack            | Guide                                     |
| -------------------------------- | ---------------- | ----------------------------------------- |
| [`vanilla-vite`](vanilla-vite)   | Vite, no framework | [docs/getting-started/vanilla.md](../docs/getting-started/vanilla.md)   |
| [`astro`](astro)                 | Astro            | [docs/getting-started/astro.md](../docs/getting-started/astro.md)       |
| [`sveltekit`](sveltekit)         | SvelteKit (static) | [docs/getting-started/sveltekit.md](../docs/getting-started/sveltekit.md) |
| [`react-vite`](react-vite)       | React + Vite     | [docs/getting-started/react-solid.md](../docs/getting-started/react-solid.md) |
| [`solid-vite`](solid-vite)       | Solid + Vite     | [docs/getting-started/react-solid.md](../docs/getting-started/react-solid.md) |
| [`qwik-vite`](qwik-vite)         | Qwik + Vite      | [docs/getting-started/react-solid.md](../docs/getting-started/react-solid.md) |

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
React/Solid/Qwik examples also exercise the optional binding subpaths
against the packed tarball — the Qwik build additionally proves the
bindings survive the Qwik optimizer's QRL extraction.
