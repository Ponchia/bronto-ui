/**
 * Advisory behavior subpath export audit.
 *
 * This is intentionally not wired into `npm run check`: it reports drift
 * between public behavior leaves and package.json subpath exports, but only
 * exits non-zero when explicitly run with `--strict`.
 *
 * Run:
 *   node scripts/audit-behavior-exports.mjs
 *   node scripts/audit-behavior-exports.mjs --strict
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportTargets } from './lib/package-targets.mjs';
import { log } from './lib/stdio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');
const INTERNAL_BEHAVIOR_LEAVES = new Set(['internal']);

const issues = [];
const pkg = readJson('package.json');
const leaves = behaviorLeaves();
const exportsByLeaf = behaviorSubpathExports(pkg);

for (const leaf of leaves) {
  if (!exportsByLeaf.has(leaf)) {
    issues.push(`behaviors/${leaf}.js exists but package.json is missing "./behaviors/${leaf}"`);
  }
}

for (const [leaf, entry] of exportsByLeaf) {
  const expectedDefault = `./behaviors/${leaf}.js`;
  const expectedTypes = `./behaviors/${leaf}.d.ts`;

  if (INTERNAL_BEHAVIOR_LEAVES.has(leaf)) {
    issues.push(`package.json exports "./behaviors/${leaf}" but behaviors/${leaf}.js is internal`);
    continue;
  }

  if (!leaves.has(leaf)) {
    issues.push(
      `package.json exports "./behaviors/${leaf}" but behaviors/${leaf}.js does not exist`,
    );
  }

  if (entry.default !== expectedDefault) {
    issues.push(
      `package.json exports "./behaviors/${leaf}".default must be ${expectedDefault} (got ${JSON.stringify(entry.default)})`,
    );
  }

  if (entry.types !== expectedTypes) {
    issues.push(
      `package.json exports "./behaviors/${leaf}".types must be ${expectedTypes} (got ${JSON.stringify(entry.types)})`,
    );
  }
}

for (const [label, target] of exportTargets(pkg)) {
  if (!label.startsWith('./behaviors') || target.includes('*')) continue;
  if (!existsSync(resolve(root, target))) {
    issues.push(`package.json export target ${label} → ${target} does not exist`);
  }
}

if (issues.length) {
  console.warn(`⚠ ${issues.length} behavior export advisory finding(s):`);
  for (const issue of issues) console.warn(`  - ${issue}`);
  if (strict) process.exit(1);
} else {
  log(
    `✓ behavior export audit: ${leaves.size} public behavior leaf subpath(s) match package.json exports (${INTERNAL_BEHAVIOR_LEAVES.size} internal leaf allowlisted)`,
  );
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(resolve(root, file), 'utf8'));
  } catch (error) {
    issues.push(`${file} — could not read JSON (${error.message})`);
    return {};
  }
}

function behaviorLeaves() {
  try {
    return new Set(
      readdirSync(resolve(root, 'behaviors'))
        .filter((file) => file.endsWith('.js'))
        .map((file) => file.replace(/\.js$/, ''))
        .filter((leaf) => leaf !== 'index' && !INTERNAL_BEHAVIOR_LEAVES.has(leaf))
        .sort((a, b) => a.localeCompare(b)),
    );
  } catch (error) {
    issues.push(`behaviors/ — could not list behavior files (${error.message})`);
    return new Set();
  }
}

function behaviorSubpathExports(manifest) {
  const out = new Map();
  for (const [key, value] of Object.entries(manifest.exports ?? {})) {
    const match = /^\.\/behaviors\/([^/]+)$/.exec(key);
    if (!match) continue;
    out.set(match[1], normalizeExportEntry(value));
  }
  return out;
}

function normalizeExportEntry(value) {
  if (typeof value === 'string') return { default: value, types: undefined };
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { default: undefined, types: undefined };
  }
  return {
    default: typeof value.default === 'string' ? value.default : undefined,
    types: typeof value.types === 'string' ? value.types : undefined,
  };
}
