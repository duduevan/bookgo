<?php
/**
 * Retransmissor da Meta Conversions API.
 *
 * Este é o ÚNICO ponto do BookGo que conhece o token da CAPI. O navegador
 * manda o nome do evento e o event_id; o token entra aqui, no servidor, e
 * nunca desce para a página.
 *
 * Fluxo: navegador → este endpoint → Graph API da Meta.
 *
 * NÃO é um proxy da Graph API. Ele aceita três eventos, um conjunto fechado
 * de campos e nada mais. Qualquer coisa fora disso é recusada antes de
 * existir uma requisição para a Meta.
 *
 * O arquivo é GERADO pelo build a partir de src/server/meta-capi.php, com o
 * pixel vindo de src/config/tracking.ts. Editar a cópia em dist/ não
 * adianta: o próximo build a sobrescreve.
 */

declare(strict_types=1);

/* As duas constantes abaixo são preenchidas no build, a partir de
 * src/config/tracking.ts e src/config/site.ts. */
const PIXEL_ID = '__PIXEL_ID__';
const GRAPH_VERSION = 'v21.0';
const ORIGEM = '__ORIGEM__';

/** Só estes três. Purchase não está aqui de propósito: a compra acontece na
 *  Kiwify, e o site não tem como sabê-la. */
const EVENTOS_PERMITIDOS = ['PageView', 'ViewContent', 'InitiateCheckout'];

const LIMITE_CORPO = 4096;      // bytes de JSON aceitos
const LIMITE_JANELA = 60;       // eventos
const JANELA_SEGUNDOS = 300;    // por IP, a cada 5 minutos

header('Cache-Control: no-store');
header('Content-Type: application/json; charset=utf-8');

/**
 * Resposta curta e sem detalhe.
 *
 * Mensagem de erro é superfície: dizer "token ausente" ou "assinatura
 * inválida" conta ao atacante em que etapa ele parou. Aqui sai só o estado.
 * O token jamais aparece, nem em erro, nem em log.
 */
function responder(int $status, string $estado): void
{
    http_response_code($status);
    echo json_encode(['status' => $estado], JSON_UNESCAPED_SLASHES);
    exit;
}

/* ── 1. Método ───────────────────────────────────────────────── */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder(405, 'metodo');
}

/* ── 2. Origem ───────────────────────────────────────────────── */

/* Só o próprio site chama este endpoint. Não é autenticação (cabeçalho se
 * forja), mas corta o tráfego automatizado trivial e deixa explícito que
 * não existe uso legítimo de fora. Nenhum CORS é liberado: sem
 * Access-Control-Allow-Origin, o navegador de outra origem nem lê a
 * resposta. */
$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origem === '') {
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $origem = $referer !== '' ? (parse_url($referer, PHP_URL_SCHEME) . '://' . parse_url($referer, PHP_URL_HOST)) : '';
}
if ($origem !== ORIGEM) {
    responder(403, 'origem');
}

/* ── 3. Corpo ────────────────────────────────────────────────── */

$bruto = file_get_contents('php://input');
if ($bruto === false || $bruto === '' || strlen($bruto) > LIMITE_CORPO) {
    responder(400, 'corpo');
}

$dados = json_decode($bruto, true);
if (!is_array($dados)) {
    responder(400, 'json');
}

/* ── 4. Evento ───────────────────────────────────────────────── */

$evento = is_string($dados['event_name'] ?? null) ? $dados['event_name'] : '';
if (!in_array($evento, EVENTOS_PERMITIDOS, true)) {
    responder(422, 'evento');
}

/* event_id é o que permite a Meta reconhecer que o evento do navegador e o
 * do servidor são o mesmo acontecimento. Formato fechado: UUID ou o
 * identificador curto do runtime. */
$eventId = is_string($dados['event_id'] ?? null) ? $dados['event_id'] : '';
if (!preg_match('/^[A-Za-z0-9_-]{8,64}$/', $eventId)) {
    responder(422, 'event_id');
}

