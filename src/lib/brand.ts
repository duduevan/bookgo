/**
 * Assets de marca usados pela aplicação.
 *
 * Os arquivos oficiais em `public/images/brand/` exibem a tagline
 * "SEU AGENDAMENTO", que não pertence ao posicionamento atual. Os arquivos
 * abaixo são derivados deles por `scripts/derive-brand-assets.mjs`, que
 * apenas apaga a tagline e isola o check — nenhum traço é redesenhado.
 *
 * Quando a versão oficial sem tagline existir, basta substituir estes
 * arquivos: nada no código muda.
 */
import wordmarkBlue from '../assets/brand/bookgo-wordmark-blue.webp';
import wordmarkWhite from '../assets/brand/bookgo-wordmark-white.webp';
import icon from '../assets/brand/bookgo-icon.webp';

export const BRAND = {
  /** Logo para fundos claros. */
  blue: wordmarkBlue,
  /** Logo para fundos azuis ou escuros. */
  white: wordmarkWhite,
  /** Check isolado, para favicon e aplicações compactas. */
  icon,
} as const;

export type BrandVariant = keyof typeof BRAND;

/** URL estável do logo para JSON-LD e Open Graph (fora do pipeline de hash). */
export const BRAND_LOGO_URL = '/images/bookgo-logo.png';
export const BRAND_ICON_URL = '/images/bookgo-icon.png';
