// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { legalPathsNotReady } from './src/config/legal.ts';

// Site 100% estático: o build gera apenas HTML/CSS/imagens em dist/.
// Nenhum adapter, nenhum SSR — a produção (cPanel) não executa Node.
export default defineConfig({
  site: 'https://bookgo.com.br',

  // Cada rota vira `pasta/index.html`, servido direto pelo Apache do cPanel
  // sem necessidade de regras de rewrite.
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },

  integrations: [
    mdx(),
    sitemap({
      // Página legal incompleta está em noindex; deixá-la no sitemap seria
      // sinal contraditório. A lista NÃO é escrita aqui: vem de
      // src/config/legal.ts, onde `ready: true` tira a página do noindex e
      // a coloca no sitemap no mesmo gesto. Nada a manter em dois lugares.
      filter: (page) =>
        !['/404', ...legalPathsNotReady()].some((path) => page.includes(path)),
    }),
  ],

  image: {
    // Sem imagens remotas: tudo é otimizado em build a partir de src/assets.
    remotePatterns: [],
  },

  markdown: {
    shikiConfig: { theme: 'github-light', wrap: true },
  },
});
