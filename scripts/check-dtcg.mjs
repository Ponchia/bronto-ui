/** Validate the subset of DTCG 2025.10 token types emitted by gen-dtcg. */
import { buildDtcg } from './gen-dtcg.mjs';
import { isMain } from './lib/emit.mjs';
import { reportAndExit } from './lib/gate-report.mjs';

const finite = (value) => typeof value === 'number' && Number.isFinite(value);

const objectValue = (value) => value && typeof value === 'object' && !Array.isArray(value);
const unitValue = (units) => (value) =>
  objectValue(value) && finite(value.value) && units.includes(value.unit);
const unitInterval = (value) => finite(value) && value >= 0 && value <= 1;
const colorComponents = (value) =>
  Array.isArray(value) && value.length === 3 && value.every(unitInterval);
const optionalHex = (value) => value === undefined || /^#[0-9a-f]{6}$/i.test(value);
const dimensionValue = unitValue(['px', 'rem']);
const durationValue = unitValue(['ms', 's']);

const validators = {
  color(value) {
    if (!objectValue(value)) return 'color must be an object';
    if (value.colorSpace !== 'srgb') return 'colorSpace must be srgb';
    if (!colorComponents(value.components)) {
      return 'sRGB components must be three numbers from 0 to 1';
    }
    if (!unitInterval(value.alpha)) return 'alpha must be a number from 0 to 1';
    if (!optionalHex(value.hex)) return 'optional hex must be #rrggbb';
    return null;
  },
  dimension: (value) =>
    dimensionValue(value) ? null : 'dimension must be { value: number, unit: px|rem }',
  duration: (value) =>
    durationValue(value) ? null : 'duration must be { value: number, unit: ms|s }',
  cubicBezier: (value) =>
    Array.isArray(value) && value.length === 4 && value.every(finite)
      ? null
      : 'cubicBezier must contain four numbers',
  fontFamily: (value) =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((part) => typeof part === 'string' && part)
      ? null
      : 'fontFamily must be a non-empty string array',
  fontWeight: (value) => (finite(value) ? null : 'fontWeight must be a number'),
  number: (value) => (finite(value) ? null : 'number must be a number'),
};

function validateTypedValue(type, value, path, errors) {
  if (value === null || value === undefined) {
    errors.push(`${path}: $value must not be null or missing`);
    return;
  }
  const validator = validators[type];
  if (!validator) {
    errors.push(`${path}: unsupported $type ${JSON.stringify(type)}`);
    return;
  }
  const error = validator(value);
  if (error) errors.push(`${path}: ${error}`);
}

export function validateDtcg(document) {
  const errors = [];
  let tokens = 0;
  const walk = (node, path) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      errors.push(`${path}: group/token must be an object`);
      return;
    }
    if ('$value' in node) {
      tokens += 1;
      if (typeof node.$type !== 'string') errors.push(`${path}: token requires $type`);
      else validateTypedValue(node.$type, node.$value, path, errors);
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$')) continue;
      walk(value, path ? `${path}.${key}` : key);
    }
  };
  walk(document, '');
  if (tokens === 0) errors.push('document contains no tokens');
  return { errors, tokens };
}

if (isMain(import.meta.url)) {
  const { errors, tokens } = validateDtcg(buildDtcg());
  reportAndExit(errors, {
    label: 'DTCG 2025.10',
    ok: `${tokens} portable tokens use conforming structured values with no null placeholders`,
  });
}
