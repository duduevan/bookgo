import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { ICON_NAMES } from './lib/icons';

/* ------------------------------------------------------------------ */
/*  Blocos reutilizáveis                                               */
/* ------------------------------------------------------------------ */

/**
 * Nome de ícone da grade da BookGo.
 *
 * Validado contra `src/lib/icons.ts`: nome inexistente quebra o build, em vez
 * de renderizar um buraco na página. É opcional de propósito — sem ícone, o
 * cartão fica só com título e texto, que é o padrão.
 */
const iconName = z.enum(ICON_NAMES as [string, ...string[]]);

const titledItem = z.object({
  title: z.string(),
  text: z.string(),
  /** Opcional. Só onde o ícone acrescenta leitura; ver src/lib/icons.ts. */
  icon: iconName.optional(),
});

const section = z.object({
  title: z.string(),
  intro: z.string().optional(),
});


/* ------------------------------------------------------------------ */
/*  Depoimentos                                                        */
/* ------------------------------------------------------------------ */

/**
 * Prova social.
 *
 * Regra do projeto, sem exceção: **nenhum depoimento é inventado**. Só entra
 * aqui texto que uma pessoa real escreveu e autorizou a publicar. Enquanto
 * isso não existir, `enabled` fica false e a seção não é renderizada — a LP
 * sai byte por byte igual à de hoje.
 *
 * O refinamento abaixo impede o pior dos casos: ligar a seção sem ter o que
 * mostrar. `enabled: true` com `items` vazio quebra o build.
 */
const testimonialBase = {
  /** Nome como a pessoa autorizou publicar. */
  name: z.string(),
  /**
   * Arquivo em `src/assets/testimonials/`. Sem avatar, o componente usa as
   * iniciais do nome — derivar é honesto, gerar um rosto não seria.
   */
  avatar: z.string().optional(),
};

const testimonialCard = z.object({
  type: z.literal('card'),
  ...testimonialBase,
  /** Contexto curto da pessoa, quando ela autorizou. */
  role: z.string().optional(),
  text: z.string(),
});

const testimonialPhone = z.object({
  type: z.literal('phone'),
  ...testimonialBase,
  /** Linha sob o nome no cabeçalho da conversa. Decorativa. */
  status: z.string().optional(),
  messages: z
    .array(
      z.object({
        /** `incoming` = a pessoa; `outgoing` = a BookGo. */
        side: z.enum(['incoming', 'outgoing']),
        text: z.string(),
        /** Horário exibido na bolha. Decorativo. */
        time: z.string().optional(),
        /** Confirmação de leitura. Só faz sentido em `outgoing`. */
        read: z.boolean().default(false),
      })
    )
    .min(1),
});

const testimonials = z
  .object({
    /** Chave mestra da seção. Sem depoimento real, fica false. */
    enabled: z.boolean().default(false),
    /**
     * Conteúdo de demonstração, para avaliar o desenho antes de existirem
     * depoimentos reais.
     *
     * Com `true`, a seção renderiza uma tarja visível dizendo que aquilo é
     * exemplo de layout. A tarja é deliberada: um aviso que mora só no
     * código deixa de existir no momento em que mais importa, que é quando
     * alguém publica sem lembrar. Aqui, publicar por engano fica óbvio na
     * própria página.
     */
    demo: z.boolean().default(false),
    title: z.string().optional(),
    intro: z.string().optional(),
    items: z
      .array(z.discriminatedUnion('type', [testimonialCard, testimonialPhone]))
      .default([]),
  })
  .default({ enabled: false, items: [] })
  .refine((t) => !t.enabled || t.items.length > 0, {
    message:
      'testimonials.enabled é true mas items está vazio. Depoimento não se inventa: preencha com texto real e autorizado, ou volte enabled para false.',
  })
  .refine((t) => !(t.enabled && !t.demo) || t.items.length > 0, {
    message:
      'Seção de depoimentos ligada fora do modo demonstração exige itens reais e autorizados.',
  });

/* ------------------------------------------------------------------ */
/*  Produtos — content/products/<slug>/index.yaml                      */
/*  Toda a copy da landing page vive aqui. Nenhum componente contém    */
/*  texto específico de produto.                                       */
/* ------------------------------------------------------------------ */

/**
 * Identidade visual do produto.
 *
 * As landing pages não usam o azul institucional: cada produto traz sua
 * paleta, que vira custom properties no escopo da LP (src/lib/theme.ts).
 * Campos derivados (faixa alternada, fundo suave) não entram aqui — são
 * calculados a partir do primary para evitar redundância.
 */
