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
const OUT = '_verificacao';

/** Páginas com tela; a chave é o nome do arquivo. */
const PAGINAS = [
  ['lp', '/casa-organizada-em-15-minutos/', ['desktop', 'mobile']],
  ['artigo', '/blog/organizacao/como-manter-a-casa-organizada/', ['desktop', 'mobile']],
  ['categoria', '/blog/organizacao/', ['desktop', 'mobile']],
  ['home', '/', ['desktop']],
];

/** Recursos sem tela, conferidos só pelo status e pelo corpo. */
const RECURSOS = ['/sitemap-index.xml', '/robots.txt', '/llms.txt'];

/**
 * Caminhos que devem responder com redirecionamento.
 *
 * Seguir o redirect e ver 200 no fim não prova nada: um arquivo de verdade
 * em `/sitemap.xml` daria o mesmo 200 e seria conteúdo duplicado. O que
 * precisa ser conferido é o 301 em si, então aqui o redirect não é seguido.
 */
const REDIRECIONAM = { '/sitemap.xml': '/sitemap-index.xml' };

const VIEWPORTS = { desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } };

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
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      imgs: [...document.images].map((i) => ({
        src: i.currentSrc.split('/').pop(),
        ok: i.naturalWidth > 0,
        px: `${i.naturalWidth}×${i.naturalHeight}`,
      })),
    }));

    await page.screenshot({ path: `${OUT}/${nome}-${vp}.jpg`, fullPage: true, quality: 80, type: 'jpeg' });

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
