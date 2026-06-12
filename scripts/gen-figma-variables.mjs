/**
 * Emit tokens/figma.variables.json — a local Figma Variables handoff manifest.
 *
 * The Figma API shape is workspace-dependent, but the hard part is stable token
 * projection: concrete light/dark colour values and unit-preserving scale
 * values. This file is deterministic, generated from the resolved token model,
 * and intended for import/sync scripts to adapt to their target Figma file.
 *
 * Run: node scripts/gen-figma-variables.mjs
 *   (or: npm run figma:variables:build)
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildResolved } from './gen-resolved.mjs';
import { repoRoot as root, isMain } from './lib/emit.mjs';
import { log } from './lib/stdio.mjs';

const PONCHIA_CSS_EXT = 'com.ponchia.css';

function round(n) {
  return Number(n.toFixed(6));
}

function rgbaFromHex(value) {
  const raw = value.slice(1);
  const chars =
    raw.length === 3 || raw.length === 4
      ? raw
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : raw;
  if (![6, 8].includes(chars.length)) return null;
  const r = Number.parseInt(chars.slice(0, 2), 16);
  const g = Number.parseInt(chars.slice(2, 4), 16);
  const b = Number.parseInt(chars.slice(4, 6), 16);
  const a = chars.length === 8 ? Number.parseInt(chars.slice(6, 8), 16) / 255 : 1;
  return { r: round(r / 255), g: round(g / 255), b: round(b / 255), a: round(a) };
}

function rgbaFromFunction(value) {
  const match =
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i.exec(value);
  if (!match) return null;
  const [, r, g, b, a = '1'] = match;
  return {
    r: round(Number(r) / 255),
    g: round(Number(g) / 255),
    b: round(Number(b) / 255),
    a: round(Number(a)),
  };
}

function figmaColor(value) {
  if (value.startsWith('#')) return rgbaFromHex(value);
  return rgbaFromFunction(value);
}

function figmaName(cssVariable) {
  return cssVariable.replace(/^--/, '').replaceAll('-', '/');
}

function cssExtensions(cssVariable, value, extra = {}) {
  return {
    [PONCHIA_CSS_EXT]: {
      variable: cssVariable,
      value,
      ...extra,
    },
  };
}

function scaleValue(value) {
  const match = /^(-?(?:\d+|\d*\.\d+))(rem|px|em|ms)?$/.exec(value);
  if (!match) return { type: 'STRING', value };
  const [, raw, unit = 'number'] = match;
  return {
    type: 'FLOAT',
    value: Number(raw),
    unit,
  };
}

function colorVariables(resolved) {
  return Object.keys(resolved.light)
    .filter((name) => name in resolved.dark)
    .sort((a, b) => figmaName(a).localeCompare(figmaName(b)))
    .map((cssVariable) => {
      const light = resolved.light[cssVariable];
      const dark = resolved.dark[cssVariable];
      const lightColor = figmaColor(light);
      const darkColor = figmaColor(dark);
      if (!lightColor || !darkColor) {
        throw new Error(`Cannot convert resolved colour ${cssVariable} to Figma RGBA`);
      }
      return {
        name: figmaName(cssVariable),
        type: 'COLOR',
        sourceCssVariable: cssVariable,
        valuesByMode: {
          light: lightColor,
          dark: darkColor,
        },
        $extensions: cssExtensions(cssVariable, light, { darkValue: dark }),
      };
    });
}

function scaleVariables(resolved) {
  return Object.entries(resolved.scale)
    .sort(([a], [b]) => figmaName(a).localeCompare(figmaName(b)))
    .map(([cssVariable, value]) => {
      const converted = scaleValue(value);
      const variable = {
        name: figmaName(cssVariable),
        type: converted.type,
        sourceCssVariable: cssVariable,
        valuesByMode: {
          global: converted.value,
        },
        $extensions: cssExtensions(cssVariable, value),
      };
      if (converted.unit) variable.unit = converted.unit;
      return variable;
    });
}

export function buildFigmaVariables() {
  const resolved = buildResolved();
  return {
    schemaVersion: 'bronto-figma-variables.v1',
    $comment:
      '@ponchia/ui local Figma Variables handoff manifest. Generated from tokens/resolved.json; do not edit by hand. This is an importer-friendly projection, not a direct Figma REST payload.',
    source: {
      tokens: 'tokens/index.js',
      resolved: 'tokens/resolved.json',
    },
    collections: [
      {
        name: 'Bronto / Color',
        modes: [
          { modeId: 'light', name: 'Light' },
          { modeId: 'dark', name: 'Dark' },
        ],
        variables: colorVariables(resolved),
      },
      {
        name: 'Bronto / Scale',
        modes: [{ modeId: 'global', name: 'Global' }],
        variables: scaleVariables(resolved),
      },
    ],
  };
}

export const FIGMA_VARIABLES_PATH = resolve(root, 'tokens/figma.variables.json');
export const figmaVariablesJson = () => JSON.stringify(buildFigmaVariables(), null, 2) + '\n';

if (isMain(import.meta.url)) {
  writeFileSync(FIGMA_VARIABLES_PATH, figmaVariablesJson());
  log('✓ wrote tokens/figma.variables.json');
}
