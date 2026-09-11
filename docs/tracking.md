# Tracking, consentimento e medição

Estado atual: **tudo desligado**. Nenhum script de terceiro, nenhum ID
configurado, nenhum cookie próprio, 0 KB de JavaScript no cliente.

Este documento diz onde cada ID entra e o que acontece quando entra.

---

## Onde fica cada ID

Arquivo único: **`src/config/tracking.ts`**. Nenhum ID vive fora dele.

| O que | Campo | Formato |
|---|---|---|
| Google Tag Manager | `gtm.id` | `GTM-XXXXXXX` |
| GA4 | `ga4.measurementId` | `G-XXXXXXXXXX` |
| Meta Pixel | `meta.pixelId` | só dígitos |
| Google Ads | `googleAds.id` | `AW-XXXXXXXXX` |
| Google Ads (conversão) | `googleAds.conversionLabel` | string do painel |
| Search Console | `googleSiteVerification` em `src/config/site.ts` | token do método "tag HTML" |
| AdSense | `ADS.adsenseClient` em `src/config/site.ts` | `ca-pub-XXXXXXXXXXXXXXXX` |

`enabled: false` é a chave mestra: com ela desligada nada é renderizado, mesmo
com IDs preenchidos. **Nunca preencha com valor de exemplo** — um ID fictício
carrega script de verdade e polui dados de terceiros.

---

## Como ligar

1. Preencha o ID do fornecedor em `src/config/tracking.ts`.
2. Mude `enabled` para `true`.
3. `npm run build` e confira o HTML gerado antes de publicar.

A partir daí o banner de consentimento passa a existir sozinho, porque passa a
haver algo a consentir.

---

## Google Tag Manager

É o contêiner preferencial. GA4, Google Ads e, se for o caso, o Meta Pixel
entram como tags **dentro** dele, em vez de virarem scripts soltos no site.

Com `consent.required = true` (o padrão), o container **não** é carregado no
HTML inicial: ele entra por JavaScript depois que o visitante aceita. Recusar
significa não carregar nada — nem o GTM, que sozinho já abre conexão com o
Google.

O `<noscript>` do GTM só é emitido quando `consent.required = false`. Um iframe
em noscript dispara sem passar por nenhuma decisão, então é incompatível com a
postura de não coletar antes do aceite. A troca é consciente: preferimos perder
a medição de quem navega sem JavaScript a coletar sem permissão.

## GA4

**Decisão: o GA4 é gerenciado pelo GTM.**

Com `gtm.id` preenchido, este projeto **não** carrega o `gtag.js`. Carregar o
GA4 pelo GTM e diretamente ao mesmo tempo dispara `page_view` duas vezes e
infla a contagem de sessões.

`ga4.measurementId` continua aqui para documentar qual propriedade está em uso.
`ga4.loadDirectlyWithoutGtm` só tem efeito quando **não** existe GTM.

Configuração no GTM:

1. Tag "Google Tag" com o `measurementId`.
2. Acionador: *Consent Initialization* → *All Pages*.
3. Os eventos da BookGo chegam como eventos de dataLayer (ver abaixo) e viram
   tags GA4 do tipo "evento".

## Meta Pixel

Eventos previstos:

| Evento | Onde dispara |
|---|---|
| `PageView` | site BookGo |
| `ViewContent` | site BookGo (artigo e LP) |
| `InitiateCheckout` | **Kiwify** |
| `Purchase` | **Kiwify** |

**O site BookGo não dispara `Purchase`.** Clique no checkout é intenção, não
compra: quem conhece a transação é a plataforma de pagamento. Disparar
`Purchase` no clique inflaria a conversão e estragaria a otimização da campanha.

Preferência: instalar o Pixel **pelo GTM**. Se `gtm.id` estiver vazio e
`meta.pixelId` preenchido, o projeto carrega o Pixel direto, como fallback.

## Google Ads

`googleAds.id` e `conversionLabel` existem para o caso de haver tag direta.

**A conversão de compra real fica preferencialmente na Kiwify.** Cuidado com
duplicidade: se a conversão do Google Ads for **importada do GA4** e além disso
existir uma tag de conversão direta no site, a mesma venda é contada duas vezes.
Escolha um caminho:

- **Recomendado:** Purchase na Kiwify → GA4 → importado como conversão no Google Ads.
- Alternativa: tag de conversão direta na Kiwify, sem importar do GA4.

