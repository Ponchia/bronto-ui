import { test, expect } from '@playwright/test';

/**
 * Locks in the accessibility/print CSS that has no other coverage:
 * forced-colors (Windows High Contrast), prefers-reduced-motion, and
 * the print stylesheet. Computed-style assertions only — no snapshots,
 * so zero baseline maintenance. The project matrix runs this non-pixel spec in
 * Chromium, Firefox, and WebKit; the assertions avoid engine-specific system
 * colour values and check durable layout/state signals instead.
 */

function rgbChannels(value) {
  return value
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number);
}

function luminance(value) {
  return rgbChannels(value)
    .map((channel) => channel / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(foreground, background) {
  const fg = luminance(foreground) + 0.05;
  const bg = luminance(background) + 0.05;
  return Math.max(fg, bg) / Math.min(fg, bg);
}

function translateX(transform) {
  if (!transform || transform === 'none') return 0;
  const values = transform
    .match(/matrix(?:3d)?\(([^)]+)\)/)?.[1]
    .split(',')
    .map(Number);
  if (!values) return 0;
  return values.length === 16 ? values[12] : values[4];
}

test('forced-colors: the keyboard focus ring is re-asserted', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/demo/', { waitUntil: 'networkidle' });

  // System-colour *resolution* under emulated forced-colors is engine
  // /palette dependent and gets backplated, so asserting an exact rgb
  // is fragile. The robust signal that our forced-colors block applied
  // is the focus outline (outline is not backplated): base.css sets
  // focus-visible → `outline: 2px solid Highlight`.
  const btn = page.getByRole('button', { name: 'Primary', exact: true });
  await btn.focus();
  const o = await btn.evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: s.outlineWidth };
  });
  expect(o.style).toBe('solid');
  expect(parseFloat(o.width)).toBeGreaterThanOrEqual(2);
});

test('forced-colors: the active app-nav link keeps a non-colour current-page cue', async ({
  page,
}) => {
  // Regression: under HCM var(--accent) (border + bg + text) flattens to one
  // system colour, so the .is-active link collapsed into its siblings. The fix
  // adds a NON-colour channel — font-weight 700 — that the OS palette can't strip.
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/test/e2e/_app-shell.fixture.html', { waitUntil: 'networkidle' });
  const weights = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.ui-app-nav a')];
    const active = links.find((a) => a.classList.contains('is-active'));
    const inactive = links.find((a) => !a.classList.contains('is-active'));
    return {
      active: getComputedStyle(active).fontWeight,
      inactive: getComputedStyle(inactive).fontWeight,
    };
  });
  expect(Number(weights.active)).toBeGreaterThan(Number(weights.inactive));
});

test('prefers-reduced-motion: the dot spinner stops animating', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  const spin = await page.evaluate(() => {
    const el = document.querySelector('.ui-dotspinner');
    const dot = document.querySelector('.ui-dotspinner i');
    return {
      anim: getComputedStyle(el).animationName,
      dotOpacity: getComputedStyle(dot).opacity,
    };
  });
  expect(spin.anim).toBe('none'); // dots.css reduced-motion kills the spin
  expect(Number(spin.dotOpacity)).toBeGreaterThan(0); // …but stays legible
});

test('print: chrome is hidden, content + link URLs are kept', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => {
    const proseLink = document.querySelector('.ui-prose a[href^="http"]');
    return {
      dotfield: getComputedStyle(document.querySelector('.ui-dotfield')).display,
      main: getComputedStyle(document.querySelector('main')).display,
      afterContent: proseLink ? getComputedStyle(proseLink, '::after').content : '"(none)"',
    };
  });
  expect(r.dotfield).toBe('none'); // decorative chrome dropped on paper
  expect(r.main).not.toBe('none'); // content kept
  // link target surfaced on paper. Chromium/WebKit resolve attr(href) to the
  // URL in computed ::after content; Firefox returns the literal `attr(href)`.
  expect(r.afterContent).toMatch(/http|attr\(href\)/);
});

