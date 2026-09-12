# BookGo — guia operacional

Site estático em Astro 5. O build gera `dist/` com HTML puro, publicado por FTPS
em uma hospedagem cPanel. **Produção não executa Node, SSR nem banco de dados.**

Princípio do projeto: **conteúdo é dado, componente é apresentação**. Nenhuma copy
específica de produto vive dentro de componente.

```
content/              conteúdo editorial (YAML + MDX)
src/                  componentes, layouts, páginas, estilos
brand/                arquivos oficiais do logo (não publicado)
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
- **Originais** ficam em `brand/`, **fora de `public/`**: eles exibem a
  tagline "SEU AGENDAMENTO", que não pertence ao posicionamento atual e não
  pode ser servida nem por URL direta.
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

### Ícones

Uma grade só, em `src/lib/icons.ts`: **viewBox 24×24, traço 1.5, pontas e
junções redondas, `currentColor`**. O invólucro `<svg>` existe em um lugar
único, `src/components/ui/Icon.astro` — mudar a espessura de todos os ícones é
mudar uma linha. Nenhum ícone traz cor ou tamanho próprio: herda do contexto.

```astro
<Icon name="shield" />              <!-- acompanha o tamanho do texto -->
<Icon name="spark" size="2rem" />
```

No YAML do produto, `icon` é opcional em benefícios, materiais e garantia, e é
validado contra a lista real — nome inexistente **quebra o build**, em vez de
abrir um buraco na página.

**Onde ícone não entra:** onde número ou texto já cumprem melhor a função. Os
módulos são numerados e os passos do "como funciona" têm ordem explícita —
ali o ícone seria decoração.

Ícones decorativos ficam em `aria-hidden`. `label` só quando o ícone for a
única fonte da informação, o que hoje não acontece em lugar nenhum do site.

### Depoimentos

**Desligados, e depoimento não se inventa.** Enquanto `testimonials.enabled`
for `false` no YAML do produto, a seção não é renderizada — sem título, sem
espaço vazio e sem um byte de CSS. Ligar com `items` vazio quebra o build de
propósito.

Só entra aqui texto que uma pessoa real escreveu e autorizou a publicar. Sem
foto, o avatar usa as iniciais do nome: derivar do que existe é honesto, gerar
um rosto não seria.

Dois formatos, decididos item a item:

```yaml
testimonials:
  enabled: false
  title: O que diz quem já usou
  items:
    - type: card          # texto corrido
      name: ...
      role: ...           # opcional
      text: ...
    - type: phone         # conversa de celular
      name: ...
      status: ...         # opcional, decorativo
      messages:
        - side: incoming  # a pessoa
          text: ...
          time: "09:12"   # opcional, decorativo
        - side: outgoing  # a BookGo
          text: ...
          read: true
