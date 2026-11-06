# Decisões de arquitetura

Um ADR registra uma decisão difícil de reverter: o contexto, o que foi escolhido, as alternativas e as consequências.

Os ADRs 0001 a 0009 foram escritos em 2026-11-06, depois das decisões, a partir do histórico do projeto. Eles listam só as alternativas de que há registro.

| ADR | Decisão | Situação |
| --- | --- | --- |
| [0001](0001-site-estatico-no-github-pages.md) | Site estático no GitHub Pages, com repositório público | Aceita |
| [0002](0002-supabase-com-rls.md) | Dados no Supabase, com RLS e cadastro fechado | Aceita |
| [0003](0003-tmdb-por-funcao.md) | TMDB acessado por uma função que guarda o token | Aceita |
| [0004](0004-nota-em-meias-estrelas.md) | Nota guardada de 1 a 10, exibida em meias estrelas | Aceita |
| [0005](0005-identidade-sala-escura.md) | Identidade visual Sala escura | Substituída pelo 0006 |
| [0006](0006-identidade-cinematic-amber.md) | Claquete, com a identidade Cinematic Amber | Aceita |
| [0007](0007-episodios-em-tabela-propria.md) | Episódios em tabela própria, com progresso derivado | Aceita |
| [0008](0008-recomendacoes-tmdb-e-pontuacao-local.md) | Recomendações do TMDB com pontuação local | Aceita |
| [0009](0009-anime-como-marcacao.md) | Anime como marcação, não como tipo | Aceita |
| [0010](0010-ambiente-de-testes-por-endereco.md) | Ambiente de testes escolhido pelo endereço | Aceita |
| [0011](0011-pull-requests-e-revisor.md) | Pull requests com agente revisor somente leitura | Aceita |
| [0012](0012-testes-automaticos.md) | Testes automáticos, sem publicação automática | Aceita |

## Como escrever

1. Copie [`modelo.md`](modelo.md) com o próximo número.
2. Adicione o ADR à tabela acima.
3. Para mudar uma decisão aceita, crie outro ADR e marque o antigo como substituído.
