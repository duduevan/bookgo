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
.tst-demo{display:block;margin:0 0 var(--s-6);padding:var(--s-4) var(--s-5);
border:1px dashed color-mix(in srgb, var(--color-accent) 55%, var(--color-border));
border-radius:var(--radius);background:color-mix(in srgb, var(--color-accent) 8%, transparent);
color:var(--color-text);font-size:var(--t--1);max-width:44rem;margin-inline:auto;
text-align:left}
.tst-demo strong{font-weight:var(--w-semibold)}

.tst-items{display:grid;gap:var(--s-5);align-items:start;
grid-template-columns:repeat(auto-fit,minmax(min(19rem,100%),1fr))}

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
.tst-frame{width:min(100%,22rem);background:var(--color-surface);
border:1px solid var(--color-border);border-radius:1.75rem;overflow:hidden;
display:flex;flex-direction:column;
box-shadow:0 0 0 .5rem var(--color-surface-raised),
0 0 0 .5625rem var(--color-border),0 1.5rem 3rem -1.5rem rgb(0 0 0 / .28)}

.tst-statusbar{position:relative;height:1.75rem;display:flex;align-items:center;
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

.tst-header{display:flex;align-items:center;gap:var(--s-3);padding:var(--s-3) var(--s-4);
border-bottom:1px solid var(--color-border);background:var(--color-surface-raised)}
.tst-header .tst-avatar{width:2.25rem;height:2.25rem}
.tst-header .tst-who{line-height:1.25}
.tst-status{font-size:.75rem;color:var(--color-muted)}

.tst-thread{margin:0;padding:var(--s-4);display:flex;flex-direction:column;
gap:var(--s-3);background:var(--color-surface)}
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
.tst-composer{display:flex;align-items:center;gap:var(--s-3);
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
