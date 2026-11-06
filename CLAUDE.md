# Claquete

Site pessoal de filmes e séries. Escreva código, documentação e mensagens em português do Brasil. Comece por [docs/arquitetura.md](docs/arquitetura.md) e pelos [ADRs](docs/adr/README.md).

## Comandos

- Site local: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/servidor-local.ps1`
- Isolamento entre contas: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/testar-isolamento.ps1`
- Testes de interface: rodam no GitHub Actions em cada pull request, porque esta máquina não tem Node

## Regras

- **Testes só no ambiente de testes.** Nunca crie, altere ou apague dados no projeto `djbouioeghjzzgmsveiu`. Em `localhost`, o site já usa o projeto de testes.
- **Segredos ficam com a pessoa.** Nunca peça nem digite senhas reais, a chave secreta do Supabase ou o token do TMDB. As contas reais e os painéis são operados por ela.
- **Credenciais de teste** ficam em `.env.teste`. Nunca as repita em mensagens nem as envie ao repositório.
- **Mudanças vão por pull request**, com o agente `revisor`. Veja [Publicação](docs/operacao/publicacao.md).
- **Banco:** toda migração em `supabase/migracoes/` também atualiza `supabase/schema.sql`. Aplique primeiro no projeto de testes e rode o teste de isolamento.
- **Função:** o código fica em `supabase/functions/buscar-titulos/`, mas ela está publicada como `swift-handler`.
- **Testes novos:** toda mudança de comportamento ganha um teste em `testes/interface/`.
- **GitHub Actions:** recebe só as credenciais das contas de teste. A senha do banco e o token do Supabase não vão para o GitHub ([ADR 0012](docs/adr/0012-testes-automaticos.md)).
- **Texto externo** entra na página só por `textContent`.
- **Decisões difíceis de reverter** ganham um ADR, e a arquitetura é atualizada na mesma mudança.
