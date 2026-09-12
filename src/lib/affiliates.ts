/**
 * Produtos afiliados de um artigo, resolvidos por id.
 *
 * Mesma ideia de `article-images`: os dados moram no frontmatter e o corpo
 * do MDX carrega só a posição. O componente não conhece marca nem link.
 */
import type { Post } from './content';

export type Affiliate = NonNullable<Post['data']['affiliates']>[number];

export const affiliateById = (post: Post, id: string): Affiliate | undefined =>
  post.data.affiliates.find((a) => a.id === id);

/** A nota de transparência existe se, e só se, houver link de afiliado. */
export const hasAffiliates = (post: Post): boolean =>
  post.data.affiliates.length > 0;
