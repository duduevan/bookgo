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
