# BookGo

Plataforma de produtos digitais e conteúdo SEO. Site estático em Astro 5,
publicado em hospedagem cPanel via FTPS.

## Rodar localmente

```bash
npm ci          # Node 22
npm run dev     # http://localhost:4321
npm run build   # gera dist/
npm run preview # serve dist/
```

## Estrutura

```
content/     conteúdo editorial (produtos em YAML, artigos em MDX)
src/         componentes, layouts, páginas e estilos
public/      arquivos servidos como estão (.htaccess, robots.txt, imagens)
materials/   fontes dos entregáveis — não é publicado
```

## Páginas

| URL | Origem |
|---|---|
| `/` | `src/pages/index.astro` |
| `/<slug-do-produto>/` | `src/pages/[product].astro` |
| `/blog/` | `src/pages/blog/index.astro` |
| `/blog/<categoria>/` | `src/pages/blog/[category]/index.astro` |
| `/blog/<categoria>/<artigo>/` | `src/pages/blog/[category]/[slug].astro` |

## Operação

Como criar produtos, landing pages, categorias e artigos, alterar preço e
checkout, e executar o deploy: veja [CLAUDE.md](./CLAUDE.md).