test('print under the dark theme: the panel/card surface flips to white paper, not near-black', async ({
  page,
}) => {
  // Regression for the print `:root` specificity loss: a bare `:root` print
  // remap (0,1,0) lost the cascade to `:root[data-theme='dark']` (0,2,0) and
  // the OLED surface (0,3,0), so a dark-mode user printed a near-black .ui-card
  // on white paper. The fix raises the print selector to `:root:root:root`.
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  const read = () =>
    page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        panel: s.getPropertyValue('--panel').trim(),
        panelStrong: s.getPropertyValue('--panel-strong').trim(),
        text: s.getPropertyValue('--text').trim(),
      };
    });

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  const dark = await read();
  expect(dark.panel).toBe('#fff'); // dark theme → white paper under print
  expect(dark.text).toBe('#111'); // ink text, not the dark token

  await page.evaluate(() => {
    document.documentElement.dataset.surface = 'oled';
  });
  const oled = await read();
  expect(oled.panel).toBe('#fff'); // OLED's (0,3,0) panel must not win either
  expect(oled.panelStrong).toBe('#fff'); // and its dark --panel-strong is neutralised
});

test('print under the dark theme: accent text and primary button ink use the light-safe print family', async ({
  page,
}) => {
  // Regression: the print block remapped --accent but left the dark-theme
  // derived family in place. That made CTA accent text resolve to a pale
  // red on white paper and left dark-mode primary buttons with black text on
  // the light print accent.
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });

  const colors = await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.dataset.surface = 'oled';

    const cta = document.createElement('a');
    cta.className = 'ui-link ui-link--cta';
    cta.href = '#';
    cta.textContent = 'Print CTA';

    const button = document.createElement('button');
    button.className = 'ui-button';
    button.textContent = 'Print action';

    document.body.append(cta, button);
    const ctaStyle = getComputedStyle(cta);
    const buttonStyle = getComputedStyle(button);
    const rootStyle = getComputedStyle(document.documentElement);
    const result = {
      paper: rootStyle.getPropertyValue('--bg').trim(),
      buttonTextToken: rootStyle.getPropertyValue('--button-text').trim(),
      ctaColor: ctaStyle.color,
      buttonColor: buttonStyle.color,
      buttonBg: buttonStyle.backgroundColor,
    };
    cta.remove();
    button.remove();
    return result;
  });

  expect(colors.paper).toBe('#fff');
  expect(colors.buttonTextToken).toBe('#ffffff');
  expect(contrastRatio(colors.ctaColor, 'rgb(255, 255, 255)')).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(colors.buttonColor, colors.buttonBg)).toBeGreaterThanOrEqual(4.5);
});

test('surface=oled: dark surfaces flip to true black; the readable text token is untouched', async ({
  page,
}) => {
  // data-surface / data-density / data-contrast are convenience presets, NOT
  // part of the stability contract (see docs/stability.md). This is a cheap
  // smoke that the OLED preset actually applies and only moves surfaces — text
  // stays the re-tuned --text, which clears WCAG AA on pure black too.
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  const v = await page.evaluate(() => {
    const root = document.documentElement;
    const read = () => {
      const s = getComputedStyle(root);
      return { bg: s.getPropertyValue('--bg').trim(), text: s.getPropertyValue('--text').trim() };
    };
    root.dataset.theme = 'dark';
    delete root.dataset.surface;
    const base = read();
    root.dataset.surface = 'oled';
    const oled = read();
    return { base, oled };
  });
  expect(v.base.bg).toBe('#121212'); // elevated near-black dark base
  expect(v.oled.bg).toBe('#000000'); // OLED preset flips --bg to true black
  expect(v.oled.text).toBe('#e6e6e6'); // text untouched — stays the readable token
});

