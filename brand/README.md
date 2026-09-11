# Arquivos oficiais da marca BookGo

**Este diretório não é publicado.** Fica fora de `public/` de propósito: os três
arquivos abaixo exibem a tagline **"SEU AGENDAMENTO"**, que não pertence ao
posicionamento atual da BookGo e não pode aparecer em produção — nem numa
página, nem por URL direta.

| Arquivo | Conteúdo |
|---|---|
| `bookgo-blue.webp` | Logo completo para fundos claros, com tagline |
| `bookgo-white.webp` | Logo completo para fundos escuros, com tagline |
| `bookgo-symbol.webp` | Wordmark sobre quadrado azul 1200×1200, com tagline |

São a fonte da verdade da identidade. Não edite estes arquivos.

## O que a aplicação usa

`npm run brand:assets` deriva daqui os arquivos de `src/assets/brand/`:

- `bookgo-wordmark-blue.webp` e `bookgo-wordmark-white.webp` — a região da
  tagline é apagada; wordmark e check ficam intactos, sem redesenho nem
  mudança de proporção. O script confere que há folga suficiente entre as
  letras da tagline e o check, e falha se não houver.
- `bookgo-icon.webp` e `public/images/icons/` — o check é isolado por
  componentes conexos e composto sobre o azul oficial, em resolução nativa
  (270×245), sem ampliação.

`npm run brand:og` regenera as imagens Open Graph com o logo oficial e a
tipografia real do site.

## Quando houver versão oficial sem tagline

Substitua os arquivos em `src/assets/brand/` diretamente e o script deixa de ser
necessário. Nenhum código muda.

## Cor

O azul oficial `#004ED1` foi extraído do fundo chapado de `bookgo-symbol.webp`
e vive em `--bookgo-blue` (`src/styles/tokens.css`).
