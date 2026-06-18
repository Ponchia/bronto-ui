/**
 * Gate shipped JSON Schema contracts.
 *
 * The schema files are public package data. This check proves they are exported,
 * documented, syntactically usable by a validator, and that the public cookbook
 * example is both schema-valid and semantically self-consistent.
 *
 * Run: node scripts/check-schemas.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
}

function json(rel) {
  return JSON.parse(read(rel));
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function typeName(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function formatPath(path, suffix) {
  if (!suffix) return path;
  if (/^\[\d+\]$/.test(suffix)) return `${path}${suffix}`;
  return `${path}.${suffix}`;
}

function resolvePointer(schema, ref) {
  if (!ref.startsWith('#/')) throw new Error(`unsupported external $ref ${ref}`);
  return ref
    .slice(2)
    .split('/')
    .reduce((node, part) => node?.[part.replace(/~1/g, '/').replace(/~0/g, '~')], schema);
}

function validateReference(value, node, schema, path, problems) {
  if (!node.$ref) return false;
  const resolved = resolvePointer(schema, node.$ref);
  if (!resolved) {
    problems.push(`${path}: unresolved $ref ${node.$ref}`);
    return true;
  }
  validateValue(value, resolved, schema, path, problems);
  return true;
}

function validateConstAndEnum(value, node, path, problems) {
  if (hasOwn(node, 'const') && value !== node.const) {
    problems.push(
      `${path}: expected const ${JSON.stringify(node.const)}, got ${JSON.stringify(value)}`,
    );
  }
  if (node.enum && !node.enum.includes(value)) {
    problems.push(
      `${path}: expected one of [${node.enum.join(', ')}], got ${JSON.stringify(value)}`,
    );
  }
}

function validateType(value, node, path, problems) {
  if (!node.type) return true;
  const actual = typeName(value);
  if (actual === node.type) return true;
  problems.push(`${path}: expected ${node.type}, got ${actual}`);
  return false;
}

function validateObject(value, node, schema, path, problems) {
  const properties = node.properties ?? {};
  for (const key of node.required ?? []) {
    if (!hasOwn(value, key)) problems.push(`${path}: missing required property ${key}`);
  }
  if (node.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!hasOwn(properties, key)) problems.push(`${path}: unexpected property ${key}`);
    }
  }
  for (const [key, propertySchema] of Object.entries(properties)) {
    if (hasOwn(value, key)) {
      validateValue(value[key], propertySchema, schema, formatPath(path, key), problems);
    }
  }
}

function validateArray(value, node, schema, path, problems) {
  if (node.minItems != null && value.length < node.minItems) {
    problems.push(`${path}: expected at least ${node.minItems} item(s), got ${value.length}`);
  }
  if (node.uniqueItems) {
    const seen = new Set();
    for (const item of value) {
      const key = JSON.stringify(item);
      if (seen.has(key)) problems.push(`${path}: duplicate array item ${key}`);
      seen.add(key);
    }
  }
  if (node.items) {
    value.forEach((item, index) =>
      validateValue(item, node.items, schema, path + `[${index}]`, problems),
    );
  }
}

function validateString(value, node, path, problems) {
  if (node.minLength != null && value.length < node.minLength) {
    problems.push(`${path}: expected string length >= ${node.minLength}`);
  }
  if (node.pattern && !new RegExp(node.pattern).test(value)) {
    problems.push(`${path}: does not match /${node.pattern}/`);
  }
  if (node.format === 'uri') {
    try {
      new URL(value);
    } catch {
      problems.push(`${path}: expected URI`);
    }
  }
  if (node.format === 'date-time' && Number.isNaN(Date.parse(value))) {
    problems.push(`${path}: expected date-time`);
  }
}

function validateValue(value, node, schema, path, problems) {
  if (validateReference(value, node, schema, path, problems)) return;
  validateConstAndEnum(value, node, path, problems);
  if (!validateType(value, node, path, problems)) return;
  if (node.type === 'object') validateObject(value, node, schema, path, problems);
  if (node.type === 'array') validateArray(value, node, schema, path, problems);
  if (node.type === 'string') validateString(value, node, path, problems);
}

function validateAgainstSchema(value, schema) {
  const problems = [];
  validateValue(value, schema, schema, '$', problems);
  return problems;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function expectInvalid(schema, name, sample, expectedNeedle) {
  const problems = validateAgainstSchema(sample, schema);
  if (!problems.some((problem) => problem.includes(expectedNeedle))) {
    errors.push(
      `${name} should fail with "${expectedNeedle}", got ${
        problems.length ? problems.join('; ') : 'no validation errors'
      }`,
    );
  }
}

function missingReferences(ids, knownIds) {
  return (ids ?? []).filter((id) => !knownIds.has(id));
}

function reportClaimSourceProblems(sidecar, sourceIds) {
  const problems = [];
  for (const claim of sidecar.claims ?? []) {
    for (const sourceId of missingReferences(claim.sourceIds, sourceIds)) {
      problems.push(`claim ${claim.id} references unknown source ${sourceId}`);
    }
  }
  return problems;
}

function reportSourceClaimProblems(sidecar, claimIds) {
  const problems = [];
  for (const source of sidecar.sources ?? []) {
    for (const key of ['supports', 'limits', 'contradicts']) {
      for (const claimId of missingReferences(source[key], claimIds)) {
        problems.push(`source ${source.id}.${key} references unknown claim ${claimId}`);
      }
    }
  }
  return problems;
}

function reportRelationProblems(sidecar, claimIds, sourceIds) {
  const problems = [];
  for (const relation of sidecar.relations ?? []) {
    if (!claimIds.has(relation.claimId)) {
      problems.push(`relation references unknown claim ${relation.claimId}`);
    }
    if (!sourceIds.has(relation.sourceId)) {
      problems.push(`relation references unknown source ${relation.sourceId}`);
    }
  }
  return problems;
}

function reportReferenceProblems(sidecar) {
  const claimIds = new Set((sidecar.claims ?? []).map((claim) => claim.id));
  const sourceIds = new Set((sidecar.sources ?? []).map((source) => source.id));
  return [
    ...reportClaimSourceProblems(sidecar, sourceIds),
    ...reportSourceClaimProblems(sidecar, claimIds),
    ...reportRelationProblems(sidecar, claimIds, sourceIds),
  ];
}

const JSON_FENCE_RE = new RegExp('```json\\n([\\s\\S]*?)\\n```', 'g');

function jsonFenceBodies(markdown) {
  return [...markdown.matchAll(JSON_FENCE_RE)].map((match) => match[1]);
}

function reportingExamples() {
  return jsonFenceBodies(read('docs/reporting.md'))
    .filter((block) => block.includes('"schemaVersion": "bronto-report-claims.v1"'))
    .map((block) => JSON.parse(block));
}

const pkg = json('package.json');
const reportingDoc = read('docs/reporting.md');
const packageContract = read('docs/package-contract.md');
const schemaFiles = readdirSync(resolve(root, 'schemas'))
  .filter((name) => name.endsWith('.schema.json'))
  .sort();

if (!pkg.files?.includes('schemas')) errors.push('package.json files must include schemas');

for (const file of schemaFiles) {
  const rel = `schemas/${file}`;
  const exportKey = `./${rel}`;
  if (pkg.exports?.[exportKey] !== `./${rel}`) {
    errors.push(`package.json must export ${exportKey} to ./${rel}`);
  }
  const schema = json(rel);
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') {
    errors.push(`${rel}: expected draft 2020-12 $schema`);
  }
  if (!schema.$id?.includes(`@ponchia/ui/schemas/${file}`)) {
    errors.push(`${rel}: $id must point at the public @ponchia/ui schema path`);
  }
  if (schema.type !== 'object') errors.push(`${rel}: top-level schema must describe an object`);
  if (schema.additionalProperties !== false) {
    errors.push(`${rel}: top-level additionalProperties must be false`);
  }
  if (!reportingDoc.includes(`@ponchia/ui/${rel}`)) {
    errors.push(`docs/reporting.md must document @ponchia/ui/${rel}`);
  }
  if (!packageContract.includes(`./${rel}`)) {
    errors.push(`docs/package-contract.md must list ./${rel}`);
  }
}

const reportSchema = json('schemas/report-claims.v1.schema.json');
const examples = reportingExamples();
if (examples.length !== 1) {
  errors.push(
    `docs/reporting.md must contain exactly one report-claims.v1 JSON example, got ${examples.length}`,
  );
}
for (const [index, example] of examples.entries()) {
  const problems = validateAgainstSchema(example, reportSchema);
  for (const problem of problems)
    errors.push(`docs/reporting.md example #${index + 1}: ${problem}`);
  for (const problem of reportReferenceProblems(example)) {
    errors.push(`docs/reporting.md example #${index + 1}: ${problem}`);
  }
}

const valid = examples[0] ?? {
  schemaVersion: 'bronto-report-claims.v1',
  report: { title: 'Fallback', type: 'audit' },
  claims: [{ id: 'claim-a', status: 'supported', statement: 'A claim' }],
  sources: [{ id: 'source-a', state: 'verified', title: 'A source', origin: 'Fixture' }],
};

{
  const sample = clone(valid);
  delete sample.sources;
  expectInvalid(reportSchema, 'missing sources', sample, 'missing required property sources');
}
{
  const sample = clone(valid);
  sample.extra = true;
  expectInvalid(reportSchema, 'extra top-level property', sample, 'unexpected property extra');
}
{
  const sample = clone(valid);
  sample.schemaVersion = 'bronto-report-claims.v2';
  expectInvalid(reportSchema, 'bad schemaVersion', sample, 'expected const');
}
{
  const sample = clone(valid);
  sample.claims = [];
  expectInvalid(reportSchema, 'empty claims', sample, 'expected at least 1 item');
}
{
  const sample = clone(valid);
  sample.claims[0].id = '1-bad';
  expectInvalid(reportSchema, 'bad claim id', sample, 'does not match');
}
{
  const sample = clone(valid);
  sample.claims[0].status = 'confirmed';
  expectInvalid(reportSchema, 'bad claim status', sample, 'expected one of');
}
{
  const sample = clone(valid);
  sample.claims[0].sourceIds = ['source-primary', 'source-primary'];
  expectInvalid(reportSchema, 'duplicate sourceIds', sample, 'duplicate array item');
}
{
  const sample = clone(valid);
  sample.sources[0].contentHash = 'md5:abc123';
  expectInvalid(reportSchema, 'bad content hash', sample, 'does not match');
}
{
  const sample = clone(valid);
  sample.sources[0].contentHash = 'sha256:abc123';
  expectInvalid(reportSchema, 'short sha256 content hash', sample, 'does not match');
}
{
  const sample = clone(valid);
  sample.sources[0].contentHash = `sha256:${'a'.repeat(64)}`;
  const problems = validateAgainstSchema(sample, reportSchema);
  if (problems.length) {
    errors.push(`valid sha256 content hash should pass, got ${problems.join('; ')}`);
  }
}
{
  const sample = clone(valid);
  sample.relations = [{ claimId: 'claim-primary', sourceId: 'source-primary', kind: 'proves' }];
  expectInvalid(reportSchema, 'bad relation kind', sample, 'expected one of');
}

reportAndExit(errors, {
  label: 'schemas',
  ok: `${schemaFiles.length} shipped schema file(s), ${examples.length} reporting example(s), and report-claims negative fixtures validate`,
});
