/**
 * Confere o comportamento do Meta Pixel no navegador.
 *
 * Não basta ler o HTML: o que importa aqui é o que o navegador **faz**, e
 * em que ordem. As perguntas são de comportamento, não de markup:
 *
 *  1. a verificação de domínio está no head, uma vez só;
 *  2. antes de qualquer escolha, nenhuma requisição sai para a Meta;
 *  3. aceitar só medição de audiência **não** libera o Pixel;
 *  4. aceitar marketing carrega o Pixel e envia PageView;
 *  5. artigo e landing page enviam ViewContent;
 *  6. o clique no checkout envia InitiateCheckout, e o checkout_click
 *     interno continua existindo ao lado dele;
 *  7. clique em afiliado não vira InitiateCheckout;
 *  8. nenhum Purchase sai do site;
 *  9. cada evento sai pelos dois caminhos, Pixel e Conversions API, com o
 *     mesmo event_id — que é o que permite a Meta deduplicar;
 * 10. o retransmissor recusa o que não faz parte da integração, e o token
 *     não aparece em página nenhuma.
 *
 * As requisições são lidas do tráfego real: toda chamada para
 * `facebook.com/tr` carrega o evento em `ev=` e o pixel em `id=`.
 *
 * Uso: node scripts/verificar-meta.mjs [origem]
 */
import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const BROWSER = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

const PIXEL = '28163448079989110';
const DOMAIN_TOKEN = 'qsja81fszd5g3tt0qnvhw5epqeoz6z';
const CHECKOUT = 'https://pay.kiwify.com.br/';

const CAPI = '/api/meta-capi.php';
/* O retransmissor só aceita chamadas do domínio de produção. Num teste
   contra localhost as recusas por origem continuam sendo o comportamento
   correto, e o relatório diz isso em vez de fingir aprovação. */
const ORIGEM_ESPERADA = 'https://bookgo.com.br';

const ARTIGO = '/blog/casa/organizacao/como-manter-a-casa-organizada/';
const COMPARATIVO =
  '/blog/casa/cozinha/comparativo-air-fryer-philips-electrolux-britania/';
const LP = '/casa-organizada-em-15-minutos/';

const linhas = [];
const problemas = [];
const registrar = (l) => {
  console.log(l);
  linhas.push(l);
};
const exigir = (ok, msg) => {
  if (!ok) problemas.push(msg);
};

const browser = await chromium.launch({
  executablePath: BROWSER,
  args: ['--no-sandbox'],
});

/**
 * Abre uma página registrando tudo que sai para a Meta.
 *
 * `meta` acumula as URLs de `connect.facebook.net` (o script) e de
 * `facebook.com/tr` (os eventos), e `eventos` traz só o nome de cada
 * evento com o pixel e o id de deduplicação.
 */
async function abrir(caminho, { consent } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  /* A escolha é gravada antes da primeira navegação, no mesmo formato que o
     runtime grava: é assim que se testa o estado "visitante que já
     decidiu" sem clicar no banner a cada página. */
  if (consent) {
    await ctx.addInitScript((c) => {
      try {
        localStorage.setItem(
          'bookgo-consent',
          JSON.stringify({ ...c, ts: new Date().toISOString() })
        );
      } catch (e) {
        /* modo privado: o teste segue sem estado salvo */
      }
    }, consent);
  }

  const meta = [];
  const capi = [];
  const page = await ctx.newPage();
  page.on('request', (r) => {
    const u = r.url();
    if (/connect\.facebook\.net|facebook\.com\/tr/.test(u)) meta.push(u);
    if (u.includes(CAPI)) {
      let corpo = null;
      try {
        corpo = JSON.parse(r.postData() ?? 'null');
      } catch (e) {
        corpo = null;
      }
      capi.push({ metodo: r.method(), corpo, bruto: r.postData() ?? '' });
    }
  });

  await page.goto(BASE + caminho, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const eventos = () =>
    meta
      .filter((u) => u.includes('/tr'))
      .map((u) => {
        const q = new URL(u).searchParams;
        return { ev: q.get('ev'), id: q.get('id'), eid: q.get('eid') };
      });

  return { ctx, page, meta, capi, eventos };
}

/** Pares navegador/servidor do mesmo evento, casados pelo event_id. */
function conferirDeduplicacao(nome, eventos, capi) {
  for (const e of eventos) {
    if (!e.eid) {
      problemas.push(`${nome}: ${e.ev} saiu do Pixel sem eventID`);
      continue;
    }
    const par = capi.find(
      (c) => c.corpo && c.corpo.event_id === e.eid && c.corpo.event_name === e.ev
    );
    if (!par) {
      problemas.push(
        `${nome}: ${e.ev} saiu pelo Pixel e não pela Conversions API com o mesmo event_id`
      );
    }
  }
  /* O caminho inverso também conta: um evento server-side sem par no
     navegador seria contado duas vezes pela Meta. */
  for (const c of capi) {
    if (!c.corpo) continue;
    const par = eventos.find(
      (e) => e.eid === c.corpo.event_id && e.ev === c.corpo.event_name
    );
    if (!par) {
      problemas.push(
        `${nome}: ${c.corpo.event_name} saiu pela Conversions API sem o par no Pixel`
      );
    }
  }
}

/* ── 1. Verificação de domínio ─────────────────────────────── */

for (const caminho of ['/', LP, '/blog/', ARTIGO, '/politica-de-cookies/']) {
  const res = await fetch(BASE + caminho);
  const html = await res.text();
  const achados = [
    ...html.matchAll(/<meta[^>]+facebook-domain-verification[^>]*>/gi),
  ];
  const conteudo = achados[0]?.[0].match(/content="([^"]+)"/)?.[1];
  registrar(
    `  ${caminho.padEnd(46)} domain-verification: ${achados.length} ocorrência(s), content=${conteudo ?? '(ausente)'}`
  );
  exigir(achados.length === 1, `${caminho}: ${achados.length} meta de verificação de domínio (esperado 1)`);
  exigir(conteudo === DOMAIN_TOKEN, `${caminho}: token de verificação de domínio inesperado`);
}

