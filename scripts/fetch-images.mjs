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
 * Descobre a imagem oficial a partir da página do produto.
 *
 * Existe porque comparativo de produto exige a foto daquele modelo, e a foto
 * daquele modelo mora na página do fabricante, não num banco de imagens. O
 * fluxo do manifesto sabe baixar uma URL direta; o que faltava era chegar
 * até ela sem inventar endereço.
 *
 * `og:image` é o caminho certo para isso: é a imagem que o próprio
 * fabricante declara como representação da página, servida por ele.
 *
 * Roda no runner, que alcança esses domínios. O ambiente de edição não
 * alcança, e é por isso que a descoberta não pode acontecer lá.
 */
async function ogImage(pageUrl) {
  const res = await fetch(pageUrl, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      'accept-language': 'pt-BR,pt;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`página respondeu HTTP ${res.status}`);
  const html = await res.text();

  for (const re of [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  ]) {
    const m = html.match(re);
    if (m) return new URL(m[1], pageUrl).href;
  }
  throw new Error('a página não declara og:image');
}

/**
 * Candidatos de URL para uma entrada, em ordem de preferência.
 *
 * Nunca lê URL assinada do manifesto — token com expiração não é dado
 * durável e não pode viver num arquivo versionado.
 *
 *   1. `IMAGE_URL_<assetId>`, a URL assinada de download, injetada por
 *      ambiente. É o **único** caminho para o arquivo limpo em alta
 *      resolução.
 *   2. `previewPath`, o caminho público do CDN, sem token. Devolve ~626px.
 *
 * MEDIDO, NÃO SUPOSTO: pedir largura ao CDN (`?w=1480`) devolve, sim, 1400px
 * — e com a marca d'água do banco ladrilhada por cima da foto inteira. O
 * caminho público sem parâmetro vem limpo, mas pequeno. Não existe terceira
 * opção pública: alta resolução sem marca d'água exige a URL assinada.
 */
function urlCandidates(item) {
  const out = [];
  const fromEnv = item.assetId && process.env[`IMAGE_URL_${item.assetId}`];
  if (fromEnv) out.push({ url: fromEnv, via: 'assinada' });
  if (item.imageUrl) out.push({ url: item.imageUrl, via: 'direta' });
  if (item.previewPath) out.push({ url: CDN + item.previewPath, via: 'preview' });
  return out;
}

/**
 * Fica com o primeiro candidato que responder — a ordem já é a preferência,
 * e aqui o maior arquivo não é o melhor: o grande é o que tem marca d'água.
 */
async function fetchBest(item) {
  const tentativas = [];

  /* A página oficial vem primeiro: é a origem mais confiável para a foto de
     um modelo específico. Falhar aqui não derruba a entrada, que ainda pode
     ter URL direta declarada. */
  const candidatos = urlCandidates(item);
  if (item.pageUrl) {
    try {
      candidatos.unshift({ url: await ogImage(item.pageUrl), via: 'og:image' });
    } catch (error) {
      tentativas.push(`og:image: ${error.message}`);
    }
  }

  for (const cand of candidatos) {
    try {
      const res = await fetch(cand.url);
      if (!res.ok) {
        tentativas.push(`${cand.via}: HTTP ${res.status}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buffer).metadata();
      tentativas.push(`${cand.via}: ${meta.width}×${meta.height}`);
      return { best: { ...cand, buffer, meta }, tentativas };
    } catch (error) {
      tentativas.push(`${cand.via}: ${error.message}`);
    }
  }

  return { best: null, tentativas };
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

    /* `fit: contain` para foto de produto: cortar o quadro cortaria o
       aparelho, e um comparativo que mostra meia air fryer não compara
       nada. O fundo vem do manifesto e fica igual nas três. */
    const target_ratio = parseRatio(ratio);
    if (target_ratio && item.fit === 'contain') {
      const larguraFinal = width ?? meta.width;
      pipeline = pipeline.resize({
        width: larguraFinal,
        height: Math.round(larguraFinal / target_ratio),
        fit: 'contain',
        background: item.background ?? '#ffffff',
      });
    } else if (target_ratio) {
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

    if (width && item.fit !== 'contain') {
      pipeline = pipeline.resize({ width, withoutEnlargement: true });
    }

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
