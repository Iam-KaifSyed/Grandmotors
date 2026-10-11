import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

import { fileURLToPath } from 'node:url';

export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        'next/link': fileURLToPath(new URL('./src/lib/next-link-shim.tsx', import.meta.url)),
      },
    },
    build: {
      assetsInlineLimit: 0,
    },
    optimizeDeps: {
      exclude: ['astro:middleware', 'astro/virtual-modules/middleware.js', 'framer-motion'],
    },
    ssr: {
      noExternal: ['framer-motion'],
    },
  },
});
