# 0007. Episódios em tabela própria, com progresso derivado

- **Situação:** aceita
- **Data:** 2026-11-06

## Contexto

Temporada e episódio guardados no título não permitiam data e nota por episódio, nem um Diário real.

## Decisão

Criar `episode_views`, com uma linha por título, temporada e episódio. O progresso do título é derivado do episódio marcado mais adiantado. As gravações passam por uma fila no navegador.

## Consequências

- Diário e tempo assistido passam a usar dados reais.
- A fila surgiu de um bug testado: mudar data e nota juntas sobrescrevia uma delas.
- `season` e `episode` em `titles` são uma cópia que precisa ser sincronizada.
- O backup ganhou o campo `episodeViews`.