```

`PhoneTestimonial` é Astro + HTML + CSS, **sem JavaScript**: a entrada em
cascata é `animation-delay` calculado no build, roda uma vez e não tem laço.
`prefers-reduced-motion` desliga a cascata e o conteúdo aparece pronto. A
moldura, a barra de status e a caixa de digitar são cenário em `aria-hidden` —
nada ali é interativo, não existe input nem botão. A conversa em si é citação
(`figure` + `blockquote`), e cada bolha diz de quem é.

O CSS das três peças vive em `src/styles/testimonials.css.ts` e é emitido
dentro da guarda de renderização. Não é estilo por preferência: Astro empacota
o CSS de todo componente **importado**, renderizado ou não, e a LP pagaria
~16 KB por uma seção que não aparece. Mesma solução do banner de consentimento.

### Composição da landing page

Duas ferramentas resolvem o vício de "título à esquerda, metade da tela
vazia à direita":

- **`<Section layout="split">`** põe o cabeçalho numa coluna estreita e o
  corpo na larga ao lado. Usado em problema, método, módulos, FAQ e
  relacionados — seções de cabeçalho curto e corpo longo.
- **`<CardGrid feature>`** faz o primeiro cartão ocupar duas colunas. Resolve
  o órfão de cinco cartões numa grade de três, e a hierarquia melhora junto.

Quando um grid ficar com lacuna na última linha, ajuste `min` antes de
aceitar o buraco: `min` grande demais colapsa para uma coluna, pequeno
demais cria o órfão.

### Hero do produto

Duas colunas no desktop: copy à esquerda, quadro de imagem à direita com o
cartão de reforços sobreposto no canto. Os reforços (`hero.highlights`) são
fatos do produto, nunca prova social.

**Sem a imagem, o quadro não vira buraco** — usa gradiente da paleta do
produto e continua sendo superfície intencional. No mobile, porém, ele é
escondido: ali seria uma tela inteira de rolagem sem entregar nada. Quando o
arquivo chegar, entra sem mudar layout: a proporção já está reservada.

### De onde vêm as imagens

`content/image-sources.yaml` declara a origem de cada arquivo de imagem:
destino, proporção, largura, URL e crédito. `npm run images:fetch` baixa,
corta, converte para WebP e grava no destino — idempotente, e `--force`
refaz.

O mesmo script roda no workflow **Materializar imagens declaradas**, que
commita os arquivos no repositório. É assim que a imagem entra no projeto:
declarar a origem, rodar o workflow. Sem download manual, sem FTP imagem a
imagem.

Existe por um motivo concreto: o ambiente onde o conteúdo é editado tem
bloqueio de egress para os CDNs do Magnific e do Freepik. Lá dá para
escolher e declarar; os bytes são buscados onde a rede permite.

Trocar de imagem é trocar `url` e `credit`. Alt, legenda e posição vivem no
YAML do produto e no frontmatter do artigo — não se mexe neles para trocar
uma foto.

### Source of truth do produto

`docs/casa-organizada-source-of-truth.md` é a referência do produto: preço,
formato, módulos, materiais, entrega e garantia. Vale para LP, curso, PDFs,
FAQ, checkout, artigos e anúncios.

**Se não está lá, não se afirma em lugar nenhum.** Quando o produto mudar,
muda ali primeiro e só depois na copy.

Formulação que a auditoria corrigiu: **"acesso liberado após a aprovação do
pagamento"**, nunca "acesso imediato" — quem aprova é a plataforma, e esse
prazo não é nosso.

### Depoimentos em modo demonstração

`testimonials.demo: true` imprime o rótulo **visível** "Conversas
ilustrativas" acima das conversas. O rótulo não deve ser escondido: um aviso
que mora só no código deixa de existir exatamente quando mais importa, na
hora em que alguém publica sem lembrar. É rótulo editorial e não caixa de
alerta, porque uma tarja de aviso acima da seção derruba o que a seção tem
de bom sem identificar melhor.

Para publicar de verdade: troque os textos por mensagens reais e
autorizadas, apague `demo`, mantenha `enabled: true`. Sem `demo`, o build
exige itens.

**A conversa tem dois lados.** As mensagens da pessoa e as respostas da
BookGo (`side: outgoing`) alternam, porque um celular só com balões de um
lado não parece conversa, parece depoimento recortado. Os aparelhos têm
proporção e altura fixas: três celulares de alturas diferentes lado a lado
denunciam que são caixas de texto com moldura.

### Imagens da landing page

Mesma convenção do blog: metadados no YAML, arquivo em
`src/assets/products/<slug>/`, e **nada renderiza enquanto o arquivo não
existir** — o build lista o que falta, com proporção e função de cada uma.

```yaml
images:
  - id: sessao-curta-cozinha
    src: sessao-curta-cozinha.webp
    alt: Descrição da cena
    caption: Opcional
    placement: after-method   # after-method | after-materials | before-offer
