/**
 * Apoio às avaliações.
 *
 * Nada aqui gera conteúdo: só deriva apresentação do dado que já existe.
 * O componente não sabe de produto nenhum, e esta camada também não.
 */

/**
 * Iniciais para o avatar de quem não mandou foto.
 *
 * Primeira e última palavra do nome, no máximo duas letras. É derivação do
 * que a pessoa já autorizou, diferente de inventar um rosto, que é o que um
 * avatar gerado seria.
 */
export function initialsOf(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 1);
  if (parts.length === 0) return name.trim().slice(0, 1).toUpperCase();
  const first = parts[0]![0]!;
  const last = parts.length > 1 ? parts[parts.length - 1]![0]! : '';
  return (first + last).toUpperCase();
}

/**
 * Como a seção se apresenta, decidido pela quantidade e por nada mais.
 *
 * Não existe número máximo. O carrossel entra a partir de três porque abaixo
 * disso ele seria uma interface de navegação para algo que já cabe na tela:
 * setas que nunca andam e pontinhos que nunca mudam pesam mais do que
 * ajudam.
 *
 *   0 → `none`      a seção não é renderizada, nem título, nem CSS
 *   1 → `solo`      uma coluna centrada, largura de leitura
 *   2 → `pair`      duas colunas de mesmo peso
 *  3+ → `carousel`  trilho com rolagem, setas, pontos e teclado
 */
export type ReviewsLayout = 'none' | 'solo' | 'pair' | 'carousel';

export function reviewsLayout(enabled: boolean, count: number): ReviewsLayout {
  if (!enabled || count === 0) return 'none';
  if (count === 1) return 'solo';
  if (count === 2) return 'pair';
  return 'carousel';
}

/**
 * Estrelas de uma nota real.
 *
 * Devolve lista vazia quando não há nota. **Nota não se deriva e não se
 * arredonda para cima**: sem o dado, a peça não exibe estrela nenhuma, e a
 * LP não passa a afirmar uma avaliação que ninguém deu.
 */
export function starsOf(rating: number | undefined): boolean[] {
  if (typeof rating !== 'number') return [];
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => i < full);
}
