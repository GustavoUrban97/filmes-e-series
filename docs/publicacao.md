# Publicação

O site é publicado pelo GitHub Pages diretamente da raiz da branch `main`. Não há build: cada push na `main` atualiza o site em poucos minutos.

## Publicar uma alteração

```bash
git add .
git commit -m "Descreva a alteração"
git push
```

Para acompanhar a publicação, abra a aba **Actions** do repositório.

## Configuração do Pages

Em **Settings > Pages** do repositório:

- **Source:** Deploy from a branch
- **Branch:** `main`, pasta `/ (root)`

O arquivo `.nojekyll` faz o GitHub servir os arquivos como estão, sem processá-los com o Jekyll.

## Por que o repositório é público

O GitHub Pages gratuito só publica a partir de repositório público. Isso deixa visíveis o código e a chave publishable do Supabase, o que é previsto: sem login, o banco não entrega nenhum dado. Nunca envie ao repositório a chave secreta do Supabase, senhas ou backups da lista.

## Depois de uma atualização

Os dados ficam no banco e não são afetados por uma nova publicação. Se você alterar a estrutura da tabela, aplique a mudança também no SQL Editor do Supabase.