const theme = z.object({
  primary: z.string(),
  primaryDark: z.string(),
  accent: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  muted: z.string(),
  border: z.string(),
  /** Cor do texto sobre `primary`. Padrão branco. */
  onPrimary: z.string().optional(),
});

/**
 * Imagem editorial da landing page.
 *
 * Mesma convenção das imagens de artigo: metadados no YAML, arquivo em
 * `src/assets/products/<slug>/`. `placement` diz em qual âncora da página ela
 * entra — a LP é gerada, então a posição precisa ser dado, não markup.
 *
 * Arquivo ainda inexistente não quebra o build e não deixa buraco: o slot
 * não renderiza e o build lista o que falta.
 */
const productImageEntry = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id deve ser minúsculo, com hífens'),
  src: z.string().regex(/\.(webp|avif|jpe?g|png)$/i),
  alt: z.string().min(15).max(180),
  caption: z.string().optional(),
  /** Âncoras conhecidas pela página do produto. */
  placement: z.enum(['after-method', 'after-materials', 'before-offer']),
});

const products = defineCollection({
  loader: glob({
    pattern: '*/index.yaml',
    base: './content/products',
    // O id do produto é o nome do diretório, que também é o slug da URL.
    generateId: ({ entry }) => entry.split('/')[0]!,
  }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    /** Frase curta usada em cards e no CTA contextual do blog. */
    tagline: z.string(),

    theme,

    /** Promessa central — base da descrição do schema Product. */
    promise: z.string(),

    price: z.object({
      amount: z.number().positive(),
      currency: z.string().default('BRL'),
      display: z.string(),
    }),

    checkout: z.object({
      provider: z.enum(['kiwify']),
      /** `null` enquanto a URL não for fornecida. O CTA não vira link inválido. */
      url: z.string().url().nullable().default(null),
      cta: z.string(),
    }),

    seo: z.object({
      title: z.string(),
      description: z.string(),
      ogImage: z.string().optional(),
    }),

    hero: z.object({
      /** Sobrelinha curta acima do título. Ex.: o nome do método. */
      eyebrow: z.string().optional(),
      headline: z.string(),
      subheadline: z.string(),
      /**
       * Reforços curtos — fatos sobre o produto, nunca prova social.
       * Viram o cartão flutuante da composição do hero.
       */
      highlights: z
        .array(z.object({ text: z.string(), icon: iconName.optional() }))
        .default([]),
      /**
       * Imagem editorial do hero. Nome do arquivo dentro de
       * `src/assets/products/<slug>/`. Sem ela, o hero usa só a
       * ambientação em CSS.
       */
      image: z.string().optional(),
      imageAlt: z.string().optional(),
    }),

    /**
     * Publicidade nesta LP. Decisão produto a produto: um material pode
     * valer a pena monetizar e outro não. Desligado por padrão, e ainda
     * assim só aparece se a posição global estiver ligada.
     */
    ads: z
      .object({ pageEnd: z.boolean().default(false) })
      .default({ pageEnd: false }),

    problem: section.extend({
      items: z.array(z.string()),
      close: z.string().optional(),
    }),

    method: section.extend({
      /** Nome do mecanismo, ex.: "O Método dos 15 Minutos". */
      name: z.string(),
      pillars: z.array(titledItem),
      note: z.string().optional(),
    }),

    benefits: section.extend({
      items: z.array(titledItem),
    }),

    howItWorks: section.extend({
      steps: z.array(titledItem),
    }),

    contents: section.extend({
      modules: z.array(
        z.object({
          number: z.number().int().positive(),
          title: z.string(),
          objective: z.string(),
        })
      ),
    }),

    materials: section.extend({
      /**
       * `mockup` é opcional: o cartão fica completo sem ele. Quando o
       * arquivo existir em `src/assets/products/<slug>/`, o quadro aparece
       * com a proporção já reservada — sem reconstruir a seção.
       */
      items: z.array(titledItem.extend({ mockup: z.string().optional() })),
    }),

    /** Cabeçalho comum aos dois blocos de público. */
    audience: section,
    forWho: section.extend({ items: z.array(z.string()) }),
    notForWho: section.extend({ items: z.array(z.string()) }),

    offer: section.extend({
      includes: z.array(z.string()),
      priceNote: z.string().optional(),
      /**
       * Reasseguranças exibidas sob o botão. **Fatos do produto**, nunca
       * prova social, número de alunos ou escassez — ver as regras de
       * conteúdo do CLAUDE.md.
       */
      reassurances: z
        .array(z.object({ icon: iconName, text: z.string() }))
        .default([]),
    }),

    guarantee: section.extend({
      text: z.string(),
      icon: iconName.optional(),
    }),

    /** Desligado por padrão; ver o bloco `testimonials` acima. */
    testimonials,

    /** Imagens editoriais distribuídas pela página. */
    images: z.array(productImageEntry).default([]),

    faq: section.extend({
      items: z.array(z.object({ q: z.string(), a: z.string() })),
    }),

    finalCta: z.object({
      title: z.string(),
      text: z.string(),
    }),
  }),
});

