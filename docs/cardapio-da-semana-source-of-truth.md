# Cardápio da Semana em 20 Minutos — source of truth

Referência única do produto. Vale para a LP, o material, os PDFs, o FAQ, o
checkout, os artigos do blog e os anúncios.

Regra do projeto, igual à do Casa Organizada: **se não está aqui, não se
afirma em lugar nenhum.** Quando algo mudar no produto, muda aqui primeiro e
só depois na copy.

> **Estado: rascunho de copy, aguardando o pacote de conteúdo.**
> O YAML do produto já está escrito a partir do briefing comercial e valida
> no build, mas segue em `draft: true`: não gera página, não entra no
> sitemap nem no `llms.txt`. **O pacote de conteúdo do produto (os módulos e
> os materiais escritos) não chegou**, então nada foi conferido contra ele.

---

## Aprovado

| Campo | Valor |
|---|---|
| Nome | Cardápio da Semana em 20 Minutos |
| Slug e URL | `/cardapio-da-semana-em-20-minutos/` |
| Preço | R$ 27,00 |
| Cobrança | Pagamento único |
| Checkout | Kiwify, `https://pay.kiwify.com.br/6VGDS8V` |
| Entrega | Área de membros da Kiwify |
| Liberação | Após a aprovação do pagamento |

## Posicionamento

O produto **não** vende receita, dieta, alimentação saudável nem culinária.
Vende **tirar a decisão do jantar do fim do dia** e resolvê-la uma vez por
semana.

**Os 20 minutos são de planejamento.** Nenhuma linha de copy pode sugerir
que as refeições são preparadas em 20 minutos. A LP repete isso em três
lugares: na subheadline, na nota do método e no FAQ.

O jantar é a porta de entrada da promessa. O almoço aparece como sobra
planejada e uso opcional do planner, nunca como "sete dias de almoço e
jantar planejados em 20 minutos".

**Público:** quem decide as refeições da casa. A comunicação fala de rotina
familiar sem excluir quem mora sozinho, casais e quem não tem filhos.

## Estrutura — 5 módulos

Os títulos são definitivos e não mudam sem decisão de produto.

1. Pare de decidir o jantar todos os dias
2. O Método dos 20 Minutos
3. Monte seu cardápio sem complicar
4. Do cardápio para a lista de compras
5. Faça funcionar na vida real

## Materiais — 5 PDFs

1. Planner de Cardápio Semanal
2. Lista de Compras Inteligente
3. Inventário Rápido de Geladeira, Freezer e Despensa
4. Banco de Refeições da Casa
5. Plano de 7 Dias para Começar

## O Método dos 20 Minutos

| Bloco | Tempo | O que acontece |
|---|---|---|
| Olhar | 0 a 5 min | Ver o que já existe na geladeira, no freezer e na despensa |
| Decidir | 5 a 12 min | Ver a agenda, marcar os dias corridos e escolher as refeições |
| Listar | 12 a 20 min | Transformar o cardápio na lista do que está faltando |

## Conceitos do método

- **Refeição base:** uma refeição que a casa já conhece, gosta e sabe preparar.
- **Dia corrido:** dia conhecido de antemão em que cozinhar é pouco provável.
- **Refeição de segurança:** algo disponível para quando a semana muda.
- **Repetição planejada:** repetir de propósito porque funciona, e não por falta de ideia.
- **Inventário rápido:** olhar o que já existe antes de montar a compra.

## O que a copy nunca afirma

- economia garantida ou redução percentual de desperdício;
- emagrecimento, dieta ou alimentação saudável;
- acabar com o delivery;
- preparar todas as refeições em 20 minutos;
- resultado de cliente. Os personagens e os "Exemplos de rotina" dos
  módulos são **didáticos** e não viram depoimento.

## Padrão interno de entrega

Registro do que a Kiwify precisa entregar, para a página e a área de membros
dizerem a mesma coisa. **Nada aqui altera a configuração da plataforma**: é a
referência contra a qual ela é conferida.

| Item | Padrão |
|---|---|
| Formato | Curso digital em texto, cinco módulos, mais cinco materiais em PDF |
| Onde | Área de membros da Kiwify |
| Liberação | Após a aprovação do pagamento, nunca "acesso imediato" |
| Prazo de acesso | Vitalício, sem renovação e sem mensalidade |
| Materiais | PDF para ler no celular, no tablet, no computador ou impresso |
| Preenchimento | Impresso ou em aplicativo de anotação do próprio aparelho. **Não afirmar PDF preenchível digitalmente** enquanto o arquivo final não tiver campos de formulário |
| Suporte | E-mail institucional da BookGo, o mesmo de `src/config/company.ts` |
| Garantia | Pendente. Ver abaixo |

## Avaliações

Só entra avaliação real, com autorização e **texto literal de quem escreveu**.
Hoje há uma publicada, da Patrícia Lima, no formato de conversa do componente
global.

Quatro outras clientes enviaram mensagens e estão fora da página: as falas
recebidas tratam de receitas e de preparo rápido, e publicá-las faria a LP
afirmar o que o produto não entrega. Elas voltam a ser consideradas quando
existir texto revisado e autorizado por cada uma. Enquanto isso, nada de
versão reescrita em nome delas.

## Pendências

1. **A garantia.** Está **omitida** do YAML de propósito, e o schema aceita
   produto sem ela. Garantia é condição configurada na Kiwify, não decisão de
   copy: afirmar um prazo sem ele estar ligado lá seria prometer em nome de
   terceiro. Confirmada a configuração, acrescentar o bloco `guarantee` e a
   reasseguração correspondente.
2. **Os mockups dos materiais.** `mockup:` fica fora enquanto os PDFs finais
   não existirem. Não se inventa tela de material.
3. **Cross-sell com o Casa Organizada.** Previsto, não implementado, e fora
   das LPs por decisão: produto não entra na landing page de outro produto
   sem uma decisão específica.

## Publicado

A LP está no ar em `/cardapio-da-semana-em-20-minutos/`, indexável, no sitemap
e no `llms.txt`. Alterar preço, checkout, copy ou paleta é editar
`content/products/cardapio-da-semana-em-20-minutos/index.yaml` e rodar
`npm run build`. Não é preciso criar arquivo em `src/pages/`, nem tocar em
componente, nem duplicar CSS.