```

### Vitrine de componentes

`npm run dev` e `/dev/componentes/` mostram todos os ícones e os dois formatos
de depoimento. A rota **só existe em desenvolvimento**: `getStaticPaths`
devolve lista vazia no build, então não há arquivo em `dist/`, nem URL, nem
entrada no sitemap. O conteúdo ali é demonstração de layout e diz isso na
própria página — não é depoimento de ninguém.

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


## Taxonomia editorial

Três dimensões, e só a primeira vira URL.

**Pilar.** O grande tema editorial. Hoje existe um: `Casa`. Mora em
`content/pillars/<slug>.yaml` e gera `/blog/<pilar>/`.

**Subcategoria.** Um recorte dentro do pilar: `Organização`, `Cozinha`. Mora
em `content/categories/<slug>.yaml`, declara `pillar:` e gera
`/blog/<pilar>/<categoria>/`. Um artigo vive em `/blog/<pilar>/<cat>/<slug>/`.

**Tipo de conteúdo.** Formato e intenção do artigo: `informacional`, `guia`,
`comparativo`, `review`. É o campo `type` no frontmatter e **não vira página,
menu nem URL**.

A separação é o ponto. Um comparativo de air fryer pertence a Casa › Cozinha,
e "comparativo" descreve o formato, não o assunto. Criar uma categoria
"Comparativos" ou "Reviews" porque existem artigos comerciais montaria uma
segunda árvore concorrendo com a primeira, e o mesmo artigo passaria a ter
dois lugares para morar. Monetização é outra dimensão ainda, e vive em
`monetization`.

**Categoria nasce de conteúdo, não de layout.** Nenhuma subcategoria é criada
para preencher grade. Limpeza, Eletrodomésticos, Lavanderia e Decoração são
recortes plausíveis de Casa para o futuro, e nada além disso enquanto não
existir artigo real.

Mudar um artigo de categoria muda a URL, então a antiga precisa de um 301 em
`public/.htaccess`. Redirecionamento direto, nunca em cadeia: a regra do
artigo vem antes da regra da categoria, senão a segunda captura o caminho do
artigo e devolve a listagem no lugar da página pedida.

## Criar uma categoria

Crie `content/categories/<slug>.yaml`:

```yaml
name: Organização
pillar: casa                       # obrigatório: define a URL
description: Frase que aparece no topo da página da categoria.
seo:
  title: Organização da casa      # opcional
  description: ...                 # opcional
order: 10                          # menor aparece primeiro
```

O nome do arquivo é o slug: a URL fica `/blog/<pilar>/<slug>/`.

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

URL resultante: `/blog/<pilar>/<categoria>/<slug>/`.

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

## Padrão editorial dos artigos

### Imagens

Artigo não é bloco contínuo de texto. Referência, não conta a fechar:
**normalmente 2 imagens em artigo médio, 3 em artigo longo** — e nenhuma que
não acrescente contexto, compreensão ou ritmo. Imagem para preencher espaço
é ruído com custo de banda.

A imagem conversa com o trecho onde aparece. Nunca como falsa prova de
resultado do produto.

Arquivos em `src/assets/blog/<categoria>/<slug>/`, com nome descritivo
(`bancada-cozinha-em-uso.webp`, não `IMG001.webp`). WebP; AVIF só quando
trouxer ganho real.

Os metadados ficam no frontmatter; o corpo do MDX carrega só a posição:

```yaml
images:
  - id: bancada-cozinha-em-uso        # referência usada no corpo
    src: bancada-cozinha-em-uso.webp  # arquivo em src/assets/blog/<cat>/<slug>/
    alt: Bancada de cozinha com louça do café da manhã sobre a superfície
    caption: Só quando acrescenta informação que o texto não dá.
    credit: Opcional.
```

```mdx
<ArticleImage id="bancada-cozinha-em-uso" />
```

`ArticleImage.astro` resolve tudo: `astro:assets` com `srcset`, `sizes`,
`width`/`height` reais, `loading="lazy"` e `decoding="async"`. **Sem
JavaScript.** Imagem principal/LCP usa `priority` — as do corpo, nunca.

`title` **não** é preenchido: repetir o alt ali não é lido por leitor de
tela, não aparece no toque e vira ruído. Só com motivo próprio.

O alt descreve a cena e a função dela naquele contexto. Sem keyword
stuffing — o schema recusa alt com 3 ou mais palavras-chave do artigo ou
mais de 25 palavras.

**Arquivo ainda inexistente não quebra nada:** o slot não renderiza e o
build lista o que falta. É assim que a arquitetura do artigo fica pronta
antes da fotografia existir, sem imagem quebrada nem caixa vazia no ar.

**Direção visual:** fotografia realista, editorial, contemporânea, humana,
luz natural. Sem texto embutido, sem cara de banco de imagens, sem estética
artificial. Em Casa e Organização: casas habitadas, objetos em uso,
organização realista — não casa perfeita de catálogo.

### CTA contextual do produto

O CTA conversa com o que a pessoa acabou de ler. Banner idêntico repetido em
todos os artigos é exatamente o que não fazemos — por isso a copy mora no
**artigo**, não no componente:

```yaml
productCta:
  placement: inline          # none | inline | end | inline-and-end
  label: Material relacionado
  headline: Quer aplicar esse raciocínio na casa inteira?
  text: Frase que liga o assunto do artigo ao produto.
  buttonLabel: Conhecer o método
