import '@ponchia/ui';
import '@ponchia/ui/css/figure.css';
import '@ponchia/annotations/bronto.css';
import './style.css';
import { initThemeToggle } from '@ponchia/ui/behaviors';
import { resolveAnnotationLayout, renderAnnotationsSvg } from '@ponchia/annotations';

const stage = document.getElementById('stage');
const chart = document.getElementById('host-chart');
const overlay = document.getElementById('annotation-overlay');
const description = document.getElementById('annotation-description');
const moveButton = document.getElementById('move-target');
const toggleButton = document.getElementById('toggle-note');
const stopTheme = initThemeToggle();
let moved = false;
let visible = true;
let previousWidth = 0;
const height = 320;

function render() {
  const width = Math.max(240, Math.floor(stage.clientWidth));
  previousWidth = width;
  const x = Math.round(width * (moved ? 0.7 : 0.3));
  const y = 220;
  chart.setAttribute('viewBox', `0 0 ${width} ${height}`);
  // The host supplies numeric geometry; annotation text is escaped by its renderer.
  chart.innerHTML = `<path class="host-axis" d="M24,260H${width - 24}" />
    <circle class="host-target" cx="${x}" cy="${y}" r="10" />`;
  const annotations = visible
    ? [
        {
          id: 'target-note',
          anchor: { type: 'point', point: { x, y } },
          note: { title: 'Selected target', body: 'The host supplies this point.' },
          placement: { side: 'top' },
          variant: 'callout',
          tone: 'accent',
        },
      ]
    : [];
  const layout = resolveAnnotationLayout({
    annotations,
    bounds: { x: 0, y: 0, width, height },
    padding: 20,
  });
  overlay.innerHTML = renderAnnotationsSvg(layout, {
    title: 'Explanation of the selected target',
    markerIdPrefix: 'independent-example',
  });
  description.textContent = visible
    ? `Selected target: the host supplies this point at (${x}, ${y}). The independent annotation engine positions the explanation.`
    : 'Annotation hidden. The host-owned target is unchanged.';
  stage.dataset.ready = 'true';
}
function moveTarget() {
  moved = !moved;
  render();
}
function toggleNote() {
  visible = !visible;
  toggleButton.setAttribute('aria-pressed', String(visible));
  toggleButton.textContent = visible ? 'Hide annotation' : 'Show annotation';
  render();
}
const observer = new ResizeObserver(() => {
  if (Math.max(240, Math.floor(stage.clientWidth)) !== previousWidth) render();
});
observer.observe(stage);
moveButton.addEventListener('click', moveTarget);
toggleButton.addEventListener('click', toggleNote);
render();
function dispose() {
  observer.disconnect();
  moveButton.removeEventListener('click', moveTarget);
  toggleButton.removeEventListener('click', toggleNote);
  stopTheme();
  window.removeEventListener('pagehide', pageHidden);
}
function pageHidden(event) {
  // A back/forward-cache entry resumes with the same handlers and observers.
  if (!event.persisted) dispose();
}
window.addEventListener('pagehide', pageHidden);
if (import.meta.hot) import.meta.hot.dispose(dispose);
