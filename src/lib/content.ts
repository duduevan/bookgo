import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Product = CollectionEntry<'products'>;
export type Post = CollectionEntry<'blog'>;
export type Category = CollectionEntry<'categories'>;
export type Pillar = CollectionEntry<'pillars'>;

/* ── URLs (única fonte de verdade das rotas) ─────────────────── */

/**
 * Mapa categoria → pilar, resolvido uma vez na carga do módulo.
 *
 * Existe para `categoryUrl` e `postUrl` continuarem síncronos. A alternativa
 * era torná-los assíncronos, o que obrigaria a mudar todo componente que
 * monta um link, inclusive os que só recebem um post pronto.
 */
const pillarByCategory = new Map(
  (await getCollection('categories')).map((c) => [c.id, c.data.pillar.id])
);

const pillarOf = (categoryId: string): string => {
  const pillar = pillarByCategory.get(categoryId);
  if (!pillar) {
    throw new Error(
      `Categoria "${categoryId}" não declara pilar. Toda categoria vive dentro de um.`
    );
  }
  return pillar;
};

/** Pilar a que uma categoria pertence. Categoria sem pilar quebra o build. */
export const pillarOfCategory = pillarOf;

export const productUrl = (slug: string) => `/${slug}/`;

export const pillarUrl = (pillarId: string) => `/blog/${pillarId}/`;

export const categoryUrl = (categoryId: string) =>
  `/blog/${pillarOf(categoryId)}/${categoryId}/`;

export const postUrl = (post: Post) =>
  `${categoryUrl(post.data.category.id)}${post.data.slug}/`;

/** Versão Markdown do artigo, servida ao lado da HTML. */
export const markdownUrl = (post: Post) => `${postUrl(post)}index.md`;

/* ── Produtos ────────────────────────────────────────────────── */

/**
 * Produtos publicados. Rascunho não gera URL, como no blog: ver `draft`
 * no schema do produto.
 */
export const getProducts = () =>
  getCollection('products', ({ data }) => !data.draft);

export const getProduct = (id: string) => getEntry('products', id);

/**
 * Produto em destaque na home.
 *
 * Marcado com `featured: true` vence; havendo mais de um, o primeiro. Sem
 * nenhum marcado, cai no primeiro publicado, para a home não depender de
 * alguém lembrar de marcar. Rascunho nunca entra, porque `getProducts` já
 * os exclui.
 */
export async function getFeaturedProduct(): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.data.featured) ?? products[0];
}

/** O CTA só vira link quando existe uma URL de checkout configurada. */
export const hasCheckout = (product: Product): boolean =>
  typeof product.data.checkout.url === 'string' &&
  product.data.checkout.url.length > 0;

/* ── Pilares ─────────────────────────────────────────────────── */

export async function getPillars(): Promise<Pillar[]> {
  const pillars = await getCollection('pillars');
  return pillars.sort(
    (a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name)
  );
}

/* ── Categorias ──────────────────────────────────────────────── */

export async function getCategories(): Promise<Category[]> {
  const categories = await getCollection('categories');
  return categories.sort(
    (a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name)
  );
}

/** Categorias de um pilar, já ordenadas. */
export async function getCategoriesByPillar(pillarId: string): Promise<Category[]> {
  const categories = await getCategories();
  return categories.filter((c) => c.data.pillar.id === pillarId);
}

/* ── Artigos ─────────────────────────────────────────────────── */

const byDateDesc = (a: Post, b: Post) =>
  b.data.date.getTime() - a.data.date.getTime();

/** Artigos publicados (exclui rascunhos), do mais recente para o mais antigo. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort(byDateDesc);
}

export async function getPostsByCategory(categoryId: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((post) => post.data.category.id === categoryId);
}

/** Artigos de todas as categorias de um pilar. */
export async function getPostsByPillar(pillarId: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((post) => pillarOf(post.data.category.id) === pillarId);
}

/**
 * Artigo do destaque do blog.
 *
 * Marcado com `featured: true` vence; havendo mais de um, o mais recente.
 * Sem nenhum marcado, cai no mais recente publicado, para a página não
 * depender de alguém lembrar de marcar. Rascunho nunca entra, porque
 * `getPosts` já os exclui.
 */
export async function getFeaturedPost(): Promise<Post | undefined> {
  const posts = await getPosts();
  return posts.find((p) => p.data.featured) ?? posts[0];
}

export async function getPostsByProduct(productId: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((post) => post.data.product?.id === productId);
}

/**
 * Artigos relacionados, em ordem determinística:
 * 1. mesma categoria, do mais recente para o mais antigo;
 * 2. mesmo produto, para cobrir quando a categoria não basta.
 * O próprio artigo nunca entra e não há sorteio.
 */
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const posts = (await getPosts()).filter((p) => p.id !== post.id);
  const picked: Post[] = [];

  const add = (candidates: Post[]) => {
    for (const candidate of candidates) {
      if (picked.length >= limit) return;
      if (!picked.some((p) => p.id === candidate.id)) picked.push(candidate);
    }
  };

  add(posts.filter((p) => p.data.category.id === post.data.category.id));
  if (post.data.product) {
    add(posts.filter((p) => p.data.product?.id === post.data.product?.id));
  }

  return picked;
}

/** Contagem de palavras do corpo, para `wordCount` no JSON-LD. */
export function countWords(body: string | undefined): number | undefined {
  if (!body) return undefined;
  const text = body
    .replace(/^---[\s\S]*?---/, '')       // frontmatter
    .replace(/```[\s\S]*?```/g, ' ')      // blocos de código
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links e imagens
    .replace(/[#>*_`|-]/g, ' ');
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  return words.length > 0 ? words.length : undefined;
}

/* ── Formatação ──────────────────────────────────────────────── */

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatDate = (date: Date) => dateFormatter.format(date);
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
