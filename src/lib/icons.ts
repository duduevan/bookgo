/**
 * Conjunto de ícones da BookGo.
 *
 * Uma grade só: viewBox 24×24, traço 1.5, pontas e junções redondas,
 * `currentColor`. Nenhum ícone traz cor, tamanho ou preenchimento próprio —
 * quem decide isso é o contexto, via CSS. É o mesmo princípio dos tokens:
 * o ícone é geometria, a apresentação fica fora dele.
 *
 * Regra de uso: ícone só entra onde ele **acrescenta** leitura. Onde já
 * existe número (módulos) ou ordem explícita (passos do "como funciona"),
 * o número comunica melhor e o ícone vira ruído decorativo.
 *
 * Cada entrada é o miolo do `<svg>`. O invólucro vive em `Icon.astro`, que
 * é o único lugar com viewBox e atributos de traço.
 */

export const ICONS = {
  /* --- marcadores ------------------------------------------------- */

  /** Confirmação. Listas de inclusão, "para quem é". */
  check: '<path d="M5 12.5 9.5 17 19 7"/>',

  /** Exclusão neutra, para listas onde a ausência não é o argumento. */
  minus: '<path d="M6 12h12"/>',

  /** Exclusão explícita. Usado só onde a oposição a `check` é o argumento. */
  x: '<path d="M6.75 6.75 17.25 17.25"/><path d="M17.25 6.75 6.75 17.25"/>',

  /** Divulgar/recolher do FAQ. Gira 180° quando aberto. */
  'chevron-down': '<path d="M6 9.5 12 15.5 18 9.5"/>',

  /** Avanço na mesma página. Cards do blog. */
  'arrow-right': '<path d="M4 12h14"/><path d="M12.5 6.5 18 12l-5.5 5.5"/>',

  /** Saída para outro contexto. CTA institucional. */
  'arrow-up-right': '<path d="M6 18 18 6"/><path d="M9 6h9v9"/>',

  /* --- benefícios -------------------------------------------------- */

  /** Ganho rápido, resultado que aparece cedo. */
  spark: '<path d="M12 3.5 14 9.5 20 11.5 14 13.5 12 19.5 10 13.5 4 11.5 10 9.5Z"/>',

  /** Constância, hábito diário. */
  calendar:
    '<path d="M8 3v3.5"/><path d="M16 3v3.5"/><path d="M4.5 5.5h15A1.5 1.5 0 0 1 21 7v12a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19V7a1.5 1.5 0 0 1 1.5-1.5Z"/><path d="M3 10h18"/>',

  /** Método em etapas, o que fazer em cada dia. */
  list: '<path d="M4.5 7h.01"/><path d="M4.5 12h.01"/><path d="M4.5 17h.01"/><path d="M9 7h10.5"/><path d="M9 12h10.5"/><path d="M9 17h10.5"/>',

  /** Direção, saber por onde começar. */
  compass:
    '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8Z"/>',

  /** A casa como um todo. */
  home: '<path d="M3.5 10.5 12 3.75l8.5 6.75V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19Z"/><path d="M9.5 20.5v-6h5v6"/>',

  /* --- materiais --------------------------------------------------- */

  /** Checklist impressa. */
  checklist:
    '<path d="m4 7.5 1.8 1.8L9 6"/><path d="m4 16.5 1.8 1.8L9 13"/><path d="M12.5 8h7.5"/><path d="M12.5 17h7.5"/>',

  /** Planner semanal. Calendário com as linhas da semana preenchidas. */
  'calendar-week':
    '<path d="M8 3v3.5"/><path d="M16 3v3.5"/><path d="M4.5 5.5h15A1.5 1.5 0 0 1 21 7v12a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19V7a1.5 1.5 0 0 1 1.5-1.5Z"/><path d="M3 10h18"/><path d="M7 13.5h10"/><path d="M7 17h6"/>',

  /**
   * Roteiro em etapas: progressão, não lista.
   *
   * A primeira versão era a rota em S com dois nós. No tamanho de uso os
   * nós somem e o traço vira um "S" decorativo — o desenho parava de
   * comunicar. A escada mantém a leitura de avanço em qualquer tamanho.
   */
  roadmap: '<path d="M3.5 19.5h5.5V15h5.5v-4.5H20V6"/>',

  /** Guia por cômodo. Planta baixa. */
  rooms:
    '<path d="M5 4.5h14A1.5 1.5 0 0 1 20.5 6v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5Z"/><path d="M10 4.5V13"/><path d="M10 13h10.5"/>',

  /* --- garantia ---------------------------------------------------- */

  /** Garantia. Escudo com confirmação — proteção, não selo de autoridade. */
  shield:
    '<path d="M12 3.5 19 6v5.6c0 4.3-2.9 7.4-7 8.9-4.1-1.5-7-4.6-7-8.9V6Z"/><path d="m9 12 2 2 4-4"/>',
} as const;

export type IconName = keyof typeof ICONS;

/** Nome conhecido? Usado pelo schema de conteúdo para falhar o build cedo. */
export const ICON_NAMES = Object.keys(ICONS) as IconName[];
