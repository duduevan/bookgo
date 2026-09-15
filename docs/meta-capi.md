# Meta: Pixel, Conversions API e verificação de domínio

Tudo que a BookGo manda para a Meta passa por três peças, e só por elas:

| Peça | Onde | O que faz |
|---|---|---|
| Verificação de domínio | `SITE.metaDomainVerification` | prova posse de `bookgo.com.br` |
| Meta Pixel | runtime em `TrackingHead.astro` | eventos do navegador |
| Conversions API | `src/server/meta-capi.php` | os mesmos eventos, pelo servidor |

Pixel e conjunto de dados: **`28163448079989110`**, em
`TRACKING.meta.pixelId` (`src/config/tracking.ts`). Não existe segundo pixel,
e nenhum arquivo escreve esse número à mão: o PHP publicado recebe o valor no
build.

---

## Verificação de domínio

```html
<meta name="facebook-domain-verification" content="...">
```

Sai de `SITE.metaDomainVerification` e é emitida por `BaseLayout`, uma vez por
página, em todas as páginas públicas.

Ela **não** depende do consentimento nem da chave mestra de medição, e é por
isso que mora em `src/config/site.ts` e não em `TRACKING`: é etiqueta de posse
do domínio, da mesma natureza da do Search Console. Não grava nada, não coleta
nada, não acompanha navegação. Desligar o Pixel não pode derrubá-la.

---

## Consentimento

A categoria é `advertising`, e ela é **independente** de `analytics`. Quem
aceita ser medido não aceita, por tabela, ser reconhecido em campanha.

| Escolha | GA4 | Meta Pixel | Conversions API |
|---|---|---|---|
| sem decisão | não carrega | não carrega | não envia |
| só analytics | carrega | **não carrega** | **não envia** |
| só marketing | não carrega | carrega | envia |
| tudo | carrega | carrega | envia |

A Conversions API segue exatamente a mesma decisão do Pixel. Ela não existe
para contornar a recusa: `capiSend` só roda depois de o Pixel ter sido
inicializado, o que só acontece com `advertising` aceito.

---

## Eventos

Mapa completo, em `TrackingHead.astro`. O que não está aqui não vira evento
na Meta.

| Evento BookGo | Meta | Onde |
|---|---|---|
| `page_view` | `PageView` (pelo `init` do Pixel) | toda página |
| `view_content` | `ViewContent` | artigos e comparativos |
| `product_view` | `ViewContent` | landing page do produto |
| `checkout_click` | `InitiateCheckout` | clique no CTA de compra da LP |
| `product_click` | nada | clique de artigo para a LP |
| `affiliate_click` | nada | clique em loja de afiliado |
| `consent_update` | nada | decisão de consentimento |

Três ausências são decisões, não esquecimento:

- **`product_click` não vira nada.** É um clique de artigo para a landing
  page. Não é visualização de conteúdo nem início de compra, e mapeá-lo para
  qualquer um dos dois inventaria um momento de funil que não aconteceu.
- **`affiliate_click` não vira `InitiateCheckout`.** Ele leva a uma loja de
  terceiro. Contá-lo como início de compra da BookGo misturaria receita de
  afiliado com venda do produto próprio e estragaria a otimização das
  campanhas. A estratégia de Meta para afiliados é outro assunto.
- **`Purchase` não sai daqui, por Pixel nem por CAPI.** Clique no checkout é
  intenção; quem conhece a transação é a Kiwify. `Purchase` só entra quando
  houver confirmação real de pagamento, por webhook da plataforma ou
  equivalente. O endpoint recusa o evento explicitamente: `Purchase` não está
  na lista de permitidos, e uma chamada com esse nome responde 422 sem tocar
  na Graph API.

---

## Deduplicação

Cada evento ganha um `event_id` gerado no navegador (`crypto.randomUUID`, com
queda para um identificador curto onde ele não existir). O mesmo id vai:

- para o Pixel, como `eventID`;
- para o retransmissor, no corpo da requisição;
- para o `dataLayer`, no campo `event_id`.

A Meta recebe o mesmo `event_name` com o mesmo `event_id` por dois caminhos e
conta uma vez só.

O `event_id` **não** é repassado ao GA4: a deduplicação é assunto da Meta, e
acrescentar um parâmetro novo mudaria os eventos que já estão sendo coletados.

---

## O retransmissor

