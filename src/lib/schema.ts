/**
 * Geradores de JSON-LD.
 *
 * Regra do projeto: só emitimos dados estruturados sustentados por informação
 * real. Nada de aggregateRating, review, número de alunos ou FAQPage — não
 * temos avaliações, e marcar dado inexistente é penalidade, não vantagem.
 * `citation` só aparece quando o artigo declara fontes de verdade.
 */
import { SITE, absoluteUrl } from '../config/site';
import { BRAND_LOGO_URL } from './brand';
import type { Post, Product } from './content';
import { isoDate } from './content';

type Json = Record<string, unknown>;

const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;

export const organization = (): Json => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE.name,
  url: `${SITE.url}/`,
  logo: {
    '@type': 'ImageObject',
    url: absoluteUrl(BRAND_LOGO_URL),
    width: 600,
    height: 216,
  },
});

export const website = (): Json => ({
  '@type': 'WebSite',
  '@id': SITE_ID,
  name: SITE.name,
  url: `${SITE.url}/`,
  description: SITE.description,
  inLanguage: SITE.lang,
  publisher: { '@id': ORG_ID },
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
  categoryName: string,
  extra: { wordCount?: number; categoryPath?: string } = {}
): Json => {
  const d = post.data;
  const image = absoluteUrl(d.ogImage ?? SITE.ogImage);

  return {
    '@type': 'Article',
    '@id': `${absoluteUrl(path)}#article`,
    headline: d.title,
    description: d.description,
    inLanguage: SITE.lang,
    datePublished: isoDate(d.date),
    ...(d.updated ? { dateModified: isoDate(d.updated) } : {}),
    articleSection: categoryName,
    ...(d.keywords.length > 0 ? { keywords: d.keywords.join(', ') } : {}),
    ...(extra.wordCount ? { wordCount: extra.wordCount } : {}),
    author: { '@type': 'Organization', name: d.author },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': SITE_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(path) },
    image,
    // Só referências declaradas pelo artigo. Nunca sintetizadas.
    ...(d.sources.length > 0
      ? {
          citation: d.sources.map((source) => ({
            '@type': 'CreativeWork',
            name: source.title,
            url: source.url,
            ...(source.publisher
              ? { publisher: { '@type': 'Organization', name: source.publisher } }
              : {}),
          })),
        }
      : {}),
  };
};

/** Empacota um ou mais nós em um único bloco @graph. */
export const graph = (nodes: Json[]): string =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
