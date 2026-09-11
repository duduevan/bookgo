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

- **Azul oficial:** `#004ED1`, extraído do símbolo oficial. Tons auxiliares
  (`-dark`, `-light`) derivam dele só para hover e fundo suave.
- **Originais** ficam em `public/images/brand/`. Eles exibem a tagline
  "SEU AGENDAMENTO", que **não pertence ao posicionamento atual**.
- **Assets da aplicação** ficam em `src/assets/brand/`, derivados dos originais
  por `npm run brand:assets`. O script apaga a região da tagline e isola o
  check — nenhum traço é redesenhado.
- **Favicon e apple-touch-icon** saem do mesmo script, a partir do check
  isolado (`public/images/icons/`).
- **OG images:** `npm run brand:og` renderiza no Chromium usando a tipografia
  real e o logo oficial. Cada produto ganha a sua a partir do tema do YAML.

Quando a versão oficial sem tagline chegar, substitua os arquivos em
`src/assets/brand/` e o script deixa de ser necessário.

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

## Campos editoriais do artigo

Além de `title`, `description`, `slug` e `category`:

```yaml
date: 2026-09-11        # = datePublished
updated: 2026-10-02     # = dateModified (opcional)

summary:                # 3 a 6 pontos, conteúdo editorial explícito
  - Primeiro ponto útil.
  - Segundo ponto útil.
  - Terceiro ponto útil.

primaryKeyword: como manter a casa organizada   # interno, orienta a redação
searchIntent: informacional                     # informacional | comercial | transacional | navegacional

sources:                # vazio quando o texto não precisa de referência externa
  - title: Nome da publicação
    url: https://exemplo.org/artigo
    publisher: Organização

ogImage: /images/og-artigo.png   # opcional; sem ele usa a institucional
ogImageAlt: Descrição da imagem
```

`primaryKeyword` e `searchIntent` são **metadados internos**: não viram meta
keywords nem qualquer tag no HTML. `summary` nunca é gerado automaticamente —
se não estiver no frontmatter, o bloco não aparece.

O índice do artigo é montado sozinho a partir dos H2 e H3 do MDX, com âncoras
HTML reais e nenhum JavaScript. Escreva H2 bem nomeados e ele se resolve.

**Modelo answer-first:** responda à intenção principal nos primeiros parágrafos,
antes do aprofundamento. A ordem na página é H1 → deck → resumo → índice →
resposta → desenvolvimento.

## Artigos relacionados

Aparecem sozinhos ao final do artigo, no máximo três. A seleção é
determinística (`getRelatedPosts`): mesma categoria primeiro, depois mesmo
produto. O próprio artigo nunca entra e não há sorteio.

## Categoria como hub

Além de `name` e `description`, o YAML da categoria aceita:

```yaml
headline: Organização que cabe na rotina    # título editorial do hub
intro:                                       # um ou dois parágrafos
  - Primeiro parágrafo.
subtopics:                                   # recortes que a categoria cobre
  - title: Rotina e manutenção
    text: Frase curta.
relatedProduct: casa-organizada-em-15-minutos
```

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

Automático em toda página: title, meta description, canonical absoluto, Open
Graph com `og:image:alt` próprio, Twitter Card, `sitemap-index.xml` e
`robots.txt`. JSON-LD: `Organization` + `WebSite` no site, `BreadcrumbList` nas
páginas internas, `Article` completo nos artigos (com `citation` quando há
fontes reais) e `Product` + `Offer` na LP — sem `aggregateRating`, `review` ou
`FAQPage`, que não têm dado real por trás.

Domínio canônico: `https://bookgo.com.br` (em `astro.config.mjs` e
`src/config/site.ts`).

### SEO QA

```bash
npm run qa:seo    # roda sobre dist/, também no CI
```

**Falha** em erro estrutural: página indexável sem title, description, canonical
ou H1; canonical fora do domínio; mais de um H1; imagem sem `alt`; JSON-LD
inválido; `Article` sem `datePublished`, `articleSection` ou `publisher`; fonte
com URL inválida; link interno quebrado.

**Avisa sem bloquear** sobre title longo ou description curta. Não existe limite
oficial de caracteres — tratar número redondo como requisito só gera ruído.

### Performance

```bash
npm run qa:perf   # relatório, também no CI
```

Mede CSS, JS de cliente, fontes, páginas e maiores imagens, e aponta o que
cresceu fora do padrão. Não bloqueia: orçamento rígido escolhido cedo atrapalha
mais do que ajuda. Metas de campo — LCP ≤ 2,5s, INP ≤ 200ms, CLS ≤ 0,1 — são
objetivos de engenharia, medidos em campo.

Padrão do projeto: **zero JavaScript no cliente**.

### Rascunhos

`draft: true` no frontmatter tira o artigo de tudo: sem URL gerada, sem sitemap,
sem categoria, sem `llms.txt`. Não existe página oculta.

### llms.txt

`/llms.txt` é um índice **curado** — hubs, conteúdos, produtos ativos e links
institucionais prontos, não todas as URLs. Gerado por `src/pages/llms.txt.ts`.

Camada complementar e experimental: não há relação comprovada com ranqueamento
e não deve ser tratada como se houvesse.

### Markdown alternativo

Cada artigo tem uma versão em texto puro em `<url-do-artigo>index.md`, sem
header, footer, CSS ou tracking, apontada por
`<link rel="alternate" type="text/markdown">`. Fica fora do sitemap; a versão
HTML continua sendo a principal. Implementado só para artigos — LPs ficam para
depois de validarmos o modelo.

### Search Console

Em `src/config/site.ts`, `googleSiteVerification` é `null` e nada é renderizado.
Para verificar o domínio, cole o valor do método "tag HTML" nesse campo — a meta
aparece sozinha. Nunca preencha com valor fictício.

### Analytics

Nenhum GA4, GTM ou Meta Pixel instalado nesta fase. Se for adicionar, atualize
antes a Política de Privacidade, que hoje declara ausência de cookies próprios.
