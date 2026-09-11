import fs from 'node:fs';

/**
 * Arquivos oficiais da marca. São a única fonte da identidade:
 * o logo nunca é redesenhado nem recriado em código.
 *
 * Enquanto um arquivo não existir, <Logo> renderiza um substituto
 * temporário em texto e o build avisa. Basta colocar o arquivo no
 * caminho abaixo — nenhum código muda.
 */
export const BRAND_ASSETS = {
  /** Logo completo, para fundos claros. */
  blue: '/images/brand/bookgo-blue.svg',
  /** Logo completo, para fundos azuis ou escuros. */
  white: '/images/brand/bookgo-white.svg',
  /** Símbolo/versão compacta, para favicon e avatar. */
  symbol: '/images/brand/bookgo-symbol.svg',
} as const;

export type BrandVariant = keyof typeof BRAND_ASSETS;

const PUBLIC_DIR = new URL('../../public', import.meta.url);

const resolve = (publicPath: string) =>
  new URL(`.${publicPath}`, `${PUBLIC_DIR}/`);

/** Um arquivo de marca já foi fornecido? Avaliado em tempo de build. */
export function hasBrandAsset(variant: BrandVariant): boolean {
  try {
    return fs.existsSync(resolve(BRAND_ASSETS[variant]));
  } catch {
    return false;
  }
}

let warned = false;

/** Avisa uma única vez por build sobre os arquivos de marca ausentes. */
export function warnMissingBrandAssets(): void {
  if (warned) return;
  warned = true;

  const missing = (Object.keys(BRAND_ASSETS) as BrandVariant[]).filter(
    (variant) => !hasBrandAsset(variant)
  );

  if (missing.length === 0) return;

  console.warn(
    `[bookgo] Arquivos de marca ausentes: ${missing
      .map((variant) => BRAND_ASSETS[variant])
      .join(', ')}\n` +
      '         O logo está sendo substituído por um texto temporário.\n' +
      '         Coloque os arquivos oficiais em public/images/brand/ para resolver.'
  );
}
