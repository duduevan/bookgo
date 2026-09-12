/**
 * Imagens editoriais dos artigos, resolvidas em build.
 *
 * O frontmatter guarda só o nome do arquivo; a imagem vive em
 * `src/assets/blog/<categoria>/<slug>/`, para passar pelo astro:assets e
 * sair com dimensões reais, srcset e formato moderno. Mesma convenção das
 * imagens de produto — nenhum caminho relativo longo no conteúdo.
 *
 * Arquivo declarado mas ainda inexistente **não quebra o build e não deixa
 * buraco na página**: o slot simplesmente não renderiza, e o build lista o
 * que falta. É o que permite preparar a arquitetura do artigo antes de a
 * fotografia existir, sem publicar imagem quebrada nem caixa vazia.
 */
import { getPosts, type Post } from './content';

const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/blog/**/*.{jpg,jpeg,png,webp,avif}',
  { eager: true }
);

export interface ResolvedArticleImage {
  id: string;
  alt: string;
  caption?: string;
  credit?: string;
  /** `undefined` quando o arquivo ainda não foi fornecido. */
  image?: ImageMetadata;
  /** Caminho esperado, usado no aviso de build e no relatório. */
  expectedPath: string;
}

/** Caminho canônico de um arquivo de imagem de artigo. */
export const articleImagePath = (
  category: string,
  slug: string,
  file: string
): string => `/src/assets/blog/${category}/${slug}/${file}`;

/** Resolve todas as imagens declaradas por um artigo, na ordem do frontmatter. */
export function resolveArticleImages(post: Post): ResolvedArticleImage[] {
  const category = post.data.category.id;
  const slug = post.data.slug;

  return post.data.images.map((img) => {
    const expectedPath = articleImagePath(category, slug, img.src);
    return {
      id: img.id,
      alt: img.alt,
      caption: img.caption,
      credit: img.credit,
      image: files[expectedPath]?.default,
      expectedPath,
    };
  });
}

/**
 * Uma imagem pelo id. Id inexistente quebra o build: um `<ArticleImage>`
 * apontando para nada é erro de conteúdo, não algo a ignorar em silêncio.
 */
export function articleImageById(
  post: Post,
  id: string
): ResolvedArticleImage {
  const found = resolveArticleImages(post).find((i) => i.id === id);
  if (!found) {
    const known = post.data.images.map((i) => i.id).join(', ') || 'nenhuma';
    throw new Error(
      `<ArticleImage id="${id}" /> em "${post.data.slug}" não corresponde a ` +
        `nenhuma imagem do frontmatter. Declaradas: ${known}.`
    );
  }
  return found;
}

/**
 * Artigo correspondente a um caminho `/blog/<categoria>/<slug>/`.
 *
 * É assim que `ArticleImage.astro` sabe de qual artigo é a imagem sem que o
 * MDX precise repetir o slug em cada chamada — o corpo do texto fica com um
 * atributo só, que é o id.
 */
export async function postFromPathname(
  pathname: string
): Promise<Post | undefined> {
  const match = pathname.match(/^\/blog\/([^/]+)\/([^/]+)\//);
  if (!match) return undefined;
  const [, category, slug] = match;
  const posts = await getPosts();
  return posts.find(
    (p) => p.data.slug === slug && p.data.category.id === category
  );
}

/** Imagens declaradas cujo arquivo ainda não existe, para o aviso de build. */
export async function missingArticleImages(): Promise<
  Array<{ slug: string; id: string; expectedPath: string; alt: string }>
> {
  const posts = await getPosts();
  const missing = [];
  for (const post of posts) {
    for (const img of resolveArticleImages(post)) {
      if (!img.image) {
        missing.push({
          slug: post.data.slug,
          id: img.id,
          expectedPath: img.expectedPath,
          alt: img.alt,
        });
      }
    }
  }
  return missing;
}
