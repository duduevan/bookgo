import type { APIRoute } from 'astro';
import { SITE, absoluteUrl } from '../config/site';
import { LEGAL_PAGES } from '../config/legal';
import {
  getCategories,
  getPosts,
  getProducts,
  categoryUrl,
  pillarUrl,
  getPillars,
  postUrl,
  markdownUrl,
  productUrl,
} from '../lib/content';

/**
 * llms.txt — índice curado do site para sistemas que leem texto.
 *
 * Curado, não exaustivo: lista os hubs, os conteúdos editoriais e os produtos
 * ativos, não todas as URLs. Rascunhos nunca entram, pela mesma razão que não
 * entram no sitemap: não têm URL pública.
 *
 * Camada complementar e experimental. Não há relação comprovada com
 * ranqueamento e este arquivo não deve ser tratado como tal.
 */
export const GET: APIRoute = async () => {
  const [pillars, categories, posts, products] = await Promise.all([
    getPillars(),
    getCategories(),
    getPosts(),
    getProducts(),
  ]);

  const lines: string[] = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    'Materiais digitais e conteúdo editorial em português do Brasil.',
    'Cada artigo também está disponível em Markdown, no endereço indicado abaixo dele.',
    '',
  ];

  if (pillars.length > 0) {
    lines.push('## Pilares', '');
    for (const pillar of pillars) {
      lines.push(
        `- [${pillar.data.name}](${absoluteUrl(pillarUrl(pillar.id))}): ${pillar.data.description}`
      );
    }
    lines.push('');
  }

  if (categories.length > 0) {
    lines.push('## Categorias', '');
    for (const category of categories) {
      lines.push(
        `- [${category.data.name}](${absoluteUrl(categoryUrl(category.id))}): ${category.data.description}`
      );
    }
    lines.push('');
  }

  if (posts.length > 0) {
    lines.push('## Conteúdos', '');
    for (const post of posts) {
      lines.push(
        `- [${post.data.title}](${absoluteUrl(postUrl(post))}): ${post.data.description}`,
        `  - Markdown: ${absoluteUrl(markdownUrl(post))}`
      );
    }
    lines.push('');
  }

  if (products.length > 0) {
    lines.push('## Produtos', '');
    for (const product of products) {
      const d = product.data;
      lines.push(
        `- [${d.name}](${absoluteUrl(productUrl(d.slug))}): ${d.tagline} ${d.price.display}, pagamento único.`
      );
    }
    lines.push('');
  }

  lines.push('## Institucional', '');
  lines.push(`- [Blog](${absoluteUrl('/blog/')}): todos os artigos publicados.`);
  // Páginas legais só entram depois de publicadas: enquanto têm
  // marcações [PREENCHER] elas são noindex e não são "úteis".
  for (const item of LEGAL_PAGES.filter((i) => i.ready)) {
    lines.push(`- [${item.label}](${absoluteUrl(item.href)})`);
  }
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
