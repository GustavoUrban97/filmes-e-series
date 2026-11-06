# Claquete

Catálogo pessoal, com login, para registrar filmes e séries: o que você já assistiu, está assistindo e quer ver.

**Acesse:** https://gustavourban97.github.io/filmes-e-series/

## Funcionalidades

- Login com e-mail e senha, com cadastro fechado
- Lista salva em banco de dados, disponível em qualquer aparelho
- Biblioteca em grade de pôsteres, com filtros, busca, ordenação e métricas
- Busca de filmes e séries pelo TMDB, com prévia antes de adicionar
- Animes separados das séries, com detecção automática e opção manual
- Página de cada título, com sinopse, direção, elenco, status, nota de até 5 estrelas e anotações
- Lista de episódios com marcação, data e nota, botão **+1 episódio** e progresso da temporada
- Recomendações de filmes e séries a partir do seu gosto
- Diário das sessões e estatísticas do que você assistiu
- Backup em JSON, para exportar e importar
- [Identidade visual Cinematic Amber](docs/identidade-visual.md), com layout adaptado ao celular

## Onde ficam os dados

Os títulos ficam em um banco PostgreSQL no [Supabase](https://supabase.com). Só uma conta conectada acessa as próprias linhas, regra aplicada pelo próprio banco com Row Level Security. Sem login, a página mostra apenas a tela de entrada, e a tabela não responde com nenhum dado.

O navegador guarda apenas a sessão de login e a preferência de exibição.

## Rodar localmente

O projeto não tem dependências nem etapa de build, mas precisa ser servido por um servidor local (`http://localhost`), e não aberto direto do disco.

Antes de usar, siga a [configuração do Supabase](docs/configuracao-supabase.md).

## Estrutura

```text
index.html           Estrutura das telas e ícones
css/styles.css       Estilos e identidade visual
js/config.js         Endereço e chave pública do Supabase
js/store.js          Dados: login, validação, banco, TMDB e backup
js/recomendacoes.js  Gosto e pontuação das recomendações
js/app.js            Interface: rotas, telas e modal
supabase/schema.sql  Tabelas e regras de acesso
supabase/migracoes/  Mudanças para bancos já criados
supabase/functions/  Função que consulta o TMDB
img/                 Ícone do site e logo do TMDB
fonts/               Fonte do site e sua licença
docs/                Documentação
```

## Documentação

- [Configuração do Supabase](docs/configuracao-supabase.md)
- [Guia de uso](docs/guia-de-uso.md)
- [Identidade visual](docs/identidade-visual.md)
- [Formato dos dados](docs/formato-dos-dados.md)
- [Publicação](docs/publicacao.md)
- [Histórico de mudanças](CHANGELOG.md)

## Créditos

Dados e pôsteres de filmes e séries: [TMDB](https://www.themoviedb.org). Este site usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
