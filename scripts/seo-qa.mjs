/**
 * SEO QA — roda sobre dist/ depois do build.
 *
 * Filosofia: só falha em erro ESTRUTURAL, aquilo que quebra de fato o
 * entendimento da página por um rastreador. Contagem de caracteres de title
 * ou description vira aviso, nunca erro: não existe limite oficial e tratar
 * número redondo como requisito só produz ruído.
 *
 * Uso: node scripts/seo-qa.mjs
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';
const ORIGIN = 'https://bookgo.com.br';

const errors = [];
const warnings = [];

const fail = (page, message) => errors.push({ page, message });
const warn = (page, message) => warnings.push({ page, message });

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const exists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

const text = (html, re) => {
  const m = html.match(re);
  return m ? m[1].trim() : null;
};

const files = await walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const urlOf = (file) =>
  '/' + path.relative(DIST, file).replace(/index\.html$/, '').replace(/\\/g, '/');

for (const file of htmlFiles) {
  const page = urlOf(file);
  const html = await readFile(file, 'utf-8');

  const robots = text(html, /<meta name="robots" content="([^"]*)"/);
  const indexable = !robots?.includes('noindex');

  const title = text(html, /<title>([\s\S]*?)<\/title>/);
  const description = text(html, /<meta name="description" content="([^"]*)"/);
  const canonical = text(html, /<link rel="canonical" href="([^"]*)"/);
  const h1Count = (html.match(/<h1[\s>]/g) || []).length;

  /* ── Estrutura: bloqueia o build ─────────────────────────── */

  if (indexable && !title) fail(page, 'página indexável sem <title>');
  if (indexable && !description) fail(page, 'página indexável sem meta description');

  if (indexable) {
    if (!canonical) fail(page, 'página indexável sem canonical');
    else if (!canonical.startsWith(`${ORIGIN}/`))
      fail(page, `canonical fora de ${ORIGIN}: ${canonical}`);
  }

  if (h1Count > 1) fail(page, `${h1Count} elementos <h1> (deve haver exatamente um)`);
  if (indexable && h1Count === 0) fail(page, 'página indexável sem <h1>');

  /* Página indexável não pode conter marcação de pendência. É a rede de
     segurança das páginas legais: `ready: true` tira o noindex, e uma
     lacuna esquecida no texto iria a público com a chancela de documento
     vigente. Aqui isso quebra o build. */
  for (const marker of ['[PENDING INPUT', '[PREENCHER']) {
    if (indexable && html.includes(marker))
      fail(page, `página indexável contém marcação de pendência "${marker}…"`);
  }

  /* Elemento comercial não encosta em elemento comercial.
     `resolveRhythm` já decide isso em build; esta checagem confere o
     resultado no HTML de verdade, que é o que o visitante recebe. Cobre
     também qualquer posicionamento futuro — afiliados incluídos. */
  const commercial = [...html.matchAll(/data-commercial="([^"]+)"/g)];
  for (let i = 1; i < commercial.length; i += 1) {
    const previous = commercial[i - 1];
    const current = commercial[i];
    const between = html.slice(
      previous.index + previous[0].length,
      current.index
    );
    /* Só conta como separação o que traz conteúdo de verdade entre os dois:
       fecha o bloco anterior e abre algo com texto legível. */
    const textBetween = between
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (textBetween.length < 40)
      fail(
        page,
        `blocos comerciais colados: "${previous[1]}" e "${current[1]}" sem ` +
          'conteúdo editorial entre eles'
      );
  }

  /* Marcador de componente que escapou para o HTML. Acontece quando um
     import some do MDX ou o nome muda: o Astro emite o texto cru. */
  for (const leak of ['<ArticleImage', '<ProductCtaHere']) {
    if (html.includes(leak))
      fail(page, `marcador "${leak}" vazou como texto para o HTML`);
  }

  // Imagens: alt ausente é erro; alt="" (decorativa) é intencional e passa.
  for (const img of html.match(/<img\b[^>]*>/g) || []) {
    const src = img.match(/src="([^"]*)"/)?.[1] ?? '(sem src)';
    if (!/\salt=/.test(img)) {
      fail(page, `imagem sem atributo alt: ${src}`);
      continue;
    }

    const alt = img.match(/\salt="([^"]*)"/)?.[1] ?? '';
    if (alt.length === 0) continue; // decorativa, intencional

    /* Sinais de keyword stuffing no alt. O alt descreve a cena e a função
       dela no contexto; quem depende de leitor de tela é quem paga a conta
       de um alt escrito para robô. Aviso, não erro: a régua é editorial e
       um número redondo não decide sozinho. */
    if (alt.split(/\s+/).length > 25)
      warn(page, `alt com mais de 25 palavras: ${src}`);

    /* `title` repetindo o alt não ajuda ninguém: não é lido por leitor de
       tela e não aparece no toque. Só deve existir com motivo próprio. */
    const title = img.match(/\stitle="([^"]*)"/)?.[1];
    if (title && title.trim() === alt.trim())
      warn(page, `title idêntico ao alt (ruído): ${src}`);
  }

  /* ── JSON-LD ─────────────────────────────────────────────── */

  const blocks = html.match(
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  ) || [];

  for (const block of blocks) {
    const raw = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      fail(page, `JSON-LD inválido: ${error.message}`);
      continue;
    }

    const nodes = parsed['@graph'] ?? [parsed];
    for (const node of nodes) {
      const type = node['@type'];

      if (type === 'Article' || type === 'BlogPosting') {
        if (!node.datePublished) fail(page, `${type} sem datePublished`);
        if (!node.headline) fail(page, `${type} sem headline`);
        if (!node.articleSection) fail(page, `${type} sem articleSection (categoria)`);
        if (!node.publisher) fail(page, `${type} sem publisher`);

        for (const citation of node.citation ?? []) {
          try {
            new URL(citation.url);
          } catch {
            fail(page, `fonte com URL inválida: ${citation.url}`);
          }
        }
      }

      if (type === 'Product') {
        const offer = node.offers;
        if (!offer?.price || !offer?.priceCurrency)
          fail(page, 'Product sem price/priceCurrency em offers');
        // Dado que não temos: se aparecer, é fabricado.
        for (const forbidden of ['aggregateRating', 'review', 'ratingValue']) {
          if (forbidden in node) fail(page, `Product com ${forbidden} sem base real`);
        }
      }
    }
  }

  /* ── Links internos: apontam para algo que existe? ────────── */

  for (const href of html.match(/href="\/[^"#]*"/g) || []) {
    const target = href.slice(7, -1);
    if (target.startsWith('/_astro/')) continue;

    const candidates = target.endsWith('/')
      ? [path.join(DIST, target, 'index.html')]
      : [path.join(DIST, target), path.join(DIST, `${target}.html`)];

    let found = false;
    for (const candidate of candidates) if (await exists(candidate)) found = true;
    if (!found) fail(page, `link interno quebrado: ${target}`);
  }

  /* ── Avisos editoriais: nunca bloqueiam ──────────────────── */

  if (indexable && title && title.length > 62)
    warn(page, `title com ${title.length} caracteres — pode ser cortado no resultado de busca`);
  if (indexable && description && description.length < 110)
    warn(page, `description com ${description.length} caracteres — há espaço para mais contexto`);
}

/* ── Relatório ─────────────────────────────────────────────── */

const group = (items) => {
  const byPage = new Map();
  for (const { page, message } of items) {
    if (!byPage.has(page)) byPage.set(page, []);
    byPage.get(page).push(message);
  }
  return byPage;
};

console.log(`SEO QA — ${htmlFiles.length} páginas verificadas\n`);

if (warnings.length) {
  console.log(`Avisos editoriais (${warnings.length}) — não bloqueiam o build:`);
  for (const [page, messages] of group(warnings)) {
    console.log(`  ${page}`);
    for (const m of messages) console.log(`    · ${m}`);
  }
  console.log('');
}

if (errors.length) {
  console.log(`ERROS ESTRUTURAIS (${errors.length}):`);
  for (const [page, messages] of group(errors)) {
    console.log(`  ${page}`);
    for (const m of messages) console.log(`    ✗ ${m}`);
  }
  console.log('');
  process.exit(1);
}

console.log('Nenhum erro estrutural.');
