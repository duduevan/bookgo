import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Product = CollectionEntry<'products'>;
export type Post = CollectionEntry<'blog'>;
export type Category = CollectionEntry<'categories'>;

/* ── URLs (única fonte de verdade das rotas) ─────────────────── */

export const productUrl = (slug: string) => `/${slug}/`;
export const categoryUrl = (categoryId: string) => `/blog/${categoryId}/`;
export const postUrl = (post: Post) =>
  `/blog/${post.data.category.id}/${post.data.slug}/`;

/** Versão Markdown do artigo, servida ao lado da HTML. */
export const markdownUrl = (post: Post) => `${postUrl(post)}index.md`;

/* ── Produtos ────────────────────────────────────────────────── */

export const getProducts = () => getCollection('products');

export const getProduct = (id: string) => getEntry('products', id);

/** O CTA só vira link quando existe uma URL de checkout configurada. */
export const hasCheckout = (product: Product): boolean =>
  typeof product.data.checkout.url === 'string' &&
  product.data.checkout.url.length > 0;

/* ── Categorias ──────────────────────────────────────────────── */

export async function getCategories(): Promise<Category[]> {
  const categories = await getCollection('categories');
  return categories.sort(
    (a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name)
  );
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
