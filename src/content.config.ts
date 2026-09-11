import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* ------------------------------------------------------------------ */
/*  Blocos reutilizáveis                                               */
/* ------------------------------------------------------------------ */

const titledItem = z.object({
  title: z.string(),
  text: z.string(),
});

const section = z.object({
  title: z.string(),
  intro: z.string().optional(),
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
      headline: z.string(),
      subheadline: z.string(),
      /** Reforços curtos abaixo do CTA (fatos sobre o produto, não provas sociais). */
      highlights: z.array(z.string()).default([]),
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
      items: z.array(titledItem),
    }),

    forWho: section.extend({ items: z.array(z.string()) }),
    notForWho: section.extend({ items: z.array(z.string()) }),

    offer: section.extend({
      includes: z.array(z.string()),
      priceNote: z.string().optional(),
    }),

    guarantee: section.extend({
      text: z.string(),
    }),

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
  }),
});

export const collections = { products, categories, blog };
