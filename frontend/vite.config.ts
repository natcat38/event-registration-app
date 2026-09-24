import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: { port: 8001, strictPort: true },
  // Pure *.test.ts files stay on the default 'node' environment; each *.test.tsx
  // file opts into jsdom itself via a `// @vitest-environment jsdom` docblock.
  test: {
    environment: 'node',
  },
});
