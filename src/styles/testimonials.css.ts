/**
 * CSS dos depoimentos, como string.
 *
 * Por que não `<style>` dentro dos componentes: Astro empacota o estilo de
 * todo componente **importado**, renderizado ou não. Com a seção desligada,
 * a LP pagaria ~16 KB de CSS por uma peça que não aparece. Emitido daqui
 * dentro da guarda de renderização, o custo com `enabled: false` é zero
 * byte — mesma solução já adotada pelo banner de consentimento.
 *
 * A contrapartida é abrir mão do escopo automático do Astro, então toda
 * classe leva o prefixo `tst-`. Nomes curtos e genéricos aqui colidiriam
 * com o resto do site.
 *
 * Só papéis (`--color-*`): nenhuma cor literal, nenhuma referência a
 * `--bookgo-*`. É o que deixa a peça assumir a paleta de cada produto.
 */
export const TESTIMONIALS_CSS = `
/* Tarja de demonstração. Tracejada e em tom de aviso: precisa ser
   inconfundível na página, não discreta. */
/* Rótulo editorial, não alerta: identifica as conversas como ilustrativas
   sem uma caixa tomando o lugar da seção. */
.tst-ilustrativa{margin:0 0 var(--s-6);font-size:var(--t--1);
letter-spacing:var(--tr-eyebrow);text-transform:uppercase;
font-weight:var(--w-semibold);color:var(--color-muted)}

.tst-items{display:grid;gap:var(--s-5);align-items:start;
grid-template-columns:repeat(auto-fit,minmax(min(19rem,100%),1fr))}
/* Conversas se alinham pelo topo e esticam juntas: celular de altura
   variável, encolhendo porque a conversa é curta, não parece celular. */
.tst-phones{align-items:stretch}

/* Celulares são estreitos por natureza: centralizados, sem esticar. */
.tst-phones{gap:var(--s-6);justify-content:center;
grid-template-columns:repeat(auto-fit,minmax(min(18rem,100%),22rem))}

/* --- comum às duas formas --- */
.tst-avatar{width:2.5rem;height:2.5rem;border-radius:50%;object-fit:cover;flex:none}
.tst-initials{display:grid;place-items:center;background:var(--color-primary-soft);
color:var(--color-primary-dark);font-size:var(--t--1);font-weight:var(--w-semibold);
letter-spacing:.02em}
.tst-who{display:flex;flex-direction:column;min-width:0}
.tst-name{font-weight:var(--w-semibold);color:var(--color-text);font-size:var(--t--1)}
.tst-role{color:var(--color-muted);font-size:var(--t--1)}

/* Rótulo de quem fala: invisível na tela, presente no leitor de tela. */
.tst-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
clip-path:inset(50%);white-space:nowrap;border:0}

/* --- cartão --- */
.tst-card{margin:0;background:var(--color-surface-raised);
border:1px solid var(--color-border);border-radius:var(--radius-lg);
padding:var(--s-6);display:flex;flex-direction:column;gap:var(--s-5);height:100%}
.tst-quote{margin:0;color:var(--color-text);font-size:var(--t-0);line-height:1.6}
.tst-cap{display:flex;align-items:center;gap:var(--s-3);margin-top:auto}

/* --- conversa --- */
.tst-phone{margin:0;display:flex;justify-content:center}
/* Proporção de smartphone de verdade. A altura vem da proporção, não do
   conteúdo: três celulares de alturas diferentes lado a lado denunciam que
   são caixas de texto com moldura, não aparelhos. */
.tst-frame{width:min(100%,19.5rem);aspect-ratio:9/18.5;display:flex;
flex-direction:column;overflow:hidden;background:var(--color-surface);
border:1px solid var(--color-border);border-radius:2.25rem;
box-shadow:var(--shadow);padding:.4rem}

.tst-statusbar{flex:none;position:relative;height:1.75rem;display:flex;align-items:center;
justify-content:flex-end;gap:.3rem;padding-inline:var(--s-4);
background:var(--color-surface-raised);color:var(--color-muted)}
.tst-island{position:absolute;left:50%;top:.35rem;transform:translateX(-50%);
width:4.25rem;height:1.05rem;border-radius:var(--radius-pill);
background:var(--color-text);opacity:.85}
.tst-signal{display:flex;align-items:flex-end;gap:1px;height:.6rem}
.tst-signal i{width:2px;height:var(--h);border-radius:1px;background:currentColor}
.tst-battery{display:block;width:1.35rem;height:.7rem;border:1px solid currentColor;
border-radius:.2rem;padding:1px}
.tst-battery b{display:block;width:65%;height:100%;border-radius:1px;background:currentColor}

.tst-header{flex:none;display:flex;align-items:center;gap:var(--s-3);padding:var(--s-3) var(--s-4);
border-bottom:1px solid var(--color-border);background:var(--color-surface-raised)}
.tst-header .tst-avatar{width:2.25rem;height:2.25rem}
.tst-header .tst-who{line-height:1.25}
.tst-status{font-size:.75rem;color:var(--color-muted)}

/* O fundo é uma interpretação própria: marcas soltas de cozinha e casa
   desenhadas aqui mesmo, em opacidade muito baixa. Lembra o ambiente de um
   mensageiro sem copiar asset de ninguém. */
.tst-thread{margin:0;padding:var(--s-4);flex:1;min-height:0;display:flex;
flex-direction:column;justify-content:flex-end;gap:var(--s-3);overflow:hidden;
background-color:color-mix(in srgb, var(--color-primary) 5%, var(--color-background));
background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Cg fill='none' stroke='%23000' stroke-opacity='.045' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 28l6 6 11-12'/%3E%3Ccircle cx='96' cy='26' r='7'/%3E%3Cpath d='M26 88h18M35 79v18'/%3E%3Cpath d='M86 84c6 0 10 4 10 10v8H76v-8c0-6 4-10 10-10z'/%3E%3C/g%3E%3C/svg%3E");
background-size:8rem 8rem}

.tst-bubble{margin:0;max-width:82%;padding:var(--s-3) var(--s-4);font-size:var(--t--1);
line-height:1.5;border-radius:1.125rem;
/* Entra uma vez e fica. Sem laço, sem JavaScript. */
animation:tst-in .42s var(--ease,ease-out) backwards;animation-delay:var(--delay)}
.tst-in{align-self:flex-start;background:var(--color-surface-raised);
border:1px solid var(--color-border);border-bottom-left-radius:.35rem;color:var(--color-text)}
.tst-out{align-self:flex-end;background:var(--color-primary);color:var(--color-on-primary);
border-bottom-right-radius:.35rem}
.tst-text{display:block}
.tst-meta{display:flex;align-items:center;justify-content:flex-end;gap:.25rem;
margin-top:.25rem;font-size:.6875rem;opacity:.75}
.tst-ticks{width:1rem;height:.6rem;flex:none}

/* Caixa de digitar: desenho, não campo. */
.tst-composer{flex:none;display:flex;align-items:center;gap:var(--s-3);
padding:var(--s-3) var(--s-4) var(--s-4);border-top:1px solid var(--color-border);
background:var(--color-surface-raised)}
.tst-field{flex:1;height:1.875rem;border-radius:var(--radius-pill);
background:var(--color-surface);border:1px solid var(--color-border)}
.tst-send{width:1.875rem;height:1.875rem;border-radius:50%;display:grid;place-items:center;
background:var(--color-primary);color:var(--color-on-primary);flex:none}
.tst-send svg{width:1rem;height:1rem}

@keyframes tst-in{from{opacity:0;transform:translateY(.5rem)}}

/* A cascata é desta peça, então some por inteiro aqui: o conteúdo aparece
   pronto, sem etapa intermediária. */
@media (prefers-reduced-motion:reduce){.tst-bubble{animation:none}}
`;
