import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const buildId = Date.now().toString(36);

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'emit-build-version',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ buildId }) });
      },
    },
  ],
  define: { __BUILD_ID__: JSON.stringify(buildId) },
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: { '@': projectRoot } },
});
