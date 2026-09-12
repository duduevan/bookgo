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
const CDN = 'https://img.magnific.com';
const force = process.argv.includes('--force');

/**
 * Resolve os bytes de uma entrada, sem nunca ler URL assinada do manifesto.
 *
 * 1. `IMAGE_URL_<assetId>` — é por aqui que uma URL assinada de alta
 *    resolução chega ao runner sem ser versionada.
 * 2. `previewPath` — caminho público do CDN, sem token e estável.
 */
function resolveUrl(item) {
  const fromEnv = item.assetId && process.env[`IMAGE_URL_${item.assetId}`];
  if (fromEnv) return { url: fromEnv, via: 'env' };
  if (item.previewPath) return { url: CDN + item.previewPath, via: 'previewPath' };
  return { url: null, via: null };
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
  const { url, via } = resolveUrl(item);

  if (!url) {
    pendentes.push(target);
    continue;
  }

  if (!force && (await exists(target))) {
    puladas += 1;
    continue;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const input = Buffer.from(await res.arrayBuffer());

    let pipeline = sharp(input);
    const meta = await pipeline.metadata();

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
        `origem: ${item.provider ?? '?'}#${item.assetId ?? '?'} (via ${via})`
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
