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
      // Páginas ainda com placeholder estão em noindex; deixá-las fora do
      // sitemap evita sinal contraditório. Remova o caminho daqui quando o
      // conteúdo definitivo entrar e o noindex da página sair.
      filter: (page) =>
        !['/404', '/termos/', '/privacidade/', '/contato/'].some((path) =>
          page.includes(path)
        ),
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
