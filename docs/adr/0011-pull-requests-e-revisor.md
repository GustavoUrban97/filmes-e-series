# 0011. Pull requests com agente revisor somente leitura

- **Situação:** aceita
- **Data:** 2026-11-06

## Contexto

As mudanças iam direto para a `main`, sem revisão. Numa revisão independente, um agente encontrou 6 bugs em uma alteração que já havia passado nos testes manuais.

## Decisão

Toda mudança passa por pull request. O agente `revisor`, em `.claude/agents/revisor.md`, só tem ferramentas de leitura e procura bugs e falhas de segurança.

Agentes separados para escrever código e documentação ficaram de fora, porque não trazem independência nem permissões diferentes.

## Consequências

- Uma leitura independente passa a existir antes de publicar.
- Cada revisão consome uso, por isso não acontece a cada pequena edição.
- O revisor não executa o site e não substitui testes.
