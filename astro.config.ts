import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Static output: no adapter needed. Deployed as Cloudflare Workers static assets.
export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Keep models/textures/wasm as real files so they cache and stream.
      assetsInlineLimit: 0,
    },
  },
});
