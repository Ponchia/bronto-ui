/**
 * Enforce: classes/vscode.css-custom-data.json is the freshly generated
 * artifact (run scripts/gen-vscode-data.mjs). Keeps editor token
 * IntelliSense from drifting away from the token registry.
 *
 * Run: node scripts/check-vscode-data.mjs
 */
import { generated } from './gen-vscode-data.mjs';
import { assertFresh } from './lib/assert-fresh.mjs';

assertFresh(generated, {
  label: 'classes/vscode.css-custom-data.json is the generated, in-sync token data',
  buildHint: 'npm run vscode:build',
});
