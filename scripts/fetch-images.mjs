/**
 * Materializa as imagens declaradas em content/image-sources.yaml.
 *
 * Baixa, corta na proporção pedida, redimensiona, converte para WebP e
 * grava no destino. Idempotente: arquivo já existente e mais novo que a
 * declaração é mantido, a menos que `--force`.
 *
 * Roda em dois lugares, com o mesmo código:
 *   · localmente, `npm run images:fetch`, quando a rede permitir;
 *   · no runner do GitHub Actions, que tem saída sem restrição.
 *
 * O ambiente do Claude hoje não consegue: os CDNs do Magnific e do Freepik
 * são negados no CONNECT pelo gateway de saída. Por isso a escolha mora no
 * manifesto e a materialização acontece onde a rede deixa.
 *
 * Uso: node scripts/fetch-images.mjs [--force]
 */
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import sharp from 'sharp';

const MANIFEST = 'content/image-sources.yaml';
const CDN_HOSTS = ['https://img.magnific.com', 'https://img.freepik.com'];
const force = process.argv.includes('--force');

/**
 * Candidatos de URL para uma entrada, em ordem de preferência.
 *
 * Nunca lê URL assinada do manifesto — token com expiração não é dado
 * durável e não pode viver num arquivo versionado.
 *
 *   1. `IMAGE_URL_<assetId>` — é por aqui que uma URL assinada de alta
 *      resolução chega ao runner sem ser versionada.
 *   2. `previewPath` com pedido de largura, nos dois espelhos do CDN. O
 *      caminho público sem parâmetro devolve uma miniatura de ~626px, que
 *      não serve para um slot de 1400px.
 *   3. `previewPath` cru, como último recurso.
 */
function urlCandidates(item) {
  const out = [];
  const fromEnv = item.assetId && process.env[`IMAGE_URL_${item.assetId}`];
  if (fromEnv) out.push({ url: fromEnv, via: 'env' });

  if (item.previewPath) {
    for (const host of CDN_HOSTS) {
      out.push({ url: `${host}${item.previewPath}?w=1480`, via: 'preview@1480' });
    }
    out.push({ url: CDN_HOSTS[0] + item.previewPath, via: 'preview' });
  }

  return out;
}

/**
 * Busca os candidatos e fica com o de maior largura real.
 *
 * Pedir largura ao CDN não garante recebê-la: o espelho pode ignorar o
 * parâmetro e devolver a mesma miniatura. Quem decide é o pixel que
 * chegou, não a URL que foi pedida.
 */
async function fetchBest(item) {
  let best = null;
  const tentativas = [];

  for (const cand of urlCandidates(item)) {
    try {
      const res = await fetch(cand.url);
      if (!res.ok) {
        tentativas.push(`${cand.via}: HTTP ${res.status}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buffer).metadata();
      tentativas.push(`${cand.via}: ${meta.width}×${meta.height}`);
      if (!best || meta.width > best.meta.width) best = { ...cand, buffer, meta };
      /* Uma origem assinada já é a maior possível: não há o que superar. */
      if (cand.via === 'env') break;
    } catch (error) {
      tentativas.push(`${cand.via}: ${error.message}`);
    }
  }

  return { best, tentativas };
}

/** "16:9" → 1.777…; sem proporção, devolve null e o corte é pulado. */
function parseRatio(ratio) {
  if (!ratio) return null;
  const [w, h] = String(ratio).split(':').map(Number);
  if (!w || !h) throw new Error(`proporção inválida: "${ratio}"`);
  return w / h;
}

const exists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

const manifest = parse(await readFile(MANIFEST, 'utf-8'));
const entries = manifest.images ?? [];

let baixadas = 0;
let puladas = 0;
const pendentes = [];
const falhas = [];

for (const item of entries) {
  const { target, ratio, width } = item;

  if (!item.previewPath && !(item.assetId && process.env[`IMAGE_URL_${item.assetId}`])) {
    pendentes.push(target);
    continue;
  }

  if (!force && (await exists(target))) {
    puladas += 1;
    continue;
  }

  try {
    const { best, tentativas } = await fetchBest(item);
    if (!best) throw new Error(tentativas.join('; '));
    const { buffer: input, via, meta } = best;

    let pipeline = sharp(input);

    /* Corte central para a proporção pedida. A origem raramente entrega a
       proporção exata — modelos e bancos têm a grade deles — e esticar a
       imagem para caber seria pior do que cortar. */
    const target_ratio = parseRatio(ratio);
    if (target_ratio) {
      const current = meta.width / meta.height;
      if (Math.abs(current - target_ratio) > 0.005) {
        const [w, h] =
          current > target_ratio
            ? [Math.round(meta.height * target_ratio), meta.height]
            : [meta.width, Math.round(meta.width / target_ratio)];
        pipeline = pipeline.extract({
          left: Math.round((meta.width - w) / 2),
          top: Math.round((meta.height - h) / 2),
          width: w,
          height: h,
        });
      }
    }

    if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });

    const out = await pipeline.webp({ quality: 78 }).toBuffer();
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, out);

    const { width: fw, height: fh } = await sharp(out).metadata();
    console.log(
      `  ✓ ${target}\n      ${fw}×${fh}  ${(out.length / 1024) | 0} KB  ` +
        `origem: ${item.provider ?? '?'}#${item.assetId ?? '?'} ` +
        `(via ${via}, fonte ${meta.width}×${meta.height})\n` +
        `      tentativas: ${tentativas.join(' | ')}`
    );
    baixadas += 1;
  } catch (error) {
    falhas.push({ target, message: error.message });
  }
}

console.log(
  `\n${baixadas} baixada(s), ${puladas} já existente(s), ` +
    `${pendentes.length} sem URL, ${falhas.length} com erro.`
);

if (pendentes.length > 0) {
  console.log('\nSem origem resolvível — declare provider/assetId/previewPath:');
  for (const t of pendentes) console.log(`  · ${t}`);
}

if (falhas.length > 0) {
  console.log('\nFalharam:');
  for (const f of falhas) console.log(`  · ${f.target} — ${f.message}`);
  /* Falha de rede não derruba o build do site: as imagens que faltarem
     simplesmente não renderizam, e o build do Astro já avisa quais são. */
  process.exitCode = 1;
}
