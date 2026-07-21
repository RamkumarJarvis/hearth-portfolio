import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  integrations: [preact()],
  adapter: node({ mode: 'standalone' }),
});
