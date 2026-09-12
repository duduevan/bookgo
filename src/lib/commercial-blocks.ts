/**
 * Ritmo dos blocos comerciais no artigo.
 *
 * Regra do projeto: **elemento comercial nunca encosta em elemento
 * comercial.** CTA de produto, material afiliado e anúncio são três sistemas
 * separados, e empilhar dois deles transforma o fim do artigo numa parede de
 * oferta — que é o padrão que a BookGo não segue.
 *
 * O caso que força a decisão é real: um artigo sem fontes perde o bloco
 * editorial que separaria o anúncio do fim do corpo do CTA de fechamento.
 * Quando isso acontece, não dá para renderizar os dois — e escolher em tempo
 * de build é melhor do que descobrir na página.
 *
 * Critério de desempate: o anúncio cede. Ele é receita suplementar de
 * terceiro; o CTA é o negócio da casa e responde ao que a pessoa acabou de
 * ler. Entre dois anúncios, cede o de menor prioridade editorial.
 */

export interface Block {
  id: string;
  /** Bloco comercial? Editorial separa, comercial disputa. */
  commercial: boolean;
  /** Deveria renderizar, pelas regras próprias dele. */
  on: boolean;
  /** Maior vence quando dois comerciais ficariam vizinhos. */
  priority?: number;
}

export interface Rhythm {
  /** Ids que devem de fato renderizar. */
  visible: Set<string>;
  /** Ids removidos por vizinhança, com o motivo — aparece no log do build. */
  dropped: Array<{ id: string; because: string }>;
}

/**
 * Resolve a sequência, removendo o mínimo necessário para que dois blocos
 * comerciais nunca fiquem lado a lado.
 */
export function resolveRhythm(blocks: Block[]): Rhythm {
  const visible = new Set<string>();
  const dropped: Rhythm['dropped'] = [];

  /** Último bloco que de fato entrou — é dele que vem a vizinhança. */
  let previous: Block | undefined;

  for (const block of blocks) {
    if (!block.on) continue;

    if (block.commercial && previous?.commercial) {
      const mine = block.priority ?? 0;
      const theirs = previous.priority ?? 0;

      if (mine > theirs) {
        visible.delete(previous.id);
        dropped.push({
          id: previous.id,
          because: `ficaria colado em "${block.id}"`,
        });
        visible.add(block.id);
        previous = block;
      } else {
        dropped.push({
          id: block.id,
          because: `ficaria colado em "${previous.id}"`,
        });
      }
      continue;
    }

    visible.add(block.id);
    previous = block;
  }

  return { visible, dropped };
}
