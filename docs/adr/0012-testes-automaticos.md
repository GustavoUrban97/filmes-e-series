# 0012. Testes automáticos, sem publicação automática

- **Situação:** aceita
- **Data:** 2026-11-06

## Contexto

A interface era testada à mão, e cada alteração dependia de scripts descartáveis. Também foi avaliada a publicação automática de banco e função pelo GitHub Actions, para acabar com o trabalho de colar SQL e código no painel do Supabase.

## Decisão

- Todo pull request roda o teste de isolamento e os testes de interface com Playwright, no projeto de testes.
- O Actions recebe só as credenciais das contas de teste.
- A publicação automática no Supabase fica de fora por enquanto. SQL e função continuam sendo aplicados à mão, primeiro nos testes e depois em produção.

## Alternativas

- **Publicar banco e função pelo Actions:** adiada. Exigiria guardar no GitHub a senha do banco de produção, que ignora o RLS, e um token com acesso a toda a conta do Supabase. Quem invadisse a conta do GitHub alcançaria o banco, e a aprovação não impediria isso.
- **Rodar os testes na máquina local:** exigiria instalar Node, e os testes não rodariam sozinhos em cada pull request.

## Consequências

- Uma invasão da conta do GitHub não alcança o banco real por este caminho.
- Mudanças na interface passam a ter uma proteção contra regressões.
- O pull request não aplica nada no Supabase: migração ou função nova precisa ser aplicada no projeto de testes antes de os testes rodarem.
- A ordem entre banco e site continua dependendo de aplicar o banco em produção antes de mesclar.
- Os testes dependem do TMDB e do projeto de testes estarem no ar, e podem falhar por causa deles.
- O rastreamento do Playwright fica desligado, porque gravaria a senha de teste em um arquivo que pode ser baixado.
