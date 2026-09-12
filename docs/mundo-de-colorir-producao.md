# Mundo de Colorir, arquitetura e produção

Como o material é montado e como a arte é feita. Documento interno: nada aqui
é texto público.

Base: `docs/mundo-de-colorir-source-of-truth.md`.
Lista das 80 páginas: `docs/mundo-de-colorir-paginas.md`.

---

## 1. Arquitetura do PDF

Duas decisões guiam tudo: **uma arte por página** e **página de colorir nunca
divide folha com outra coisa**. Quem imprime só o desenho 34 tem que receber o
desenho 34 inteiro e nada além dele.

### Estrutura proposta

| Ordem | Página | Quantidade | Obrigatória? |
|---|---|---|---|
| 1 | Capa | 1 | Sim |
| 2 | Este livro pertence a | 1 | Sim |
| 3 | Como usar este material | 1 | Sim |
| 4 | Índice dos 8 temas | 1 | Sim |
| 5 | Divisória do tema | 8, uma por tema | Recomendada |
| 6 | Páginas para colorir | 80, dez por tema | Sim |
| 7 | Página final | 1 | Recomendada |

Total: 92 páginas com as divisórias e a página final, 83 sem elas.

### O que cada página faz

**Capa.** O nome do material, a assinatura BookGo e uma ilustração que reúne
elementos de vários temas. É a única página pensada para ser vista em tela
(miniatura do checkout, mockup da LP, capa na área de membros) e não para ser
impressa. Pode ter cor.

**Este livro pertence a.** Uma linha para o nome, um quadro para a criança se
desenhar e um espaço para a data. É a primeira coisa que a criança faz, e é ela
que transforma o arquivo em "o meu livro".

**Como usar.** Meia dúzia de linhas para o adulto: imprima em A4, papel comum
serve, papel um pouco mais grosso segura melhor a canetinha, imprima quantas
vezes quiser, use o índice para achar o tema. Sem instrução óbvia demais e sem
tom de manual.

**Índice.** Os 8 temas com o intervalo de páginas de cada um. É o que faz a
pessoa achar "aquele dos dinossauros" em dois segundos.

**Divisórias.** Uma por tema, com o nome do tema em letra grande e contorno
vazado (a criança colore o próprio título) mais dois ou três elementos do tema
ao redor. Elas fazem o material parecer coleção e dão respiro entre blocos.
Custam 8 páginas e valem: sem elas, os 80 desenhos viram uma pilha.

**Página final.** Um "parabéns, você coloriu o mundo inteiro" curto, com espaço
para a criança marcar o que mais gostou. Fecha o material em vez de ele acabar
no desenho 80.

### Numeração

As 80 páginas para colorir são numeradas de **01 a 80**, em sequência contínua
ao longo dos temas. É essa numeração que a LP, o índice e o nome dos arquivos
usam. A numeração física do PDF é outra coisa e não é citada em texto nenhum.

Nome de arquivo da arte, para produção:

```
mdc-01-animais-gatinho-novelo.png
mdc-34-espaco-lua-sorridente.png
```

Prefixo do produto, número de dois dígitos, tema e apelido curto. Ordena
sozinho, diz o que é sem abrir e sobrevive a uma troca de máquina.

### Formato técnico

| Item | Especificação |
|---|---|
| Página | A4 retrato, 210 × 297 mm |
| Margem de segurança | 12 mm em todos os lados, nada de arte encostando na borda |
| Resolução da arte | 300 dpi na caixa útil |
| Cor | Preto puro sobre branco puro. Sem cinza, sem meio-tom, sem trama |
| Espessura do contorno | Uniforme na coleção. Referência: 4 a 6 px numa arte de 2480 px de largura |
| Sangria | Nenhuma. O material é impresso em casa, e impressora doméstica não sangra |
| Peso do arquivo | Alvo abaixo de 40 MB no PDF final, para caber em qualquer download |

### Extras opcionais [APROVAR]

Três propostas, nenhuma implementada, todas fora da conta das 80:

1. **Desenhe seu personagem.** Uma página com moldura vazia e uma frase curta.
   Custo: 1 página. Ganho: valor percebido e uma atividade a mais.
2. **Complete o desenho.** Duas ou três páginas com metade da arte pronta e a
   outra metade em pontilhado leve. Custo: arte nova e uma decisão de estilo
   (pontilhado é o único cinza que entraria na coleção).
3. **Minhas cores favoritas.** Uma página com 12 círculos vazios para a criança
   pintar de cada cor que tem em casa. Custo: 1 página, produção trivial.

Recomendação: **1 e 3 entram, 2 fica para o volume 2.** As duas primeiras não
exigem arte nova relevante e fecham o material com cara de mais completo; a
segunda quebra a regra do preto puro e merece decisão própria.

---

## 2. Direção de ilustração

O que faz as 80 páginas parecerem uma coleção, e não 80 encomendas diferentes.

### Regras do traço

- **contorno preto uniforme**, mesma espessura em toda a coleção, com leve
  variação só onde separa planos (a linha que separa o bicho do fundo pode ser
  um ponto mais grossa que a linha interna do bicho);
