import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `STANDALONE=1 vite build` inlines everything (JS, CSS, fonts) into a single
// self-contained dist/index.html that runs offline — matching the original
// exported "standalone" deliverable.
const standalone = process.env.STANDALONE === '1';

export default defineConfig({
  plugins: [react(), ...(standalone ? [viteSingleFile()] : [])],
  build: standalone
    ? {
        // Inline every asset (incl. KaTeX + Heebo/JetBrains font files) as data URIs.
        assetsInlineLimit: Number.MAX_SAFE_INTEGER,
        cssCodeSplit: false,
      }
    : {},
});
