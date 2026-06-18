/**
 * Project-native complexity gate.
 *
 * The external audit helper can find hotspots, but this package needs the same
 * guard in its own `npm run check` chain so complexity regressions fail in CI.
 * This intentionally uses the existing TypeScript dev dependency instead of a
 * new runtime or Python tool: parse JS/MJS source, score function-level
 * cyclomatic complexity, and keep large functions out of hand-authored code.
 *
 * Run: node scripts/check-complexity.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_MAX_COMPLEXITY = 12;
const DEFAULT_MAX_NLOC = 220;
const MAX_COMPLEXITY = Number(process.env.BRONTO_COMPLEXITY_MAX ?? DEFAULT_MAX_COMPLEXITY);
const MAX_NLOC = Number(process.env.BRONTO_COMPLEXITY_MAX_NLOC ?? DEFAULT_MAX_NLOC);
const BRANCH_NODE_KINDS = new Set([
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.DoStatement,
  ts.SyntaxKind.ConditionalExpression,
  ts.SyntaxKind.CatchClause,
  ts.SyntaxKind.CaseClause,
]);
const LOGICAL_OPERATOR_KINDS = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
]);

const SOURCE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);
const SKIP_DIRS = new Set([
  '.git',
  '.jj',
  '.next',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);
const SKIP_FILES = new Set([
  // Generated declaration maps are data, not maintainable source.
  '.d.ts.map',
]);

const errors = [];
const metrics = [];

for (const file of sourceFiles(root)) {
  const sourceText = readFileSync(file, 'utf8');
  const rel = relative(root, file).split(sep).join('/');
  const source = ts.createSourceFile(
    rel,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(file),
  );
  collectFunctionMetrics(source, sourceText, rel, metrics);
}

metrics.sort((a, b) => b.complexity - a.complexity || b.nloc - a.nloc);

for (const metric of metrics) {
  if (metric.complexity > MAX_COMPLEXITY) {
    errors.push(
      `${metric.rel}:${metric.line} ${metric.name} complexity ${metric.complexity} > ${MAX_COMPLEXITY}`,
    );
  }
  if (metric.nloc > MAX_NLOC) {
    errors.push(`${metric.rel}:${metric.line} ${metric.name} NLOC ${metric.nloc} > ${MAX_NLOC}`);
  }
}

reportAndExit(errors, {
  label: 'complexity',
  ok:
    `${metrics.length} function(s) stay under cyclomatic complexity ${MAX_COMPLEXITY} ` +
    `and NLOC ${MAX_NLOC}`,
});

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* sourceFiles(join(dir, entry.name));
      continue;
    }
    if (!entry.isFile()) continue;
    const file = join(dir, entry.name);
    if (!SOURCE_EXTENSIONS.has(extname(file))) continue;
    if ([...SKIP_FILES].some((suffix) => file.endsWith(suffix))) continue;
    yield file;
  }
}

function scriptKind(file) {
  return extname(file) === '.mjs' ? ts.ScriptKind.JS : ts.ScriptKind.JS;
}

function collectFunctionMetrics(source, sourceText, rel, out) {
  function visit(node) {
    if (isFunctionWithBody(node)) {
      out.push({
        rel,
        line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
        name: functionName(node, source),
        complexity: cyclomaticComplexity(node),
        nloc: nloc(sourceText.slice(node.getStart(source), node.end)),
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
}

function isFunctionWithBody(node) {
  return ts.isFunctionLike(node) && !!node.body;
}

function functionName(node, source) {
  if (node.name) return node.name.getText(source);

  const parent = node.parent;
  if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name.text;
  if (ts.isPropertyAssignment(parent) || ts.isPropertyDeclaration(parent)) {
    return parent.name.getText(source);
  }
  if (ts.isCallExpression(parent)) return `${parent.expression.getText(source)} callback`;

  return '(anonymous)';
}

function cyclomaticComplexity(fn) {
  let score = 1;

  function visit(node) {
    if (node !== fn && isFunctionWithBody(node)) return;
    score += nodeComplexity(node);
    ts.forEachChild(node, visit);
  }

  visit(fn.body ?? fn);
  return score;
}

function nodeComplexity(node) {
  return Number(BRANCH_NODE_KINDS.has(node.kind)) + Number(isLogicalBinary(node));
}

function isLogicalBinary(node) {
  return ts.isBinaryExpression(node) && LOGICAL_OPERATOR_KINDS.has(node.operatorToken.kind);
}

function nloc(sourceText) {
  return sourceText
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .split('\n')
    .filter((line) => line.trim()).length;
}