/* A URL de origem precisa ser uma página do próprio site. */
$url = is_string($dados['event_source_url'] ?? null) ? $dados['event_source_url'] : '';
if ($url === '' || strlen($url) > 500 || strpos($url, ORIGEM . '/') !== 0) {
    responder(422, 'event_source_url');
}

/* ── 5. custom_data, campo a campo ───────────────────────────── */

/**
 * Lista fechada. O que não está aqui é descartado em silêncio, em vez de
 * seguir para a Meta: repassar o que chegar transformaria o endpoint num
 * canal aberto para escrever qualquer coisa no dataset.
 */
function limparCustomData(array $entrada): array
{
    $saida = [];

    $texto = static function ($v, int $max): ?string {
        if (!is_string($v)) {
            return null;
        }
        $v = trim($v);
        return $v === '' ? null : mb_substr($v, 0, $max);
    };

    foreach (['content_name' => 200, 'content_category' => 100] as $campo => $max) {
        $v = $texto($entrada[$campo] ?? null, $max);
        if ($v !== null) {
            $saida[$campo] = $v;
        }
    }

    if (isset($entrada['content_type']) && in_array($entrada['content_type'], ['product', 'article'], true)) {
        $saida['content_type'] = $entrada['content_type'];
    }

    if (isset($entrada['content_ids']) && is_array($entrada['content_ids'])) {
        $ids = [];
        foreach (array_slice($entrada['content_ids'], 0, 5) as $id) {
            $id = $texto($id, 100);
            if ($id !== null) {
                $ids[] = $id;
            }
        }
        if ($ids !== []) {
            $saida['content_ids'] = $ids;
        }
    }

    if (isset($entrada['value']) && is_numeric($entrada['value'])) {
        $valor = (float) $entrada['value'];
        if ($valor >= 0 && $valor <= 100000) {
            $saida['value'] = $valor;
        }
    }

    if (isset($entrada['currency']) && is_string($entrada['currency'])
        && preg_match('/^[A-Z]{3}$/', $entrada['currency'])) {
        $saida['currency'] = $entrada['currency'];
    }

    if (isset($entrada['num_items']) && is_int($entrada['num_items'])
        && $entrada['num_items'] >= 1 && $entrada['num_items'] <= 10) {
        $saida['num_items'] = $entrada['num_items'];
    }

    return $saida;
}

$customData = is_array($dados['custom_data'] ?? null)
    ? limparCustomData($dados['custom_data'])
    : [];

/* ── 6. Freio por IP ─────────────────────────────────────────── */

/**
 * Contagem simples numa janela deslizante, em arquivo temporário.
 *
 * Não é defesa contra ataque distribuído, e não pretende ser: serve para
 * um script sozinho não conseguir encher o dataset. Qualquer falha de
 * escrita libera a passagem em vez de derrubar a medição: é freio, não
 * porta.
 */
function dentroDoLimite(string $ip): bool
{
    $arquivo = sys_get_temp_dir() . '/bookgo-capi-' . substr(hash('sha256', $ip), 0, 24);
    $agora = time();

    $fp = @fopen($arquivo, 'c+');
    if ($fp === false) {
        return true;
    }
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return true;
    }

    $conteudo = stream_get_contents($fp);
    $estado = json_decode((string) $conteudo, true);
    if (!is_array($estado) || !isset($estado['ate'], $estado['n']) || $estado['ate'] < $agora) {
        $estado = ['ate' => $agora + JANELA_SEGUNDOS, 'n' => 0];
    }
    $estado['n']++;
    $permitido = $estado['n'] <= LIMITE_JANELA;

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($estado));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    return $permitido;
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
if ($ip !== '' && !dentroDoLimite($ip)) {
    responder(429, 'limite');
}

/* ── 7. Token, só aqui ───────────────────────────────────────── */

