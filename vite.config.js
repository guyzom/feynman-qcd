import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { inlineBuild } from './scripts/inline-build.js';

function thirdPartyNotices() {
  return {
    name: 'third-party-notices',
    transformIndexHtml() {
      const text = readFileSync(new URL('./THIRD_PARTY_NOTICES.md', import.meta.url), 'utf8');
      if (/<\/script/i.test(text)) throw new Error('Notice text contains an HTML script terminator');
      return [{
        tag: 'script',
        attrs: { type: 'text/plain', id: 'third-party-notices' },
        children: text,
        injectTo: 'head',
      }];
    },
  };
}

export default defineConfig(({ mode }) => {
  const standalone = mode === 'standalone';
  return {
    base: standalone ? './' : '/',
    plugins: [react(), thirdPartyNotices(), ...(standalone ? [inlineBuild()] : [])],
    build: {
      outDir: standalone ? 'dist-standalone' : 'dist',
      ...(standalone ? {
        assetsInlineLimit: Number.MAX_SAFE_INTEGER,
        cssCodeSplit: false,
      } : {}),
    },
  };
});
