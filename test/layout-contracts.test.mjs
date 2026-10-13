import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readText = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const readJSON = (path) => JSON.parse(readText(path));
const specs = [
  ['home.json', '/', [320, 340, 375, 768, 1280]],
  ['operations.json', '/examples/operations/', [320, 375, 768, 1280]],
];

test('local-site contracts preserve loopback target and explicit design rules', () => {
  for (const [filename, route, widths] of specs) {
    const contract = readJSON('test/layout/' + filename);
    assert.equal(contract.schemaVersion, 1);
    assert.equal(contract.url, 'http://127.0.0.1:18775' + route);
    assert.deepEqual(contract.widths, widths);
    assert.equal(contract.rules[0].type, 'document-overflow');
    assert.ok(contract.rules[0].tolerance <= 2);
    assert.ok(contract.rules.some((rule) => rule.type === 'contained' && rule.axis === 'x'));
    assert.ok(contract.rules.some((rule) => rule.type === 'selector-count'));
    assert.equal(new Set(contract.rules.map((rule) => rule.id)).size, contract.rules.length);
  }
});

test('layout workflow pins toolchain, sandbox and fixed localhost targets', () => {
  const workflow = readText('.github/workflows/layout-contract-smoke.yml');
  assert.match(workflow, /repository: Ponchia\/bronto-layout/);
  assert.match(workflow, /ref: 9b39ed8586f5fff3c1d47d0ec1a141fd9790b2fd/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /doctor --verify-launch --json/);
  assert.match(workflow, /--spec test\/layout\/home\.json/);
  assert.match(workflow, /--spec test\/layout\/operations\.json/);
  for (const line of workflow.split('\n')) {
    if (line.trim().startsWith('#')) continue;
    assert.doesNotMatch(line, /BRONTO_CHROME_NO_SANDBOX=1|--no-sandbox/);
  }
  assert.doesNotMatch(workflow, /inputs\.(?:url|domain|manifest|path)/);
});

test('negative control alters generated CSS only and verifies blocking overflow', () => {
  const workflow = readText('.github/workflows/layout-contract-smoke.yml');
  const healthy = workflow.indexOf('check --spec test/layout/home.json');
  const mutation = workflow.indexOf("cat >> _site/site/site.css <<'CSS'");
  const failing = workflow.indexOf('data.reports.flatMap');
  assert.ok(healthy > 0 && mutation > healthy && failing > mutation);
  assert.match(workflow, /document-does-not-overflow/);
  assert.match(workflow, /x.deviation > 2/);
  assert.match(workflow, /trap 'cp "\$clean_css" _site\/site\/site\.css;/);
});
