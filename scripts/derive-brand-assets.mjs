/**
 * Deriva os assets de marca usados na aplicação a partir dos arquivos
 * oficiais em brand/ (fora de public/, portanto nunca publicados).
 *
 * Por que existe: os três arquivos oficiais exibem a tagline
 * "SEU AGENDAMENTO", que não pertence ao posicionamento atual da BookGo.
 * Não há versão oficial sem tagline. Este script NÃO redesenha nada —
 * ele apenas apaga a região da tagline e recorta o check já existente,
 * usando exclusivamente pixels dos arquivos oficiais.
 *
 * Quando a versão oficial sem tagline for fornecida, este script deixa de
 * ser necessário: basta substituir os arquivos em src/assets/brand/.
 *
 * Uso: node scripts/derive-brand-assets.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

// Fora de public/: os originais exibem a tagline "SEU AGENDAMENTO" e não
// podem ser servidos em produção, nem por URL direta.
const OFFICIAL = 'brand';
const APP = 'src/assets/brand';
const PUBLIC = 'public/images';

const BRAND_BLUE = '#004ED1';

/** Alpha acima do qual um pixel conta como tinta. */
const INK = 30;

async function raw(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/**
 * Localiza a faixa da tagline.
 *
 * Discriminador: uma linha da tagline é composta por muitos segmentos de
 * tinta curtos (as letras de "SEU AGENDAMENTO"), enquanto uma linha que
 * contém apenas o check tem um ou dois segmentos largos. Dentro de uma
 * linha de tagline, a maior folga horizontal separa as letras do check.
 */
function findTaglineBox({ data, w, h }) {
  const alphaAt = (x, y) => data[(y * w + x) * 4 + 3];

  const segmentsOf = (y) => {
    const segs = [];
    let start = -1;
    for (let x = 0; x <= w; x++) {
      const on = x < w && alphaAt(x, y) > INK;
      if (on && start < 0) start = x;
      if (!on && start >= 0) {
        segs.push([start, x - 1]);
        start = -1;
      }
    }
    return segs;
  };

  let top = -1;
  let bottom = -1;
  let taglineRight = 0;
  let checkLeft = w;

  for (let y = Math.floor(h * 0.6); y < h; y++) {
    const segs = segmentsOf(y);
    if (segs.length < 6) continue; // linha de check, não de tagline

    // Maior folga entre segmentos consecutivos: divide letras e check.
    let bestGap = 0;
    let cut = segs.length - 1;
    for (let i = 0; i < segs.length - 1; i++) {
      const gap = segs[i + 1][0] - segs[i][1];
      if (gap > bestGap) {
        bestGap = gap;
        cut = i;
      }
    }

    if (top < 0) top = y;
    bottom = y;
    if (segs[cut][1] > taglineRight) taglineRight = segs[cut][1];
    if (segs[cut + 1] && segs[cut + 1][0] < checkLeft) checkLeft = segs[cut + 1][0];
  }

  if (top < 0) return null;

  const gap = checkLeft - taglineRight;
  if (gap < 20) {
    throw new Error(
      `Tagline e check separados por apenas ${gap}px — recorte inseguro. ` +
        'Forneça a versão oficial sem tagline.'
    );
  }

  // A máscara para no meio da folga, longe do check e das letras.
  return {
    top: top - 2,
    bottom: h,
    left: 0,
    right: taglineRight + Math.floor(gap / 2),
    gap,
  };
}

/** Apaga a tagline preservando cada pixel do wordmark e do check. */
async function removeTagline(src, out) {
  const img = await raw(src);
  const box = findTaglineBox(img);
  if (!box) throw new Error(`Tagline não localizada em ${src}`);

  const maskW = box.right - box.left;
  const maskH = box.bottom - box.top;

  // Retângulo transparente sobreposto com composite 'dest-out'.
  const cutout = await sharp({
    create: {
      width: maskW,
      height: maskH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  await sharp(src)
    .ensureAlpha()
    .composite([{ input: cutout, left: box.left, top: box.top, blend: 'dest-out' }])
    .trim({ threshold: 1 })
    .webp({ quality: 95, effort: 6 })
    .toFile(out);

  const meta = await sharp(out).metadata();
  console.log(
    `  ${out}  ${meta.width}x${meta.height}  (folga tagline/check: ${box.gap}px)`
  );
}

/**
 * Recorta o check do símbolo oficial.
 *
 * O check é um traço isolado: rotulando os componentes conexos brancos do
 * símbolo, ele é o maior componente mais à direita — separado do wordmark,
 * que fica à esquerda. Nada é redesenhado; o recorte sai em resolução
 * nativa e o ícone é montado ao redor dele, sem ampliar.
 */
function largestRightmostComponent({ data, w, h }) {
  const mask = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) mask[p] = 1;
  }

  const seen = new Uint8Array(w * h);
  const stack = [];
  let best = null;

  for (let p0 = 0; p0 < w * h; p0++) {
    if (!mask[p0] || seen[p0]) continue;
    stack.length = 0;
    stack.push(p0);
    seen[p0] = 1;
    let n = 0, minX = w, maxX = 0, minY = h, maxY = 0;

    while (stack.length) {
      const q = stack.pop();
      const x = q % w;
      const y = (q - x) / w;
      n++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x > 0 && mask[q - 1] && !seen[q - 1]) { seen[q - 1] = 1; stack.push(q - 1); }
      if (x < w - 1 && mask[q + 1] && !seen[q + 1]) { seen[q + 1] = 1; stack.push(q + 1); }
      if (y > 0 && mask[q - w] && !seen[q - w]) { seen[q - w] = 1; stack.push(q - w); }
      if (y < h - 1 && mask[q + w] && !seen[q + w]) { seen[q + w] = 1; stack.push(q + w); }
    }

    // Só componentes substanciais concorrem; vence o mais à direita.
    if (n > 5000 && (!best || minX > best.minX)) {
      best = { n, minX, maxX, minY, maxY, seed: p0 };
    }
  }

  return best;
}

/**
 * Alpha do check, com antialiasing preservado.
 *
 * A bounding box do check encosta no "o" de "Go", então recortar o
 * retângulo traria um pedaço da letra. A máscara abaixo isola o traço:
 * parte do componente conexo, dilata alguns pixels para alcançar a borda
 * suavizada e usa a "brancura" do pixel original como alpha — o fundo do
 * símbolo é azul chapado, então isso reproduz a borda original sem serrilha.
 */
function checkAlphaMask({ data, w, h }, box) {
  const inComponent = new Uint8Array(w * h);
  const mask = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) mask[p] = 1;
  }

  // Flood fill a partir da semente do componente vencedor.
  const stack = [box.seed];
  inComponent[box.seed] = 1;
  while (stack.length) {
    const q = stack.pop();
    const x = q % w;
    const y = (q - x) / w;
    if (x > 0 && mask[q - 1] && !inComponent[q - 1]) { inComponent[q - 1] = 1; stack.push(q - 1); }
    if (x < w - 1 && mask[q + 1] && !inComponent[q + 1]) { inComponent[q + 1] = 1; stack.push(q + 1); }
    if (y > 0 && mask[q - w] && !inComponent[q - w]) { inComponent[q - w] = 1; stack.push(q - w); }
    if (y < h - 1 && mask[q + w] && !inComponent[q + w]) { inComponent[q + w] = 1; stack.push(q + w); }
  }

  // Dilatação: alcança os pixels de borda antialiasados, que ficaram fora
  // do limiar mas pertencem ao traço.
  const R = 4;
  const dilated = new Uint8Array(w * h);
  for (let y = box.minY - R; y <= box.maxY + R; y++) {
    for (let x = box.minX - R; x <= box.maxX + R; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      let hit = 0;
      for (let dy = -R; dy <= R && !hit; dy++) {
        for (let dx = -R; dx <= R && !hit; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (inComponent[ny * w + nx]) hit = 1;
        }
      }
      dilated[y * w + x] = hit;
    }
  }

  return dilated;
}

