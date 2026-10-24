import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const gate = resolve('scripts/semgrep-gate.py');
const source = 'const text = "reviewed";\n';
const finding = {
  check_id: 'audit.example',
  path: 'fixture.js',
  start: { line: 1, col: 1 },
  end: { line: 1, col: 24 },
  extra: { message: 'Reviewed finding', severity: 'INFO', metadata: {} },
};
const report = {
  version: '1.166.0',
  paths: { scanned: ['fixture.js'] },
  errors: [],
  results: [finding],
};
const baseline = {
  scannerVersion: '1.166.0',
  parserWarnings: [],
  exceptions: [
    {
      identity: [
        finding.check_id,
        finding.path,
        1,
        1,
        1,
        24,
        createHash('sha256').update(source).digest('hex'),
        createHash('sha256')
          .update('{"message": "Reviewed finding", "metadata": {}, "severity": "INFO"}')
          .digest('hex'),
      ],
      reason: 'Reviewed audit fixture',
      evidence: 'Regression fixture',
    },
  ],
};

function run(scan = report, exceptions = baseline, code = source) {
  const root = mkdtempSync(join(tmpdir(), 'bronto-semgrep-gate-'));
  try {
    writeFileSync(join(root, 'fixture.js'), code);
    writeFileSync(join(root, 'report.json'), JSON.stringify(scan));
    writeFileSync(join(root, 'baseline.json'), JSON.stringify(exceptions));
    return spawnSync('python3', [gate, 'report.json', 'baseline.json'], {
      cwd: root,
      encoding: 'utf8',
    });
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}

test('Semgrep accepts exact reviewed findings and removed findings', () => {
  for (const scan of [report, { ...report, results: [] }]) {
    const result = run(scan);
    assert.equal(result.status, 0, result.stderr);
  }
});

test('Semgrep rejects changed source, new rules, locations and duplicate findings', () => {
  const mutations = [
    { check_id: 'new.security.rule' },
    { start: { line: 2, col: 1 } },
    { end: { line: 1, col: 25 } },
    { extra: { ...finding.extra, severity: 'ERROR' } },
    { extra: { ...finding.extra, message: 'Changed assessment' } },
    { extra: { ...finding.extra, metadata: { confidence: 'HIGH' } } },
    { path: '../outside.js' },
  ];
  for (const mutation of mutations) {
    assert.equal(run({ ...report, results: [{ ...finding, ...mutation }] }).status, 1);
  }
  assert.equal(run(report, baseline, `${source}// edited input or context\n`).status, 1);
  assert.equal(run({ ...report, results: [finding, finding] }).status, 1);
});

test('Semgrep rejects incomplete scans, execution errors and malformed exceptions', () => {
  for (const scan of [
    {},
    { ...report, errors: [{ message: 'parse failure' }] },
    { ...report, errors: undefined },
    { ...report, results: null },
    { ...report, version: 'new' },
    { ...report, paths: { scanned: [] } },
  ]) {
    assert.equal(run(scan).status, 1);
  }
  const entry = baseline.exceptions[0];
  for (const exceptions of [
    [entry, entry],
    [{ ...entry, reason: '' }],
    [{ ...entry, evidence: '' }],
  ]) {
    assert.equal(run(report, { ...baseline, exceptions }).status, 1);
  }
});

test('only exact reviewed partial-parser warnings pass, never execution errors', () => {
  const warning = { path: 'fixture.js', level: 'warn', code: 3, type: ['PartialParsing', []] };
  // Python uses sorted JSON with spaces; preserve its canonical encoding here.
  const canonical =
    '{"code": 3, "level": "warn", "path": "fixture.js", "type": ["PartialParsing", []]}';
  const warnings = {
    ...baseline,
    parserWarnings: [
      {
        identity: [
          'fixture.js',
          createHash('sha256').update(canonical).digest('hex'),
          baseline.exceptions[0].identity[6],
        ],
        reason: 'Scanner parser limitation in fixture',
        evidence: 'Reviewed source and independent syntax check',
      },
    ],
  };
  const accepted = run({ ...report, errors: [warning] }, warnings);
  assert.equal(accepted.status, 0, accepted.stderr);
  for (const changed of [
    { ...warning, level: 'error' },
    { ...warning, code: 2 },
    { ...warning, type: ['Timeout', []] },
    { ...warning, message: 'new location' },
  ]) {
    assert.equal(run({ ...report, errors: [changed] }, warnings).status, 1);
  }
  assert.equal(run({ ...report, errors: [warning, warning] }, warnings).status, 1);
  assert.equal(run({ ...report, errors: [warning] }, warnings, `${source}// changed\n`).status, 1);
});
