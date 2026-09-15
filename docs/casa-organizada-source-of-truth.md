# Casa Organizada em 15 Minutos por Dia — source of truth

Referência única do produto na **V1**. Vale para a LP, o curso, os PDFs, o
FAQ, o checkout, os artigos do blog e os anúncios.

Regra: **se não está aqui, não se afirma em lugar nenhum.** Quando algo mudar
no produto, muda aqui primeiro — e só depois na copy.

---

## Identificação

| Campo | Valor |
|---|---|
| Nome | Casa Organizada em 15 Minutos por Dia |
| Preço | R$ 37,00 |
| Cobrança | Pagamento único |
| Mecanismo | Método dos 15 Minutos |
| Formato da V1 | Curso digital predominantemente textual |
| Vídeos | **Não fazem parte da V1** |
| Checkout | Kiwify, `https://pay.kiwify.com.br/UJyyPuL` |
| Entrega | Área de membros da Kiwify |
| Liberação | Após a aprovação do pagamento |
| Garantia | 7 dias |

## Promessa

Usar pequenos ciclos de 15 minutos para criar uma rotina de organização
possível de manter.

**Não prometer:** "organizar toda a casa em 15 minutos". A promessa é sobre a
rotina se sustentar, não sobre a casa ficar pronta numa sessão.

## Estrutura — 5 módulos

1. Pare de tentar organizar tudo
2. O Método dos 15 Minutos
3. Organizando ambiente por ambiente
4. Sua rotina semanal
5. Como evitar que a bagunça volte

## Materiais complementares — 4, em PDF

1. Checklist Diário de 15 Minutos
2. Planner Semanal da Casa
3. Plano Casa Organizada em 7 Dias
4. Checklist por Ambiente

---

## Não inventar

Nada disto existe na V1, e nenhuma copy pode sugerir que existe:

- número de páginas
- duração total
- quantidade de aulas
- certificado
- comunidade
- suporte individual
- acesso vitalício
- bônus além dos quatro materiais acima
- número de clientes
- resultados de alunos

Somam-se a isso as regras de conteúdo do `CLAUDE.md`, que valem para todo o
site: nada de depoimentos ou avaliações inventados, escassez artificial,
contador regressivo ou promessa de resultado garantido.

## Formulações que a copy deve usar

| Onde | Formulação correta |
|---|---|
| Liberação do acesso | "Acesso liberado após a aprovação do pagamento." |
| Entrega | "Área de membros da Kiwify." |
| Formato do curso | "Curso digital em texto." / "5 módulos em texto direto." |
| Formato dos materiais | "4 materiais práticos em PDF." |
| Garantia | "Você terá 7 dias de garantia para conhecer o conteúdo." |
| Preço | "R$ 37,00 · pagamento único" |

Evitar **"acesso imediato"**: quem aprova o pagamento é a plataforma, e o
prazo dessa aprovação não é nosso. "Após a aprovação" é verdadeiro em
qualquer cenário; "imediato" não.

---

## Onde cada dado vive no código

A copy da LP **não** é escrita à mão: sai de
`content/products/casa-organizada-em-15-minutos/index.yaml`. Para alterar
preço, checkout, módulos ou materiais, edite o YAML. O schema em
`src/content.config.ts` recusa campo faltando ou com tipo errado.

Pontos ainda em aberto, fora do escopo deste documento:

- **Mockups dos quatro PDFs.** A seção de materiais já aceita
  `mockup:` por item; os arquivos só devem ser produzidos a partir dos PDFs
  reais, nunca de páginas inventadas.
