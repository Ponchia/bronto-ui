import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, normalize, resolve, sep } from 'node:path';

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
 *
 * Strict: exactly root, or under `root + sep` — never a `root`-prefixed
 * sibling like `<root>-evil`.
 *
 * @param {string} root
 * @param {string} pathname
 * @returns {string | null}
 */
export function safeStaticPath(root, pathname) {
  let p = pathname;
  if (p.endsWith('/')) p += 'index.html';
  const abs = normalize(resolve(root, `.${p}`));
  if (abs !== root && !abs.startsWith(root + sep)) return null;
  return abs;
}

/**
 * Create a zero-dependency static file server rooted at `root`.
 *
 * @param {string} root
 * @param {{ baseUrl?: string }} [opts]
 * @returns {import('node:http').Server}
 */
export function createStaticServer(root, { baseUrl = 'http://x' } = {}) {
  return createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, baseUrl).pathname);
      const abs = safeStaticPath(root, pathname);
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
