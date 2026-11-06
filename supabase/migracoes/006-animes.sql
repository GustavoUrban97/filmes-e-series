-- Execute uma única vez no SQL Editor, em projetos criados antes da versão 7.0.0.
-- Marca os títulos de anime. Vazio significa que o título ainda não foi classificado.

alter table public.titles
  add column anime boolean;

notify pgrst, 'reload schema';