registrar('');

/* ── 2. Sem decisão: nada sai para a Meta ──────────────────── */

{
  const { ctx, meta, capi } = await abrir(LP);
  registrar(`  sem decisão            Meta: ${meta.length} · CAPI: ${capi.length}`);
  exigir(meta.length === 0, `sem consentimento saíram ${meta.length} requisição(ões) para a Meta`);
  exigir(capi.length === 0, `sem consentimento saíram ${capi.length} chamada(s) para a Conversions API`);
  await ctx.close();
}

/* ── 3. Só analytics: o Pixel continua fora ────────────────── */

{
  const { ctx, meta, capi } = await abrir(LP, {
    consent: { analytics: true, advertising: false },
  });
  registrar(`  só analytics           Meta: ${meta.length} · CAPI: ${capi.length}`);
  exigir(
    meta.length === 0,
    `aceitar apenas analytics carregou a Meta (${meta.length} requisição(ões))`
  );
  exigir(
    capi.length === 0,
    'aceitar apenas analytics disparou a Conversions API, que é marketing'
  );
  await ctx.close();
}

/* ── 4 a 6. Com marketing aceito ───────────────────────────── */

const ACEITO = { analytics: true, advertising: true };

{
  const { ctx, eventos, capi } = await abrir('/', { consent: ACEITO });
  const e = eventos();
  registrar(`  home                   Pixel: ${e.map((x) => x.ev).join(', ') || '(nenhum)'}`);
  registrar(`                         CAPI:  ${capi.map((c) => c.corpo?.event_name).join(', ') || '(nenhum)'}`);
  conferirDeduplicacao('home', e, capi);
  exigir(e.some((x) => x.ev === 'PageView'), 'a home não enviou PageView');
  exigir(
    e.every((x) => x.id === PIXEL),
    'alguma requisição saiu com pixel diferente do configurado'
  );
  exigir(
    e.filter((x) => x.ev === 'PageView').length === 1,
    'PageView saiu mais de uma vez na home'
  );
  await ctx.close();
}

for (const [nome, caminho] of [
  ['artigo', ARTIGO],
  ['comparativo', COMPARATIVO],
]) {
  const { ctx, eventos, capi } = await abrir(caminho, { consent: ACEITO });
  const e = eventos();
  registrar(`  ${nome.padEnd(22)} Pixel: ${e.map((x) => x.ev).join(', ') || '(nenhum)'}`);
  registrar(`                         CAPI:  ${capi.map((c) => c.corpo?.event_name).join(', ') || '(nenhum)'}`);
  conferirDeduplicacao(nome, e, capi);
  exigir(e.some((x) => x.ev === 'PageView'), `${nome} não enviou PageView`);
  exigir(e.some((x) => x.ev === 'ViewContent'), `${nome} não enviou ViewContent`);
  exigir(
    e.filter((x) => x.ev === 'ViewContent').every((x) => x.eid),
    `${nome}: ViewContent sem eventID de deduplicação`
  );
  await ctx.close();
}

