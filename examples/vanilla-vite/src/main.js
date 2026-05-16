import '@ponchia/ui';
import { initThemeToggle, toast } from '@ponchia/ui/behaviors';

const stop = initThemeToggle();
document
  .getElementById('toastBtn')
  .addEventListener('click', () => toast('Hello from @ponchia/ui', { tone: 'success' }));

// SPA teardown would call stop(); kept to show the cleanup contract.
window.addEventListener('beforeunload', () => stop());
