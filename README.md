# Filmes e Séries

Site pessoal, com login, para registrar filmes e séries: o que você já assistiu, está assistindo e quer ver.

**Acesse:** https://gustavourban97.github.io/filmes-e-series/

## Funcionalidades

- Login com e-mail e senha, com cadastro fechado
- Lista salva em banco de dados, disponível em qualquer aparelho
- Busca de filmes e séries pelo TMDB, que preenche título, tipo, ano e gêneros
- Cadastro com situação, ano, temporadas vistas, data, nota de até 5 estrelas, gêneros e anotações
- Edição e exclusão de títulos
- Busca por título, gênero ou anotação, sem diferenciar acentos
- Filtros por tipo e situação, e cinco opções de ordenação
- Resumo com totais e nota média
- Backup em JSON, para exportar e importar
- Tema claro e escuro automático, com layout adaptado ao celular

## Onde ficam os dados

Os títulos ficam em um banco PostgreSQL no [Supabase](https://supabase.com). Só uma conta conectada acessa as próprias linhas, regra aplicada pelo próprio banco com Row Level Security. Sem login, a página mostra apenas a tela de entrada, e a tabela não responde com nenhum dado.

O navegador guarda apenas a sessão de login.

## Rodar localmente

O projeto não tem dependências nem etapa de build, mas precisa ser servido por um servidor local (`http://localhost`), e não aberto direto do disco.

Antes de usar, siga a [configuração do Supabase](docs/configuracao-supabase.md).

## Estrutura

```text
index.html           Estrutura da página
css/styles.css       Estilos e temas
js/config.js         Endereço e chave pública do Supabase
js/store.js          Dados: login, validação, banco e backup
js/app.js            Interface: login, lista, filtros e formulário
supabase/schema.sql  Tabela e regras de acesso
supabase/functions/  Função que consulta o TMDB
img/                 Logo do TMDB
docs/                Documentação
```

## Créditos

Dados e pôsteres de filmes e séries: [TMDB](https://www.themoviedb.org). Este site usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.

## Documentação

- [Configuração do Supabase](docs/configuracao-supabase.md)
- [Guia de uso](docs/guia-de-uso.md)
- [Formato dos dados](docs/formato-dos-dados.md)
- [Publicação](docs/publicacao.md)
- [Histórico de mudanças](CHANGELOG.md)
