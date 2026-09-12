/**
 * Imagens dos produtos, resolvidas em build.
 *
 * O YAML do produto guarda só o nome do arquivo; a imagem em si vive em
 * `src/assets/products/<slug>/`, para passar pelo pipeline do astro:assets
 * e sair com dimensões reais, srcset e formato otimizado.
 *
 * Isso mantém a regra do projeto: o conteúdo é dado, e o componente não
 * precisa saber de qual produto se trata.
 */
const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/products/**/*.{jpg,jpeg,png,webp,avif}',
  { eager: true }
);

/** Devolve a imagem do produto, ou undefined quando ainda não existe. */
export function productImage(
  slug: string,
  file: string | undefined
): ImageMetadata | undefined {
  if (!file) return undefined;
  return files[`/src/assets/products/${slug}/${file}`]?.default;
}

/** Caminho canônico esperado de uma imagem de produto. */
export const productImagePath = (slug: string, file: string): string =>
  `/src/assets/products/${slug}/${file}`;

/**
 * Imagens declaradas cujo arquivo ainda não existe.
 *
 * Slot silencioso é o comportamento certo na página — mas silencioso no log
 * do build seria esquecer que a imagem falta. Cobre o hero e as editoriais.
 */
export async function missingProductImages(): Promise<
  Array<{ slug: string; expectedPath: string; alt: string; role: string }>
> {
  const { getCollection } = await import('astro:content');
  const products = await getCollection('products');
  const missing = [];

  for (const product of products) {
    const slug = product.data.slug;

    const hero = product.data.hero.image;
    if (hero && !productImage(slug, hero)) {
      missing.push({
        slug,
        expectedPath: productImagePath(slug, hero),
        alt: product.data.hero.imageAlt ?? '(sem alt)',
        role: 'hero — elemento de LCP, proporção 4/5',
      });
    }

    for (const img of product.data.images) {
      if (!productImage(slug, img.src)) {
        missing.push({
          slug,
          expectedPath: productImagePath(slug, img.src),
          alt: img.alt,
          role: `editorial (${img.placement}) — proporção 16/9`,
        });
      }
    }
  }

  return missing;
}