/* Landing page: ViewContent na abertura e InitiateCheckout no clique. O
   clique é interceptado para não sair do site durante o teste: o que se
   confere é a requisição disparada, não a navegação. */
{
  const { ctx, page, eventos, capi } = await abrir(LP, { consent: ACEITO });

  const naAbertura = eventos().map((x) => x.ev);
  registrar(`  lp (abertura)          ${naAbertura.join(', ') || '(nenhum)'}`);
  exigir(naAbertura.includes('ViewContent'), 'a LP não enviou ViewContent');
  exigir(
    !naAbertura.includes('InitiateCheckout'),
    'a LP enviou InitiateCheckout só por ter sido aberta'
  );

  const camada = () =>
    page.evaluate(() =>
      (window.dataLayer || []).filter((d) => d && d.event).map((d) => d.event)
    );
  const antes = await camada();

  const alvo = page.locator(`a[href^="${CHECKOUT}"]`).first();
  await alvo.evaluate((el) => el.setAttribute('target', '_blank'));
  await page.context().route('**/pay.kiwify.com.br/**', (route) => route.abort());
  await alvo.click({ noWaitAfter: true });
  await page.waitForTimeout(800);

  const depois = eventos().map((x) => x.ev);
  const camadaDepois = await camada();
  registrar(`  lp (clique checkout)   ${depois.join(', ')}`);
  registrar(`  camada BookGo          ${camadaDepois.join(', ')}`);

  exigir(
    depois.includes('InitiateCheckout'),
    'o clique no checkout não enviou InitiateCheckout'
  );
  exigir(
    camadaDepois.includes('checkout_click') && !antes.includes('checkout_click'),
    'checkout_click deixou de ser disparado na camada da BookGo'
  );
  exigir(
    camadaDepois.includes('product_view'),
    'product_view deixou de ser disparado na LP'
  );

  registrar(`  lp CAPI                ${capi.map((c) => c.corpo?.event_name).join(', ') || '(nenhum)'}`);
  conferirDeduplicacao('lp', eventos(), capi);

  const comEid = eventos().filter((x) => x.ev === 'InitiateCheckout' && x.eid);
  exigir(comEid.length > 0, 'InitiateCheckout sem eventID de deduplicação');

  /* O corpo enviado ao retransmissor precisa carregar o produto real, e
     nada além dos campos previstos. */
  const ic = capi.find((c) => c.corpo?.event_name === 'InitiateCheckout');
  exigir(Boolean(ic), 'InitiateCheckout não foi enviado à Conversions API');
  if (ic) {
    exigir(
      ic.corpo.event_source_url?.includes(LP),
      'InitiateCheckout foi enviado com event_source_url de outra página'
    );
    exigir(
      ic.corpo.custom_data?.currency === 'BRL' &&
        typeof ic.corpo.custom_data?.value === 'number',
      'InitiateCheckout sem valor e moeda do produto'
    );
    exigir(
      !JSON.stringify(ic.corpo).includes('access_token'),
      'o corpo enviado ao retransmissor menciona access_token'
    );
  }
  await ctx.close();
}

/* ── 7. Afiliado não é checkout da BookGo ──────────────────── */

{
  const { ctx, page, eventos, capi } = await abrir(COMPARATIVO, { consent: ACEITO });
  const antes = eventos().length;
  const antesCapi = capi.length;

  const alvo = page.locator('a[href*="meli.la"]').first();
  await page.context().route('**/meli.la/**', (route) => route.abort());
  await alvo.click({ noWaitAfter: true });
  await page.waitForTimeout(800);

  const novos = eventos().slice(antes);
  const camada = await page.evaluate(() =>
    (window.dataLayer || []).filter((d) => d && d.event).map((d) => d.event)
  );
  registrar(`  clique afiliado        Meta: ${novos.map((x) => x.ev).join(', ') || '(nenhum)'}`);
  registrar(`  camada BookGo          ${camada.join(', ')}`);

  exigir(
    !novos.some((x) => x.ev === 'InitiateCheckout'),
    'clique em afiliado virou InitiateCheckout na Meta'
  );
  exigir(
    camada.includes('affiliate_click'),
    'affiliate_click deixou de ser disparado na camada da BookGo'
  );
  const novosCapi = capi.slice(antesCapi).map((c) => c.corpo?.event_name);
  registrar(`  clique afiliado        CAPI: ${novosCapi.join(', ') || '(nenhum)'}`);
  exigir(
    !novosCapi.includes('InitiateCheckout'),
    'clique em afiliado virou InitiateCheckout na Conversions API'
  );
  await ctx.close();
}

/* ── 8. Nenhum Purchase, em página nenhuma ─────────────────── */

