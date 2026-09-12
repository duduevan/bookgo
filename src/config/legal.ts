/**
 * Páginas legais — registro único.
 *
 * Uma página legal só é publicável quando **todo** dado essencial existe.
 * Antes disso ela continua acessível e linkada no rodapé (esconder política
 * de privacidade seria pior), mas fica fora dos buscadores.
 *
 * `ready` é a única chave. Virar para `true` faz, sozinho:
 *  - sair o `noindex` (`LegalPage.astro`);
 *  - entrar no sitemap (filtro em `astro.config.mjs`);
 *  - entrar no `llms.txt`;
 *  - sumir o aviso de pendência da própria página.
 *
 * Não existe segundo lugar para mudar. Era esse o problema da versão
 * anterior: o `noindex` estava escrito à mão na página e o sitemap tinha os
 * caminhos repetidos em `astro.config.mjs` — três fontes de verdade para o
 * mesmo fato, fáceis de deixar em desacordo.
 *
 * `pending` é a lista do que falta, exibida na própria página. Uma página
 * com `ready: true` e `pending` não vazio quebra o build: publicar um
 * documento legal sabidamente incompleto não pode depender de disciplina.
 */

export interface LegalPage {
  /** Chave interna, usada pelas páginas para buscar o próprio registro. */
  id: string;
  /** Rótulo curto do rodapé. */
  label: string;
  /** Título da página e do `<title>`. */
  title: string;
  href: string;
  description: string;
  /** Conteúdo definitivo publicado? Ver acima o que isso governa. */
  ready: boolean;
  /**
   * Data da última revisão do texto, formato ISO. `null` enquanto o
   * documento não foi publicado — inventar uma data de vigência para um
   * texto que ainda não vale seria falso.
   */
  updated: string | null;
  /** O que falta para poder publicar. Exibido na página. */
  pending: string[];
  /**
   * Aparece nos rodapés? O rodapé é curto de propósito — cada linha a mais
   * numa landing page é uma saída da oferta. Um documento pode existir e ser
   * alcançável por links no corpo do texto sem ocupar o rodapé.
   */
  inFooter: boolean;
}

/**
 * Dados que faltam e travam mais de um documento. Repetir o texto em cada
 * página deixaria as listas fora de sincronia com o tempo.
 */
const FALTA = {
  retencao:
    'Prazo de retenção dos dados. Duas partes: (a) a configuração de retenção da propriedade do Google Analytics — Admin › Coleta e modificação de dados › Retenção de dados, hoje no padrão do painel; (b) por quanto tempo os registros de acesso do servidor são mantidos pela hospedagem. É o único item que ainda impede publicar a Política de Privacidade: a LGPD exige informar a duração do tratamento, e um número aqui não pode ser estimado.',
  checkoutUrl: 'URL definitiva de checkout do produto.',
  entrega:
    'Formato definitivo do produto, método de entrega e prazo efetivo de liberação após o pagamento.',
  garantia:
    'Confirmação final da garantia comercial de 7 dias e do canal por onde o reembolso é solicitado.',
} as const;

/** Data de publicação dos documentos liberados nesta revisão. */
const PUBLICADO_EM = '2026-09-12';

export const LEGAL_PAGES: LegalPage[] = [
  {
    id: 'termos',
    label: 'Termos de Uso',
    title: 'Termos de Uso',
    href: '/termos/',
    description:
      'Condições de uso do site da BookGo: conteúdo editorial, propriedade intelectual, uso adequado e legislação aplicável.',
    ready: true,
    updated: PUBLICADO_EM,
    pending: [],
    inFooter: true,
  },
  {
    id: 'compra',
    label: 'Termos de Compra',
    title: 'Termos de Compra e Reembolso',
    href: '/termos-de-compra/',
    description:
      'Condições de compra dos materiais digitais da BookGo, direito de arrependimento e reembolso.',
    ready: false,
    updated: null,
    pending: [FALTA.checkoutUrl, FALTA.entrega, FALTA.garantia],
    /* Entra no rodapé junto com o checkout: linkar condições de compra numa
       página onde ainda não é possível comprar só gera pergunta. */
    inFooter: false,
  },
  {
    id: 'privacidade',
    label: 'Política de Privacidade',
    title: 'Política de Privacidade',
    href: '/privacidade/',
    description:
      'Como a BookGo trata dados pessoais: o que é medido, com qual consentimento e com quem é compartilhado.',
    ready: false,
    updated: null,
    pending: [FALTA.retencao],
    inFooter: true,
  },
  {
    id: 'cookies',
    label: 'Política de Cookies',
    title: 'Política de Cookies',
    href: '/politica-de-cookies/',
    description:
      'Quais cookies e armazenamento local o site da BookGo usa, em quais categorias e como aceitar ou recusar.',
    ready: true,
    updated: PUBLICADO_EM,
    pending: [],
    inFooter: true,
  },
  {
    id: 'contato',
    label: 'Contato',
    title: 'Contato',
    href: '/contato/',
    description:
      'Fale com a BookGo: atendimento, dúvidas sobre materiais e solicitações relativas a dados pessoais.',
    ready: true,
    updated: PUBLICADO_EM,
    pending: [],
    inFooter: true,
  },
];

/** Busca o registro de uma página. Id desconhecido quebra o build. */
export function legalPage(id: string): LegalPage {
  const page = LEGAL_PAGES.find((p) => p.id === id);
  if (!page) {
    throw new Error(
      `Página legal desconhecida: "${id}". Ver src/config/legal.ts.`
    );
  }
  if (page.ready && page.pending.length > 0) {
    throw new Error(
      `"${id}" está com ready: true mas ainda tem ${page.pending.length} pendência(s). ` +
        'Um documento legal não vai a público incompleto — resolva as pendências ' +
        'e esvazie `pending`, ou volte `ready` para false.'
    );
  }
  if (page.ready && !page.updated) {
    throw new Error(
      `"${id}" está com ready: true mas sem \`updated\`. Uma política publicada ` +
        'precisa dizer desde quando vale.'
    );
  }
  return page;
}

/** Caminhos que devem ficar fora do sitemap. Lido por astro.config.mjs. */
export const legalPathsNotReady = (): string[] =>
  LEGAL_PAGES.filter((p) => !p.ready).map((p) => p.href);
