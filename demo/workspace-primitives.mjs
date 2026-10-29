import {
  initToolbar,
  initActionMenu,
  initSplitter,
  initCommand,
  initDialog,
} from '../behaviors/index.js';

const cleanups = [initToolbar(), initSplitter(), initCommand(), initDialog()];
const trigger = document.querySelector('#menu-trigger');
const menu = document.querySelector('#actions');
let stopMenu;
function closeMenu() {
  menu.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
  stopMenu?.();
  stopMenu = undefined;
}
trigger.addEventListener('click', () => {
  if (!menu.hidden) {
    closeMenu();
    return;
  }
  menu.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  stopMenu = initActionMenu({ root: menu, invoker: trigger, onClose: closeMenu });
});
document
  .querySelector('#edit')
  .addEventListener('click', () => document.querySelector('#editor').focus());
document.querySelector('#inspect').addEventListener('click', () => {
  document.querySelector('#menu-result').textContent = 'Document inspected.';
});
document
  .querySelector('[data-bronto-command]')
  .addEventListener('bronto:command:select', () => document.querySelector('#commands').close());
document
  .querySelector('[data-bronto-command]')
  .addEventListener('bronto:command:close', () => document.querySelector('#commands').close());
window.addEventListener(
  'pagehide',
  () => {
    closeMenu();
    cleanups.forEach((stop) => stop());
  },
  { once: true },
);
