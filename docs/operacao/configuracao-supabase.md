# Configuração do Supabase

O site guarda os dados e faz o login pelo [Supabase](https://supabase.com). Estes passos são feitos uma única vez.

## 1. Criar o projeto

1. Crie uma conta no Supabase e um projeto novo, na região mais próxima de você.
2. Guarde a senha do banco de dados que o Supabase pedir. Ela não é a senha de login do site e não vai para o código.

## 2. Criar a tabela

1. Abra **SQL Editor** no painel do projeto.
2. Cole o conteúdo de [`supabase/schema.sql`](../../supabase/schema.sql) e execute.

## 3. Fechar o cadastro e criar a sua conta

1. Em **Authentication > Users**, adicione um usuário com o seu e-mail e uma senha forte, marcando a confirmação automática do e-mail.
2. Em **Authentication > Sign In / Providers**, desative **Allow new users to sign up**.

## 4. Conectar o site

1. Em **Project Settings > API Keys**, copie a **publishable key** (começa com `sb_publishable_`).
2. Copie também a URL do projeto (`https://xxxx.supabase.co`).
3. Preencha os dois valores no bloco `PRODUCAO` de [`js/config.js`](../../js/config.js). O bloco `TESTES` é do [ambiente de testes](ambiente-de-testes.md).

**Nunca use a chave secreta (`sb_secret_` ou `service_role`) no site.** Ela ignora todas as regras de acesso.

## 5. Ativar a busca de títulos

A busca usa o [TMDB](https://www.themoviedb.org). O token dele fica guardado no Supabase, fora do site, e a própria função confere o login, então só contas conectadas podem usar a busca.

1. Crie uma conta no TMDB e, em **Settings > API**, solicite uma chave para uso pessoal e não comercial.
2. Copie o **API Read Access Token**. Esse é o token longo, não a API Key curta.
3. No Supabase, abra **Edge Functions > Secrets** e crie o segredo `TMDB_TOKEN` com esse valor.
4. Em **Edge Functions**, crie uma função pelo editor, cole o conteúdo de [`supabase/functions/buscar-titulos/index.ts`](../../supabase/functions/buscar-titulos/index.ts) e publique. Mantenha **Verify JWT** ativo. O site chama a função pelo nome `swift-handler`: se ela tiver outro nome, atualize a chamada em `buscarTitulos`, no arquivo `js/store.js`.

Sem esses passos, o site continua funcionando, mas os campos precisam ser preenchidos manualmente.

O TMDB é gratuito para uso não comercial, desde que seja creditado como fonte. O crédito fica no rodapé do site. Se o endereço do site mudar, atualize a lista `ORIGENS_PERMITIDAS` na função.

## Limites do plano gratuito

- O projeto é pausado depois de cerca de uma semana com pouca atividade. Quando isso acontecer, o site mostra um erro de conexão: reative o projeto no painel do Supabase.
- Cada projeto tem 500 MB de banco de dados, muito mais do que uma lista de títulos costuma ocupar.

Consulte os valores atuais na [página de preços](https://supabase.com/pricing). Mesmo com o banco, mantenha um backup exportado pelo site.

## Esqueci a senha

Em **Authentication > Users**, abra o seu usuário e defina uma nova senha.
