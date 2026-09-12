/**
 * Decisões de tracking avaliadas em build.
 *
 * Tudo aqui é função pura sobre a configuração: os componentes só perguntam
 * "devo renderizar isto?" e não repetem regra de negócio.
 */
import { TRACKING } from '../config/tracking';
import { ADS } from '../config/site';

/** Algum fornecedor tem ID utilizável? */
export function hasAnyProvider(): boolean {
  return Boolean(
    TRACKING.gtm.id ||
      TRACKING.ga4.measurementId ||
      TRACKING.meta.pixelId ||
      TRACKING.googleAds.id
  );
}

/** O tracking está ligado E existe pelo menos um fornecedor configurado. */
export const isTrackingActive = (): boolean =>
  TRACKING.enabled && hasAnyProvider();

/** GTM entra apenas com a chave mestra ligada e um container real. */
export const shouldLoadGtm = (): boolean =>
  TRACKING.enabled && Boolean(TRACKING.gtm.id);

/**
 * GA4 direto (gtag.js) só quando NÃO há GTM.
 *
 * Com GTM presente, o GA4 é uma tag dentro do container. Carregar os dois
 * dispara page_view duas vezes e quebra a contagem de sessões.
 */
export const shouldLoadGa4Directly = (): boolean =>
  TRACKING.enabled &&
  !TRACKING.gtm.id &&
  TRACKING.ga4.loadDirectlyWithoutGtm &&
  Boolean(TRACKING.ga4.measurementId);

/**
 * AdSense.
 *
 * Ter o publisher ID **não** autoriza carregar nada. O script só entra com
 * `ADS.enabled` true — e, mesmo assim, apenas depois do aceite da categoria
 * `advertising`. Hoje devolve false, e é por isso que o ID real em
 * `src/config/site.ts` não custa um byte ao visitante.
 */
export const shouldLoadAdsense = (): boolean =>
  ADS.enabled && Boolean(ADS.adsenseClient);

/** Meta Pixel direto. Preferência é entrar pelo GTM; ver docs/tracking.md. */
export const shouldLoadMetaPixelDirectly = (): boolean =>
  TRACKING.enabled && !TRACKING.gtm.id && Boolean(TRACKING.meta.pixelId);

/**
 * O banner de consentimento só existe quando há algo a consentir.
 *
 * É isso que preserva o 0 KB de JavaScript hoje: sem fornecedor configurado,
 * não há banner, não há script, não há decisão a pedir. Pedir consentimento
 * para nada seria ruído — e, pela LGPD, também não faria sentido.
 *
 * O AdSense conta como motivo: quando os anúncios forem ligados, a categoria
 * `advertising` passa a existir e o banner aparece sozinho.
 */
export const needsConsentBanner = (): boolean =>
  TRACKING.consent.required &&
  (isTrackingActive() || (ADS.enabled && Boolean(ADS.adsenseClient)));

/** Dados de um clique de checkout, lidos pelo listener no cliente. */
export interface CheckoutEventData {
  product_slug: string;
  product_name: string;
  value: number;
  currency: string;
}

/**
 * Atributos `data-*` do evento, para o listener delegado.
 *
 * Devolve `{}` quando o tracking está desligado: hoje o HTML sai idêntico ao
 * que já estava em produção, sem atributo sobrando.
 */
export function eventAttrs(
  event: string,
  data: Record<string, string | number> = {}
): Record<string, string> {
  if (!isTrackingActive()) return {};
  return {
    'data-bookgo-event': event,
    'data-bookgo-params': JSON.stringify(data),
  };
}
