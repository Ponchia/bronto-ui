// The gallery uses the same explicit lifecycle as the copyable recipes.
import { initCommand, initDialog, initSplitter } from '../behaviors/index.js';

const root = document.querySelector('[data-component-catalog]');
const stops = [initSplitter({ root }), initDialog({ root }), initCommand({ root })];
const palette = document.getElementById('catalog-commands');
const result = document.getElementById('catalog-command-result');
function select(event) {
  result.textContent = 'Selected: ' + event.detail.label;
  palette.close();
}
function close() {
  palette.close();
}
palette.addEventListener('bronto:command:select', select);
palette.addEventListener('bronto:command:close', close);
function dispose(event) {
  if (event.persisted) return;
  palette.removeEventListener('bronto:command:select', select);
  palette.removeEventListener('bronto:command:close', close);
  for (const stop of stops) stop();
  window.removeEventListener('pagehide', dispose);
}
window.addEventListener('pagehide', dispose);
