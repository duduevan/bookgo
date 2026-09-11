import type { APIRoute, GetStaticPaths } from 'astro';
import { SITE, absoluteUrl } from '../../../../config/site';
import {
  getPosts,
  getCategories,
  getProduct,
  postUrl,
  categoryUrl,
  productUrl,
  isoDate,
  type Post,
} from '../../../../lib/content';

/**
 * Versão Markdown do artigo, servida ao lado da HTML.
 *
 * Só o conteúdo: sem header, footer, CSS, tracking ou decoração. A versão
 * HTML continua sendo a principal — este arquivo é um formato alternativo
 * de leitura, apontado por <link rel="alternate" type="text/markdown">.
 *
 * Camada complementar e experimental: serve para que sistemas que preferem
 * texto puro consumam o conteúdo sem ruído. Não há promessa de ganho de
 * ranqueamento associada a isso.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const [posts, categories] = await Promise.all([getPosts(), getCategories()]);

  return posts.map((post) => ({
    params: { category: post.data.category.id, slug: post.data.slug },
    props: {
      post,
      categoryName:
        categories.find((c) => c.id === post.data.category.id)?.data.name ??
        post.data.category.id,
    },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { post, categoryName } = props as { post: Post; categoryName: string };
  const d = post.data;
  const product = d.product ? await getProduct(d.product.id) : undefined;

  const lines: string[] = [
    `# ${d.title}`,
    '',
    `> ${d.description}`,
    '',
  ];

  if (d.summary?.length) {
    lines.push('## Resumo rápido', '');
    for (const point of d.summary) lines.push(`- ${point}`);
    lines.push('');
  }

  lines.push(post.body?.trim() ?? '', '');

  if (d.sources.length > 0) {
    lines.push('## Fontes', '');
    for (const source of d.sources) {
      const publisher = source.publisher ? ` — ${source.publisher}` : '';
      lines.push(`- [${source.title}](${source.url})${publisher}`);
    }
    lines.push('');
  }

  lines.push(
    '---',
    '',
    '## Sobre este documento',
    '',
    `- Versão HTML (principal): ${absoluteUrl(postUrl(post))}`,
    `- Categoria: ${categoryName} — ${absoluteUrl(categoryUrl(d.category.id))}`,
    `- Publicado em: ${isoDate(d.date)}`,
    ...(d.updated ? [`- Atualizado em: ${isoDate(d.updated)}`] : []),
    `- Autoria: ${d.author}`,
    ...(product
      ? [
          `- Material relacionado: ${product.data.name} — ${absoluteUrl(
            productUrl(product.data.slug)
          )}`,
        ]
      : []),
    `- Publicado por: ${SITE.name} — ${SITE.url}/`,
    ''
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
