-- Execute uma única vez no SQL Editor, em projetos criados antes da versão 6.0.0.
-- Guarda os títulos que a pessoa não quer ver nas recomendações.

create table public.dismissed_titles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tmdb_id integer not null check (tmdb_id > 0),
  type text not null check (type in ('movie', 'series')),
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_id, type)
);

alter table public.dismissed_titles enable row level security;

revoke all on table public.dismissed_titles from anon, public;
grant select, insert, delete on table public.dismissed_titles to authenticated;

create policy "Ler os próprios dispensados" on public.dismissed_titles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Criar os próprios dispensados" on public.dismissed_titles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Excluir os próprios dispensados" on public.dismissed_titles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';
