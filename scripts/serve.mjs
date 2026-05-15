/**
 * Zero-dependency static file server for the demo, used by the Playwright
 * webServer in CI. Serves the package root so /demo/ resolves the same
 * relative ../css, ../dist, ../fonts and entrypoint paths a real
 * consumer checkout would. Not shipped (scripts/ is dev-only).
 *
 * Run: node scripts/serve.mjs [port]
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2]) || 8123;

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

createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    // Contain to root — reject path traversal.
    const abs = normalize(resolve(root, `.${pathname}`));
    if (!abs.startsWith(root)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    const body = await readFile(abs);
    res.writeHead(200, { 'content-type': TYPES[extname(abs)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(port, () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
