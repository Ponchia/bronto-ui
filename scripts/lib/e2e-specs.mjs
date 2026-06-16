import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const VISUAL_E2E_SPEC = 'visual.spec.mjs';
export const NON_PIXEL_E2E_TEST_MATCH = /[/\\](?!visual\.spec\.mjs)[^/\\]+\.spec\.mjs$/;

export function discoverNonPixelE2eSpecs(root) {
  return readdirSync(resolve(root, 'test/e2e'), { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith('.spec.mjs') && name !== VISUAL_E2E_SPEC)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => `test/e2e/${name}`);
}
