# 0003. TMDB acessado por uma função que guarda o token

- **Situação:** aceita
- **Data:** 2026-11-06

## Contexto

Preencher ano, gênero e tipo à mão era trabalhoso, e esses dados são públicos. O token do TMDB não pode ficar no site, porque o código é público.

## Decisão

Criar uma Edge Function que chama o TMDB com o token guardado em segredo. A função confere a sessão em `/auth/v1/user`, porque a verificação de JWT da plataforma também aceita a chave publishable, e isso deixaria a busca aberta. Ela está publicada como `swift-handler`, nome gerado na primeira publicação.

## Alternativas

- **Chamar o TMDB pelo navegador:** exporia o token.
- **Confiar só em Verify JWT:** testado, e a função respondeu sem login.

## Consequências

- O token fica fora do repositório e do navegador.
- A busca só funciona com login, e o TMDB precisa de crédito no rodapé.
- O nome no Supabase difere da pasta `buscar-titulos`, e isso precisa ficar documentado.
- A função é publicada à mão e não tem limite de uso por conta.
