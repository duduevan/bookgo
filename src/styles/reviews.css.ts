/**
 * CSS das avaliações, como string.
 *
 * Por que não `<style>` dentro dos componentes: Astro empacota o estilo de
 * todo componente **importado**, renderizado ou não. Um produto sem
 * avaliação pagaria o CSS inteiro por uma seção que não aparece. Emitido
 * daqui dentro da guarda de renderização, o custo de um produto sem
 * avaliações é zero byte, que é a mesma solução do banner de consentimento.
 *
 * A contrapartida é abrir mão do escopo automático do Astro, então toda
 * classe leva o prefixo `rv-`. Nomes curtos e genéricos aqui colidiriam
 * com o resto do site.
 *
 * Só papéis (`--color-*`): nenhuma cor literal, nenhuma referência a
 * `--bookgo-*`. É o que deixa a peça assumir a paleta de cada produto sem
 * uma linha de CSS por produto.
 *
 * Sem crase em lugar nenhum da string: ela vive num template literal, e uma
 * crase ali a encerraria no meio.
 */
export const REVIEWS_CSS = `
/* ─── Carrossel ────────────────────────────────────────────────────
   A unidade que ele move é um celular, nunca um cartão de texto.

   Quantos cabem por vez sai de duas coisas ao mesmo tempo: a largura da
   tela e a quantidade de avaliações. O --rv-count vem do componente, e o
   min() é o que faz uma avaliação sozinha ocupar a faixa inteira em vez de
   ficar encolhida num terço, e duas dividirem a largura ao meio, sem
   nenhum caso especial no código. */

.rv-wrap{--rv-per:1;--rv-gap:var(--s-5)}
@media (min-width:48rem){.rv-wrap{--rv-per:min(2, var(--rv-count));--rv-gap:var(--s-5)}}
@media (min-width:72rem){.rv-wrap{--rv-per:min(3, var(--rv-count));--rv-gap:var(--s-6)}}

.rv-track{display:flex;gap:var(--rv-gap);align-items:stretch;
overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;
scroll-behavior:smooth;
/* A sombra dos aparelhos é cortada pelo overflow. O respiro vertical
   devolve o espaço dela em vez de deixar a borda inferior chapada. */
padding-block:.375rem .75rem}
.rv-track:focus-visible{outline:2px solid var(--color-primary);
outline-offset:4px;border-radius:var(--radius)}

.rv-track>*{flex:0 0 calc((100% - (var(--rv-per) - 1) * var(--rv-gap)) / var(--rv-per));
min-width:0;scroll-snap-align:start}

/* Sem JavaScript a barra de rolagem é a única pista de que há mais ao
   lado, então ela fica. Assim que o script assume, as setas e os pontos
   dizem o mesmo melhor, e a barra sai. */
.rv-wrap[data-rv-js] .rv-track{scrollbar-width:none;-ms-overflow-style:none}
.rv-wrap[data-rv-js] .rv-track::-webkit-scrollbar{display:none}

/* Controles: uma linha só abaixo do trilho. Fora dos aparelhos de
   propósito, porque seta sobreposta cobre justamente a conversa que a
   pessoa veio ler, e no celular fica no caminho do polegar. */
.rv-nav{display:flex;align-items:center;justify-content:center;
gap:var(--s-4);margin-top:var(--s-6)}
.rv-nav[hidden]{display:none}

.rv-arrow{width:2.75rem;height:2.75rem;flex:none;display:grid;place-items:center;
border-radius:50%;cursor:pointer;
background:var(--color-surface-raised);color:var(--color-primary-dark);
border:1px solid var(--color-border);box-shadow:var(--shadow-sm);
transition:background-color .15s ease,color .15s ease,opacity .15s ease}
.rv-arrow svg{width:1.25rem;height:1.25rem}
.rv-arrow:hover:not(:disabled){background:var(--color-primary);
color:var(--color-on-primary);border-color:transparent}
.rv-arrow:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}
/* Ponta do trilho: o botão continua no lugar, sem a linha saltar. */
.rv-arrow:disabled{opacity:.35;cursor:default}

.rv-dots{display:flex;align-items:center;gap:0;margin:0;padding:0;list-style:none}
/* O ponto continua com 8px de desenho, mas o botão tem 24x24 de área de
   toque. Antes o alvo era o próprio ponto: 8px num dedo é erro garantido,
   e fica abaixo do mínimo que o Google cobra em celular. A cor vai para o
   ::before justamente para a área crescer sem a bolinha crescer junto. */
.rv-dot{width:1.5rem;height:1.5rem;padding:0;border:0;background:none;cursor:pointer;
display:grid;place-items:center;-webkit-tap-highlight-color:transparent}
.rv-dot::before{content:'';width:.5rem;height:.5rem;border-radius:50%;
background:color-mix(in srgb, var(--color-primary) 30%, transparent);
transition:background-color .15s ease,transform .15s ease}
.rv-dot:hover::before{background:color-mix(in srgb, var(--color-primary) 55%, transparent)}
.rv-dot:focus-visible{outline:2px solid var(--color-primary);outline-offset:-2px;border-radius:50%}
.rv-dot[aria-current='true']::before{background:var(--color-primary);transform:scale(1.35)}

/* ─── O aparelho ──────────────────────────────────────────────────
   Um celular por avaliação. A moldura, a barra de status e o fundo são
   desenhados aqui: nada é identidade de aplicativo de mensagem de
   ninguém. */

.rv-phone{margin:0;display:flex;justify-content:center}
.rv-frame{width:min(100%,19.5rem);display:flex;flex-direction:column;
overflow:hidden;background:var(--color-surface);
border:1px solid var(--color-border);border-radius:2.25rem;
box-shadow:var(--shadow);padding:.4rem}

.rv-statusbar{flex:none;position:relative;height:1.75rem;display:flex;align-items:center;
justify-content:flex-end;gap:.3rem;padding-inline:var(--s-4);
background:var(--color-surface-raised);color:var(--color-muted)}
.rv-island{position:absolute;left:50%;top:.35rem;transform:translateX(-50%);
width:4.25rem;height:1.05rem;border-radius:var(--radius-pill);
background:var(--color-text);opacity:.85}
.rv-signal{display:flex;align-items:flex-end;gap:1px;height:.6rem}
.rv-signal i{width:2px;height:var(--h);border-radius:1px;background:currentColor}
.rv-battery{display:block;width:1.35rem;height:.7rem;border:1px solid currentColor;
border-radius:.2rem;padding:1px}
.rv-battery b{display:block;width:65%;height:100%;border-radius:1px;background:currentColor}

.rv-header{flex:none;display:flex;align-items:center;gap:var(--s-3);padding:var(--s-3) var(--s-4);
border-bottom:1px solid var(--color-border);background:var(--color-surface-raised)}
.rv-avatar{width:2.25rem;height:2.25rem;border-radius:50%;object-fit:cover;flex:none}
.rv-initials{display:grid;place-items:center;background:var(--color-primary-soft);
color:var(--color-primary-dark);font-size:var(--t--1);font-weight:var(--w-semibold);
letter-spacing:.02em}
.rv-who{display:flex;flex-direction:column;min-width:0;line-height:1.25}
.rv-name{font-weight:var(--w-semibold);color:var(--color-text);font-size:var(--t--1)}
.rv-status{font-size:.75rem;color:var(--color-muted)}

/* Rótulo de quem fala: invisível na tela, presente no leitor de tela. */
.rv-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
clip-path:inset(50%);white-space:nowrap;border:0}

/* A conversa.

   ALTURA, E POR QUE NÃO HÁ CORTE. A versão anterior fixava a proporção do
   aparelho e deixava o excedente para fora: uma conversa mais longa
   começava pela metade. Aqui a altura vem do conteúdo, com um piso que
   mantém cara de celular mesmo na conversa mais curta, e o align-items:
   stretch do trilho iguala todos pelo mais alto. Nenhuma mensagem é
   escondida, nenhum aparelho fica com metade da altura do vizinho, e nada
   precisa de reticências.

   O min-height NAO pode ser 0 aqui: zero autorizaria o flex a encolher a
   conversa abaixo do conteúdo, que é exatamente o corte que se quer evitar.

   O fundo é uma interpretação própria: marcas soltas de cozinha e casa
   desenhadas aqui mesmo, em opacidade muito baixa. */
.rv-thread{margin:0;padding:var(--s-4);flex:1;min-height:20rem;display:flex;
flex-direction:column;justify-content:flex-end;gap:.55rem;
background-color:color-mix(in srgb, var(--color-primary) 5%, var(--color-background));
background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Cg fill='none' stroke='%23000' stroke-opacity='.045' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 28l6 6 11-12'/%3E%3Ccircle cx='96' cy='26' r='7'/%3E%3Cpath d='M26 88h18M35 79v18'/%3E%3Cpath d='M86 84c6 0 10 4 10 10v8H76v-8c0-6 4-10 10-10z'/%3E%3C/g%3E%3C/svg%3E");
background-size:8rem 8rem}

@media (min-width:48rem){.rv-thread{min-height:26rem}}

.rv-bubble{margin:0;max-width:82%;padding:var(--s-3) var(--s-4);font-size:var(--t--1);
line-height:1.5;border-radius:1.125rem;
font-family:var(--font-sans),'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji';
/* Entra uma vez e fica. Sem laço, sem JavaScript. */
animation:rv-in .42s var(--ease,ease-out) backwards;animation-delay:var(--delay)}
.rv-in{align-self:flex-start;background:var(--color-surface-raised);
border:1px solid var(--color-border);border-bottom-left-radius:.35rem;color:var(--color-text)}
.rv-out{align-self:flex-end;background:var(--color-primary);color:var(--color-on-primary);
border-bottom-right-radius:.35rem}
.rv-text{display:block}
.rv-meta{display:flex;align-items:center;justify-content:flex-end;gap:.25rem;
margin-top:.25rem;font-size:.6875rem;opacity:.75}
.rv-ticks{width:1rem;height:.6rem;flex:none}

/* Caixa de digitar: desenho, não campo. */
.rv-composer{flex:none;display:flex;align-items:center;gap:var(--s-3);
padding:var(--s-3) var(--s-4) var(--s-4);border-top:1px solid var(--color-border);
background:var(--color-surface-raised)}
.rv-field{flex:1;height:1.875rem;border-radius:var(--radius-pill);
background:var(--color-surface);border:1px solid var(--color-border)}
.rv-send{width:1.875rem;height:1.875rem;border-radius:50%;display:grid;place-items:center;
background:var(--color-primary);color:var(--color-on-primary);flex:none}
.rv-send svg{width:1rem;height:1rem}

@keyframes rv-in{from{opacity:0;transform:translateY(.5rem)}}

/* A cascata e a rolagem suave são desta peça, então somem por inteiro
   aqui: o conteúdo aparece pronto e o trilho salta direto para o destino,
   sem etapa intermediária. */
/* Reação em emoji, pendurada na quina de baixo da bolha. Existe para as
   conversas em que a equipe reagiu e não respondeu por escrito: antes
   essas ficavam com a bolha solta, como se ninguém tivesse visto. A
   reação é real; a resposta escrita que não existiu segue sem ser
   inventada. */
.rv-bubble{position:relative}
.rv-reaction{position:absolute;inset-inline-end:var(--s-3);bottom:-.7rem;
display:inline-flex;align-items:center;padding:.1rem .4rem;border-radius:999px;
font-size:.8rem;line-height:1.3;background:var(--color-surface);
border:1px solid var(--color-border);box-shadow:0 1px 3px rgb(0 0 0 / .08);
white-space:nowrap}
.rv-bubble:has(.rv-reaction){margin-bottom:var(--s-3)}

@media (prefers-reduced-motion:reduce){
.rv-bubble{animation:none}
.rv-track{scroll-behavior:auto}
.rv-arrow,.rv-dot::before{transition:none}
.rv-dot[aria-current='true']::before{transform:none;outline:2px solid var(--color-primary);
outline-offset:2px}
}
`;
