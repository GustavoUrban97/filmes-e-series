# 0009. Anime como marcação, não como tipo

- **Situação:** aceita
- **Data:** 2026-11-06

## Contexto

Animes apareciam junto das séries. O TMDB não tem uma categoria de anime, e existem séries e filmes de anime.

## Decisão

Adicionar a coluna `anime`, independente de `type`. A detecção usa gênero Animação e idioma original japonês, com correção manual. Filmes de anime aparecem em **Filmes** e **Animes**, e séries de anime só em **Animes**.

## Alternativas

- **Terceiro tipo `anime`:** exigiria revisar cerca de 45 trechos que tratam o tipo, e filmes de anime ficariam sem lugar.

## Consequências

- Episódios, **+1 episódio** e TMDB continuam iguais.
- A regra erra em alguns casos, como *Rick and Morty: The Anime* e animações chinesas. A caixa **É anime** corrige.
- `null` significa não classificado, para que a classificação automática não sobrescreva uma escolha manual.