/* ------------------------------------------------------------------ */
/*  Categorias — content/categories/<slug>.yaml                        */
/* ------------------------------------------------------------------ */

const categories = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './content/categories' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),

    /** Título editorial do hub. Sem ele, usa `name`. */
    headline: z.string().optional(),
    /** Um ou dois parágrafos de abertura do hub. */
    intro: z.array(z.string()).default([]),
    /** Recortes que a categoria cobre — orienta leitor e rastreador. */
    subtopics: z
      .array(z.object({ title: z.string(), text: z.string() }))
      .default([]),
    /** Produto da categoria, quando houver. */
    relatedProduct: reference('products').optional(),
    /**
     * Copy do CTA do produto neste hub. Sem ela, o CTA usa o nome e a
     * tagline do próprio produto — nunca fica vazio.
     */
    productCta: z
      .object({
        label: z.string().optional(),
        headline: z.string(),
        text: z.string(),
        buttonLabel: z.string(),
      })
      .optional(),

    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
      })
      .default({}),
    order: z.number().int().default(100),
  }),
});


/* ------------------------------------------------------------------ */
/*  Blocos editoriais do artigo                                        */
/* ------------------------------------------------------------------ */

/**
 * Imagem editorial dentro do artigo.
 *
 * Todos os metadados ficam aqui, no frontmatter. O corpo do MDX carrega
 * apenas `<ArticleImage id="..." />` no ponto exato onde a imagem entra —
 * a posição é decisão editorial e pertence ao texto; alt, legenda e crédito
 * são dados e pertencem ao cabeçalho.
 *
 * `src` é só o nome do arquivo. A imagem vive em
 * `src/assets/blog/<categoria>/<slug>/`, para passar pelo astro:assets e
 * sair com dimensões reais, srcset e formato moderno — mesma convenção já
 * usada pelas imagens de produto.
 */
const articleImage = z.object({
  /** Referência usada no corpo do MDX. Minúsculas, hífens. */
  id: z
    .string()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'id de imagem deve ser minúsculo, com hífens: "bancada-cozinha"'
    ),
  /** Nome do arquivo, descritivo. Nada de IMG001.webp. */
  src: z.string().regex(/\.(webp|avif|jpe?g|png)$/i),
  /**
   * Descreve a cena e a função dela naquele contexto. Não é campo de
   * palavra-chave: ver o refinamento contra keyword stuffing abaixo.
   */
  alt: z.string().min(15).max(180),
  /** Só quando acrescenta informação editorial que o texto não dá. */
  caption: z.string().optional(),
  credit: z.string().optional(),
});

/**
 * CTA contextual do produto BookGo.
 *
 * A copy vive no artigo, não no componente: ela precisa conversar com o
 * assunto que a pessoa acabou de ler. Um banner idêntico repetido em todos
 * os artigos é justamente o que não queremos.
 *
 * `inline` é renderizado onde o corpo traz `<ProductCtaHere />`; o ponto
 * editorial é escolhido por quem escreve, não calculado por porcentagem.
 */
const productCta = z.object({
  placement: z.enum(['none', 'inline', 'end', 'inline-and-end']),
  /** Sobrelinha curta. */
  label: z.string().default('Material relacionado'),
  headline: z.string().min(10).max(120),
  text: z.string().min(30),
  buttonLabel: z.string().min(3).max(40),
});

/**
 * Produto afiliado citado por um artigo.
 *
 * Mora no frontmatter, como tudo que é conteúdo: o componente não conhece
 * marca, modelo nem link. O corpo do MDX carrega só a posição, pelo `id`.
 *
 * `url` é **sempre** o link de afiliado, e é ele que vai para o HTML. A
 * página oficial do produto entra em `sourceUrl` e serve para conferência
 * editorial: é de lá que as especificações precisam sair, não do título do
 * anúncio.
 *
 * Preço não existe aqui de propósito. Ele muda, e um número copiado para
 * dentro do artigo transforma a página em mentira sozinha, sem ninguém
 * mexer em nada.
 */
