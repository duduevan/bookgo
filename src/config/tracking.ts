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
   * Eventos previstos: PageView, ViewContent, InitiateCheckout, Purchase.
   * `Purchase` **não** é disparado pelo site: quem conhece a compra é a
   * Kiwify. Ver docs/tracking.md.
   */
  meta: {
    /** Só dígitos. */
    pixelId: string | null;
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
  enabled: false,

  gtm: { id: null },

  ga4: {
    measurementId: null,
    loadDirectlyWithoutGtm: false,
  },

  meta: { pixelId: null },

  googleAds: {
    id: null,
    conversionLabel: null,
  },

  consent: {
    required: true,
    storageKey: 'bookgo-consent',
  },
};
