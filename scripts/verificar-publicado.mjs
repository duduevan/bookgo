/**
 * Confere o site que está no ar e guarda as telas.
 *
 * Existe porque o ambiente onde o site é construído não alcança
 * bookgo.com.br: o gateway de saída nega o CONNECT, como faz com os CDNs de
 * imagem. Conferir a publicação daqui é impossível, e conferir só o build
 * local não prova nada sobre o servidor — é justamente o passo entre os dois
 * que pode falhar. Então a conferência roda onde a rede permite: no runner.
 *
 * O que verifica, por página: status HTTP, imagem quebrada, rolagem
 * horizontal e o tamanho real de cada imagem carregada. As telas saem em
 * `_verificacao/`, para serem olhadas e depois apagadas.
 *
 * Uso: node scripts/verificar-publicado.mjs [origem]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'https://bookgo.com.br';
const BROWSER = process.env.CHROMIUM_PATH || '/usr/bin/google-chrome';
const OUT = '_verificacao'; // rodada da migração

/** Páginas com tela; a chave é o nome do arquivo. */
const PAGINAS = [
  ['home', '/', ['desktop', 'mobile']],
  ['blog', '/blog/', ['desktop', 'tablet', 'mobile']],
  ['lp', '/casa-organizada-em-15-minutos/', ['desktop', 'mobile']],
  ['artigo', '/blog/casa/organizacao/como-manter-a-casa-organizada/', ['desktop', 'tablet', 'mobile']],
  ['cozinha15', '/blog/casa/organizacao/organizar-a-cozinha-em-15-minutos/', ['desktop', 'mobile']],
  ['desarruma', '/blog/casa/organizacao/casa-desarruma-no-dia-seguinte/', ['desktop', 'mobile']],
  ['minimo', '/blog/casa/organizacao/o-minimo-para-manter-a-casa-em-ordem/', ['desktop', 'mobile']],
  ['acumulo', '/blog/casa/organizacao/pontos-de-acumulo-da-casa/', ['desktop', 'mobile']],
  ['pilar', '/blog/casa/', ['desktop', 'mobile']],
  ['organizacao', '/blog/casa/organizacao/', ['desktop', 'mobile']],
  ['cozinha', '/blog/casa/cozinha/', ['desktop', 'mobile']],
  ['comparativo', '/blog/casa/cozinha/comparativo-air-fryer-philips-electrolux-britania/', ['desktop', 'tablet', 'mobile']],
];

/**
 * Destino que os CTAs de compra da landing page precisam ter.
 *
 * Conferido no HTML publicado, não no build local: entre um e outro existe
 * um envio por FTPS, e é justamente o que acontece no meio que ninguém vê.
 * Nenhuma requisição é feita ao checkout, só a leitura do href.
 */
const CHECKOUT = 'https://pay.kiwify.com.br/UJyyPuL';

/** Recursos sem tela, conferidos só pelo status e pelo corpo. */
const RECURSOS = ['/sitemap-index.xml', '/robots.txt', '/llms.txt'];

/**
 * Caminhos que devem responder com redirecionamento.
 *
 * Seguir o redirect e ver 200 no fim não prova nada: um arquivo de verdade
 * em `/sitemap.xml` daria o mesmo 200 e seria conteúdo duplicado. O que
 * precisa ser conferido é o 301 em si, então aqui o redirect não é seguido.
 */
const REDIRECIONAM = {
  '/sitemap.xml': '/sitemap-index.xml',
  /* Migração do blog. Destino direto, nunca em cadeia: o que se confere aqui
     é que uma URL antiga chega ao novo endereço num salto só. */
  '/blog/organizacao/': '/blog/casa/organizacao/',
  '/blog/organizacao/como-manter-a-casa-organizada/':
    '/blog/casa/organizacao/como-manter-a-casa-organizada/',
};

const VIEWPORTS = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};

await mkdir(OUT, { recursive: true });

const linhas = [];
const problemas = [];
const registrar = (linha) => {
  console.log(linha);
  linhas.push(linha);
};

registrar(`Origem: ${BASE}`);
registrar('');

