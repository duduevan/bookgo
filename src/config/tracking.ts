/**
 * Configuração de tracking — ponto único de verdade.
 *
 * Nenhum ID vive fora deste arquivo. Enquanto `enabled` for false ou o ID de
 * um fornecedor for `null`, **nada daquele fornecedor é renderizado**: sem
 * script, sem pixel, sem requisição externa. Não existe ID fictício aqui.
 *
 * Consequência prática: com tudo desligado, o site continua com 0 KB de
 * JavaScript no cliente — inclusive o banner de consentimento, que só existe
 * quando há algo a consentir.
 */

export interface TrackingConfig {
  /** Chave mestra. Com false, nada é renderizado, mesmo com IDs preenchidos. */
  enabled: boolean;

  /**
   * Google Tag Manager. É o contêiner preferencial: GA4, Google Ads e, se for
   * o caso, o Meta Pixel entram por aqui em vez de virarem scripts soltos.
   */
  gtm: {
    /** Formato `GTM-XXXXXXX`. */
    id: string | null;
  };

  /**
   * GA4.
   *
   * DECISÃO: quando `gtm.id` estiver configurado, o GA4 é gerenciado **pelo
   * GTM** e este arquivo NÃO carrega o gtag.js — carregar os dois duplica
   * page_view e infla a contagem de sessões. `measurementId` aqui serve para
   * documentar qual propriedade está em uso e para o caso de algum dia
   * existir GA4 sem GTM.
   */
  ga4: {
    /** Formato `G-XXXXXXXXXX`. */
    measurementId: string | null;
    /** Só tem efeito quando não há GTM. Ver `shouldLoadGa4Directly`. */
    loadDirectlyWithoutGtm: boolean;
  };

  /**
   * Meta Pixel.
   *
   * Eventos do navegador: PageView, ViewContent, InitiateCheckout.
   * `Purchase` **não** é disparado pelo site: clique no checkout é intenção,
   * e quem conhece a transação é a Kiwify. Ver docs/tracking.md.
   *
   * Categoria de consentimento: `advertising`. É tecnologia de marketing, e
   * não de medição de audiência, então aceitar analytics não o libera.
   */
  meta: {
    /** Só dígitos. */
    pixelId: string | null;

    /**
     * Conversions API (server-side).
     *
     * **O token nunca mora aqui.** Este arquivo é lido pelo build e vira
     * JavaScript público: qualquer segredo escrito nele chega ao navegador
     * de todo visitante. O campo abaixo guarda apenas o endereço do
     * retransmissor que fará as chamadas com o token do lado do servidor.
     *
     * Com `null`, nenhum evento server-side é enviado, e é o estado de hoje.
     * Ver docs/meta-capi.md.
     */
    capiEndpoint: string | null;
  };

  /**
   * Google Ads.
   *
   * A conversão de compra real fica preferencialmente na Kiwify. Importar a
   * mesma conversão do GA4 **e** disparar a tag direta contaria duas vezes.
   */
  googleAds: {
    /** Formato `AW-XXXXXXXXX`. */
    id: string | null;
    /** Rótulo de conversão. Nunca preencher com valor de exemplo. */
    conversionLabel: string | null;
  };

  /** Banner de consentimento. */
  consent: {
    /**
     * Com true, analytics e publicidade só carregam depois do aceite.
     * É a postura mais segura e o padrão do projeto.
     */
    required: boolean;
    /** Chave no localStorage. Mudar invalida as escolhas já feitas. */
    storageKey: string;
  };
}

export const TRACKING: TrackingConfig = {
  enabled: true,

  /**
   * Ainda não existe contêiner GTM. Quando existir, basta preencher o ID
   * aqui: `shouldLoadGa4Directly` passa a devolver false sozinho, o gtag.js
   * deixa de ser carregado pelo site e o GA4 vira uma tag dentro do
   * contêiner. Nenhuma página muda — a decisão mora inteira neste arquivo.
   */
  gtm: { id: null },

  ga4: {
    measurementId: 'G-W41286ERFZ',
    /**
     * Sem GTM, o GA4 entra direto pelo gtag.js — mas ainda assim pela
     * camada central, nunca colado página a página. Este campo é ignorado
     * assim que `gtm.id` existir, o que torna a migração um passo só.
     */
    loadDirectlyWithoutGtm: true,
  },

  /**
   * Pixel BookGo. Só carrega depois do aceite em `advertising`.
   *
   * `capiEndpoint` segue nulo: sem um retransmissor que guarde o token do
   * lado do servidor, não existe envio server-side, e declarar a CAPI
   * "pronta" sem ele seria descrever algo que não acontece.
   */
  meta: {
    pixelId: '28163448079989110',
    /**
     * Retransmissor no próprio domínio, gerado pelo build a partir de
     * `src/server/meta-capi.php`. Caminho relativo de propósito: a chamada é
     * de mesma origem, o que dispensa CORS e mantém os cookies do Pixel
     * (`_fbp`, `_fbc`) acompanhando a requisição.
     */
    capiEndpoint: '/api/meta-capi.php',
  },

  googleAds: {
    id: null,
    conversionLabel: null,
  },

  consent: {
    required: true,
    storageKey: 'bookgo-consent',
  },
};