/**
 * Duas origens possíveis, nenhuma versionada:
 *
 *  1. variável de ambiente do servidor, quando a hospedagem permitir;
 *  2. api/credenciais.php, escrito no deploy a partir do GitHub Secret.
 *
 * Sem token, o endpoint devolve 503 e nada é enviado. Ele nunca é impresso,
 * nem em resposta, nem em log, nem em mensagem de erro.
 */
function lerToken(): string
{
    $env = getenv('META_CAPI_ACCESS_TOKEN');
    if (is_string($env) && $env !== '') {
        return $env;
    }

    $arquivo = __DIR__ . '/credenciais.php';
    if (is_file($arquivo)) {
        /** @var mixed $credenciais */
        $credenciais = require $arquivo;
        if (is_array($credenciais) && is_string($credenciais['meta_capi_access_token'] ?? null)) {
            return $credenciais['meta_capi_access_token'];
        }
    }

    return '';
}

$token = lerToken();
if ($token === '' || PIXEL_ID === '') {
    responder(503, 'indisponivel');
}

/* ── 8. Montagem do evento ───────────────────────────────────── */

/**
 * user_data traz apenas o que o servidor realmente observa.
 *
 * Nada de e-mail, telefone, nome ou endereço: o BookGo não coleta esses
 * dados em nenhum formulário, e inventá-los seria enviar dado pessoal
 * falso para a Meta. IP e user-agent são os parâmetros técnicos que a
 * própria requisição carrega.
 */
$userData = [];
if ($ip !== '') {
    $userData['client_ip_address'] = $ip;
}
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
if (is_string($ua) && $ua !== '') {
    $userData['client_user_agent'] = mb_substr($ua, 0, 500);
}

/* fbp e fbc são cookies que o próprio Pixel grava no navegador. Não são
 * dado pessoal declarado: são os identificadores que a Meta já usa do lado
 * do browser, e reenviá-los é o que faz o evento do servidor casar com o
 * mesmo visitante. Só existem se o Pixel tiver carregado, o que só acontece
 * depois do aceite em marketing. */
foreach (['_fbp' => 'fbp', '_fbc' => 'fbc'] as $cookie => $campo) {
    $v = $_COOKIE[$cookie] ?? null;
    if (is_string($v) && $v !== '' && strlen($v) <= 255 && preg_match('/^[A-Za-z0-9._-]+$/', $v)) {
        $userData[$campo] = $v;
    }
}

$evento_payload = [
    'event_name' => $evento,
    'event_time' => time(),
    'event_id' => $eventId,
    'event_source_url' => $url,
    'action_source' => 'website',
    'user_data' => $userData,
];
if ($customData !== []) {
    $evento_payload['custom_data'] = $customData;
}

$corpo = [
    'data' => [$evento_payload],
    'access_token' => $token,
];

/* Código de teste só por variável de ambiente. Nunca fica fixo no código:
 * um test_event_code esquecido em produção manda a conversão real para a
 * aba de testes e ela não conta em campanha nenhuma. */
$teste = getenv('META_CAPI_TEST_EVENT_CODE');
if (is_string($teste) && $teste !== '') {
    $corpo['test_event_code'] = $teste;
}

/* ── 9. Envio ────────────────────────────────────────────────── */

/* O token vai no CORPO da requisição, nunca na query string: query string
 * entra em log de servidor, em proxy e no histórico de qualquer
 * intermediário. */
$endpoint = 'https://graph.facebook.com/' . GRAPH_VERSION . '/' . PIXEL_ID . '/events';

$ch = curl_init($endpoint);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($corpo, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 5,
    CURLOPT_CONNECTTIMEOUT => 3,
]);
$resposta = curl_exec($ch);
$httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

/* A resposta da Meta não é repassada: ela pode ecoar partes da requisição,
 * e o navegador não precisa dela para nada. Sai só se deu certo. */
if ($resposta === false || $httpCode < 200 || $httpCode >= 300) {
    responder(502, 'upstream');
}

responder(200, 'ok');