async function deriveIcon() {
  const src = `${OFFICIAL}/bookgo-symbol.webp`;
  const img = await raw(src);
  const box = largestRightmostComponent(img);
  if (!box) throw new Error('Check não localizado no símbolo oficial.');

  const cw = box.maxX - box.minX + 1;
  const ch = box.maxY - box.minY + 1;
  if (cw < 200 || ch < 200) {
    throw new Error(
      `Check extraído em ${cw}x${ch} — resolução insuficiente para ícone. ` +
        'Mantenha o favicon temporário.'
    );
  }

  const dilated = checkAlphaMask(img, box);
  const { data, w } = img;

  // Recorte RGBA: branco com alpha proporcional à brancura original.
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const sp = ((box.minY + y) * w + (box.minX + x)) * 4;
      const dp = (y * cw + x) * 4;
      const inside = dilated[(box.minY + y) * w + (box.minX + x)];
      // O azul oficial tem canal R = 0 e o traço é branco (R = 255), então o
      // próprio canal vermelho já é o fator de mistura: 0 no fundo, 255 no
      // traço, valores intermediários na borda suavizada.
      const alpha = inside ? data[sp] : 0;
      out[dp] = 255;
      out[dp + 1] = 255;
      out[dp + 2] = 255;
      out[dp + 3] = alpha;
    }
  }

  // Lado do ícone derivado do tamanho nativo do check: nada é ampliado.
  const side = Math.round(Math.max(cw, ch) / 0.56);
  const check = await sharp(out, { raw: { width: cw, height: ch, channels: 4 } })
    .png()
    .toBuffer();

  const icon = sharp({
    create: { width: side, height: side, channels: 4, background: BRAND_BLUE },
  }).composite([
    {
      input: check,
      left: Math.round((side - cw) / 2),
      top: Math.round((side - ch) / 2),
    },
  ]);

  const base = await icon.png().toBuffer();

  await sharp(base).webp({ quality: 95, effort: 6 }).toFile(`${APP}/bookgo-icon.webp`);
  await sharp(base).png({ compressionLevel: 9 }).toFile(`${PUBLIC}/bookgo-icon.png`);

  for (const size of [32, 180, 512]) {
    await sharp(base)
      .resize(size, size, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toFile(`${PUBLIC}/icons/icon-${size}.png`);
  }

  console.log(`  check nativo ${cw}x${ch} → ícone ${side}x${side} (+ 32/180/512)`);
}

await mkdir(APP, { recursive: true });
await mkdir(`${PUBLIC}/icons`, { recursive: true });

console.log('Derivando assets de marca (sem tagline):');
await removeTagline(`${OFFICIAL}/bookgo-blue.webp`, `${APP}/bookgo-wordmark-blue.webp`);
await removeTagline(`${OFFICIAL}/bookgo-white.webp`, `${APP}/bookgo-wordmark-white.webp`);
await deriveIcon();
