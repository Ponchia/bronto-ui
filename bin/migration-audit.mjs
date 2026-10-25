/** Literal review markers, not a codemod or a complete dependency-graph audit. */
import { readFileSync } from 'node:fs';

const registry = JSON.parse(readFileSync(new URL('../MIGRATIONS.json', import.meta.url), 'utf8'));
export const supportedMigrations = registry.migrations
  .filter((entry) => entry.audit)
  .map((entry) => entry.to);

const specifiers = /(?<![\w@/.-])@ponchia\/ui\/[\w./-]+/g;
const classes = /(?<![/\w-])ui-[a-z0-9][\w-]*(?![\w/-])/g;
const members = /(?<![\w$])([A-Za-z_$][\w$]*)\s*\.\s*([A-Za-z_$][\w$]*)/g;

function patternFor(rule) {
  if (rule.type === 'specifier') return specifiers;
  if (rule.type === 'class-family') return classes;
  if (rule.type === 'member' || rule.type === 'member-family') return members;
  throw new Error(`Unsupported migration rule type: ${rule.type}`);
}

function matchesRule(rule, match) {
  if (rule.type === 'specifier') return rule.values.includes(match[0]);
  if (rule.type === 'class-family') {
    return rule.values.some(
      (value) =>
        match[0] === value ||
        match[0].startsWith(`${value}__`) ||
        match[0].startsWith(`${value}--`),
    );
  }
  if (match[1] !== rule.owner) return false;
  return rule.type === 'member'
    ? rule.values.includes(match[2])
    : rule.values.some((value) => match[2].startsWith(value));
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
      for (const rule of compiled) {
        for (const match of source.matchAll(rule.pattern)) {
          if (matchesRule(rule, match))
            matches.push({
              index: match.index,
              name: match[0],
              rule: rule.id,
              message: rule.message,
            });
        }
      }
      return matches.sort((a, b) => a.index - b.index || a.rule.localeCompare(b.rule));
    },
  };
}
