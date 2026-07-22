import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// shadcn/Radix components (src/components/ui/**, InfoDialog.tsx) are real
// React — Radix's nested Slot/asChild layers (used by Dialog, Popover, etc.)
// silently fail to forward children under preact/compat, so they run on a
// real React island instead of being aliased into the Preact tree. Every
// other component stays on Preact.
const REACT_SCOPE = ['**/components/ui/**/*.tsx', '**/components/InfoDialog.tsx'];

export default defineConfig({
  output: 'server',
  integrations: [
    preact({ exclude: REACT_SCOPE }),
    react({ include: REACT_SCOPE }),
  ],
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
    // gsap ships an ESM entry that Node's CJS loader can't require() at
    // runtime if left as an external SSR import — inline it into the
    // server bundle instead.
    ssr: {
      noExternal: ['gsap'],
    },
  },
});
