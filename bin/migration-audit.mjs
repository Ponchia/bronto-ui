/** Literal review markers, not a codemod or a complete dependency-graph audit. */
import { readFileSync } from 'node:fs';

const registry = JSON.parse(readFileSync(new URL('../MIGRATIONS.json', import.meta.url), 'utf8'));
export const supportedMigrations = registry.migrations
  .filter((entry) => entry.audit)
  .map((entry) => entry.to);

const specifiers = /(?<![\w@/.-])@ponchia\/ui\/[\w./-]+/g;
const classes = /(?<![/\w-])ui-[a-z0-9][\w-]*(?![\w/-])/g;
const members =
  /(?<![\w$])([A-Za-z_$][\w$]*)\s*(?:\.\s*([A-Za-z_$][\w$]*)|\[\s*(['"`])([A-Za-z_$][\w$]*)\3\s*\]|\[\s*([A-Za-z_$][\w$]*)\s*\])/g;
const splitSpecifiers =
  /(?<![\w@/.-])(['"`])(@ponchia\/ui\/[\w./-]*)\1\s*\+\s*(['"`])([\w./-]+)\3/g;

// A bounded source review: only syntax that directly names the classes export.
// Do not guess values across imports, functions or runtime dataflow.
function namedOwners(source, name) {
  const owners = new Set([name]);
  const esm = /\bimport\s*\{([^}]*)\}\s*from\s*(['"])@ponchia\/ui\/classes\2/g;
  for (const match of source.matchAll(esm)) {
    for (const item of match[1].split(',')) {
      const alias = item.trim().match(/^(ui|cls)\s+as\s+([A-Za-z_$][\w$]*)$/);
      if (alias?.[1] === name) owners.add(alias[2]);
    }
  }
  const cjs =
    /\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*require\(\s*(['"])@ponchia\/ui\/classes\2\s*\)/g;
  for (const match of source.matchAll(cjs)) {
    for (const item of match[1].split(',')) {
      const alias = item.trim().match(/^(ui|cls)\s*:\s*([A-Za-z_$][\w$]*)$/);
      if (alias?.[1] === name) owners.add(alias[2]);
    }
  }
  return owners;
}

function constantMembers(source) {
  const constants = new Map();
  const declarations = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(['"`])([A-Za-z_$][\w$]*)\2/g;
  for (const match of source.matchAll(declarations)) constants.set(match[1], match[3]);
  return constants;
}

function patternFor(rule) {
  if (rule.type === 'specifier') return specifiers;
  if (rule.type === 'class-family') return classes;
  if (rule.type === 'member' || rule.type === 'member-family') return members;
  throw new Error(`Unsupported migration rule type: ${rule.type}`);
}

function matchesRule(rule, match, aliases, constants) {
  if (rule.type === 'specifier') return rule.values.includes(match[0]);
  if (rule.type === 'class-family') {
    return rule.values.some(
      (value) =>
        match[0] === value ||
        match[0].startsWith(`${value}__`) ||
        match[0].startsWith(`${value}--`),
    );
  }
  if (!aliases.get(rule.owner).has(match[1])) return false;
  const property = match[2] ?? match[4] ?? constants.get(match[5]);
  if (!property) return false;
  return rule.type === 'member'
    ? rule.values.includes(property)
    : rule.values.some((value) => property.startsWith(value));
}

export function migrationAudit(version) {
  if (version === undefined) return null;
  const edge = registry.migrations.find((entry) => entry.to === version && entry.audit);
  if (!edge) throw new Error(`No source audit is defined for migration ${version}`);
  const { guide, scope, rules } = edge.audit;
  const compiled = rules.map((rule) => ({ ...rule, pattern: patternFor(rule) }));
  return {
    metadata: { from: edge.from, to: edge.to, guide, scope },
    scan(source) {
      const matches = [];
      const aliases = new Map(
        [...new Set(compiled.filter((rule) => rule.owner).map((rule) => rule.owner))].map(
          (owner) => [owner, namedOwners(source, owner)],
        ),
      );
      const constants = constantMembers(source);
      for (const rule of compiled) {
        for (const match of source.matchAll(rule.pattern)) {
          if (matchesRule(rule, match, aliases, constants))
            matches.push({
              index: match.index,
              name: match[0],
              rule: rule.id,
              message: rule.message,
            });
        }
        if (rule.type === 'specifier') {
          for (const match of source.matchAll(splitSpecifiers)) {
            const combined = match[2] + match[4];
            if (rule.values.includes(combined)) {
              matches.push({
                index: match.index,
                name: combined,
                rule: rule.id,
                message: rule.message,
              });
            }
          }
        }
      }
      return matches.sort((a, b) => a.index - b.index || a.rule.localeCompare(b.rule));
    },
  };
}
