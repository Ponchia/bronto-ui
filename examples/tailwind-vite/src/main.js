import './main.css';
import { initThemeToggle, toast } from '@ponchia/ui/behaviors';

const stopTheme = initThemeToggle();

document.querySelector('[data-toast]')?.addEventListener('click', () => {
  toast('Tailwind bridge is using Bronto tokens', { tone: 'success' });
});

window.addEventListener('pagehide', () => stopTheme(), { once: true });