for (const caminho of RECURSOS) {
  const res = await fetch(BASE + caminho, { redirect: 'follow' });
  const corpo = await res.text();
  registrar(`  ${String(res.status).padEnd(4)} ${caminho.padEnd(22)} ${corpo.length} bytes`);
  if (!res.ok) problemas.push(`${caminho} respondeu ${res.status}`);
}

for (const [caminho, destino] of Object.entries(REDIRECIONAM)) {
  const res = await fetch(BASE + caminho, { redirect: 'manual' });
  const para = res.headers.get('location') ?? '(sem Location)';
  const ok = res.status >= 300 && res.status < 400 && para.endsWith(destino);
  registrar(`  ${String(res.status).padEnd(4)} ${caminho.padEnd(22)} → ${para}`);
  if (!ok) problemas.push(`${caminho} deveria redirecionar para ${destino} (recebido ${res.status} → ${para})`);
}

registrar('');

const browser = await chromium.launch({ executablePath: BROWSER, args: ['--no-sandbox'] });

for (const [nome, caminho, viewports] of PAGINAS) {
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: VIEWPORTS[vp], deviceScaleFactor: 1 });
    const page = await ctx.newPage();

    const respostasRuins = [];
    page.on('response', (r) => {
      if (r.status() >= 400) respostasRuins.push(`${r.status()} ${r.url()}`);
    });

    const res = await page.goto(BASE + caminho, { waitUntil: 'networkidle' });

    /* O banner de consentimento é legítimo e cobre o rodapé; sai da tela
       para a captura mostrar a página, não o banner. */
    await page.evaluate(() => {
      document.querySelector('[class*=consent],[id*=consent]')?.remove();
    });

    /* Rola antes de medir: com lazy-loading, medir de cara reprovaria
       imagem que apenas ainda não entrou na viewport. */
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
      window.scrollTo(0, 0);
      document.querySelectorAll('img').forEach((i) => {
        i.loading = 'eager';
      });
    });
    await page.waitForTimeout(2000);

    const diag = await page.evaluate(() => ({
      /* Rolagem horizontal de verdade, e não `scrollWidth`.
         Uma página com carrossel tem um contêiner rolável dentro dela, e o
         `scrollWidth` do documento passa a relatar o overflow interno desse
         contêiner mesmo com ele recortado: a conta antiga acusava 389px de
         rolagem numa página que não anda um pixel. O que importa para quem
         usa é se a janela rola de lado, então é isso que se mede: empurra
         até o fim e vê onde parou. */
      overflow: (() => {
        const antes = window.scrollX;
        window.scrollTo(document.documentElement.scrollWidth, 0);
        const maximo = Math.round(window.scrollX);
        window.scrollTo(antes, 0);
        return maximo;
      })(),
      imgs: [...document.images].map((i) => ({
        src: i.currentSrc.split('/').pop(),
        ok: i.naturalWidth > 0,
        px: `${i.naturalWidth}×${i.naturalHeight}`,
      })),
    }));

    await page.screenshot({ path: `${OUT}/${nome}-${vp}.jpg`, fullPage: true, quality: 80, type: 'jpeg' });

    /* Na LP, todo CTA de compra tem que apontar para o checkout real. */
    /* No comparativo, todo link de afiliado precisa sair com a relação
       declarada e em aba nova. */
    if (nome === 'comparativo' && vp === 'desktop') {
      const afiliados = await page.evaluate(() =>
        [...document.querySelectorAll('a[href*="meli.la"]')].map((a) => ({
          href: a.href,
          rel: a.rel,
          target: a.target,
          evento: a.dataset.bookgoEvent ?? '',
        }))
      );
      registrar(`         afiliados: ${afiliados.length} link(s)`);
      for (const a of afiliados) {
        registrar(`         · ${a.href}  rel="${a.rel}"  target=${a.target}  ${a.evento}`);
        if (!a.rel.includes('sponsored') || !a.rel.includes('nofollow') || !a.rel.includes('noopener'))
          problemas.push(`link de afiliado sem rel completo: ${a.href}`);
        if (a.target !== '_blank') problemas.push(`link de afiliado fora de aba nova: ${a.href}`);
        if (a.evento !== 'affiliate_click')
          problemas.push(`link de afiliado sem affiliate_click: ${a.href}`);
      }
      if (afiliados.length === 0) problemas.push('o comparativo não tem link de afiliado');
    }

    /* No hub do blog, o destaque tem que existir e não pode aparecer de novo
       na lista de recentes: o mesmo artigo duas vezes na mesma tela não é
       hierarquia, é repetição. */
    if (nome === 'blog' && vp === 'desktop') {
      const hub = await page.evaluate(() => {
        const destaque = document.querySelector('.feature h2 a');
        const recentes = [...document.querySelectorAll('.posts a[href*="/blog/"]')]
          .map((a) => new URL(a.href).pathname);
        const temas = [...document.querySelectorAll('.sub h4')].map((h) =>
          h.textContent.trim()
        );
        return {
          destaque: destaque ? new URL(destaque.href).pathname : null,
          recentes: [...new Set(recentes)],
          temas,
        };
      });
      registrar(`         destaque: ${hub.destaque ?? '(nenhum)'}`);
      registrar(`         recentes: ${hub.recentes.length} · temas: ${hub.temas.join(', ')}`);
      if (!hub.destaque) problemas.push('o hub do blog está sem destaque');
      if (hub.destaque && hub.recentes.includes(hub.destaque))
        problemas.push('o destaque do blog se repete na lista de recentes');
      if (hub.temas.length === 0) problemas.push('o hub do blog está sem "Explore por tema"');
    }

    /* Coluna do artigo: o número tem que vir do navegador, não do CSS lido
       à mão. Confere também que nenhum bloco escapa da coluna e que o aviso
       de afiliado aparece no comparativo e só nele. */
    /* Artigos do curso: o CTA tem que levar à landing page, e nenhum deles
       pode mandar alguém direto ao checkout. A regra vale para os quatro
       novos e para o que já existia. */
    const DO_CURSO = ['artigo', 'cozinha15', 'desarruma', 'minimo', 'acumulo'];
    if (DO_CURSO.includes(nome) && vp === 'desktop') {
      const cta = await page.evaluate(() => ({
        produto: [...document.querySelectorAll('[data-bookgo-event="product_click"]')]
          .map((a) => new URL(a.href).pathname),
        checkout: [...document.querySelectorAll('a[href*="pay.kiwify"]')].length,
        afiliado: [...document.querySelectorAll('a[href*="meli.la"]')].length,
      }));
      registrar(
        `         CTA do curso: ${cta.produto.join(', ') || '(nenhum)'} · checkout=${cta.checkout} · afiliado=${cta.afiliado}`
      );
      if (cta.produto.length === 0)
        problemas.push(`${nome}: nenhum CTA para a landing page do curso`);
      for (const p of cta.produto) {
        if (p !== '/casa-organizada-em-15-minutos/')
          problemas.push(`${nome}: CTA do curso aponta para ${p}`);
      }
      if (cta.checkout > 0)
        problemas.push(`${nome}: artigo com ${cta.checkout} link(s) direto(s) para o checkout`);
      if (cta.afiliado > 0)
        problemas.push(`${nome}: artigo informacional com link de afiliado`);
    }

    if (nome === 'artigo' || nome === 'comparativo') {
      const col = await page.evaluate(() => {
        const art = document.querySelector('.article');
        if (!art) return null;
        const pad = parseFloat(getComputedStyle(art).paddingLeft);
        const r = art.getBoundingClientRect();
        const esq = Math.round(r.left + pad);
        const dir = Math.round(r.right - pad);
        const fora = [];
        for (const e of art.querySelectorAll(':scope > *, .prose > *')) {
          const b = e.getBoundingClientRect();
          if (b.width === 0) continue;
          if (Math.round(b.left) < esq - 1 || Math.round(b.right) > dir + 1) {
            fora.push(e.tagName + '.' + String(e.className || '').slice(0, 24));
          }
        }
        const tabela = document.querySelector('.tabela-rolavel');
        return {
          largura: dir - esq,
          fora,
          avisos: document.querySelectorAll('.aff-nota').length,
          aviso: (document.querySelector('.aff-nota') || {}).textContent?.trim() ?? '',
          tabelaRola: tabela ? tabela.scrollWidth > tabela.clientWidth : null,
          esticadas: [...document.querySelectorAll('.article-figure img')]
            .filter((i) => i.naturalWidth > 0 && i.getBoundingClientRect().width > i.naturalWidth + 1)
            .map((i) => i.currentSrc.split('/').pop()),
        };
      });
      if (col) {
        registrar(
          `         coluna=${col.largura}px  blocos fora=${col.fora.length}  avisos=${col.avisos}` +
            (col.tabelaRola === null ? '' : `  tabela rola=${col.tabelaRola}`)
        );
        if (vp === 'desktop' && (col.largura < 700 || col.largura > 800)) {
          problemas.push(`${nome}: coluna de ${col.largura}px no desktop, fora do esperado para 840px de max-width`);
        }
        for (const f of col.fora) problemas.push(`${nome}/${vp}: ${f} escapa da coluna do artigo`);
        for (const i of col.esticadas)
          problemas.push(`${nome}/${vp}: ${i} renderizada acima da resolução real`);

        const esperado = nome === 'comparativo' ? 1 : 0;
        if (col.avisos !== esperado)
          problemas.push(`${nome}: ${col.avisos} aviso(s) de afiliado, esperado ${esperado}`);
        if (nome === 'comparativo') {
          if (!col.aviso.startsWith('Este artigo contém links de afiliado.'))
            problemas.push('o aviso de afiliado não está com o texto atual');
          if (col.aviso.includes('Isso não muda'))
            problemas.push('o aviso de afiliado ainda traz a frase removida');
        }
      }
    }

    if (nome === 'lp' && vp === 'desktop') {
      const hrefs = await page.evaluate(() =>
        [...document.querySelectorAll('a')].map((a) => a.href)
      );
      const paraCheckout = hrefs.filter((h) => h.startsWith('https://pay.kiwify.com.br/'));
      const errados = paraCheckout.filter((h) => h !== CHECKOUT);
      registrar(`         checkout: ${paraCheckout.length} link(s), destino ${CHECKOUT}`);
      if (paraCheckout.length === 0) problemas.push('nenhum CTA da LP aponta para o checkout');
      for (const h of errados) problemas.push(`CTA da LP com destino inesperado: ${h}`);

      const pendente = await page.evaluate(() =>
        document.body.innerText.includes('Checkout em configuração')
      );
      if (pendente) problemas.push('a LP ainda mostra "Checkout em configuração"');

      /* A LP não manda ninguém para o blog. Decisão comercial: cada saída
         custa conversão em campanha paga. Os links legais do rodapé são a
         única exceção, e não passam por /blog/. */
      const paraBlog = hrefs.filter((h) => new URL(h).pathname.startsWith('/blog'));
      registrar(`         links para o blog: ${paraBlog.length}`);
      for (const h of paraBlog)
        problemas.push(`a LP tem link para o blog: ${h}`);

      /* Os dois tipos de botão, afirmados no HTML e não só no código: o de
         compra leva ao checkout e carrega `checkout_click`; o de
         continuidade leva à oferta e não carrega evento de compra. */
      const ctas = await page.evaluate(() =>
        [...document.querySelectorAll('[data-cta]')].map((el) => ({
          kind: el.getAttribute('data-cta'),
          href: el.getAttribute('href'),
          evento: el.getAttribute('data-bookgo-event'),
        }))
      );
      const compra = ctas.filter((c) => c.kind === 'buy');
      const continua = ctas.filter((c) => c.kind === 'continue');
      registrar(
        `         CTAs: ${compra.length} de compra, ${continua.length} de continuidade`
      );
      if (compra.length === 0) problemas.push('a LP não tem nenhum CTA de compra');
      if (continua.length === 0)
        problemas.push('a LP não tem nenhum CTA de continuidade');
      for (const c of compra) {
        if (c.href !== CHECKOUT)
          problemas.push(`CTA de compra sem destino de checkout: ${c.href}`);
        if (c.evento !== 'checkout_click')
          problemas.push(`CTA de compra sem checkout_click: ${c.href}`);
      }
      for (const c of continua) {
        if (c.href !== '#oferta')
          problemas.push(`CTA de continuidade fora da âncora da oferta: ${c.href}`);
        if (c.evento)
          problemas.push(
            `CTA de continuidade disparando ${c.evento}: rolar a página não é intenção de compra`
          );
      }

      /* Avaliações: uma é um celular, e o comentário mora dentro dele.
         Se um cartão de review voltar a aparecer, ou se a seção virar duas,
         isto quebra. */
      const aval = await page.evaluate(() => ({
        secoes: document.querySelectorAll('.rv-wrap').length,
        aparelhos: document.querySelectorAll('.rv-phone').length,
        cartoes: document.querySelectorAll('.rv-card').length,
        nomes: [...document.querySelectorAll('.rv-name')].map((n) => n.textContent.trim()),
        balaoForaDoAparelho: [...document.querySelectorAll('.rv-bubble')].filter(
          (b) => !b.closest('.rv-frame')
        ).length,
      }));
      registrar(
        `         avaliações: ${aval.aparelhos} aparelho(s) em ${aval.secoes} seção(ões), nomes ${aval.nomes.join(', ') || '(nenhum)'}`
      );
      if (aval.secoes !== 1)
        problemas.push(`a LP tem ${aval.secoes} seção(ões) de avaliações, esperado 1`);
      if (aval.aparelhos === 0) problemas.push('a LP não tem nenhuma avaliação em aparelho');
      if (aval.cartoes > 0)
        problemas.push(`a LP tem ${aval.cartoes} cartão(ões) de review; o formato é o aparelho`);
      if (aval.balaoForaDoAparelho > 0)
        problemas.push(`${aval.balaoForaDoAparelho} balão(ões) fora de um aparelho`);
      if (aval.nomes.length !== aval.aparelhos)
        problemas.push('há aparelho sem nome no cabeçalho');

      /* A oferta é um bloco só: conteúdo, preço, botão, reasseguranças e
         garantia. Se a garantia voltar a ser uma seção solta, isto quebra. */
      const ofertaInteira = await page.evaluate(() => {
        const sec = document.getElementById('oferta');
        if (!sec) return null;
        const t = sec.innerText;
        return {
          garantia: t.includes('Garantia de 7 dias'),
          preco: t.includes('R$ 37,00'),
          incluso: /O que você recebe/.test(t),
        };
      });
      if (!ofertaInteira) problemas.push('a LP não tem a âncora #oferta');
      else {
        for (const [k, v] of Object.entries(ofertaInteira))
          if (!v) problemas.push(`a seção da oferta não traz: ${k}`);
      }
    }

    const quebradas = diag.imgs.filter((i) => !i.ok);
    registrar(
      `  ${String(res.status()).padEnd(4)} ${nome}/${vp}`.padEnd(28) +
        `overflow=${diag.overflow}px  imagens=${diag.imgs.length} quebradas=${quebradas.length}`
    );
    for (const i of diag.imgs) registrar(`         · ${i.px.padEnd(11)} ${i.src}`);

    if (!res.ok()) problemas.push(`${caminho} respondeu ${res.status()}`);
    if (quebradas.length) problemas.push(`${nome}/${vp}: ${quebradas.length} imagem(ns) quebrada(s)`);
    if (diag.overflow > 0) problemas.push(`${nome}/${vp}: rolagem horizontal de ${diag.overflow}px`);
    for (const r of respostasRuins) problemas.push(`${nome}/${vp}: ${r}`);

    await ctx.close();
  }
}

await browser.close();

registrar('');
registrar(problemas.length === 0 ? 'Nenhum problema encontrado.' : `PROBLEMAS (${problemas.length}):`);
for (const p of problemas) registrar(`  ✗ ${p}`);

await writeFile(`${OUT}/relatorio.txt`, linhas.join('\n') + '\n');

/* Não derruba o job: o relatório e as telas são o entregável, e um problema
   encontrado precisa ser visto, não escondido atrás de um job vermelho sem
   artefato commitado. */
