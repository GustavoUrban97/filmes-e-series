# Filmes e Séries

Site pessoal para registrar filmes e séries: o que você já assistiu, está assistindo e quer ver.

**Acesse:** https://gustavourban97.github.io/filmes-e-series/

## Funcionalidades

- Cadastro de filmes e séries, com situação, ano, temporadas vistas, data, nota de 1 a 10, gêneros e anotações
- Edição e exclusão de títulos
- Busca por título, gênero ou anotação, sem diferenciar acentos
- Filtros por tipo e situação, e cinco opções de ordenação
- Resumo com totais e nota média
- Backup em JSON, para exportar, importar e levar a lista a outro aparelho
- Tema claro e escuro automático, com layout adaptado ao celular

## Onde ficam os dados

Os dados ficam **somente no navegador** de quem usa o site (`localStorage`). Nada é enviado ao GitHub nem a outro servidor, então a sua lista não aparece no repositório, mesmo ele sendo público.

Isso também significa que:

- a lista não sincroniza sozinha entre aparelhos;
- limpar os dados do navegador apaga a lista, a menos que você tenha um backup.

Veja como se proteger disso no [guia de uso](docs/guia-de-uso.md#backup).

## Rodar localmente

O projeto não tem dependências nem etapa de build. Baixe o repositório e abra o `index.html` no navegador.

```bash
git clone https://github.com/GustavoUrban97/filmes-e-series.git
```

## Estrutura

```text
index.html       Estrutura da página
css/styles.css   Estilos e temas
js/store.js      Dados: validação, armazenamento e backup
js/app.js        Interface: lista, filtros e formulário
docs/            Documentação
```

## Documentação

- [Guia de uso](docs/guia-de-uso.md)
- [Formato dos dados](docs/formato-dos-dados.md)
- [Publicação](docs/publicacao.md)
- [Histórico de mudanças](CHANGELOG.md)