- **sem preenchimento preto.** Olho, pupila e narina são as únicas exceções, e
  ainda assim pequenos;
- **sem sombra, sem hachura, sem textura, sem cinza**;
- **cantos arredondados** e formas cheias. Nada de ponta, bico, garra afiada ou
  ângulo agressivo, inclusive nos dinossauros;
- **área mínima de pintura:** nenhuma região fechada menor que uma moeda de um
  real no tamanho impresso. É o limite da mão de uma criança de 5 anos;
- **rosto expressivo e simples:** olhos grandes, boca simples, sobrancelha
  opcional. Nenhum detalhe de cílio, dente ou ruga;
- **composição centralizada**, figura inteira dentro do quadro, com margem;
- **chão sugerido**, nunca cenário completo: uma linha de grama, três pedrinhas,
  duas nuvens. O fundo é branco e continua branco.

### Níveis de complexidade

| Nível | O que é | Quantos elementos | Para quem |
|---|---|---|---|
| Simples | Uma figura, chão sugerido | 1 principal, até 2 de apoio | 4 e 5 anos |
| Médio | Figura em situação | 1 principal, 3 a 5 de apoio | 5 a 7 anos |
| Moderado | Cena com dois planos | 2 principais, 5 a 8 de apoio | 7 e 8 anos |

Distribuição por tema: **4 simples, 4 médias, 2 moderadas.** Todo tema abre
fácil e termina cheio, então toda criança encontra páginas do tamanho dela em
qualquer tema que escolher.

Contagem da coleção: 32 simples, 32 médias, 16 moderadas.

### O que nunca entra na arte

Texto, logotipo, marca, personagem conhecido, moldura decorativa cheia, padrão
de fundo, confete, hachura, cinza, arma, dente afiado em destaque, figura
cortada pela borda, detalhe menor que a regra da área mínima.

---

## 3. Prompt base

Os prompts estão em inglês porque é onde os geradores de imagem têm o
vocabulário mais estável para linha limpa e livro de colorir. O texto público
do produto é todo em português, e isso não muda.

**O prompt de cada página é montado assim:**

```
<CENA>, <ESTILO>
```

A cena vem da lista das 80 páginas, uma por página. O estilo é o bloco abaixo,
**idêntico nas 80**. É essa repetição literal que dá consistência à coleção.

### Bloco de estilo (copiar sem alterar)

```
black and white coloring book page for young children, clean bold black
outlines of uniform weight, no color, no shading, no grayscale, no hatching,
no texture, pure white background, friendly rounded cartoon style, large
simple expressive eyes, wide open areas easy to color, single main subject
centered in frame, full figure inside the canvas with generous margin, minimal
ground line, no text, no letters, no logo, no watermark, no border frame,
printable A4 portrait, high contrast line art
```

### Bloco negativo (copiar sem alterar)

```
color, colored, shading, gradient, gray fill, crosshatching, sketchy lines,
rough pencil, busy background, pattern background, confetti, decorative frame,
text, letters, numbers, signature, watermark, photorealistic, 3d render,
realistic texture, scary, sharp teeth, weapon, cropped subject, tiny details,
copyrighted character, franchise character, brand logo
```

### Dois exemplos montados

Desenho 01:

```
a chubby sitting kitten playing with a round ball of yarn, tail curled,
one paw raised, black and white coloring book page for young children, clean
bold black outlines of uniform weight, no color, no shading, no grayscale, no
hatching, no texture, pure white background, friendly rounded cartoon style,
large simple expressive eyes, wide open areas easy to color, single main
subject centered in frame, full figure inside the canvas with generous margin,
minimal ground line, no text, no letters, no logo, no watermark, no border
frame, printable A4 portrait, high contrast line art
```

Desenho 31:

```
a smiling rocket lifting off with three rounded smoke puffs below and two
small stars beside it, black and white coloring book page for young children,
clean bold black outlines of uniform weight, no color, no shading, no
grayscale, no hatching, no texture, pure white background, friendly rounded
cartoon style, large simple expressive eyes, wide open areas easy to color,
single main subject centered in frame, full figure inside the canvas with
generous margin, minimal ground line, no text, no letters, no logo, no
watermark, no border frame, printable A4 portrait, high contrast line art
```

### Ajuste por complexidade

Acrescente ao fim da cena, antes do bloco de estilo:

| Nível | Trecho |
|---|---|
| Simples | `very simple composition, only one subject and a minimal ground line` |
| Média | `simple composition with three or four small supporting elements` |
| Moderada | `slightly fuller scene with two subjects and a simple background layer` |

### Conferência página a página

Nenhuma arte entra no PDF sem passar por esta lista:

1. imprime em A4 comum e continua legível?
2. tem alguma região fechada menor que a área mínima?
3. sobrou cinza, trama ou preenchimento preto em algum lugar?
4. o contorno tem a mesma espessura das outras páginas?
5. a figura está inteira, com margem, sem encostar na borda?
6. tem texto, marca, logo ou assinatura em algum canto?
7. lembra algum personagem conhecido? Se a resposta for "um pouco", refaz.
8. é bonito em preto e branco, antes de ser pintado?

O item 7 é o que mais reprova página, e é o mais importante de todos.
