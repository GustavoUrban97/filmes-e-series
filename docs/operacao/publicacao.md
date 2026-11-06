# Publicação

O site é publicado pelo GitHub Pages diretamente da raiz da branch `main`. Não há build: cada mesclagem na `main` atualiza o site em poucos minutos.

## Publicar uma alteração

1. Trabalhe em uma branch. Se houver migração ou mudança na função, aplique primeiro no projeto de testes.
2. Abra um pull request. Os [testes automáticos](ambiente-de-testes.md#testes-automáticos) rodam sozinhos.
3. Passe o agente `revisor` e confira o resultado dos testes.
4. Aplique a migração e a função em produção, se houver.
5. Mescle na `main`, o que publica o site.

A migração vem antes da mesclagem porque o site novo pode depender dela. Por isso, cada migração e cada função precisam continuar funcionando com o site que ainda está no ar.

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

## Revisão antes de publicar

O agente `revisor`, definido em [`.claude/agents/revisor.md`](../../.claude/agents/revisor.md), lê a alteração sem poder editá-la e aponta bugs e falhas de segurança. Use-o em cada pull request. Ele não executa o site nem substitui os testes.