## Consent Mode

Os defaults do Google Consent Mode são enviados **antes de qualquer tag**, com
tudo negado:

```
ad_storage, ad_user_data, ad_personalization, analytics_storage → denied
functionality_storage, security_storage → granted
wait_for_update: 500
```

Na decisão do visitante sai um `consent update` com o estado escolhido. Como o
GTM só carrega depois do aceite, ele já encontra o estado correto.

Quando o GTM entrar, o acionador *Consent Initialization* deve rodar antes de
tudo — é o comportamento padrão do GTM e não exige configuração extra aqui.

## Consentimento

Banner discreto no rodapé, sem popup nem bloqueio de conteúdo. Duas ações com
o **mesmo peso visual e o mesmo tamanho de alvo**: `Aceitar` e
`Recusar não essenciais`. Nada vem pré-selecionado e recusar não exige passos
extras — sem dark pattern.

Categorias: `analytics` e `advertising`. A preferência fica no `localStorage`,
sob a chave `bookgo-consent`:

```json
{ "analytics": true, "advertising": true, "ts": "2026-09-11T21:00:00.000Z" }
```

Enquanto não houver decisão, **nada carrega**.

O banner só existe quando há algo a consentir: sem fornecedor configurado e sem
AdSense ligado, ele não é renderizado — e por isso o site segue hoje com 0 KB
de JavaScript.

## AdSense

Configurado em `src/config/site.ts` (`ADS`), desligado. Quando for ligado, ele
passa a contar como motivo para o banner aparecer, e a categoria `advertising`
é quem deve controlá-lo. Ver a seção "Publicidade" do `CLAUDE.md`.

---

## Eventos BookGo

Camada independente de fornecedor. O site dispara; os provedores escutam.

```js
window.bookgo.track('checkout_click', { product_slug: '...', value: 37 });
```

Tudo entra no `dataLayer` como `{ event: '<nome>', ...params }`.

| Evento | Quando | Parâmetros |
|---|---|---|
| `page_view` | toda página | `page_path`, `page_title` |
| `view_content` | artigo | `content_type`, `content_slug`, `content_title`, `category` |
| `product_view` | landing page | `product_slug`, `product_name`, `value`, `currency` |
| `checkout_click` | clique no CTA de checkout | `product_slug`, `product_name`, `value`, `currency`, `placement` |
| `affiliate_click` | reservado para o futuro sistema de afiliados | a definir |
| `consent_update` | decisão de consentimento | `consent_analytics`, `consent_advertising` |

Em HTML, um clique vira evento com dois atributos, gerados por `eventAttrs()`:

```html
<a data-bookgo-event="checkout_click" data-bookgo-params='{"value":37}'>
```

Com o tracking desligado, `eventAttrs()` devolve `{}` e **nenhum atributo é
emitido** — o HTML de hoje sai idêntico ao que já estava em produção.

`affiliate_click` ainda não tem emissor: o catálogo de afiliados é outro
sistema e virá depois.

---

## Kiwify — estratégia de integração

Falta a URL final de checkout e os IDs. Quando existirem:

| Camada | Responsabilidade |
|---|---|
| **BookGo** | `PageView`, `ViewContent`, `checkout_click` |
| **Kiwify** | `InitiateCheckout`, `Purchase` |
| **Meta** | Pixel + Conversions API configurados na Kiwify |
| **GA4** | mesma propriedade nos dois domínios, com lista de exclusão de referência para a Kiwify não aparecer como origem |
| **Google Ads** | conversão de compra preferencialmente na Kiwify |

Ponto de atenção: sem a exclusão de referência no GA4, o retorno da Kiwify
inicia uma sessão nova e a compra é atribuída à própria Kiwify em vez da
campanha que trouxe a pessoa.

---

## Search Console

1. Em `src/config/site.ts`, preencha `googleSiteVerification` com o valor do
   método **"tag HTML"** do Search Console — só o conteúdo do `content`, não a
   tag inteira. Com `null`, nada é renderizado.
2. `npm run build` e publique.
3. No Search Console, clique em **Verificar**.
4. Envie o sitemap:

```
https://bookgo.com.br/sitemap-index.xml
```

Alternativa sem código: verificação por **registro DNS TXT** no domínio, que
não depende de deploy e sobrevive a qualquer mudança no site.
