// Seek the browser's actual CSS transitions rather than guessing a wall-clock
// delay. This catches unsafe intermediate colours even on a fast/loaded runner.
export async function themeFrames(button, theme, foregroundSelector) {
  return button.evaluate(
    async (element, { nextTheme, foregroundSelector }) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const rgba = (colour) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = '#010203';
        context.fillStyle = colour;
        const resolved = context.fillStyle;
        context.fillStyle = '#040506';
        context.fillStyle = colour;
        if (context.fillStyle !== resolved) throw new Error(`Unresolved browser colour: ${colour}`);
        context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data);
      };
      const sample = (progress) => {
        const style = getComputedStyle(element);
        const foreground = foregroundSelector ? element.querySelector(foregroundSelector) : element;
        if (!foreground) throw new Error(`Missing foreground: ${foregroundSelector}`);
        const textStyle = getComputedStyle(foreground);
        return {
          progress,
          foreground: textStyle.color,
          background: style.backgroundColor,
          border: style.borderTopColor,
          foregroundRgba: rgba(textStyle.color),
          backgroundRgba: rgba(style.backgroundColor),
          borderRgba: rgba(style.borderTopColor),
          opacity: style.opacity,
        };
      };

      for (const animation of element.getAnimations()) animation.finish();
      const fromTheme = document.documentElement.dataset.theme;
      const before = sample('before'); // Commit the old theme's computed style.
      document.documentElement.dataset.theme = nextTheme;
      const start = sample('start'); // Create transitions before collecting them.
      const animations = element.getAnimations();
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = 0;
      }
      await Promise.all(animations.map((animation) => animation.ready));

      const frames = [before, start];
      for (const progress of [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]) {
        for (const animation of animations) {
          animation.currentTime = Number(animation.effect.getTiming().duration) * progress;
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
        frames.push(sample(progress));
      }
      for (const animation of animations) animation.finish();
      return {
        fromTheme,
        toTheme: document.documentElement.dataset.theme,
        accent: getComputedStyle(element).getPropertyValue('--accent').trim(),
        transitions: animations.map((animation) => ({
          property: animation.transitionProperty,
          duration: Number(animation.effect.getTiming().duration),
        })),
        frames,
      };
    },
    { nextTheme: theme, foregroundSelector },
  );
}
