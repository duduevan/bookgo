# BookGo — guia operacional

Site estático em Astro 5. O build gera `dist/` com HTML puro, publicado por FTPS
em uma hospedagem cPanel. **Produção não executa Node, SSR nem banco de dados.**

Princípio do projeto: **conteúdo é dado, componente é apresentação**. Nenhuma copy
específica de produto vive dentro de componente.

```
content/              conteúdo editorial (YAML + MDX)
src/                  componentes, layouts, páginas, estilos
public/images/brand/  arquivos oficiais do logo
public/fonts/         Inter Variable auto-hospedada
materials/            fontes dos entregáveis — nunca é publicado
```

---

## Sistema visual

### Tokens em três camadas (`src/styles/tokens.css`)

| Camada | Prefixo | Muda por produto? |
|---|---|---|
| Primitivas — espaço, tipografia, raio, motion | `--s-*`, `--t-*`, `--radius-*` | Não |
| Marca BookGo | `--bookgo-*` | Não |
| Papéis — o que os componentes usam | `--color-*` | **Sim** |

Regra única: **componente só referencia `--color-*`.** Nunca `--bookgo-*`, nunca
cor literal. É isso que permite a mesma engenharia servir o site institucional
(azul) e cada LP (paleta própria) sem duplicar componente.

### Dois layouts

| Layout | Onde | Navbar | Rodapé |
|---|---|---|---|
| `SiteLayout` | home, blog, páginas legais | BookGo completa | institucional completo |
| `ProductLayout` | landing pages | **nenhuma** | assinatura discreta |

A LP não tem navbar, logo no hero nem links para blog e outros produtos: cada
saída custa conversão em campanha paga. A marca aparece só na assinatura do
rodapé, junto dos links legais.

### Marca

Os arquivos oficiais ficam em `public/images/brand/` — veja o README de lá para
os nomes exatos. Enquanto um arquivo não existir, `<Logo>` renderiza um texto
temporário e o build avisa. O logo nunca é redesenhado em código.

### Tipografia

Inter Variable (OFL), auto-hospedada em `public/fonts/`, subsets latin e
latin-ext, com preload do subset principal. Nenhuma requisição externa bloqueia
a renderização. O eixo óptico (`opsz`) fecha o desenho nos títulos grandes.

### Animação

Só CSS: marquee, hover e pequenas transformações. `prefers-reduced-motion` é
tratado uma vez, globalmente, em `src/styles/global.css`, e o marquee vira uma
lista estática rolável.

---

## Criar um produto (e sua landing page)

A LP não é escrita à mão: ela é gerada a partir do YAML do produto.

1. Copie um produto existente:
   ```bash
   cp -r content/products/casa-organizada-em-15-minutos content/products/<novo-slug>
   ```
2. Edite `content/products/<novo-slug>/index.yaml`. O campo `slug` **deve** ser
   igual ao nome do diretório — ele define a URL.
3. Rode `npm run build`. A página aparece em `/<novo-slug>/`.

Não é preciso criar arquivo em `src/pages/`: `src/pages/[product].astro` gera uma
LP para cada produto encontrado.

O schema que valida o YAML está em `src/content.config.ts`. Campo obrigatório
faltando ou com tipo errado **quebra o build** — é proposital.

## Alterar preço

`content/products/<slug>/index.yaml`:

```yaml
price:
  amount: 37          # número, usado no schema Product/Offer
  currency: BRL
  display: R$ 37,00   # texto exibido na página
```

Atualize os dois: `amount` alimenta os dados estruturados, `display` é o que a
pessoa lê.

## Alterar o checkout

```yaml
checkout:
  provider: kiwify
  url: https://pay.kiwify.com.br/XXXXXXX   # null enquanto pendente
  cta: QUERO COMEÇAR AGORA
```

Com `url: null`, todos os CTAs são renderizados mas **não viram link** (e o build
avisa no log). Basta preencher a URL para que todos os botões da LP e o CTA
contextual do blog passem a apontar para ela — um único lugar.

## Definir a identidade visual de um produto

A LP **não** usa o azul institucional. A paleta vive no YAML do produto e vira
custom properties no `<body>` da página (`src/lib/theme.ts`):

```yaml
theme:
  primary: "#758A72"       # CTAs e destaques
  primaryDark: "#34483A"   # hover e contraste
  accent: "#C88D5A"        # acento pontual
  background: "#FAF8F4"    # fundo da página
  surface: "#FFFFFF"       # cartões
  text: "#262825"
  muted: "#697068"
  border: "#E8E2D8"
  onPrimary: "#FFFFFF"     # opcional, padrão branco
```

Dois papéis são **derivados** e não entram no YAML: a faixa alternada das seções
e o fundo suave de destaque, ambos calculados a partir de `primary`. Isso evita
campo redundante e mantém a paleta coerente sozinha.

Ao escolher as cores, verifique o contraste de `text` sobre `background` e de
`onPrimary` sobre `primary` — o mínimo é 4.5:1 para texto corrido.


## Criar uma categoria

Crie `content/categories/<slug>.yaml`:

```yaml
name: Organização
description: Frase que aparece no topo da página da categoria.
seo:
  title: Organização da casa      # opcional
  description: ...                 # opcional
order: 10                          # menor aparece primeiro
```

O nome do arquivo é o slug da URL: `/blog/<slug>/`.

