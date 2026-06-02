/**
 * Regenerate every pure freshness artifact in the registry in one shot.
 * The single counterpart to check-fresh.mjs — run after editing token/class
 * source so the committed mirrors stay in sync.
 *
 * Run: node scripts/gen-all.mjs   (or: npm run fresh:build)
 *
 * Note: this writes only the registry's pure-freshness artifacts. The heavier
 * generated outputs with their own semantic gates (dataviz/charts, skins,
 * glyphs, contrast, dist) are produced by their own `*:build` scripts and by
 * `npm run prepack`, which runs the complete set.
 */
import { writeAll } from './lib/artifacts.mjs';

writeAll();
