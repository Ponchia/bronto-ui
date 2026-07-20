/**
 * Emit tokens/tokens.dtcg.json as a portable Design Tokens Community Group
 * 2025.10 document. DTCG typed values are structured data: colours are sRGB
 * objects, dimensions/durations are number+unit objects, and numeric tokens
 * are numbers rather than CSS strings.
 *
 * Bronto's authored model is CSS-first and intentionally contains var() and
 * color-mix() expressions. The DTCG artifact therefore projects the existing
 * resolved light/dark palettes plus the flattened global scale. Consumers that
 * need the original CSS expressions use tokens.json instead.
 *
 * Run: node scripts/gen-dtcg.mjs   (or: npm run dtcg:build)
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cssVars } from '../tokens/index.js';
import { buildResolved } from './gen-resolved.mjs';
import { parseCssColor } from './lib/oklch.mjs';
import { repoRoot as root, isMain } from './lib/emit.mjs';
import { log } from './lib/stdio.mjs';

const CSS_EXTENSION = 'com.ponchia.css';
const fontFamilyTokens = new Set(['mono', 'sans', 'dot-font', 'display']);
const omittedScaleTokens = new Set(['tracking-wide', 'tracking-wider']);
const numeric = /^[-+]?(?:(?:\d+\.?\d*)|\.\d+)$/;
const typedDimension = /^([-+]?(?:(?:\d+\.?\d*)|\.\d+))(px|rem)$/;
const duration = /^([-+]?(?:(?:\d+\.?\d*)|\.\d+))(ms|s)$/;

const round = (value) => Number(value.toFixed(6));

function sourceExtension(variable, authoredValue) {
  return {
    [CSS_EXTENSION]: {
      variable,
      authoredValue,
    },
  };
}

function fontFamily(value) {
  return value.split(',').map((part) => part.trim().replace(/^['"]|['"]$/g, ''));
}

function scaleToken(variable, value) {
  const name = variable.replace(/^--/, '');
  const extensions = sourceExtension(variable, cssVars.global[variable]);
  const dimensionMatch = typedDimension.exec(value);
  if (dimensionMatch) {
    return {
      $type: 'dimension',
      $value: { value: Number(dimensionMatch[1]), unit: dimensionMatch[2] },
      $extensions: extensions,
    };
  }
  const durationMatch = duration.exec(value);
  if (durationMatch) {
    return {
      $type: 'duration',
      $value: { value: Number(durationMatch[1]), unit: durationMatch[2] },
      $extensions: extensions,
    };
  }
  if (name.startsWith('ease-')) {
    const match = /^cubic-bezier\(([^)]+)\)$/.exec(value);
    if (!match) throw new Error(`Cannot convert ${variable}=${value} to a cubicBezier token`);
    return {
      $type: 'cubicBezier',
      $value: match[1].split(',').map((part) => Number(part.trim())),
      $extensions: extensions,
    };
  }
  if (fontFamilyTokens.has(name)) {
    return { $type: 'fontFamily', $value: fontFamily(value), $extensions: extensions };
  }
  if (/weight/.test(name) && numeric.test(value)) {
    return { $type: 'fontWeight', $value: Number(value), $extensions: extensions };
  }
  if (numeric.test(value)) {
    return { $type: 'number', $value: Number(value), $extensions: extensions };
  }
  // DTCG dimensions intentionally allow px/rem only; em tracking has no
  // conforming scalar type. Keep it in tokens.json instead of fabricating a
  // unitless number. Any other unhandled scale is a generator error.
  if (omittedScaleTokens.has(name)) return null;
  throw new Error(`Cannot convert ${variable}=${value} to a portable DTCG token`);
}

function colorValue(value) {
  const rgba = parseCssColor(value);
  if (!rgba) throw new Error(`Cannot convert resolved colour ${value} to DTCG sRGB`);
  const [r, g, b, alpha] = rgba;
  const out = {
    colorSpace: 'srgb',
    components: [round(r / 255), round(g / 255), round(b / 255)],
    alpha: round(alpha),
  };
  if (/^#[0-9a-f]{6}$/i.test(value)) out.hex = value.toLowerCase();
  return out;
}

function colorToken(theme, variable, value) {
  const authoredValue = cssVars[theme][variable] ?? cssVars.global[variable];
  return {
    $type: 'color',
    $value: colorValue(value),
    $extensions: sourceExtension(variable, authoredValue),
  };
}

/** Group a flat CSS-variable map by its first hyphen segment
 * (radius-lg -> radius.lg; accent-soft -> accent.soft). */
function group(map, makeToken) {
  const out = {};
  for (const [variable, value] of Object.entries(map)) {
    const name = variable.replace(/^--/, '');
    const segment = name.includes('-') ? name.slice(0, name.indexOf('-')) : name;
    const leaf = name === segment ? 'DEFAULT' : name.slice(segment.length + 1);
    const token = makeToken(variable, value);
    if (token) (out[segment] ||= {})[leaf] = token;
  }
  return out;
}

export function buildDtcg() {
  const resolved = buildResolved();
  return {
    $schema: 'https://www.designtokens.org/schemas/2025.10/format.json',
    $description:
      '@ponchia/ui portable design tokens in DTCG 2025.10 format. Generated from the resolved light/dark palettes and flattened global scale; use tokens.json for authored CSS var()/color-mix() expressions.',
    $extensions: {
      'com.ponchia.ui': {
        format: 'DTCG 2025.10',
        source: 'tokens/index.js',
        rawCssArtifact: 'tokens.json',
        omittedCssVariables: ['--tracking-wide', '--tracking-wider', '--shadow', '--shadow-raised'],
      },
    },
    scale: group(resolved.scale, scaleToken),
    color: {
      light: group(resolved.light, (variable, value) => colorToken('light', variable, value)),
      dark: group(resolved.dark, (variable, value) => colorToken('dark', variable, value)),
    },
  };
}

export const DTCG_PATH = resolve(root, 'tokens/tokens.dtcg.json');
export const dtcgJson = () => `${JSON.stringify(buildDtcg(), null, 2)}\n`;

if (isMain(import.meta.url)) {
  writeFileSync(DTCG_PATH, dtcgJson());
  log('✓ wrote tokens/tokens.dtcg.json');
}
