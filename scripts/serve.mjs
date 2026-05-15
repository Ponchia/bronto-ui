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
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, normalize, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

/**
 * Resolve a request pathname to an absolute file path contained within
 * `root`, or `null` if it escapes (`..`, absolute, sibling-prefix).
 * Strict: exactly root, or under `root + sep` — never a `root`-prefixed
 * sibling like `<root>-evil`.
 */
export function safePath(pathname) {
  let p = pathname;
  if (p.endsWith('/')) p += 'index.html';
  const abs = normalize(resolve(root, `.${p}`));
  if (abs !== root && !abs.startsWith(root + sep)) return null;
  return abs;
}

export function createDemoServer() {
  return createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const abs = safePath(pathname);
      if (!abs) {
        res.writeHead(403).end('forbidden');
        return;
      }
      const body = await readFile(abs);
      res.writeHead(200, { 'content-type': TYPES[extname(abs)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
}

const isMain = resolve(process.argv[1] || '') === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.argv[2]) || 8123;
  createDemoServer().listen(port, '127.0.0.1', () =>
    console.log(`serving ${root} on http://127.0.0.1:${port}`)
  );
}
