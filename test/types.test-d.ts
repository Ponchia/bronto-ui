/**
 * Type-only gate (compiled by `npm run check:types`, never executed).
 * Proves the published .d.ts are sound *and* that the generated literal
 * `cls` / token types actually reject typos — the concrete payoff of
 * making the declarations generated-from-source. A regression here is a
 * consumer-facing break, so it blocks `npm run check`.
 */
import { cls, ui, cx, type ClassValue } from '../classes/index.js';
import tokens, { themeColor, cssVars, type ThemeName } from '../tokens/index.js';
import { initThemeToggle, initDialog, toast, type Cleanup } from '../behaviors/index.js';

// cls values are literal, not widened to `string`.
const btn: 'ui-button' = cls.button;
const appShell: 'ui-app-shell' = cls.appShell;
const tt: 'ui-themetoggle__button' = cls.themetoggleButton;

// @ts-expect-error — unknown cls key is now a compile error (was `string`).
cls.definitelyNotAKey;

// Recipes return strings; options are typed unions.
const a: string = ui.button({ variant: 'ghost' });
const b: string = ui.tab({ active: true });
// @ts-expect-error — invalid variant rejected.
ui.button({ variant: 'nope' });

const parts: ClassValue = ['a', false, ['b'], null];
const joined: string = cx(parts, 'extra', undefined);

// themeColor is ThemeName-typed; keys stay kebab-case.
const dark = themeColor('dark');
const soft: string = dark['accent-soft'];
const th: ThemeName = 'light';
// @ts-expect-error — arbitrary string is not a ThemeName.
themeColor('drak');

const accentVar: string = cssVars.light['--accent'];
// @ts-expect-error — unknown token name rejected by the literal union.
cssVars.light['--not-a-token'];
const scaleMd: string = tokens.scale['space-md'];

// Behaviors: every initializer returns a Cleanup.
const stop: Cleanup = initThemeToggle();
const stopDlg: Cleanup = initDialog({ root: document });
const dismiss: Cleanup = toast('hi', { tone: 'success', title: 'OK', duration: 0 });
// @ts-expect-error — message is required.
toast();

void [btn, appShell, tt, a, b, joined, soft, th, accentVar, scaleMd, stop, stopDlg, dismiss];
