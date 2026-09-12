/**
 * CSS das avaliações, como string.
 *
 * Por que não `<style>` dentro dos componentes: Astro empacota o estilo de
 * todo componente **importado**, renderizado ou não. Um produto sem
 * avaliação pagaria ~18 KB de CSS por uma seção que não aparece. Emitido
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
 */
export const REVIEWS_CSS = `
/* Rótulo editorial, não alerta: identifica conteúdo de exemplo sem uma
   caixa de aviso tomando o lugar da seção. */
.rv-ilustrativa{margin:0 0 var(--s-6);font-size:var(--t--1);
letter-spacing:var(--tr-eyebrow);text-transform:uppercase;
font-weight:var(--w-semibold);color:var(--color-muted)}

/* ─── Layouts por quantidade ───────────────────────────────────────
   Nenhum deles conhece um número máximo. Um, dois, e daí em diante o
   trilho, que serve a três como a quinze. */

.rv-solo{max-width:42rem;margin-inline:auto}
.rv-pair{display:grid;gap:var(--s-5);align-items:stretch;
grid-template-columns:repeat(auto-fit,minmax(min(20rem,100%),1fr))}
/* Conversas são estreitas por natureza: não esticam para preencher. */
.rv-pair.rv-conversas{justify-content:center;
grid-template-columns:repeat(auto-fit,minmax(min(18rem,100%),22rem))}

/* ─── Carrossel ────────────────────────────────────────────────────
   Rolagem nativa com scroll-snap. Sem biblioteca, sem framework: o
   arraste no celular e o trackpad no desktop já são do navegador, e o
   JavaScript só acrescenta setas, pontos e estado. Sem ele, a seção
   continua navegável. */

.rv-wrap{--rv-per:1;--rv-gap:var(--s-5)}
@media (min-width:48rem){.rv-wrap{--rv-per:2;--rv-gap:var(--s-5)}}
@media (min-width:72rem){.rv-wrap{--rv-per:3;--rv-gap:var(--s-6)}}

.rv-track{display:flex;gap:var(--rv-gap);align-items:stretch;
overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;
scroll-behavior:smooth;
/* A sombra dos cartões é cortada pelo overflow. O respiro vertical
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

/* Controles: uma linha só abaixo do trilho. Fora dos cartões de
   propósito, porque seta sobreposta cobre justamente o texto que a
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

.rv-dots{display:flex;align-items:center;gap:.4rem;margin:0;padding:0;list-style:none}
.rv-dot{width:.5rem;height:.5rem;padding:0;border:0;border-radius:50%;cursor:pointer;
background:color-mix(in srgb, var(--color-primary) 30%, transparent);
transition:background-color .15s ease,transform .15s ease}
.rv-dot:hover{background:color-mix(in srgb, var(--color-primary) 55%, transparent)}
.rv-dot:focus-visible{outline:2px solid var(--color-primary);outline-offset:3px}
.rv-dot[aria-current='true']{background:var(--color-primary);transform:scale(1.35)}

/* ─── Comum às duas formas ─────────────────────────────────────── */
.rv-avatar{width:2.5rem;height:2.5rem;border-radius:50%;object-fit:cover;flex:none}
.rv-initials{display:grid;place-items:center;background:var(--color-primary-soft);
color:var(--color-primary-dark);font-size:var(--t--1);font-weight:var(--w-semibold);
letter-spacing:.02em}
.rv-who{display:flex;flex-direction:column;min-width:0}
.rv-name{font-weight:var(--w-semibold);color:var(--color-text);font-size:var(--t--1)}
.rv-role,.rv-date{color:var(--color-muted);font-size:var(--t--1)}

/* Rótulo de quem fala: invisível na tela, presente no leitor de tela. */
.rv-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
clip-path:inset(50%);white-space:nowrap;border:0}

/* ─── Cartão ───────────────────────────────────────────────────── */
/* Sem height:100% de propósito. Altura explícita num item de flex ou de
   grid cancela o stretch do contêiner, e era isso que deixava um cartão
   curto ao lado de um longo no mesmo trilho. Sem ela, o stretch padrão
   iguala a altura da linha e o texto continua inteiro em todos.
   (E sem crase neste comentário: a string inteira vive num template
   literal, e uma crase aqui a encerraria no meio.) */
.rv-card{margin:0;background:var(--color-surface-raised);
border:1px solid var(--color-border);border-radius:var(--radius-lg);
padding:var(--s-6);display:flex;flex-direction:column;gap:var(--s-5);
min-height:13rem;box-shadow:var(--shadow-sm)}
/* Aspas de abertura como marca d'água, no lugar de um ícone importado.
   Diz "citação" antes da primeira palavra e não ocupa linha própria. */
.rv-card::before{content:'\\201C';display:block;font-size:2.75rem;line-height:.6;
height:1.1rem;color:color-mix(in srgb, var(--color-primary) 32%, transparent)}
/* O texto é o conteúdo: nada de recorte por altura, nada de reticências
   para igualar cartão. Mensagem cortada é mensagem escondida. */
.rv-quote{margin:0;color:var(--color-text);font-size:var(--t-0);line-height:1.65;
white-space:pre-line;
font-family:var(--font-sans),'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji'}
.rv-cap{display:flex;align-items:center;gap:var(--s-3);margin-top:auto}

/* Estrelas: discretas, e só quando existe nota real no dado. */
.rv-stars{display:flex;gap:.15rem;color:var(--color-accent)}
.rv-stars svg{width:.95rem;height:.95rem}
.rv-star-off{opacity:.25}

/* ─── Conversa ─────────────────────────────────────────────────── */
.rv-phone{margin:0;display:flex;justify-content:center}
/* Proporção de smartphone de verdade. A altura vem da proporção, não do
   conteúdo: celulares de alturas diferentes lado a lado denunciam que
   são caixas de texto com moldura, não aparelhos. */
.rv-frame{width:min(100%,19.5rem);aspect-ratio:9/19.5;display:flex;
flex-direction:column;overflow:hidden;background:var(--color-surface);
border:1px solid var(--color-border);border-radius:2.25rem;
box-shadow:var(--shadow);padding:.4rem}

/* Tela muito estreita: a proporção fixa deixa de mandar.
   Abaixo de 24rem o texto quebra em mais linhas do que a altura de um
   aparelho comporta, e o resultado era mensagem cortada no topo. Ali os
   celulares já aparecem um por vez, então altura própria não denuncia
   nada: o que denunciaria é a conversa começar pela metade. */
@media (max-width:24rem){
.rv-frame{aspect-ratio:auto}
.rv-thread{overflow:visible}
}

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
.rv-header .rv-avatar{width:2.25rem;height:2.25rem}
.rv-header .rv-who{line-height:1.25}
.rv-status{font-size:.75rem;color:var(--color-muted)}

/* O fundo é uma interpretação própria: marcas soltas de cozinha e casa
   desenhadas aqui mesmo, em opacidade muito baixa. Lembra o ambiente de um
   mensageiro sem copiar asset de ninguém. */
.rv-thread{margin:0;padding:var(--s-4);flex:1;min-height:0;display:flex;
flex-direction:column;justify-content:flex-end;gap:.55rem;overflow:hidden;
background-color:color-mix(in srgb, var(--color-primary) 5%, var(--color-background));
background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Cg fill='none' stroke='%23000' stroke-opacity='.045' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 28l6 6 11-12'/%3E%3Ccircle cx='96' cy='26' r='7'/%3E%3Cpath d='M26 88h18M35 79v18'/%3E%3Cpath d='M86 84c6 0 10 4 10 10v8H76v-8c0-6 4-10 10-10z'/%3E%3C/g%3E%3C/svg%3E");
background-size:8rem 8rem}

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
@media (prefers-reduced-motion:reduce){
.rv-bubble{animation:none}
.rv-track{scroll-behavior:auto}
.rv-arrow,.rv-dot{transition:none}
.rv-dot[aria-current='true']{transform:none;outline:2px solid var(--color-primary);
outline-offset:2px}
}
`;
