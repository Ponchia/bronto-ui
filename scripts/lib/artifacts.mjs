/**
 * The registry of pure, committed, generated artifacts: one flat
 * `repo-relative path → expected content` map assembled from the generators.
 *
 * Every entry here is a **pure freshness** artifact — its content is a
 * deterministic function of committed source (`tokens/index.js`,
 * `classes/index.js`, the token model), with no Date/now/random — so a single
 * regenerate-and-byte-compare check (`check-fresh.mjs`) replaces the per-file
 * drift gates these generators used to each carry. `writeAll()` is the
 * counterpart `npm run` target that produces them.
 *
 * NOT here (deliberately): artifacts whose check also asserts a *semantic*
 * property beyond freshness — `css/dataviz.css`/`charts.json` (CVD-distinct),
 * `css/skins.css` (accent-defining), `glyphs/*` (16×16, sorted),
 * `docs/contrast.md` (WCAG floors), `dist/**` (size budget + url() resolution).
 * Those keep their own bespoke gates. This registry is only the freshness frame.
 */
import { repoRoot, writeGenerated } from './emit.mjs';

import { generated as dtsGenerated } from '../gen-dts.mjs';
import { packageContractMd } from '../gen-package-contract.mjs';
import { generated as referenceGenerated } from '../gen-reference.mjs';
import { generated as vscodeGenerated } from '../gen-vscode-data.mjs';
import { classesJson } from '../gen-classes-json.mjs';
import { dtcgJson } from '../gen-dtcg.mjs';
import { figmaVariablesJson } from '../gen-figma-variables.mjs';
import { resolvedJson } from '../gen-resolved.mjs';
import { tokensCss } from '../gen-tokens-css.mjs';
import { tokensJson } from '../gen-tokens-json.mjs';

/** Repo-relative path → freshly-generated expected content. */
export const artifacts = {
  ...dtsGenerated, // classes/index.d.ts, tokens/index.d.ts
  ...referenceGenerated, // docs/reference.md
  ...vscodeGenerated, // classes/vscode.css-custom-data.json
  'docs/package-contract.md': packageContractMd,
  'classes/classes.json': classesJson(),
  'tokens/tokens.dtcg.json': dtcgJson(),
  'tokens/resolved.json': resolvedJson(),
  'tokens/figma.variables.json': figmaVariablesJson(),
  'css/tokens.css': tokensCss(),
  'tokens/index.json': tokensJson,
};

/** Write every registry artifact to disk. */
export function writeAll() {
  writeGenerated(repoRoot, artifacts);
}
