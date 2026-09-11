/**
 * Geradores de JSON-LD.
 *
 * Regra do projeto: só emitimos dados estruturados sustentados por informação
 * real. Nada de aggregateRating, review, número de alunos ou FAQPage — não
 * temos avaliações e marcar dado inexistente é penalidade, não vantagem.
 */
import { SITE, absoluteUrl } from '../config/site';
import type { Post, Product } from './content';
import { isoDate } from './content';

type Json = Record<string, unknown>;

export const organization = (): Json => ({
  '@type': 'Organization',
  '@id': `${SITE.url}/#organization`,
  name: SITE.name,
  url: `${SITE.url}/`,
  logo: {
    '@type': 'ImageObject',
    url: absoluteUrl('/images/logo.png'),
  },
});

export const breadcrumbs = (
  items: Array<{ name: string; path: string }>
): Json => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const productSchema = (product: Product, path: string): Json => {
  const { name, price, checkout, seo } = product.data;
  return {
    '@type': 'Product',
    name,
    description: seo.description,
    url: absoluteUrl(path),
    brand: { '@type': 'Brand', name: SITE.name },
    image: absoluteUrl(seo.ogImage ?? SITE.ogImage),
    offers: {
      '@type': 'Offer',
      price: price.amount.toFixed(2),
      priceCurrency: price.currency,
      availability: 'https://schema.org/InStock',
      // Enquanto o checkout não está configurado, a oferta aponta para a
      // própria landing page — que é uma URL real e válida.
      url: absoluteUrl(checkout.url ? checkout.url : path),
    },
  };
};

export const articleSchema = (
  post: Post,
  path: string,
  categoryName: string
): Json => {
  const { title, description, date, updated, author, keywords } = post.data;
  return {
    '@type': 'Article',
    headline: title,
    description,
    inLanguage: SITE.lang,
    datePublished: isoDate(date),
    dateModified: isoDate(updated ?? date),
    articleSection: categoryName,
    ...(keywords.length > 0 ? { keywords: keywords.join(', ') } : {}),
    author: { '@type': 'Organization', name: author },
    publisher: { '@id': `${SITE.url}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(path) },
    image: absoluteUrl(SITE.ogImage),
  };
};

/** Empacota um ou mais nós em um único bloco @graph. */
export const graph = (nodes: Json[]): string =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
