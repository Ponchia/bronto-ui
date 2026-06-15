/**
 * Gate the public migration map.
 *
 * MIGRATIONS.json is shipped machine-readable API for consumers/codemods. This
 * check keeps it structurally valid and tied to the human migration docs:
 * every version edge has a doc, safe rewrites are well-formed, and manual
 * rewrites carry a note.
 *
 * Run: node scripts/check-migrations.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const map = JSON.parse(readFileSync(resolve(root, 'MIGRATIONS.json'), 'utf8'));

if (!Array.isArray(map.migrations) || map.migrations.length === 0) {
  errors.push('MIGRATIONS.json must contain a non-empty migrations array');
} else {
  const seen = new Set();
  for (const [index, migration] of map.migrations.entries()) {
    const label = `migrations[${index}]`;
    const from = migration.from;
    const to = migration.to;
    if (!/^\d+\.\d+$/.test(String(from))) errors.push(`${label}.from must be "major.minor"`);
    if (!/^\d+\.\d+$/.test(String(to))) errors.push(`${label}.to must be "major.minor"`);
    const edge = `${from}->${to}`;
    if (seen.has(edge)) errors.push(`${label}: duplicate migration edge ${edge}`);
    seen.add(edge);

    const docRel = `docs/migrations/${from}-to-${to}.md`;
    if (!existsSync(resolve(root, docRel))) {
      errors.push(`${label}: missing ${docRel}`);
    } else {
      const doc = readFileSync(resolve(root, docRel), 'utf8');
      if (!doc.includes('MIGRATIONS.json')) {
        errors.push(`${docRel}: must link back to MIGRATIONS.json`);
      }
    }

    if (!nonEmpty(migration.summary)) errors.push(`${label}.summary must be non-empty`);
    if (!nonEmpty(migration.codemod)) errors.push(`${label}.codemod must be non-empty`);
    if (!Array.isArray(migration.safe)) errors.push(`${label}.safe must be an array`);
    if (!Array.isArray(migration.manual)) errors.push(`${label}.manual must be an array`);

    for (const [ruleIndex, rule] of (migration.safe ?? []).entries()) {
      const ruleLabel = `${label}.safe[${ruleIndex}]`;
      if (!nonEmpty(rule.old)) errors.push(`${ruleLabel}.old must be non-empty`);
      if (!nonEmpty(rule.new)) errors.push(`${ruleLabel}.new must be non-empty`);
      if (rule.prefix !== undefined && typeof rule.prefix !== 'boolean') {
        errors.push(`${ruleLabel}.prefix must be boolean when present`);
      }
    }

    for (const [ruleIndex, rule] of (migration.manual ?? []).entries()) {
      const ruleLabel = `${label}.manual[${ruleIndex}]`;
      if (!nonEmpty(rule.old)) errors.push(`${ruleLabel}.old must be non-empty`);
      if (!nonEmpty(rule.new)) errors.push(`${ruleLabel}.new must be non-empty`);
      if (!nonEmpty(rule.note)) errors.push(`${ruleLabel}.note must be non-empty`);
    }
  }
}

reportAndExit(errors, {
  label: 'migration map',
  ok: `${map.migrations?.length ?? 0} migration edge(s) have structured rules and docs`,
});

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
