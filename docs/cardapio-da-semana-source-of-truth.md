# Cardápio da Semana em 20 Minutos — source of truth

Referência única do produto. Vale para a LP, o material, os PDFs, o FAQ, o
checkout, os artigos do blog e os anúncios.

Regra do projeto, igual à do Casa Organizada: **se não está aqui, não se
afirma em lugar nenhum.** Quando algo mudar no produto, muda aqui primeiro e
só depois na copy.

> **Estado: em aberto.** Só os campos marcados como aprovados abaixo têm
> lastro. Todo o resto está pendente de definição sua, e por isso o YAML do
> produto está em `draft: true` com os campos marcados `[PREENCHER]`: a LP
> não é gerada, não entra no sitemap nem no `llms.txt`, e não existe copy
> provisória de venda que alguém possa publicar por engano.

---

## Aprovado

| Campo | Valor |
|---|---|
| Nome | Cardápio da Semana em 20 Minutos |
| Slug e URL | `/cardapio-da-semana-em-20-minutos/` |
| Preço | R$ 27,00 |
| Cobrança | Pagamento único |
| Checkout | Kiwify, `https://pay.kiwify.com.br/6VGDS8V` |

## Padrão do projeto, já aplicado

Estes não dependem de decisão de produto: são regras da BookGo e valem para
qualquer material.

| Campo | Valor |
|---|---|
| Garantia | 7 dias, comercial e objetiva |
| Texto da garantia | "Você terá 7 dias de garantia para conhecer o conteúdo. Se não for para você, basta pedir o reembolso dentro desse prazo." |
| Liberação do acesso | "Acesso liberado após a aprovação do pagamento" (nunca "acesso imediato") |
| Prova social | Nenhuma. Sem depoimento, sem número de alunos, sem escassez |

## Pendente de definição

Cada linha aqui corresponde a um ou mais campos `[PREENCHER]` em
`content/products/cardapio-da-semana-em-20-minutos/index.yaml`.

1. **Promessa central.** Uma frase do que o material entrega, e o que ele
   explicitamente não promete.
2. **Mecanismo.** O nome do método e os pilares que o sustentam. O "20
   minutos" do nome precisa significar algo verificável: 20 minutos de quê,
   com que frequência.
3. **Formato.** Curso em texto, e-book, planner, ou combinação. Se houver
   vídeo, dizer aqui; se não houver, dizer também.
4. **Estrutura.** Quantos módulos ou capítulos, e o título e objetivo de cada
   um.
5. **Materiais.** Quantos, quais e em que formato. Se são PDFs, dizer.
6. **Entrega.** Área de membros da Kiwify, ou outra forma.
7. **Público.** Para quem é e para quem não é.
8. **Objeções.** As perguntas reais que chegam, para o FAQ e para a seção de
   conversas.
9. **Imagens.** Hero e editoriais. Enquanto não existirem, a página se fecha
   sozinha: o hero usa a ambientação em CSS e os slots não renderizam.

## Identidade visual proposta

A LP não pode parecer uma variação da do Casa Organizada. A proposta troca a
cor principal em vez de ajustar o mesmo sálvia: entra um páprica quente, e o
verde passa a acento pontual. Mesmo sistema de componentes, outra voz.

| Papel | Valor |
|---|---|
| `primary` | `#9C4221` |
| `primaryDark` | `#6B2C14` |
| `accent` | `#3F6B52` |
| `background` | `#FDF8F3` |
| `surface` | `#FFFFFF` |
| `text` | `#2A211C` |
| `muted` | `#6E5F56` |
| `border` | `#EADFD3` |

Contrastes conferidos: texto sobre fundo 14,9:1; branco sobre `primary`
6,5:1; branco sobre `primaryDark` 10,5:1; `muted` sobre fundo 5,8:1. Todos
acima do mínimo de 4,5:1 para texto corrido.

**A paleta é uma proposta, não uma decisão.** Trocar as oito linhas no YAML
muda a LP inteira sem tocar em código.

## Como publicar quando a source of truth fechar

1. Preencher os campos `[PREENCHER]` do YAML a partir das decisões acima.
2. Apagar a linha `draft: true`.
3. `npm run build`. A página aparece em `/cardapio-da-semana-em-20-minutos/`.

Não é preciso criar arquivo em `src/pages/`, nem tocar em componente, nem
duplicar CSS. `src/pages/[product].astro` gera a LP a partir do YAML, e o
tema vira custom properties no `<body>` da página.
