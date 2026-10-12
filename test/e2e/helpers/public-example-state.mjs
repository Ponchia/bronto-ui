/** Browser-side state for diagnosing responsive example failures. */
export function readExampleState() {
  const elementState = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const style = getComputedStyle(element);
    const { x, y, width, height } = element.getBoundingClientRect();
    return {
      display: style.display,
      visibility: style.visibility,
      hidden: element.hidden,
      rect: { x, y, width, height },
      src: element.getAttribute('src'),
    };
  };
  return {
    url: location.href,
    readyState: document.readyState,
    innerWidth,
    innerHeight,
    mobileMedia: matchMedia('(max-width: 600px)').matches,
    overflow: document.documentElement.scrollWidth - innerWidth,
    iframe: elementState('.iframe-frame iframe'),
    fallback: elementState('.example-mobile-preview'),
    stylesheets: [...document.styleSheets].map((sheet) => sheet.href),
  };
}

export async function attachExampleFailure(page, testInfo, { key, phase, beforeResize }) {
  let timer;
  // A stalled renderer must not stall diagnostics or replace the original failure.
  const deadline = new Promise((resolve) => {
    timer = setTimeout(
      () => resolve({ captureError: 'Renderer did not respond within 2000ms' }),
      2000,
    );
  });
  try {
    const current = await Promise.race([
      page.evaluate(readExampleState).catch((error) => ({ captureError: error.message })),
      deadline,
    ]);
    await testInfo.attach(`example-${key}-${phase}`, {
      contentType: 'application/json',
      body: JSON.stringify(
        {
          example: key,
          phase,
          project: testInfo.project.name,
          retry: testInfo.retry,
          requestedViewport: page.viewportSize(),
          url: page.url(),
          frames: page.frames().map((frame) => frame.url()),
          beforeResize,
          current,
        },
        null,
        2,
      ),
    });
  } finally {
    clearTimeout(timer);
  }
}
