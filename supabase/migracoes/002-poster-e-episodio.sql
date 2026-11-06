-- Execute uma única vez no SQL Editor, em projetos criados antes da versão 2.2.0.
-- "seasons" passa a significar a temporada em que você está; os valores são mantidos.

alter table public.titles rename column seasons to season;

alter table public.titles
  add column episode integer check (episode >= 0),
  add column poster_url text check (poster_url like 'https://image.tmdb.org/t/p/%');

notify pgrst, 'reload schema';
