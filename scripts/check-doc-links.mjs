// Gate: public documentation must not contain stale local links or anchors.
//
// Shipped docs have one extra invariant: any local file they link to must also
// ship in the npm tarball, because those links need to work offline from the
// package. GitHub-only authoring docs and the docs viewer are still public
// authoring surfaces, so they get the same path/anchor checks without the
// tarball-membership requirement.
//
// Run: node scripts/check-doc-links.mjs
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shippedDocs } from './lib/shipped-docs.mjs';
import { npmPackFiles } from './lib/shipped-files.mjs';
import { log } from './lib/stdio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const shipped = shippedDocs(pkg);
const shippedSet = new Set(shipped);
const authoringSources = publicAuthoringSources();

const LOCAL_SCHEMES = new Set(['', 'file']);
const SKIP_SCHEMES = new Set(['http', 'https', 'mailto', 'tel', 'data']);
const FORBIDDEN_SCHEMES = new Set(['javascript', 'vbscript']);

const FENCE = /^ {0,3}(```|~~~)/;
const HEADING = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/;
const EXPLICIT_ID = /\bid=["']([^"']+)["']/gi;
const REF_LINK = /^ {0,3}\[[^\]]+\]:\s*(\S+)/gm;
const HTML_LINK = /\b(?:href|src)=["']([^"']+)["']/gi;

const problems = [];
const anchorCache = new Map();
const packFiles = new Set(packFileList());
let checkedLinks = 0;
let checkedAnchors = 0;
let checkedPackedTargets = 0;
let checkedPackedCodeRefs = 0;
let checkedViewerDocs = 0;
let checkedInventoryDocs = 0;

function packFileList() {
  try {
    return npmPackFiles(root);
  } catch (error) {
    console.error('✗ check:doc-links — `npm pack --dry-run --json` failed:', error.message);
    process.exit(1);
  }
}

function walkMarkdown(dir) {
  const abs = resolve(root, dir);
  if (!existsSync(abs)) return [];
  const out = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...walkMarkdown(rel));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(rel);
  }
  return out.sort();
}

function publicAuthoringSources() {
  return [
    ...new Set([
      ...shipped,
      'CONTRIBUTING.md',
      'ROADMAP.md',
      'docs/index.html',
      ...walkMarkdown('docs'),
      'examples/README.md',
    ]),
  ].filter((rel) => existsSync(resolve(root, rel)));
}

function stripCodeBlocks(text) {
  const lines = text.split('\n');
  let fenced = false;
  return lines
    .map((line) => {
      if (FENCE.test(line)) {
        fenced = !fenced;
        return '';
      }
      return fenced ? '' : line;
    })
    .join('\n');
}

function stripInlineCode(text) {
  return text.replace(/`[^`\n]*`/g, (m) => ' '.repeat(m.length));
}

function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function unescapeMarkdownDestination(raw) {
  let value = raw.trim();
  if (value.startsWith('<') && value.endsWith('>')) value = value.slice(1, -1);
  return value.replaceAll('\\)', ')').replaceAll('\\(', '(').replaceAll('\\ ', ' ');
}

function parseUrl(raw) {
  const target = unescapeMarkdownDestination(raw);
  if (!target || target.startsWith('#')) return { scheme: '', path: '', hash: target.slice(1) };

  let url;
  try {
    url = new URL(target, 'file:///');
  } catch {
    return null;
  }
  const scheme = url.protocol.replace(/:$/, '');
  if (FORBIDDEN_SCHEMES.has(scheme)) return { forbiddenScheme: scheme };
  if (SKIP_SCHEMES.has(scheme)) return { skip: true };
  if (!LOCAL_SCHEMES.has(scheme)) return { skip: true };

  const [pathPart, hashPart = ''] = target.split('#', 2);
  const cleanPath = pathPart.split('?')[0];
  return { scheme, path: cleanPath, hash: hashPart };
}

function resolveLocal(sourceRel, linkPath) {
  if (!linkPath) {
    const target = resolve(root, sourceRel);
    return { abs: target, rel: normalize(sourceRel) };
  }
  const base = linkPath.startsWith('/') ? root : resolve(root, dirname(sourceRel));
  const target = resolve(base, decodeURIComponent(linkPath));
  const rel = relative(root, target);
  if (rel.startsWith('..') || rel === '' || rel.split(sep).includes('..')) return null;
  return { abs: target, rel: normalize(rel) };
}

function stripInlineHtmlTags(text) {
  let out = '';
  let inTag = false;
  for (const char of text) {
    if (char === '<') {
      inTag = true;
      continue;
    }
    if (inTag) {
      if (char === '>') inTag = false;
      continue;
    }
    out += char;
  }
  return out;
}

