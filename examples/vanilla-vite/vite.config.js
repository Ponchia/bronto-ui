import { fileURLToPath } from 'node:url';

export default {
  base: './',
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        workspace: fileURLToPath(new URL('./workspace.html', import.meta.url)),
      },
    },
  },
};
