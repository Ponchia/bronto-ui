/**
 * Shared emit plumbing for the `gen-*` codegen scripts: the repo root, the
 * "am I being run directly?" guard, the write-the-generated-files loop, and the
 * canonical GENERATED banner. Each generator owns its token→slot MAP and its
 * artifact shape; only this boilerplate was copy-pasted across all of them.
 * (code-quality audit Q11/Q12.)
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from './stdio.mjs';

/** Absolute repo root (this file lives at scripts/lib/emit.mjs). */
export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** True when the module at `importMetaUrl` is the entry point (`node x.mjs`),
 *  not an import — the one idiom for every generator's CLI footer. */
export function isMain(importMetaUrl) {
  return Boolean(process.argv[1]) && resolve(process.argv[1]) === fileURLToPath(importMetaUrl);
}

/** Write a `{ 'rel/path': content }` map under `root`, logging each file. */
export function writeGenerated(root, files) {
  for (const [rel, content] of Object.entries(files)) {
    writeFileSync(resolve(root, rel), content);
    log(`✓ wrote ${rel}`);
  }
}

/**
 * The canonical `/** @ponchia/ui — GENERATED … *​/` banner shared by every
 * generated artifact. `bodyLines` (optional) are the wrapped prose paragraph the
 * `.js` carries and the `.d.ts` omits — each becomes a ` *  <line>` row.
 *
 * @param {string} script   the generator filename, e.g. `gen-d2.mjs`
 * @param {string} buildCmd the npm script, e.g. `d2:build`
 * @param {string[]} [bodyLines]
 * @returns {string} the banner, newline-terminated
 */
export function genBanner(script, buildCmd, bodyLines = []) {
  const head =
    `/** @ponchia/ui — GENERATED from the token source by scripts/${script}.\n` +
    ` *  Do not edit by hand; run \`npm run ${buildCmd}\`. Drift-checked in CI.`;
  if (!bodyLines.length) return `${head} */\n`;
  return `${head}\n *\n${bodyLines.map((l) => ` *  ${l}`).join('\n')} */\n`;
}