```

```mdx
<ProductCtaHere />
```

O marcador diz **onde**; o resto vem do frontmatter. Referência de posição:
entre 40% e 65% do texto, depois de a pessoa já ter recebido valor — mas o
ponto certo é editorial, não aritmético. `placement` com `inline` e nenhum
marcador quebra o build, e vice-versa.

**Artigo médio:** normalmente 1 CTA inline. **Artigo longo:** inline + um de
fechamento.

**Nunca:** logo depois do H1, dentro do resumo, dentro do índice, antes de
conteúdo substancial, ou colado em anúncio ou material afiliado.

O bloco veste a paleta do próprio produto (`themeToStyle`), então quem clica
cai numa landing page com as mesmas cores. Sem contador, sem escassez, sem
animação agressiva, sem cor de alarme.

**Nunca inventar característica do produto.** A copy só afirma o que o YAML
do produto já sustenta.

### Produto afiliado no artigo

```yaml
affiliates:
  - id: philips-na130          # referência usada no corpo e na imagem
    brand: Philips Walita
    model: Airfryer Série 1000 XL NA130/00
    url: https://link-de-afiliado   # é este que vira href
    sourceUrl: https://pagina-oficial  # conferência editorial, não vira link
    cta: Ver oferta atual
```

```mdx
<AffiliateProduct id="philips-na130" />
```

A foto do produto usa o **mesmo id** no array `images`, então arquivo, alt e
crédito ficam num lugar só. Sem arquivo, o bloco renderiza apenas o CTA.

Três coisas o componente impõe, em vez de confiar na memória de quem escreve:

- **preço não entra.** Ele muda, e um número copiado para dentro do artigo
  transforma a página em mentira sozinho;
- **`rel="sponsored nofollow noopener"` é obrigatório**, não opcional;
- **a nota de transparência é automática** quando o artigo declara
  `affiliates`. Aviso que depende de alguém lembrar não é transparência.

### Para onde cada CTA leva

O destino depende da intenção da página, não do componente.

**Produto próprio (low ticket)**

- Artigo informacional leva para a **landing page**, nunca direto ao
  checkout. Quem está lendo ainda não viu preço, o que está incluso nem a
  garantia: pular a LP economiza um clique e cobra a decisão antes de a
  pessoa ter com o que decidir.
- A **landing page** leva ao checkout. É lá que a oferta está inteira.
- Quantidade e copy dos CTAs saem do conteúdo, não de um número fixo.

A ordem é **artigo → landing page → checkout**, e cada página faz a sua
parte. Os eventos acompanham: `product_click` no CTA do artigo,
`checkout_click` só nos botões de compra da LP. Contar como intenção de
compra um clique que apenas abre a página do produto misturaria dois
momentos do funil no mesmo número.

**Em que aba cada link abre**

| Origem | Destino | Aba | `rel` | Evento |
|---|---|---|---|---|
| Artigo BookGo | LP do produto | mesma | nenhum | `product_click` |
| LP do produto | checkout externo | mesma | nenhum | `checkout_click` |
| Comparativo ou review | loja, por link de afiliado | **nova** | `sponsored nofollow noopener` | `affiliate_click` |

O critério é a continuidade da decisão. Conteúdo próprio mantém a pessoa num
fluxo só, e tirar a aba de volta atrapalharia quem quer recuar. O link de
afiliado sai do site para o domínio de outro, e ali abrir nova aba preserva o
artigo que a pessoa estava lendo.

**Isso não se escreve artigo a artigo.** Aba, `rel` e evento vivem nos
componentes: `Cta` e `ProductCta` para produto próprio, `AffiliateProduct`
para afiliado. O frontmatter carrega só o dado (URL, marca, modelo). Um
`target` ou um `rel` escrito dentro de um MDX é sinal de que a regra vazou
para o lugar errado e precisa voltar para o componente.

Vale igual para o que ainda não existe: outro comparativo, review individual,
lista de melhores, novo curso, nova LP. Nenhum deles precisa redescobrir esta
tabela.

**Afiliados e comparativos**

- O CTA leva ao anunciante pelo **link de afiliado**, com
  `rel="sponsored nofollow noopener"` e evento `affiliate_click`.
- A copy fala do produto comparado. CTA do curso próprio não entra aqui sem
  contexto: um botão de outro assunto no meio de um comparativo é ruído.
- Preço, desconto e parcelamento não são copiados para o artigo. Eles mudam,
  e a página passa a mentir sozinha. O CTA diz "ver oferta atual".

### Três sistemas comerciais separados

`ProductCta`, `AffiliateProduct` e `AdSlot` são independentes e **nunca se
empilham**. Entre dois blocos comerciais tem que
haver conteúdo editorial.

Isso é código, não recomendação: `src/lib/commercial-blocks.ts` resolve a
sequência em build e remove o que ficaria colado — o anúncio cede, porque é
receita de terceiro e o CTA é o negócio da casa. O `qa:seo` confere o
resultado no HTML gerado e falha se dois `data-commercial` ficarem vizinhos.

### Metadados internos de monetização

Orientam o planejamento editorial. **Não viram tag, meta nem atributo no
HTML** — nenhum componente os recebe.

```yaml
monetization:
  productCta: medio      # forte | medio | secundario | off
  affiliate: baixo       # alto | medio | baixo | off
  adsense: alto          # alto | medio | baixo | off
