-- Execute uma única vez no SQL Editor, em projetos criados antes da versão 4.0.0.
-- Liga cada título ao TMDB, para a página de detalhes, e guarda a direção mostrada na biblioteca.

alter table public.titles
  add column tmdb_id integer check (tmdb_id > 0),
  add column director text;

notify pgrst, 'reload schema';
