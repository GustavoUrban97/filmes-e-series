# 0010. Ambiente de testes escolhido pelo endereço

- **Situação:** aceita
- **Data:** 2026-11-06

## Contexto

Os testes rodavam no banco real, com a conta real. Títulos de teste eram criados e apagados na biblioteca verdadeira, e o isolamento entre contas nunca havia sido testado.

## Decisão

Criar um segundo projeto Supabase, com duas contas falsas. `js/config.js` só usa produção em `gustavourban97.github.io`, e qualquer outro endereço usa testes. Sem projeto de testes configurado, o site não se conecta a nada. Uma faixa âmbar indica o ambiente.

## Alternativas

- **Arquivo de configuração local:** esquecer de trocá-lo levaria os testes à produção.

## Consequências

- Testes em `localhost` não alcançam os dados reais, e a falha é segura por padrão.
- Agentes podem testar com liberdade nesse projeto.
- Cada migração e função precisam ser aplicadas em dois projetos, à mão.
- O projeto de testes pode pausar por falta de uso.
