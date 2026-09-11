import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Product = CollectionEntry<'products'>;
export type Post = CollectionEntry<'blog'>;
export type Category = CollectionEntry<'categories'>;

/* ── URLs (única fonte de verdade das rotas) ─────────────────── */

export const productUrl = (slug: string) => `/${slug}/`;
export const categoryUrl = (categoryId: string) => `/blog/${categoryId}/`;
export const postUrl = (post: Post) =>
  `/blog/${post.data.category.id}/${post.data.slug}/`;

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

/* ── Formatação ──────────────────────────────────────────────── */

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatDate = (date: Date) => dateFormatter.format(date);
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
