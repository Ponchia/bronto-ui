/**
 * Shared, dependency-free OKLCH ↔ sRGB helpers used by the colour build/gate
 * scripts (gen-contrast, gen-charts, check-charts). Hand-rolled per the
 * zero-dependency stance. OKLab matrix + transfer function per CSS Color 4 /
 * Björn Ottosson.
 */

/** oklch(L C H) → sRGB [r,g,b] (0-255), via OKLab → linear sRGB → gamma.
 *  L is 0-1; H is degrees. Throws on out-of-sRGB-gamut rather than silently
 *  clamping to a colour the browser would gamut-map differently — a clamped
 *  value would let a gate pass/fail on a colour no user actually sees. */
export function oklchToRgb(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  if (lin.some((c) => c < -0.001 || c > 1.001)) {
    throw new Error(
      `oklch(${L} ${C} ${H}) is outside the sRGB gamut (linear ${lin.map((c) => c.toFixed(3))}) — ` +
        `pick an in-gamut value so its contrast can be measured honestly`,
    );
  }
  const gamma = (x) => {
    const c = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.max(0, Math.min(1, c)) * 255;
  };
  return lin.map(gamma);
}

/** Parse `oklch(L C H [/ A])` (L as 0-1 or %, H in deg) → [r,g,b,a] (0-255,0-1),
 *  or null if not an oklch() literal. */
export function parseOklch(str) {
  const ok = /^oklch\(\s*([^)]+)\)$/i.exec(String(str).trim());
  if (!ok) return null;
  const p = ok[1].split(/[\s/]+/).filter(Boolean);
  if (p.length < 3) return null;
  const L = p[0].endsWith('%') ? Number.parseFloat(p[0]) / 100 : Number.parseFloat(p[0]);
  const C = Number.parseFloat(p[1]);
  const H = Number.parseFloat(p[2]);
  const al =
    p[3] != null
      ? p[3].endsWith('%')
        ? Number.parseFloat(p[3]) / 100
        : Number.parseFloat(p[3])
      : 1;
  if (![L, C, H, al].every((n) => Number.isFinite(n))) return null;
  return [...oklchToRgb(L, C, H), al];
}

/** [r,g,b] (0-255) → `#rrggbb`. */
export function rgbToHex([r, g, b]) {
  const h = (n) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** sRGB [r,g,b] (0-255) → OKLab [L,a,b] (for perceptual distance). */
export function rgbToOklab([r, g, b]) {
  const lin = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Euclidean distance in OKLab (a reasonable perceptual ΔE for our purposes). */
export function deltaOklab(rgb1, rgb2) {
  const a = rgbToOklab(rgb1);
  const b = rgbToOklab(rgb2);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** sRGB [r,g,b] (0-255) → OKLCH { L, C, H(deg), achromatic }. */
export function rgbToOklch(rgb) {
  const [L, a, b] = rgbToOklab(rgb);
  const C = Math.hypot(a, b);
  // A near-neutral's hue is "powerless" in CSS color-mix (the chromatic
  // endpoint's hue is kept), matching browser color-mix(in oklch, …). 0.02
  // separates near-neutral surfaces (C ≲ 0.003) from real colours (C ≳ 0.05).
  return { L, C, H: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360, achromatic: C < 0.02 };
}

/** OKLCH (L, C, H deg) → sRGB [r,g,b] (0-255), clamped to gamut (no throw). */
function oklchToRgbClamp(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((x) => {
    const c = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(1, c)) * 255);
  });
}

/** Replicate CSS `color-mix(in oklch, A wA%, B wB%)` for two OPAQUE sRGB
 *  colours → sRGB [r,g,b]. Interpolates L, C and (shorter-arc) H per CSS
 *  Color 4; an achromatic endpoint's hue is "powerless" and takes the other's.
 *  wA/wB are the (already-normalised) weights. */
export function mixOklch(rgbA, rgbB, wA, wB) {
  const a = rgbToOklch(rgbA);
  const b = rgbToOklch(rgbB);
  const L = a.L * wA + b.L * wB;
  const C = a.C * wA + b.C * wB;
  let H;
  if (a.achromatic && b.achromatic) H = 0;
  else if (a.achromatic) H = b.H;
  else if (b.achromatic) H = a.H;
  else {
    // Shorter-arc hue interpolation.
    let d = b.H - a.H;
    if (d > 180) d -= 360;
    else if (d < -180) d += 360;
    H = (a.H + d * wB + 360) % 360;
  }
  return oklchToRgbClamp(L, C, H);
}
