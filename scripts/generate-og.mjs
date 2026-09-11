/**
 * Gera as imagens Open Graph (1200x630).
 *
 * Renderiza HTML no Chromium para usar a tipografia real do site (Inter) e o
 * wordmark oficial — nada é desenhado à mão. A imagem institucional usa a
 * identidade BookGo; a de cada produto usa o tema do próprio produto, lido do
 * YAML, então um produto novo só precisa existir para ganhar sua OG.
 *
 * Uso: node scripts/generate-og.mjs
 */
import { chromium } from 'playwright-core';
import { parse } from 'yaml';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = 'public/images';
const PRODUCTS = 'content/products';
const BROWSER = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

const asDataUri = async (file, mime) =>
  `data:${mime};base64,${(await readFile(file)).toString('base64')}`;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function page({ font, logo, bg, ink, dim, kicker, title, foot, accent }) {
  return `<!doctype html><meta charset="utf-8"><style>
    @font-face {
      font-family: 'Inter';
      src: url('${font}') format('woff2-variations');
      font-weight: 100 900;
    }
    * { margin: 0; box-sizing: border-box; }
    body {
      width: 1200px; height: 630px; display: flex; flex-direction: column;
      justify-content: space-between; padding: 72px 80px;
      background: ${bg}; color: ${ink};
      font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased;
      position: relative; overflow: hidden;
    }
    .glow {
      position: absolute; width: 760px; height: 760px; border-radius: 50%;
      right: -180px; top: -300px; background: ${accent}; opacity: .5;
    }
    header, main, footer { position: relative; }
    img { height: 46px; width: auto; display: block; }
    .kicker {
      font-size: 21px; font-weight: 600; letter-spacing: .16em;
      text-transform: uppercase; color: ${dim}; margin-bottom: 22px;
    }
    h1 {
      font-size: 76px; line-height: 1.05; letter-spacing: -.035em;
      font-weight: 600; max-width: 15ch; font-variation-settings: 'opsz' 32;
    }
    footer { font-size: 25px; color: ${dim}; }
  </style>
  <div class="glow"></div>
  <header><img src="${logo}" alt=""></header>
  <main>
    ${kicker ? `<p class="kicker">${escapeHtml(kicker)}</p>` : ''}
    <h1>${escapeHtml(title)}</h1>
  </main>
  <footer>${escapeHtml(foot)}</footer>`;
}

const browser = await chromium.launch({ executablePath: BROWSER, args: ['--no-sandbox'] });
const view = await browser.newPage({ viewport: { width: 1200, height: 630 } });

const font = await asDataUri('public/fonts/inter-latin-var.woff2', 'font/woff2');
const logoWhite = await asDataUri('src/assets/brand/bookgo-wordmark-white.webp', 'image/webp');

async function shot(file, html) {
  await view.setContent(html, { waitUntil: 'load' });
  await view.evaluate(() => document.fonts.ready);
  await view.screenshot({ path: file });
  console.log('  ', file);
}

await mkdir(OUT, { recursive: true });
console.log('Gerando imagens Open Graph:');

// Institucional
await shot(
  `${OUT}/og-default.png`,
  page({
    font,
    logo: logoWhite,
    bg: '#004ED1',
    ink: '#ffffff',
    dim: 'rgba(255,255,255,.78)',
    accent: 'rgba(255,255,255,.10)',
    title: 'Aprenda algo útil. Coloque em prática.',
    foot: 'bookgo.com.br',
  })
);

// Um arquivo por produto, com o tema do próprio produto.
const slugs = await readdir(PRODUCTS, { withFileTypes: true });
for (const dir of slugs.filter((d) => d.isDirectory())) {
  const file = path.join(PRODUCTS, dir.name, 'index.yaml');
  const product = parse(await readFile(file, 'utf-8'));
  const theme = product.theme ?? {};

  await shot(
    `${OUT}/og-${product.slug}.png`,
    page({
      font,
      logo: logoWhite,
      bg: theme.primaryDark ?? '#004ED1',
      ink: theme.background ?? '#ffffff',
      dim: `color-mix(in srgb, ${theme.background ?? '#fff'} 72%, transparent)`,
      accent: `color-mix(in srgb, ${theme.primary ?? '#fff'} 40%, transparent)`,
      kicker: 'Material digital',
      title: product.name,
      foot: product.tagline,
    })
  );
}

await browser.close();
