/**
 * Configuração global do site.
 * Único lugar onde vivem domínio, marca, navegação e defaults de SEO.
 */
export const SITE = {
  url: 'https://bookgo.com.br',
  name: 'BookGo',
  title: 'BookGo — aprenda algo útil, coloque em prática',
  description:
    'Cursos rápidos, guias e materiais práticos para resolver problemas reais do dia a dia, no seu ritmo.',
  locale: 'pt-BR',
  lang: 'pt-BR',
  ogImage: '/images/og-default.png',
  ogImageAlt: 'BookGo — aprenda algo útil e coloque em prática',
  /**
   * Verificação do Google Search Console.
   * `null` enquanto não houver token real: nada é renderizado.
   * Para ativar, cole aqui o valor do método "tag HTML" do Search Console.
   */
  googleSiteVerification: null as string | null,
} as const;

/** Navegação institucional. `Explorar` e `Sobre` são âncoras da home
 *  enquanto não existirem páginas próprias — trocar por uma rota é
 *  mudar o href aqui. */
export const NAV = [
  { label: 'Explorar', href: '/#explorar' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Sobre', href: '/#sobre' },
] as const;

export const NAV_CTA = {
  label: 'Explorar conteúdos',
  href: '/#explorar',
} as const;

/**
 * Links legais — rodapé institucional e rodapé das LPs.
 *
 * `ready: false` enquanto a página ainda tem marcações [PREENCHER]: ela
 * continua acessível e linkada no rodapé, mas fica em noindex, fora do
 * sitemap e fora do llms.txt. Vire para `true` junto com a publicação do
 * texto definitivo.
 */
export const LEGAL_NAV = [
  { label: 'Termos de Uso', href: '/termos/', ready: false },
  { label: 'Política de Privacidade', href: '/privacidade/', ready: false },
  { label: 'Contato', href: '/contato/', ready: false },
] as const;

export const FOOTER = {
  legalName: 'BookGo',
  note: 'Conteúdo educacional. Os resultados variam de pessoa para pessoa.',
} as const;

/**
 * Publicidade.
 *
 * Nada é renderizado e nenhum recurso externo é carregado enquanto
 * `enabled` for false. O script do AdSense **não** é injetado por este
 * arquivo: ligá-lo é um passo separado e deliberado, porque ele custa o
 * "zero JavaScript no cliente" que é padrão do projeto.
 *
 * Filosofia (ver CLAUDE.md): só anúncio in-page discreto. Nada de popup,
 * modal, vignette, anchor, side rail, sticky ou qualquer formato que cubra
 * o conteúdo. Sem sidebar de publicidade.
 */
export type AdPlacement = 'article-inline' | 'article-end' | 'product-page-end';

export const ADS: {
  enabled: boolean;
  adsenseClient: string | null;
  placements: Record<AdPlacement, boolean>;
} = {
  enabled: false,
  adsenseClient: null,
  /** Cada posição liga e desliga sozinha, mesmo com `enabled` true. */
  placements: {
    'article-inline': false,
    'article-end': false,
    'product-page-end': false,
  },
};

/** Monta uma URL absoluta a partir de um caminho interno. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).href;
}
