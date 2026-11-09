import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  // og:image must be a full URL: LinkedIn, Facebook and Slack ignore a relative one. Set VITE_SITE_URL
  // (for example https://events.example.com) at build time once the app is hosted; unset, the path stays
  // relative. see docs/adr/0013
  const siteUrl = (loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL ?? '').replace(/\/+$/, '');
  return {
    plugins: [
      react(),
      {
        name: 'absolute-og-image',
        transformIndexHtml: (html: string) =>
          html.replace('content="/og-image.png"', `content="${siteUrl}/og-image.png"`),
      },
    ],
    server: { port: 8001, strictPort: true },
    // Pure *.test.ts files stay on the default 'node' environment; each *.test.tsx
    // file opts into jsdom itself via a `// @vitest-environment jsdom` docblock.
    test: {
      environment: 'node',
    },
  };
});
