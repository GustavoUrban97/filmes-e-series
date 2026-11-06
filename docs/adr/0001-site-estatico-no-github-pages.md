# 0001. Site estático no GitHub Pages, com repositório público

- **Situação:** aceita
- **Data:** 2026-11-05

## Contexto

O projeto precisava de um site para registrar filmes e séries, publicado junto do repositório e sem servidor para manter.

## Decisão

Publicar HTML, CSS e JavaScript puro no GitHub Pages, a partir da raiz da `main`, sem build. O repositório é público, porque o Pages gratuito exige isso.

## Alternativas

- **Repositório privado:** exigiria um plano pago do GitHub para usar o Pages.

## Consequências

- Publicar é só mesclar na `main`, sem etapa de build.
- Código e chave publishable ficam visíveis, então nenhum segredo pode ir para o repositório, e a proteção dos dados não pode depender do site.
- As rotas usam o hash da URL, e a CSP fica em meta tag, sem `frame-ancestors`.
- Sem build, os módulos são scripts simples, carregados em ordem.