const affiliateProduct = z.object({
  id: z.string(),
  brand: z.string(),
  model: z.string(),
  /** Link de afiliado. Vai para o href com `sponsored nofollow noopener`. */
  url: z.string().url(),
  /** Página oficial ou anúncio, para conferência. Não vira link na página. */
  sourceUrl: z.string().url().optional(),
  cta: z.string().default('Ver oferta atual'),
});

/**
 * Metadados internos de monetização.
 *
 * Orientam a redação e o planejamento editorial. **Não viram tag, meta,
 * classe nem atributo no HTML** — nenhum componente os recebe.
 */
const monetization = z.object({
  /** Peso do CTA do produto BookGo neste artigo. */
  productCta: z.enum(['forte', 'medio', 'secundario', 'off']),
  /** Potencial de material afiliado. Sistema ainda não implementado. */
  affiliate: z.enum(['alto', 'medio', 'baixo', 'off']),
  /** Potencial de AdSense. Publicidade segue desligada globalmente. */
  adsense: z.enum(['alto', 'medio', 'baixo', 'off']),
});

/* ------------------------------------------------------------------ */
/*  Blog — content/blog/<categoria>/<slug>.mdx                         */
/* ------------------------------------------------------------------ */

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './content/blog',
    generateId: ({ data }) => String(data.slug),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: reference('categories'),
    /** Quando definido, o artigo exibe CTA contextual do produto. */
    product: reference('products').optional(),
    keywords: z.array(z.string()).default([]),
    author: z.string().default('BookGo'),
    draft: z.boolean().default(false),

    /**
     * `date`   = datePublished
     * `updated` = dateModified (opcional)
     * Mantidos com estes nomes para não gerar migração desnecessária.
     */

    /**
     * Resumo rápido, exibido perto do início do artigo.
     * Conteúdo editorial explícito — nunca gerado automaticamente.
     */
    summary: z.array(z.string()).min(3).max(6).optional(),

    /**
     * Metadados editoriais internos. Orientam a redação e o QA;
     * não viram meta keywords nem qualquer tag no HTML.
     */
    primaryKeyword: z.string().optional(),
    searchIntent: z
      .enum(['informacional', 'comercial', 'transacional', 'navegacional'])
      .optional(),

    /** Referências externas reais. Vazio quando o texto não precisa delas. */
    sources: z
      .array(
        z.object({
          title: z.string(),
          url: z.string().url(),
          publisher: z.string().optional(),
        })
      )
      .default([]),

    /** Imagem social própria do artigo; sem ela cai na institucional. */
    ogImage: z.string().optional(),
    ogImageAlt: z.string().optional(),

    /**
     * Imagens editoriais. Referência editorial: normalmente duas em artigo
     * médio, três em artigo longo — e nenhuma que não acrescente contexto,
     * compreensão ou ritmo. Não é conta a fechar.
     */
    images: z.array(articleImage).default([]),

    /** CTA contextual do produto. Exige `product` definido. */
    productCta: productCta.optional(),

    /**
     * Produtos afiliados do artigo.
     *
     * Com a lista preenchida, o artigo passa a exibir a nota de
     * transparência: um texto que depende de alguém lembrar de escrevê-lo
     * não é transparência, é sorte.
     */
    affiliates: z.array(affiliateProduct).default([]),

    /** Interno. Nunca sai no HTML. */
    monetization: monetization.optional(),
  })
  .superRefine((d, ctx) => {
    const ids = d.images.map((i) => i.id);
    const duplicated = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (duplicated.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ids de imagem repetidos: ${[...new Set(duplicated)].join(', ')}`,
      });
    }

    /* Guarda contra keyword stuffing no alt. Um alt que empilha as palavras-
       chave do artigo descreve a estratégia de SEO, não a imagem — e quem
       depende de leitor de tela é quem paga a conta. */
    for (const img of d.images) {
      const alt = img.alt.toLowerCase();
      const hits = d.keywords.filter((k) => alt.includes(k.toLowerCase()));
      if (hits.length >= 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            `alt da imagem "${img.id}" contém ${hits.length} palavras-chave do artigo. ` +
            'O alt descreve a cena e a função dela no contexto, não repete a lista de keywords.',
        });
      }
      if (alt.split(/\s+/).length > 25) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `alt da imagem "${img.id}" tem mais de 25 palavras — descreva a cena, não o artigo.`,
        });
      }
    }

    if (d.productCta && d.productCta.placement !== 'none' && !d.product) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'productCta definido sem `product`. O CTA precisa apontar para um produto existente.',
      });
    }
  }),
});

export const collections = { products, categories, blog };