```

Como referência: artigo informacional tende a CTA médio, afiliado baixo,
AdSense alto; artigo de fundo de funil, CTA forte e AdSense desligado.

---

## Publicidade

Hoje **desligada por inteiro**: `ADS.enabled = false` em `src/config/site.ts`.
Nada é renderizado, nenhum script é carregado e o site segue com 0 KB de
JavaScript no cliente.

```ts
ADS = {
  enabled: false,
  adsenseClient: 'ca-pub-6552313195053069',   // guardado; não carrega nada
  placements: {
    'article-inline': false,   // fim do corpo editorial do artigo
    'article-end': false,      // fim da página do artigo
    'product-page-end': false, // fim da LP, depois do CTA final
  },
}
```

Cada posição liga sozinha. A LP exige **duas** chaves: a posição global e o
`ads.pageEnd` do próprio produto — para decidir material a material se vale a
pena monetizar.

O publisher ID já está guardado, e isso **não liga nada**: com `enabled: false`
o ID nem chega ao HTML. Ligar o AdSense de verdade é um passo separado e
deliberado — `enabled`, o placement e, na LP, o `ads.pageEnd` do produto. Só
então o script do Google é carregado, e ainda assim apenas depois do aceite na
categoria `advertising`.

**Formatos que a BookGo não usa:** popup, modal, vignette, anchor ad, side
rail, sticky ou qualquer anúncio que cubra conteúdo. Só in-page discreto, sem
sidebar. O rótulo é `Publicidade` e nada mais — nunca "clique aqui",
"recomendado" ou "veja esta oferta".

**Onde nunca entra:** home, `/blog/`, páginas de categoria, páginas legais e
404. E, dentro do artigo, nunca antes do primeiro parágrafo — nem entre H1,
deck, resumo e índice.

Quando ligar, o `reserve` do `AdSlot` guarda a altura antes da carga, para o
anúncio não empurrar o conteúdo e gerar CLS.

Afiliados são um sistema separado (`<AffiliateProduct>`), sem relação com
este.

## Layout do artigo

Coluna única centralizada, largura confortável de leitura. **Sem sidebar, sem
índice lateral, sem coluna sticky.** A ordem é fixa:

```
H1 → deck → resumo rápido → índice → conteúdo
```

O índice é inline no fluxo, numerado e com links em azul da marca — a
afordância não depende de `:hover`, que não existe em toque. No mobile os H3
saem e sobra a espinha de H2.

## Imagem do hero do produto

```yaml
hero:
  image: hero.jpg          # arquivo em src/assets/products/<slug>/
  imageAlt: Descrição objetiva da cena
