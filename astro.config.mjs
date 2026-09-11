// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

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
      filter: (page) => !page.includes('/404'),
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
