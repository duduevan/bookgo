/**
 * Emite `/api/meta-capi.php` no build.
 *
 * O PHP existe como arquivo de verdade em `src/server/meta-capi.php`, e é
 * lido cru aqui. Esta rota só injeta o que precisa vir da configuração:
 * o pixel e o domínio canônico. É o que mantém a regra do projeto de que
 * nenhum identificador vive fora de `src/config/tracking.ts` — inclusive
 * para o código que roda no servidor.
 *
 * Sem pixel configurado, o arquivo publicado responde 503 e não envia nada:
 * a constante sai vazia e a própria guarda do PHP barra a requisição.
 *
 * O token da Conversions API **não** passa por aqui. Ele é escrito no
 * deploy, em `api/credenciais.php`, a partir do GitHub Secret, e esse
 * arquivo não existe no repositório. Ver docs/meta-capi.md.
 */
import type { APIRoute } from 'astro';
import php from '../../server/meta-capi.php?raw';
import { TRACKING } from '../../config/tracking';
import { SITE } from '../../config/site';

export const GET: APIRoute = async () => {
  const source = php
    .replaceAll('__PIXEL_ID__', TRACKING.meta.pixelId ?? '')
    .replaceAll('__ORIGEM__', SITE.url);

  return new Response(source, {
    headers: { 'Content-Type': 'application/x-httpd-php; charset=utf-8' },
  });
};
