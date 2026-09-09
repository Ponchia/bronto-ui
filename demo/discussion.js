const form = document.querySelector('[data-reply-form]');
const input = form?.querySelector('textarea');
const submit = form?.querySelector('button');
const state = document.querySelector('[data-thread-state]');
const resolve = document.querySelector('[data-resolve]');
const messages = document.querySelector('[data-messages]');
const status = document.querySelector('[data-post-status]');
let resolved = false;
function renderState() {
  if (state) state.textContent = `${resolved ? 'Resolved' : 'Open'} · passage attached`;
  if (resolve) resolve.textContent = resolved ? 'Reopen' : 'Resolve';
}
resolve?.addEventListener('click', () => {
  resolved = !resolved;
  renderState();
});
input?.addEventListener('input', () => {
  if (submit) submit.disabled = !input.value.trim();
});
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!input?.value.trim() || !messages) return;
  const item = document.createElement('li');
  item.className = 'ui-discussion__message';
  const author = document.createElement('p');
  author.className = 'ui-discussion__meta';
  author.textContent = 'You · local example';
  const body = document.createElement('p');
  body.textContent = input.value;
  item.append(author, body);
  messages.append(item);
  input.value = '';
  if (submit) submit.disabled = true;
  resolved = false;
  renderState();
  if (status) status.textContent = 'Reply added to this local preview';
  input.focus();
});
