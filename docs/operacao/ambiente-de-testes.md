# Ambiente de testes

Os testes rodam em um projeto Supabase separado, com contas e dados falsos. Assim, nenhum teste alcança a sua biblioteca real.

## Como a separação funciona

[`js/config.js`](../../js/config.js) escolhe o projeto pelo endereço da página. Só `gustavourban97.github.io` usa o banco real. Em qualquer outro endereço, o site usa o projeto de testes e mostra uma faixa âmbar. Se o projeto de testes não estiver preenchido, o site não se conecta a nada.

## Rodar o site

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/servidor-local.ps1
```

Abra `http://localhost:8123` e entre com uma das contas de teste. O servidor só atende pedidos desta máquina e só serve os arquivos do site. A porta é fixa, porque a função do TMDB só libera essa origem.

## Conferir o isolamento entre contas

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/testar-isolamento.ps1
```

O script usa as duas contas para confirmar, nas três tabelas, que uma não lê, altera, exclui ou cria dados em nome da outra. Também confere o acesso sem login, o cadastro fechado e a função, inclusive com a chave pública no lugar do login. Ele apaga os dados das duas contas de teste no início e no fim, e só roda contra o projeto do bloco `TESTES`.

Rode-o sempre que mudar tabelas, regras de acesso ou a função.

## Credenciais

Ficam em `.env.teste`, na raiz do projeto, um arquivo que não vai para o repositório:

```text
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
TESTE_A_EMAIL=teste-a@example.com
TESTE_A_SENHA=...
TESTE_B_EMAIL=teste-b@example.com
TESTE_B_SENHA=...
```

Use senhas geradas só para isso, nunca uma senha real.

## Recriar o projeto de testes

1. Crie um projeto no Supabase.
2. No **SQL Editor**, execute [`supabase/schema.sql`](../../supabase/schema.sql).
3. Em **Authentication > Users**, crie as duas contas, com a confirmação automática do e-mail.
4. Em **Authentication > Sign In / Providers**, desative **Allow new users to sign up**.
5. Em **Edge Functions > Secrets**, crie o segredo `TMDB_TOKEN`.
6. Crie a função com o nome `swift-handler`, cole [`index.ts`](../../supabase/functions/buscar-titulos/index.ts) e publique com **Verify JWT** ativo.
7. Preencha o bloco `TESTES` de `js/config.js` e o arquivo `.env.teste`.

## Regras

- **Nada de dados reais:** não importe um backup real neste projeto.
- **Testes primeiro:** aplique migrações e mudanças na função aqui antes da produção.
- **Projeto pausado:** como no projeto real, ele pausa depois de cerca de uma semana com pouca atividade. Reative-o no painel.
