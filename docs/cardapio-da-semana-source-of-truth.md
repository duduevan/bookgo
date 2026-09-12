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

## Pendências

1. **O pacote de conteúdo.** Sem ele, os `objective` dos cinco módulos, as
   descrições dos cinco materiais e as respostas do FAQ são derivadas do
   briefing, não do texto real. Estão marcadas `# CONFERIR:` no YAML. O
   risco concreto é afirmar na página um recurso que o módulo não tem.
2. **A garantia.** Está **omitida** do YAML de propósito, e o schema passou
   a aceitar produto sem ela. Garantia é condição configurada na Kiwify, não
   decisão de copy: afirmar um prazo sem ele estar ligado lá seria prometer
   em nome de terceiro. Confirmada a configuração, acrescentar o bloco
   `guarantee` e a reasseguração correspondente.
3. **A paleta.** Páprica com acento âmbar, proposta e não decidida. Verde
   ficou fora como cor principal de propósito: puxaria para alimentação
   saudável, que é o que este produto não vende.
4. **As imagens.** Nenhuma declarada. Sem o arquivo, o hero usa a
   ambientação em CSS e os slots não renderizam. Direção visual: cozinha
   real, rotina, agenda, lista, mercado, comida comum. Sem estética fitness,
   sem prato gourmet, sem cozinha de catálogo.
5. **Cross-sell com o Casa Organizada.** Previsto, não implementado.

## Como publicar quando fechar

1. Conferir os pontos `# CONFERIR:` do YAML contra o pacote de conteúdo.
2. Resolver as pendências acima.
3. Apagar a linha `draft: true`.
4. `npm run build`. A página aparece em `/cardapio-da-semana-em-20-minutos/`.

Não é preciso criar arquivo em `src/pages/`, nem tocar em componente, nem
duplicar CSS.
