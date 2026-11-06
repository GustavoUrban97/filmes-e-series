# 0002. Dados no Supabase, com RLS e cadastro fechado

- **Situação:** aceita
- **Data:** 2026-11-06

## Contexto

A primeira versão guardava a lista no navegador e não tinha login. Os dados precisavam ficar em um banco, disponíveis em qualquer aparelho, e ninguém mais deveria acessá-los.

## Decisão

Usar o Supabase para banco e login. Cada tabela tem Row Level Security por `user_id`, e `anon` não tem permissão. O cadastro é fechado, com uma única conta real.

## Alternativas

- **Continuar no navegador:** descartada a pedido, porque os dados ficariam presos a um aparelho.

## Consequências

- O navegador acessa o banco direto, sem servidor próprio.
- As regras de RLS são a principal proteção, então precisam de teste a cada mudança.
- No plano gratuito, o projeto pausa depois de cerca de uma semana com pouca atividade.