test('theme toggle thumb reflects OS dark when data-theme is absent', async ({ page }) => {
  // `applyStoredTheme()` intentionally leaves data-theme absent when there is
  // no stored preference so the token layer follows prefers-color-scheme. The
  // toggle chrome must reflect that same dark state, not only explicit
  // data-theme="dark".
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/test/e2e/_app-shell.fixture.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.innerHTML = `
      <button class="ui-themetoggle__button" type="button" data-bronto-theme-toggle>
        <span class="ui-themetoggle__prefix">Theme</span>
        <span class="ui-themetoggle__label">Dark</span>
        <span class="ui-themetoggle__track"><span class="ui-themetoggle__thumb"></span></span>
      </button>
    `;
  });

  const states = await page.evaluate(() => {
    const root = document.documentElement;
    const thumb = document.querySelector('.ui-themetoggle__thumb');
    thumb.style.transition = 'none';
    const probe = document.createElement('span');
    probe.style.color = 'var(--accent)';
    document.body.append(probe);

    const read = () => {
      const thumbStyle = getComputedStyle(thumb);
      return {
        thumbBg: thumbStyle.backgroundColor,
        accent: getComputedStyle(probe).color,
        transform: thumbStyle.transform,
      };
    };

    root.removeAttribute('data-theme');
    root.removeAttribute('dir');
    const osDark = read();

    root.setAttribute('dir', 'rtl');
    const osDarkRtl = read();

    root.setAttribute('data-theme', 'light');
    root.removeAttribute('dir');
    const explicitLight = read();

    probe.remove();
    return { osDark, osDarkRtl, explicitLight };
  });

  expect(states.osDark.thumbBg).toBe(states.osDark.accent);
  expect(translateX(states.osDark.transform)).toBeGreaterThan(1);
  expect(translateX(states.osDarkRtl.transform)).toBeLessThan(-1);
  expect(states.explicitLight.thumbBg).not.toBe(states.explicitLight.accent);
  expect(Math.abs(translateX(states.explicitLight.transform))).toBeLessThan(1);
});

test('density presets: compact and comfortable move only the spacing scale', async ({ page }) => {
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  const v = await page.evaluate(() => {
    const root = document.documentElement;
    const read = () => {
      const s = getComputedStyle(root);
      return {
        xs: s.getPropertyValue('--space-xs').trim(),
        md: s.getPropertyValue('--space-md').trim(),
        xl: s.getPropertyValue('--space-xl').trim(),
        text: s.getPropertyValue('--text').trim(),
      };
    };
    delete root.dataset.density;
    const base = read();
    root.dataset.density = 'compact';
    const compact = read();
    root.dataset.density = 'comfortable';
    const comfortable = read();
    return { base, compact, comfortable };
  });

  expect(v.base).toEqual({ xs: '0.5rem', md: '1rem', xl: '1.75rem', text: '#e6e6e6' });
  expect(v.compact).toEqual({ xs: '0.4rem', md: '0.8rem', xl: '1.35rem', text: '#e6e6e6' });
  expect(v.comfortable).toEqual({
    xs: '0.6rem',
    md: '1.25rem',
    xl: '2.2rem',
    text: '#e6e6e6',
  });
});

test('contrast preset: manual and OS high-contrast paths re-point soft tokens', async ({
  page,
}) => {
  const read = () =>
    page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        line: s.getPropertyValue('--line').trim(),
        lineStrong: s.getPropertyValue('--line-strong').trim(),
        textDim: s.getPropertyValue('--text-dim').trim(),
        textSoft: s.getPropertyValue('--text-soft').trim(),
        focusRing: s.getPropertyValue('--focus-ring').trim(),
        accent: s.getPropertyValue('--accent').trim(),
        shadowRaised: s.getPropertyValue('--shadow-raised').trim(),
        text: s.getPropertyValue('--text').trim(),
      };
    });

  await page.goto('/demo/', { waitUntil: 'networkidle' });
  const base = await read();
  await page.evaluate(() => {
    document.documentElement.dataset.contrast = 'high';
  });
  const manual = await read();

  await page.emulateMedia({ contrast: 'more' });
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  const os = await read();

  expect(base.line).not.toBe(base.lineStrong);
  for (const high of [manual, os]) {
    expect(high.line).toBe(high.lineStrong);
    expect(high.textDim).toBe(high.textSoft);
    expect(high.focusRing).toBe(high.accent);
    expect(high.shadowRaised).toBe(`0 0 0 1px ${high.text}`);
  }
});