{
  let purchases = 0;
  for (const caminho of ['/', LP, ARTIGO, COMPARATIVO, '/blog/']) {
    const { ctx, eventos, capi } = await abrir(caminho, { consent: ACEITO });
    purchases += eventos().filter((x) => x.ev === 'Purchase').length;
    purchases += capi.filter((c) => c.corpo?.event_name === 'Purchase').length;
    await ctx.close();
  }
  registrar(`  Purchase               ${purchases} ocorrência(s)`);
  exigir(purchases === 0, `saíram ${purchases} evento(s) Purchase, e o site não conhece compra`);
}

/* ── 9. O retransmissor recusa o que não faz parte disto ────── */

/**
 * Cada caso abaixo é um jeito de usar o endpoint para algo que ele não
 * deve fazer. Todos precisam ser recusados **antes** de virar requisição
 * para a Meta, e por isso o teste olha o status, não o efeito.
 */
const RECUSAS = [
  ['GET em vez de POST', { method: 'GET' }, [405]],
  [
    'sem origem do site',
    { method: 'POST', body: '{}' },
    [403],
  ],
  [
    'origem de outro domínio',
    { method: 'POST', origin: 'https://exemplo.invalid', body: '{}' },
    [403],
  ],
  [
    'evento fora da lista (Purchase)',
    {
      method: 'POST',
      origin: ORIGEM_ESPERADA,
      body: JSON.stringify({
        event_name: 'Purchase',
        event_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        event_source_url: ORIGEM_ESPERADA + '/',
      }),
    },
    [422],
  ],
  [
    'event_id fora do formato',
    {
      method: 'POST',
      origin: ORIGEM_ESPERADA,
      body: JSON.stringify({
        event_name: 'PageView',
        event_id: 'x',
        event_source_url: ORIGEM_ESPERADA + '/',
      }),
    },
    [422],
  ],
  [
    'event_source_url de fora',
    {
      method: 'POST',
      origin: ORIGEM_ESPERADA,
      body: JSON.stringify({
        event_name: 'PageView',
        event_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        event_source_url: 'https://exemplo.invalid/x',
      }),
    },
    [422],
  ],
  [
    'corpo acima do limite',
    {
      method: 'POST',
      origin: ORIGEM_ESPERADA,
      body: 'a'.repeat(5000),
    },
    [400],
  ],
];

registrar('');

for (const [nome, req, esperados] of RECUSAS) {
  const headers = { 'Content-Type': 'application/json' };
  if (req.origin) headers.Origin = req.origin;
  let status = 0;
  try {
    const res = await fetch(BASE + CAPI, {
      method: req.method,
      headers,
      body: req.method === 'GET' ? undefined : req.body,
      redirect: 'manual',
    });
    status = res.status;
    const corpo = await res.text();
    exigir(
      !/access_token|EAA/.test(corpo),
      `${nome}: a resposta do retransmissor menciona credencial`
    );
  } catch (e) {
    status = -1;
  }
  registrar(`  ${nome.padEnd(34)} ${status}`);
  exigir(
    esperados.includes(status),
    `retransmissor respondeu ${status} para "${nome}" (esperado ${esperados.join(' ou ')})`
  );
}

/* Um evento legítimo precisa ser aceito, senão os testes acima estariam
   passando por um endpoint simplesmente quebrado. */
{
  const res = await fetch(BASE + CAPI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGEM_ESPERADA },
    body: JSON.stringify({
      event_name: 'PageView',
      event_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      event_source_url: ORIGEM_ESPERADA + '/',
    }),
  });
  registrar(`  ${'evento legítimo'.padEnd(34)} ${res.status}`);
  exigir(
    res.status === 200,
    `um PageView legítimo foi recusado pelo retransmissor (${res.status}). ` +
      '503 significa que o token não chegou ao servidor; 502, que a Meta recusou.'
  );
}

/* ── 10. O código-fonte do retransmissor não é servido ──────── */

{
  const res = await fetch(BASE + '/api/credenciais.php');
  registrar(`  ${'api/credenciais.php'.padEnd(34)} ${res.status}`);
  const corpo = await res.text();
  exigir(
    res.status === 403 || res.status === 404,
    `api/credenciais.php respondeu ${res.status}; deveria ser recusado pelo Apache`
  );
  exigir(
    !corpo.includes('meta_capi_access_token'),
    'api/credenciais.php devolveu o conteúdo do arquivo de credencial'
  );
}

await browser.close();

registrar('');
registrar(
  problemas.length === 0
    ? 'Nenhum problema encontrado.'
    : `PROBLEMAS (${problemas.length}):`
);
for (const p of problemas) registrar(`  ✗ ${p}`);

if (problemas.length > 0) process.exitCode = 1;
