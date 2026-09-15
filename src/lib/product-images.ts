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

/**
 * Devolve a imagem do produto, ou undefined quando ainda não existe.
 *
 * **A extensão declarada no YAML é uma preferência, não uma exigência.**
 * Não achando o arquivo exato, procura o mesmo nome com qualquer extensão
 * aceita. Quem sobe a arte não precisa converter nada antes: o
 * `astro:assets` já entrega WebP com srcset e dimensões reais a partir de
 * PNG, JPG ou do que vier, e exigir a conversão manual só criaria um passo
 * para o arquivo chegar errado.
 *
 * Dois arquivos com o mesmo nome e extensões diferentes é erro de quem
 * publicou, e aqui vence o primeiro em ordem alfabética de caminho.
 */
export function productImage(
  slug: string,
  file: string | undefined
): ImageMetadata | undefined {
  if (!file) return undefined;

  const exato = files[`/src/assets/products/${slug}/${file}`]?.default;
  if (exato) return exato;

  const base = `/src/assets/products/${slug}/${file.replace(/\.[^.]+$/, '')}.`;
  const alternativo = Object.keys(files)
    .filter((caminho) => caminho.startsWith(base))
    .sort()[0];

  return alternativo ? files[alternativo]!.default : undefined;
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
