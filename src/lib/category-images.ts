/**
 * Capa de categoria, resolvida pelo id.
 *
 * O arquivo se chama como a categoria (`organizacao.webp` para
 * `content/categories/organizacao.yaml`), e é só isso que liga um ao outro.
 * Uma categoria nova ganha capa colocando o arquivo aqui: nenhuma lista
 * para atualizar, nenhum import a acrescentar.
 *
 * Sem arquivo, a capa é `undefined` e quem chama decide o que fazer. Hoje o
 * card da home cai num fundo da paleta, que continua sendo superfície
 * intencional em vez de buraco.
 */
import type { ImageMetadata } from 'astro';

const covers = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/categories/*.{webp,avif,jpg,jpeg,png}',
  { eager: true }
);

const byId = new Map<string, ImageMetadata>(
  Object.entries(covers).map(([path, mod]) => [
    path.split('/').pop()!.replace(/\.[^.]+$/, ''),
    mod.default,
  ])
);

export const categoryCover = (categoryId: string): ImageMetadata | undefined =>
  byId.get(categoryId);
