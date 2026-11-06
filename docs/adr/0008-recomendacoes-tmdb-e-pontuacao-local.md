# 0008. Recomendações do TMDB com pontuação local

- **Situação:** aceita
- **Data:** 2026-11-06

## Contexto

O site deveria recomendar títulos a partir do gosto da pessoa, com uma única conta e sem novos custos.

## Decisão

A função consulta as recomendações do TMDB e títulos bem avaliados dos gêneros favoritos. O navegador pontua os candidatos em `js/recomendacoes.js`, usando as notas e os gêneros da biblioteca, e explica o motivo de cada sugestão. Títulos dispensados ficam em `dismissed_titles`.

## Alternativas

- **Modelo de linguagem:** escreveria bons textos, mas custa por uso, exige outra chave e envia o histórico a mais um serviço.
- **Comparar com outros usuários:** só funciona com muitas pessoas, e o cadastro é fechado.

## Consequências

- Sem custo novo, e cada sugestão tem um motivo verificável.
- Os pesos foram definidos por julgamento e nunca foram avaliados com dados.
- Recomendações do TMDB são do mesmo tipo da referência, e o outro tipo só entra pelos gêneros.
