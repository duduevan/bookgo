/**
 * Tema visual por produto.
 *
 * As landing pages não usam a identidade azul institucional: cada produto
 * define sua própria paleta no YAML. Aqui ela vira custom properties com os
 * mesmos nomes de papel que os componentes já consomem (--color-*), aplicadas
 * no <body> da LP.
 *
 * Consequência: nenhum componente precisa saber de qual produto se trata,
 * e nenhuma cor de produto aparece dentro de componente.
 */

export interface ProductTheme {
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  onPrimary?: string;
}

/**
 * Monta o valor do atributo `style` do <body> da LP.
 *
 * Dois papéis são derivados em vez de virarem campo no YAML:
 * - `--color-surface`     faixa alternada, tinta do primary sobre o fundo;
 * - `--color-primary-soft` fundo suave para destaques.
 * Isso evita campos redundantes e mantém a paleta coerente sozinha.
 */
export function themeToStyle(theme: ProductTheme): string {
  const vars: Record<string, string> = {
    '--color-primary': theme.primary,
    '--color-primary-dark': theme.primaryDark,
    '--color-accent': theme.accent,
    '--color-bg': theme.background,
    '--color-surface-raised': theme.surface,
    '--color-text': theme.text,
    '--color-muted': theme.muted,
    '--color-border': theme.border,
    '--color-on-primary': theme.onPrimary ?? '#ffffff',
    '--color-surface': `color-mix(in srgb, ${theme.primary} 7%, ${theme.background})`,
    '--color-primary-soft': `color-mix(in srgb, ${theme.primary} 14%, #ffffff)`,
  };

  return Object.entries(vars)
    .map(([name, value]) => `${name}:${value}`)
    .join(';');
}
