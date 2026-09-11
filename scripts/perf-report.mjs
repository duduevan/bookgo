/**
 * Relatório de performance do build.
 *
 * Mede o que foi gerado e avisa quando algo cresce fora do padrão. Não
 * bloqueia o build: um orçamento rígido escolhido no escaço atrapalha mais
 * do que ajuda. As metas de campo (LCP <= 2,5s, INP <= 200ms, CLS <= 0,1)
 * são objetivos de engenharia, medidos em campo, não aqui.
 *
 * Uso: node scripts/perf-report.mjs
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';

/** Limiares de ATENÇÃO. Ultrapassar gera aviso, nunca falha. */
const WATCH = {
  clientJs: 0,          // qualquer JS de cliente merece justificativa
  cssTotal: 80 * 1024,
  htmlPage: 80 * 1024,
  image: 250 * 1024,
  fontsTotal: 300 * 1024,
};

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push({ file: full, size: (await stat(full)).size });
  }
  return out;
}

const files = await walk(DIST);
const by = (ext) => files.filter((f) => f.file.endsWith(ext));
const sum = (list) => list.reduce((t, f) => t + f.size, 0);

const html = by('.html');
const css = by('.css');
const js = by('.js');
const fonts = by('.woff2');
const images = files.filter((f) => /\.(png|jpe?g|webp|avif|svg|gif)$/.test(f.file));

console.log('Performance do build\n');
console.log(`  Total            ${kb(sum(files))}`);
console.log(`  HTML             ${kb(sum(html))} em ${html.length} páginas`);
console.log(`  CSS              ${kb(sum(css))}`);
console.log(`  JS de cliente    ${kb(sum(js))} em ${js.length} arquivos`);
console.log(`  Fontes           ${kb(sum(fonts))} em ${fonts.length} arquivos`);
console.log(`  Imagens          ${kb(sum(images))} em ${images.length} arquivos`);

const pages = ['/index.html', '/blog/index.html'];
console.log('\n  Páginas principais');
for (const page of html.sort((a, b) => b.size - a.size).slice(0, 5)) {
  console.log(`    ${kb(page.size).padStart(9)}  ${page.file.replace(DIST, '')}`);
}

console.log('\n  Maiores imagens');
for (const image of images.sort((a, b) => b.size - a.size).slice(0, 5)) {
  console.log(`    ${kb(image.size).padStart(9)}  ${image.file.replace(DIST, '')}`);
}

const notes = [];
if (js.length > WATCH.clientJs)
  notes.push(`${js.length} arquivo(s) de JS no cliente — o padrão do projeto é zero.`);
if (sum(css) > WATCH.cssTotal) notes.push(`CSS total em ${kb(sum(css))}.`);
if (sum(fonts) > WATCH.fontsTotal) notes.push(`Fontes somam ${kb(sum(fonts))}.`);
for (const page of html) {
  if (page.size > WATCH.htmlPage)
    notes.push(`${page.file.replace(DIST, '')} com ${kb(page.size)}.`);
}
for (const image of images) {
  if (image.size > WATCH.image)
    notes.push(`${image.file.replace(DIST, '')} com ${kb(image.size)}.`);
}

console.log('');
if (notes.length) {
  console.log('  Atenção (não bloqueia):');
  for (const note of notes) console.log(`    · ${note}`);
} else {
  console.log('  Nada fora do padrão.');
}

console.log(
  '\n  Metas de campo: LCP <= 2,5s · INP <= 200ms · CLS <= 0,1' +
    '\n  São objetivos de engenharia, medidos em campo — não garantias deste relatório.'
);