`src/server/meta-capi.php` é publicado em `/api/meta-capi.php`. O build
substitui duas constantes, o pixel e o domínio canônico, a partir de
`src/config/tracking.ts` e `src/config/site.ts`.

**Não é um proxy da Graph API.** Antes de existir qualquer requisição para a
Meta, ele exige:

| Checagem | Recusa |
|---|---|
| método `POST` | 405 |
| `Origin` (ou `Referer`) igual ao domínio canônico | 403 |
| corpo JSON de até 4 KB | 400 |
| `event_name` em `PageView`, `ViewContent`, `InitiateCheckout` | 422 |
| `event_id` casando `^[A-Za-z0-9_-]{8,64}$` | 422 |
| `event_source_url` dentro do domínio | 422 |
| até 60 eventos por IP a cada 5 minutos | 429 |

`custom_data` passa por uma lista fechada campo a campo: `content_name`,
`content_category`, `content_type`, `content_ids`, `value`, `currency`,
`num_items`, cada um com tipo e tamanho conferidos. O que não está na lista é
descartado em vez de seguir para a Meta.

### user_data

Só o que o servidor realmente observa:

- `client_ip_address` e `client_user_agent`, da própria requisição;
- `fbp` e `fbc`, os cookies que o **próprio Pixel** gravou, quando existem.

**Nada de e-mail, telefone, nome ou endereço.** O site não coleta esses dados
em formulário nenhum, e enviar campo inventado seria mandar dado pessoal falso
para a Meta.

`action_source` é sempre `website`, e `event_time` é o relógio do servidor,
não um valor vindo do navegador.

---

## O token

`META_CAPI_ACCESS_TOKEN` é o segredo da integração e **não existe no
repositório**. O endpoint procura por ele em duas fontes, nesta ordem:

1. variável de ambiente `META_CAPI_ACCESS_TOKEN`, quando a hospedagem
   permitir defini-la;
2. `api/credenciais.php`, escrito **no deploy** a partir do GitHub Secret de
   mesmo nome.

Sem token, o endpoint responde `503` e nenhum evento server-side sai. A página
continua funcionando e o Pixel do navegador segue normal: a medição
server-side para, o site não.

### Como ele chega ao servidor

No workflow de deploy, depois do build e antes do envio por FTPS:

```
GitHub Secret  →  dist/api/credenciais.php  →  FTPS  →  document root
```

O valor entra no arquivo em base64, para que nenhum caractere dele possa
escapar da string PHP. Não é cifra, é quoting seguro: quem tiver o arquivo
tem o token.

Três proteções, e é preciso que as três continuem valendo:

- **`.gitignore`** ignora `credenciais.php`, então ele não volta para o
  repositório por descuido;
- **`public/.htaccess`** tem uma regra `<Files "credenciais.php">` que nega o
  acesso pela web. O PHP consegue incluir o arquivo; o navegador recebe 403;
- **o deploy falha** se o token aparecer em qualquer arquivo de `dist/` que
  não seja o próprio `credenciais.php`. É a rede de segurança contra o dia em
  que alguém colar o token na configuração do site por engano.

Nenhuma dessas etapas imprime o valor. As respostas do endpoint são
`{"status":"..."}` e nada mais: mensagem de erro detalhada conta ao atacante
em que etapa ele parou.

### Trocar o token

Basta atualizar o GitHub Secret e rodar o deploy. Nenhum arquivo do
repositório muda.

### Testar com o Test Events da Meta

O código de teste é lido da variável de ambiente
`META_CAPI_TEST_EVENT_CODE`, e **nunca fica fixo no código**: um
`test_event_code` esquecido em produção manda a conversão real para a aba de
testes, onde ela não conta em campanha nenhuma.

---

## Conferir

```bash
node scripts/verificar-meta.mjs https://bookgo.com.br
```

O script abre o site no Chromium e lê o tráfego real: a meta de verificação de
domínio, o que sai (e o que não sai) antes do consentimento, os eventos do
Pixel com o `eventID`, as chamadas ao retransmissor, o casamento entre os dois
e as recusas do endpoint. Também confere que `api/credenciais.php` não é
servido.

**Ele não roda no ambiente onde o site é escrito:** o gateway de saída nega o
CONNECT para `connect.facebook.net` e `graph.facebook.com`, então o Pixel
nunca carregaria e o teste passaria por não observar nada. Rode-o pelo
workflow **Conferir a integração com a Meta**, que executa no runner.
