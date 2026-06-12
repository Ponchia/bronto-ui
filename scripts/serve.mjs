/**
 * Zero-dependency static file server for the demo, used by the Playwright
 * webServer in CI. Serves the package root so /demo/ resolves the same
 * relative ../css, ../dist, ../fonts and entrypoint paths a real
 * consumer checkout would. Not shipped (scripts/ is dev-only).
 *
 * `safePath` is exported (pure) so the traversal containment can be
 * unit-tested without binding a socket.
 *
 * Run: node scripts/serve.mjs [port]
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStaticServer, safeStaticPath } from './lib/static-server.mjs';
import { log } from './lib/stdio.mjs';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Resolve a request pathname to an absolute file path contained within
 * `root`, or `null` if it escapes (`..`, absolute, sibling-prefix).
 * Strict: exactly root, or under `root + sep` — never a `root`-prefixed
 * sibling like `<root>-evil`.
 */
export function safePath(pathname) {
  return safeStaticPath(root, pathname);
}

export function createDemoServer() {
  return createStaticServer(root);
}

const isMain = resolve(process.argv[1] || '') === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.argv[2]) || 8123;
  createDemoServer().listen(port, '127.0.0.1', () =>
    log(`serving ${root} on http://127.0.0.1:${port}`),
  );
}
