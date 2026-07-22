import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  integrations: [preact()],
  adapter: vercel(),
  vite: {
    // gsap ships an ESM entry that Node's CJS loader can't require() at
    // runtime if left as an external SSR import — inline it into the
    // server bundle instead.
    ssr: {
      noExternal: ['gsap'],
    },
  },
});
