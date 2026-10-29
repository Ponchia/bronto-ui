// Shared fail-closed verification for the *active* source-locked publisher.
// The installed dependency graph is checked by source-publisher.mjs before
// this function accepts an npm audit result. This function never audits a
// manifest without its verified installed inventory.
import assert from 'node:assert/strict';

const levels = ['info', 'low', 'moderate', 'high', 'critical'];

export function verifyAudit(report, exitCode, installed) {
  assert.equal(report?.auditReportVersion, 2, 'Unsupported or malformed audit report');
  assert.equal(report.error, undefined, 'Audit service returned an error');
  assert.ok(
    report.vulnerabilities &&
      typeof report.vulnerabilities === 'object' &&
      !Array.isArray(report.vulnerabilities),
    'Missing audit findings',
  );
  const counts = Object.fromEntries(levels.map((level) => [level, 0]));
  for (const [name, finding] of Object.entries(report.vulnerabilities)) {
    assert.equal(finding?.name, name, 'Malformed audit finding');
    assert.ok(levels.includes(finding.severity), 'Unknown finding severity');
    assert.ok(
      Array.isArray(finding.nodes) && finding.nodes.length > 0,
      'Missing affected package paths',
    );
    for (const node of finding.nodes)
      assert.equal(installed.get(node)?.name, name, 'Audit finding outside installed inventory');
    counts[finding.severity]++;
  }
  const summary = report.metadata?.vulnerabilities;
  for (const level of levels) {
    assert.ok(
      Number.isInteger(summary?.[level]) && summary[level] >= 0,
      'Missing or invalid audit counts',
    );
    assert.equal(summary[level], counts[level], 'Audit counts differ from findings');
  }
  assert.equal(
    summary.total,
    Object.values(counts).reduce((sum, count) => sum + count, 0),
    'Invalid audit total',
  );
  assert.ok(exitCode === 0 || exitCode === 1, 'Audit command failed');
  assert.equal(
    counts.high + counts.critical,
    0,
    'Publishing tooling has high/critical vulnerabilities',
  );
  assert.equal(exitCode, 0, 'Audit command did not succeed');
  return counts;
}
