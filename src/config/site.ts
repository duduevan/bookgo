/**
 * Configuração global do site.
 * Único lugar onde vivem domínio, marca, navegação e defaults de SEO.
 */
export const SITE = {
  url: 'https://bookgo.com.br',
  name: 'BookGo',
  title: 'BookGo: aprenda algo útil, coloque em prática',
  description:
    'Métodos, guias e materiais práticos para resolver problemas reais do dia a dia, no seu ritmo.',
  locale: 'pt-BR',
  lang: 'pt-BR',
  ogImage: '/images/og-default.png',
  ogImageAlt: 'BookGo: aprenda algo útil e coloque em prática',
  /**
   * Verificação do Google Search Console (método "tag HTML").
   *
   * Token real da propriedade bookgo.com.br. `BaseLayout` é o único lugar
   * que lê este campo, e renderiza a meta uma única vez por página. Não
   * existe segunda cópia em layout, página ou componente.
   *
   * Não é segredo: o token é público por natureza — ele só prova posse do
   * domínio para quem já tem acesso à conta do Search Console.
   */
  googleSiteVerification: 'oBqSFgvHkSPpe1vSmnJ_Aip9_LlG5cEmEtevdcWHQTM' as
    | string
    | null,

  /**
   * Verificação de domínio da Meta (Business Manager).
   *
   * Mesma natureza da etiqueta do Search Console: prova posse do domínio
   * para quem já administra a conta, não grava nada no navegador e não
   * acompanha navegação. Não é cookie e não é rastreamento.
   *
   * Vive aqui, e não no `TRACKING`, de propósito: ela não depende do
   * consentimento nem da chave mestra de medição. Desligar o Pixel não pode
   * derrubar a verificação do domínio, porque as duas coisas não têm
   * relação. `BaseLayout` é o único lugar que lê o campo, e emite a meta uma
   * vez por página.
   */
  metaDomainVerification: 'qsja81fszd5g3tt0qnvhw5epqeoz6z' as string | null,
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
 * Links legais.
 *
 * O registro vive em `src/config/legal.ts`, junto com o estado de cada
 * documento — não aqui, para não existirem duas listas contando histórias
 * diferentes sobre a mesma página. Reexportado para quem só precisa do menu.
 */
export { LEGAL_PAGES } from './legal';

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
 * `adsenseClient` já guarda o publisher ID real. Ter o ID **não** liga nada:
 * o runtime só carrega o adsbygoogle.js quando `enabled` for true, existir
 * um placement ligado e o visitante tiver aceitado a categoria de
 * publicidade. Guardar o ID aqui agora evita procurá-lo depois e mantém a
 * regra do projeto de que nenhum identificador vive fora da configuração.
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
  /** Publisher ID real. Inerte enquanto `enabled` for false. */
  adsenseClient: 'ca-pub-6552313195053069',
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
