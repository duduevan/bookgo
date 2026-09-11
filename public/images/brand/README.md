# Arquivos oficiais da marca BookGo

Coloque os arquivos aqui, **com estes nomes exatos**. Nenhum código precisa
mudar: `<Logo>` passa a usá-los automaticamente e o aviso de build some.

| Arquivo | Uso | Formato preferido |
|---|---|---|
| `bookgo-blue.svg` | Logo em fundos claros — navbar, rodapé da LP | SVG |
| `bookgo-white.svg` | Logo em fundos azuis ou escuros — hero, faixas | SVG |
| `bookgo-symbol.svg` | Símbolo compacto — favicon, avatar | SVG quadrado |

SVG é o formato preferido: escala sem perda e pesa pouco. Se só houver PNG,
use PNG com fundo transparente em pelo menos 3x o tamanho de exibição e
ajuste a extensão em `src/lib/brand.ts`.

Não aplique sombra, gradiente ou efeito nos arquivos. Não altere proporções.

## Favicon

Depois de colocar `bookgo-symbol.svg` aqui, atualize também:

- `public/favicon.svg` — cópia do símbolo
- a cor de `<meta name="theme-color">` em `src/layouts/BaseLayout.astro`,
  se o azul oficial for diferente de `--bookgo-blue`

## Cor da marca

O token `--bookgo-blue` em `src/styles/tokens.css` está com um valor
**estimado**. Assim que o arquivo oficial chegar, extraia o azul exato dele e
substitua o token — é o único lugar a mudar.