## Criar um artigo

Crie `content/blog/<categoria>/<slug>.mdx`:

```mdx
---
title: Como manter a casa organizada mesmo com uma rotina corrida
description: Resumo de uma a duas frases, usado na meta description.
slug: como-manter-a-casa-organizada
date: 2026-09-11
category: organizacao                     # nome do arquivo em content/categories/
product: casa-organizada-em-15-minutos    # opcional
keywords:
  - como manter a casa organizada
---

Texto do artigo em Markdown.
```

URL resultante: `/blog/<categoria>/<slug>/`.

Campos opcionais: `updated`, `author`, `draft: true` (exclui do site).

## Relacionar artigo a produto

Adicione `product: <slug-do-produto>` ao frontmatter. Isso liga os dois lados:

- o artigo passa a exibir o CTA contextual do produto ao final;
- a LP do produto passa a listar o artigo em "Leia também".

O slug precisa existir em `content/products/`, senão o build falha.

## Adicionar imagem

- **Imagens de interface e OG** (servidas como estão): coloque em
  `public/images/` e referencie por `/images/arquivo.png`.
- **Imagem OG de um produto**: `seo.ogImage: /images/og-<slug>.png` no YAML.
  Tamanho: 1200×630.
- **Imagens dentro de artigo**: coloque em `public/images/blog/` e use
  `![descrição](/images/blog/arquivo.jpg)`. Otimize antes de commitar (WebP,
  largura máxima ~1400px).

## Build

```bash
npm ci        # Node 22
npm run build # gera dist/
npm run preview
```

`dist/` é o que vai para produção — nada além disso.

---

## Deploy

O deploy é manual, via GitHub Actions.

> **O workflow precisa estar na `main` antes de poder ser disparado.**
> O GitHub só lista um `workflow_dispatch` em **Actions → Run workflow** quando o
> arquivo já existe na branch padrão. Um workflow que vive apenas numa branch de
> feature não aparece na interface. Por isso a ordem abaixo não pode ser invertida:
> não tente rodar o dry-run a partir da branch de implementação.

### Ordem de publicação

1. Implementação em uma branch (`claude/...`).
2. Pull Request para `main`.
3. CI verde — `build.yml` roda em `push` e `pull_request`.
4. Revisão.
5. Merge na `main`. **A partir daqui o workflow de deploy existe na branch padrão.**
6. Primeiro dry-run manual (`dry_run = true`).
7. Validação do log.
8. Deploy real manual (`dry_run = false`).

### Configuração (nenhum valor fica em código)

| Tipo | Nome |
|---|---|
| Variable | `BOOKGO_FTP_SERVER` |
| Variable | `BOOKGO_FTP_PATH` (`./`) |
| Secret | `BOOKGO_FTP_USERNAME` |
| Secret | `BOOKGO_FTP_PASSWORD` |

### Passo 6 — dry-run

1. GitHub → **Actions** → **Deploy para produção (FTPS)** → **Run workflow**.
2. Em **Use workflow from**, selecione `main`.
3. Deixe `dry_run` marcado (`true`) e execute.
4. Confira no log: as quatro linhas `definido`, `Configuração validada`, a
   contagem de arquivos e a lista do passo FTPS — **confirme que `.htaccess`
   aparece**, é o arquivo oculto que mais importa validar.

Nada é alterado no servidor em dry-run.

### Passo 8 — deploy real

Mesmo caminho, com `dry_run` **desmarcado** (`false`).

O workflow falha antes de qualquer conexão se alguma variável estiver vazia ou se
`BOOKGO_FTP_PATH` não for `./`. Usuário e senha nunca são impressos no log.

### Ativar deploy automático (opcional, só depois da validação)

Em `.github/workflows/deploy.yml`, acrescente o gatilho de push:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      dry_run:
        ...
```

E troque a linha do dry-run para que o push nunca simule:

```yaml
dry-run: ${{ github.event_name == 'workflow_dispatch' && inputs.dry_run || false }}
```

---

## Páginas legais

`/termos/`, `/privacidade/` e `/contato/` existem com texto de referência e
marcações `[PREENCHER]`. Enquanto estiverem assim:

- as páginas estão em `noindex`;
- ficam fora do sitemap (filtro em `astro.config.mjs`);
- exibem o aviso `PlaceholderNotice`.

Ao publicar o conteúdo definitivo, desfaça os três — nenhum dado jurídico ou
empresarial foi inventado.


## Regras de conteúdo (não negociáveis)

Não escreva, em nenhuma página:

- depoimentos, avaliações ou número de alunos;
- contadores regressivos, vagas limitadas ou qualquer escassez artificial;
- promessa de resultado garantido;
- dados estruturados sem informação real por trás (`aggregateRating`, `review`,
  `FAQPage`).

A garantia é comercial e objetiva: "Você terá 7 dias de garantia para conhecer o
conteúdo." Sem interpretação jurídica.

## SEO

Implementado e automático: title, meta description, canonical absoluto, Open
Graph, Twitter Card, `sitemap-index.xml`, `robots.txt`, BreadcrumbList em todas as
páginas internas, Article nos artigos, Product + Offer na LP, Organization no site.

Domínio canônico: `https://bookgo.com.br` (definido em `astro.config.mjs` e
`src/config/site.ts`).
