import { qwikVite } from '@builder.io/qwik/optimizer';

// Client-side-rendering mode (`csr: true`) — a plain Vite SPA like the
// react/solid examples, no SSR entry. The behaviors are client glue, so this
// is enough to exercise the @ponchia/ui/qwik bindings end to end.
export default {
  plugins: [qwikVite({ csr: true })],
};
