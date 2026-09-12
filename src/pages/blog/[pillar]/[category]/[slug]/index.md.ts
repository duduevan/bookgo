import type { APIRoute, GetStaticPaths } from 'astro';
import { SITE, absoluteUrl } from '../../../../../config/site';
import {
  getPosts,
  getCategories,
  getProduct,
  postUrl,
  categoryUrl,
  productUrl,
  isoDate,
  type Post,
} from '../../../../../lib/content';
import { resolveArticleImages } from '../../../../../lib/article-images';

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

/**
 * Converte o corpo MDX em Markdown puro.
 *
 * O corpo traz imports de componente e marcadores como `<ArticleImage />` e
 * `<ProductCtaHere />`. Deixá-los aqui entregaria sintaxe de framework a quem
 * pediu texto: `<ArticleImage id="..." />` não significa nada fora do site.
 *
 * As imagens viram Markdown de verdade, com o alt como texto — que é
 * justamente a descrição pensada para quem não vê a imagem. O CTA some: é
 * elemento de conversão, não conteúdo editorial.
 */
function toPlainMarkdown(
  body: string,
  images: ReturnType<typeof resolveArticleImages>,
  toAbsolute: (src: string) => string
): string {
  return (
    body
      /* Linhas de import do MDX. */
      .replace(/^import\s+.+?from\s+['"].+?['"];?\s*$/gm, '')
      /* Imagens: viram Markdown quando o arquivo existe. */
      .replace(/^[ \t]*<ArticleImage\s+id="([^"]+)"\s*\/>[ \t]*$/gm, (_, id) => {
        const img = images.find((i) => i.id === id);
        if (!img?.image) return '';
        const caption = img.caption ? `\n\n*${img.caption}*` : '';
        return `![${img.alt}](${toAbsolute(img.image.src)})${caption}`;
      })
      /* Marcadores sem conteúdo próprio. */
      .replace(/^[ \t]*<ProductCtaHere\s*\/>[ \t]*$/gm, '')
      /* Três ou mais quebras viram duas: o que sobrou não deixa buraco. */
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
export const getStaticPaths: GetStaticPaths = async () => {
  const [posts, categories] = await Promise.all([getPosts(), getCategories()]);

  return posts.map((post) => {
    const category = categories.find((c) => c.id === post.data.category.id);
    return {
      params: {
        pillar: category!.data.pillar.id,
        category: post.data.category.id,
        slug: post.data.slug,
      },
      props: {
        post,
        categoryName: category?.data.name ?? post.data.category.id,
      },
    };
  });
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

  lines.push(
    toPlainMarkdown(
      post.body ?? '',
      resolveArticleImages(post),
      (src) => absoluteUrl(src)
    ),
    ''
  );

  if (d.sources.length > 0) {
    lines.push('## Fontes', '');
    for (const source of d.sources) {
      const publisher = source.publisher ? `. ${source.publisher}` : '';
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
    `- Categoria: [${categoryName}](${absoluteUrl(categoryUrl(d.category.id))})`,
    `- Publicado em: ${isoDate(d.date)}`,
    ...(d.updated ? [`- Atualizado em: ${isoDate(d.updated)}`] : []),
    `- Autoria: ${d.author}`,
    ...(product
      ? [
          `- Material relacionado: [${product.data.name}](${absoluteUrl(
            productUrl(product.data.slug)
          )})`,
        ]
      : []),
    `- Publicado por: [${SITE.name}](${SITE.url}/)`,
    ''
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
