/**
 * Enforce: every pure generated-artifact mirror is byte-identical to what its
 * generator produces right now. One gate over the whole registry
 * (scripts/lib/artifacts.mjs), replacing the per-file freshness gates
 * (formerly check-tokens / check-dts / check-dtcg / check-resolved /
 * check-reference / check-vscode-data).
 *
 * Run: node scripts/check-fresh.mjs
 */
import { artifacts } from './lib/artifacts.mjs';
import { assertFresh } from './lib/assert-fresh.mjs';

assertFresh(artifacts, {
  label: `${Object.keys(artifacts).length} generated artifacts are fresh (tokens.css/json, dtcg, resolved, .d.ts, reference, classes.json, vscode data)`,
  buildHint: 'npm run fresh:build',
});
