import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const schema = JSON.parse(readFileSync('schemas/report-claims.v1.schema.json', 'utf8'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

test('report claims schema is exported and keeps the v1 contract vocabulary', () => {
  assert.equal(
    pkg.exports['./schemas/report-claims.v1.schema.json'],
    './schemas/report-claims.v1.schema.json',
  );
  assert.equal(schema.additionalProperties, false);
  for (const key of ['$schema', 'schemaVersion', 'report', 'claims', 'sources', 'relations']) {
    assert.ok(schema.properties[key], `schema allows documented top-level key ${key}`);
  }
  assert.equal(schema.properties.schemaVersion.const, 'bronto-report-claims.v1');
  assert.deepEqual(schema.$defs.claimStatus.enum, [
    'supported',
    'partial',
    'disputed',
    'unsupported',
    'unknown',
  ]);
  assert.deepEqual(schema.$defs.sourceState.enum, [
    'verified',
    'reviewed',
    'generated',
    'unverified',
    'stale',
    'conflict',
  ]);
  assert.deepEqual(schema.$defs.relationKind.enum, [
    'supports',
    'limits',
    'contradicts',
    'informs',
  ]);
  assert.match(`sha256:${'a'.repeat(64)}`, new RegExp(schema.$defs.hash.pattern));
  assert.doesNotMatch('sha256:abc123', new RegExp(schema.$defs.hash.pattern));
});