```

Com imagem, o hero vira duas colunas no desktop; sem ela, fica em coluna única
com a ambientação em CSS. A imagem passa por `astro:assets` com `srcset`,
`fetchpriority="high"` e dimensões reais — é o elemento de LCP da página.

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

Cinco documentos, um registro só: **`src/config/legal.ts`**. Nenhuma página
escreve o próprio `noindex`, e o sitemap não repete caminho nenhum.

| Página | Estado |
|---|---|
| `/termos/` | publicada |
| `/politica-de-cookies/` | publicada |
| `/contato/` | publicada |
| `/privacidade/` | **noindex** — falta prazo de retenção |
| `/termos-de-compra/` | **noindex** — faltam dados do produto |

`ready: true` é a única chave. Virá-la faz, sozinho: sair o `noindex`, entrar
no sitemap, entrar no `llms.txt` e sumir o aviso de pendência da página.
`inFooter` decide o rodapé em separado — um documento pode existir e ser
alcançável por links no texto sem ocupar uma linha da landing page.

Três travas impedem publicar documento incompleto, e todas quebram o build:

- `ready: true` com `pending` não vazio;
- `ready: true` sem `updated` (política vigente precisa dizer desde quando vale);
- página indexável contendo `[PENDING INPUT` ou `[PREENCHER]` — verificado em
  `npm run qa:seo`, sobre o HTML gerado.

Uma página incompleta continua **acessível e linkada** no rodapé: esconder
política de privacidade seria pior do que publicá-la com o aviso.

### Identificação da empresa

`src/config/company.ts` é a fonte única — razão social, CNPJ, endereço e
e-mail. Alimenta as cinco páginas e o JSON-LD `Organization`. Nenhuma dessas
strings é escrita direto numa página.

**BookGo é nome comercial, não marca registrada.** Nenhum texto deve
apresentá-la como tal. A formulação padrão vive em `OPERATED_BY`.

### O que os documentos afirmam

O texto descreve a implementação real, e o que é gerado a partir da
configuração não pode divergir dela: as tabelas de cookies saem de `TRACKING`
e `ADS`, e o catálogo dos termos de compra sai do YAML do produto. Ligar a
publicidade ou trocar o ID do Analytics muda a página no mesmo build.

Regras que valem para qualquer revisão desses textos:

- **não afirmar que o site exibe anúncios** enquanto `ADS.enabled` for false;
- **não apresentar o Search Console como cookie ou rastreamento** — é só uma
  etiqueta de verificação de propriedade do domínio;
- **não descrever opção que o banner não oferece.** Hoje a escolha é única e
  vale para as duas categorias não essenciais ao mesmo tempo; não existe
  seletor por categoria;
- **não inventar** prazo de retenção, encarregado, foro, telefone ou segundo
  e-mail;
- **não reduzir direito do consumidor.** A garantia comercial de 7 dias é
  oferecida voluntariamente e não substitui o direito de arrependimento do
  art. 49 do CDC.

### Revogar consentimento

`ConsentControl.astro`, na Política de Cookies, apaga a escolha e recarrega a
página. A LGPD exige que revogar seja tão fácil quanto consentir — sem esse
controle, a única saída seria limpar os dados do site no navegador, o que não
é uma escolha oferecida, é um obstáculo. O botão só aparece depois de existir
uma decisão a revogar.

## Regras de conteúdo (não negociáveis)

### Nunca utilizar travessão

O caractere `—` não aparece em texto do BookGo. Reescreva a frase com
pontuação natural: ponto, vírgula, dois-pontos, ponto e vírgula, parênteses
ou uma estrutura melhor. **Trocar por hífen não resolve** — a frase é que
precisa mudar.

```
"a premissa é outra — a casa é usada"     →  "a premissa é outra: a casa é usada"
"cadeira do quarto — os lugares que"      →  "Bancada, mesa da sala e cadeira do
                                              quarto são os lugares que"
```

Vale para tudo que chega ao público: títulos, parágrafos, artigos, FAQ, CTAs,
meta title e description, YAML de produto e categoria, frontmatter, páginas
legais, texto de cartão e `aria-label` ou `alt`, que o leitor de tela anuncia
igual a parágrafo.

`npm run qa:seo` **quebra o build** se um travessão aparecer no HTML, no
Markdown alternativo ou no `llms.txt` gerados. A verificação roda sobre
`dist/`, e não sobre o código: comentário de implementação e dependência de
terceiro ficam de fora, porque não chegam a leitor nenhum. Este guia e os
comentários do código também estão fora do escopo.

### O que nunca vai a uma página

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

Padrão do projeto: **zero JavaScript no cliente** — hoje com uma exceção
declarada, o runtime de medição e consentimento (~4,8 KB inline por página).
Fora isso, nenhum componente embarca JavaScript. `PhoneTestimonial`, o FAQ e o
índice do artigo são HTML e CSS puros.

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

`googleSiteVerification` em `src/config/site.ts` carrega o token real, e
`BaseLayout` é o único lugar que o lê: a meta sai uma vez por página. É apenas
verificação de propriedade do domínio — não é cookie, não coleta dado de
visitante e não deve ser descrita como rastreamento. Sitemap a enviar:
`https://bookgo.com.br/sitemap-index.xml`.

---

## Tracking e consentimento

**GA4 `G-W41286ERFZ` está ligado.** `TRACKING.enabled = true` em
`src/config/tracking.ts`. Meta Pixel e Google Ads seguem sem ID, e ainda não
existe contêiner GTM — por isso o GA4 entra por `gtag.js` direto, mas sempre
pela camada central: o snippet não é colado em página nenhuma. Preencher
`gtm.id` migra tudo para o contêiner sem tocar em uma linha de markup.

**Nada carrega antes do aceite.** Sem decisão ou com recusa, nenhuma requisição
sai para o Google. Eventos disparados antes da escolha ficam numa fila em
memória e só são enviados se a pessoa aceitar `analytics`.

**O custo, declarado:** o site deixou de ser 0 KB de JavaScript no cliente.
São ~4,8 KB inline por página (runtime + banner), medidos e reportados
separadamente por `npm run qa:perf`. Voltar `TRACKING.enabled` para `false`
devolve a página a 0 KB.

Todos os IDs vivem num arquivo só: `src/config/tracking.ts` — GTM, GA4, Meta
Pixel e Google Ads. Com ID `null`, aquele fornecedor não renderiza nada.

Eventos da BookGo, independentes de fornecedor: `page_view`, `view_content`,
`product_view`, `checkout_click`, `consent_update` (e `affiliate_click`
reservado). Entram no `dataLayer`, que é o formato do GTM. Enquanto o GA4 for
direto, uma ponte também os repassa como `gtag('event', ...)` — menos
`page_view`, que o `config` do GA4 já envia e contaria em dobro.

**`Purchase` nunca sai do site.** Clique no checkout é intenção, não compra —
quem conhece a transação é a Kiwify.

O banner de consentimento só existe quando há algo a consentir. Com o GA4
ligado, ele passou a existir. Desligar o tracking o faz desaparecer sozinho,
junto com o JavaScript — pedir consentimento para nada seria ruído.

Como configurar cada fornecedor, como integrar a Kiwify e como evitar contar a
mesma conversão duas vezes: **[docs/tracking.md](docs/tracking.md)**.

A Política de Cookies documenta os cookies do GA4 e está publicada. A
Política de Privacidade descreve tudo corretamente, mas segue em `noindex`
por um item só: **o prazo de retenção** (Analytics › Admin › Retenção de
dados, e por quanto tempo a hospedagem guarda os registros de acesso).
