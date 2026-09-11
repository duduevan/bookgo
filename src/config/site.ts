/**
 * Configuração global do site.
 * Único lugar onde vivem domínio, marca e defaults de SEO.
 */
export const SITE = {
  url: 'https://bookgo.com.br',
  name: 'BookGo',
  title: 'BookGo — conhecimento prático para o dia a dia',
  description:
    'Materiais diretos e aplicáveis para resolver problemas reais da rotina, sem complicação.',
  locale: 'pt-BR',
  lang: 'pt-BR',
  ogImage: '/images/og-default.png',
  ogImageAlt: 'BookGo',
} as const;

export const NAV = [
  { label: 'Blog', href: '/blog/' },
] as const;

/** Rodapé: mantido mínimo enquanto não há páginas legais publicadas. */
export const FOOTER = {
  legalName: 'BookGo',
  note: 'Conteúdo educacional. Os resultados variam de pessoa para pessoa.',
} as const;

/** Monta uma URL absoluta a partir de um caminho interno. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).href;
}