function slugFor(text, seen) {
  let base = stripInlineHtmlTags(text)
    .trim()
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/&[a-z0-9#]+;/gi, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!base) base = 'section';
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

function anchorsFor(abs) {
  if (anchorCache.has(abs)) return anchorCache.get(abs);
  const anchors = new Set();
  const ext = extname(abs).toLowerCase();
  if (!['.md', '.html', '.htm'].includes(ext)) {
    anchorCache.set(abs, anchors);
    return anchors;
  }

  const text = readFileSync(abs, 'utf8');
  for (const m of text.matchAll(EXPLICIT_ID)) anchors.add(m[1]);

  if (ext === '.md') {
    const seen = new Map();
    for (const line of stripCodeBlocks(text).split('\n')) {
      const m = HEADING.exec(line);
      if (m) anchors.add(slugFor(m[2], seen));
    }
  }

  anchorCache.set(abs, anchors);
  return anchors;
}

function normalizeHash(hash) {
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}

function recordLink(sourceRel, line, rawTarget, { requirePackedTarget = false } = {}) {
  const parsed = parseUrl(rawTarget);
  if (!parsed || parsed.skip) return;
  if (parsed.forbiddenScheme) {
    problems.push(`${sourceRel}:${line}  ${rawTarget} — executable URL scheme is not allowed`);
    return;
  }

  const local = localLinkTarget(sourceRel, line, rawTarget, parsed.path);
  if (!local) return;

  checkedLinks += 1;
  if (!targetExists(sourceRel, line, rawTarget, local)) return;

  const stat = statSync(local.abs);
  if (!checkPackedTarget(sourceRel, line, rawTarget, local, stat, requirePackedTarget)) return;
  if (stat.isFile()) checkAnchorTarget(sourceRel, line, rawTarget, local, parsed.hash);
}

function localLinkTarget(sourceRel, line, rawTarget, targetPath) {
  const local = resolveLocal(sourceRel, targetPath);
  if (!local) {
    problems.push(`${sourceRel}:${line}  ${rawTarget} — local link escapes the repository`);
    return null;
  }
  return local;
}

function targetExists(sourceRel, line, rawTarget, local) {
  if (!existsSync(local.abs)) {
    problems.push(`${sourceRel}:${line}  ${rawTarget} — missing local target ${local.rel}`);
    return false;
  }
  return true;
}

function checkPackedTarget(sourceRel, line, rawTarget, local, stat, requirePackedTarget) {
  const packedRel = local.rel.replace(/\\/g, '/');
  if (stat.isFile() && requirePackedTarget) {
    checkedPackedTargets += 1;
  }
  if (stat.isFile() && requirePackedTarget && !packFiles.has(packedRel)) {
    problems.push(
      `${sourceRel}:${line}  ${rawTarget} — target ${packedRel} is not shipped in the npm package`,
    );
    return false;
  }
  return true;
}

function checkAnchorTarget(sourceRel, line, rawTarget, local, hash) {
  if (!hash) return;
  const anchor = normalizeHash(hash);
  if (!anchor) return;
  checkedAnchors += 1;
  const anchors = anchorsFor(local.abs);
  if (!anchors.has(anchor)) {
    problems.push(`${sourceRel}:${line}  ${rawTarget} — missing #${anchor} in ${local.rel}`);
  }
}

function offlineReferenceSlice(text) {
  const start = text.indexOf('## Authoritative offline references');
  if (start === -1) return null;
  const end = text.indexOf('## External web references', start);
  return {
    text: text.slice(start, end === -1 ? undefined : end),
    offset: start,
  };
}

function looksLikePackagePath(value) {
  if (value.includes(' ') || value.startsWith('@') || value.startsWith('--')) return false;
  if (value.startsWith('node_modules/')) return false;
  return /^(?:annotations|behaviors|classes|docs|glyphs|schemas|shiki|tokens)\//.test(value);
}

function recordPackedCodeSpan(sourceRel, line, rawTarget) {
  const target = rawTarget.trim();
  if (!looksLikePackagePath(target)) return;
  const local = resolveLocal(sourceRel, target);
  if (!local) {
    problems.push(`${sourceRel}:${line}  \`${target}\` — local reference escapes the repository`);
    return;
  }
  checkedPackedCodeRefs += 1;
  const packedRel = local.rel.replace(/\\/g, '/');
  if (!existsSync(local.abs)) {
    problems.push(`${sourceRel}:${line}  \`${target}\` — missing local target ${packedRel}`);
    return;
  }
  if (!packFiles.has(packedRel)) {
    problems.push(
      `${sourceRel}:${line}  \`${target}\` — offline reference target is not shipped in the npm package`,
    );
  }
}

function docsMarkdownInventory() {
  return walkMarkdown('docs')
    .map((rel) => rel.replace(/^docs\//, ''))
    .filter((rel) => rel !== 'README.md')
    .sort();
}

function docsReadmeTargets() {
  const rel = 'docs/README.md';
  const abs = resolve(root, rel);
  if (!existsSync(abs)) return new Set();
  const text = readFileSync(abs, 'utf8');
  const visible = stripInlineCode(stripCodeBlocks(text));
  const out = new Set();
  const consider = (rawTarget) => {
    const parsed = parseUrl(rawTarget);
    if (!parsed || parsed.skip || !parsed.path) return;
    const local = resolveLocal(rel, parsed.path);
    if (!local || !local.rel.startsWith('docs/') || !local.rel.endsWith('.md')) return;
    const docRel = local.rel.replace(/^docs\//, '');
    if (docRel !== 'README.md') out.add(docRel);
  };

  for (const link of inlineMarkdownLinks(visible)) consider(link.target);
  for (const m of visible.matchAll(REF_LINK)) consider(m[1]);
  for (const m of visible.matchAll(HTML_LINK)) consider(m[1]);
  return out;
}

function docsViewerRoutes(text) {
  return new Set(
    [...text.matchAll(/\[\s*['"]([^'"]+\.md(?:#[^'"]*)?)['"]\s*,/g)]
      .map((m) => m[1].split('#')[0])
      .filter(Boolean),
  );
}

function requireSameDocsInventory(label, actual, expected) {
  for (const rel of expected) {
    if (!actual.has(rel)) problems.push(`${label}: missing docs inventory entry for ${rel}`);
  }
  for (const rel of [...actual].sort()) {
    if (!expected.has(rel)) problems.push(`${label}: lists ${rel}, but docs/${rel} does not exist`);
  }
}

function inlineMarkdownLinks(text) {
  const links = [];
  for (let i = 0; i < text.length; i += 1) {
    if (!isUnescapedLabelStart(text, i)) continue;

    const closeLabel = text.indexOf(']', i + 1);
    if (closeLabel === -1 || text[closeLabel + 1] !== '(') continue;

    const parsed = parseInlineTarget(text, closeLabel + 2);
    if (parsed) {
      links.push({ index: i, target: parsed.target.split(/\s+["'(]/, 1)[0] });
      i = parsed.end;
    }
  }
  return links;
}

function isUnescapedLabelStart(text, index) {
  return text[index] === '[' && (index === 0 || text[index - 1] !== '\\');
}

function parseInlineTarget(text, start) {
  let depth = 0;
  let target = '';
  for (let index = start; index < text.length; index += 1) {
    const next = readInlineTargetChar(text, index, depth);
    if (next.done) return { target, end: index };
    target += next.value;
    depth = next.depth;
    index = next.index;
  }
  return null;
}

function readInlineTargetChar(text, index, depth) {
  const char = text[index];
  if (char === '\\') {
    return { value: char + (text[index + 1] ?? ''), depth, index: index + 1, done: false };
  }
  if (char === '(') return { value: char, depth: depth + 1, index, done: false };
  if (char === ')' && depth === 0) return { value: '', depth, index, done: true };
  if (char === ')') return { value: char, depth: depth - 1, index, done: false };
  return { value: char, depth, index, done: false };
}

for (const rel of authoringSources) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) continue; // check:pack owns missing package-listed docs
  const text = readFileSync(abs, 'utf8');
  const unfenced = stripCodeBlocks(text);
  const visible = stripInlineCode(unfenced);
  const requirePackedTarget = shippedSet.has(rel);

  for (const link of inlineMarkdownLinks(visible)) {
    recordLink(rel, lineAt(visible, link.index), link.target, { requirePackedTarget });
  }
  for (const m of visible.matchAll(REF_LINK)) {
    recordLink(rel, lineAt(visible, m.index), m[1], { requirePackedTarget });
  }
  for (const m of visible.matchAll(HTML_LINK)) {
    recordLink(rel, lineAt(visible, m.index), m[1], { requirePackedTarget });
  }
  if (rel === 'llms.txt') {
    const refs = offlineReferenceSlice(unfenced);
    if (refs) {
      for (const m of refs.text.matchAll(/`([^`\n]+)`/g)) {
        recordPackedCodeSpan(rel, lineAt(unfenced, refs.offset + m.index), m[1]);
      }
    }
  }
}

const docsIndexRel = 'docs/index.html';
let viewerRoutes = new Set();
if (existsSync(resolve(root, docsIndexRel))) {
  const text = readFileSync(resolve(root, docsIndexRel), 'utf8');
  viewerRoutes = docsViewerRoutes(text);
  for (const route of viewerRoutes) {
    checkedViewerDocs += 1;
    recordLink(docsIndexRel, lineAt(text, text.indexOf(route)), route);
  }
}

const docsInventory = new Set(docsMarkdownInventory());
checkedInventoryDocs = docsInventory.size;
requireSameDocsInventory('docs/README.md', docsReadmeTargets(), docsInventory);
requireSameDocsInventory('docs/index.html', viewerRoutes, docsInventory);

if (problems.length) {
  console.error(`✗ check:doc-links — ${problems.length} public-doc local link problem(s):`);
  for (const p of problems) console.error(`    ${p}`);
  console.error(
    '  Fix the target path or heading id; docs and the docs viewer are public authoring surfaces.',
  );
  process.exit(1);
}

log(
  `✓ check:doc-links — ${checkedLinks} public authoring local link(s), including ` +
    `${checkedAnchors} anchor(s), ${checkedPackedTargets} shipped link target(s) present in ` +
    `the tarball, ${checkedPackedCodeRefs} offline code reference(s), and ` +
    `${checkedViewerDocs} docs viewer route(s) resolve; docs README/viewer cover ` +
    `${checkedInventoryDocs} docs page(s)`,
);
