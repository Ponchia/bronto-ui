import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

export default {
  plugins: [
    sveltekit({
      adapter: adapter(),
      prerender: { entries: ['*'] },
    }),
  ],
};
