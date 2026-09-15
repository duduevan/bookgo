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
