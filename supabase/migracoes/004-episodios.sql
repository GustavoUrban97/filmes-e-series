-- Execute uma única vez no SQL Editor, em projetos criados antes da versão 5.0.0.
-- Cria o registro de cada episódio visto e guarda a duração dos filmes, usada nas estatísticas.

alter table public.titles
  add column runtime integer check (runtime > 0);

create table public.episode_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title_id uuid not null references public.titles (id) on delete cascade,
  season integer not null check (season >= 0),
  episode integer not null check (episode >= 0),
  watched_on date not null default current_date,
  rating integer check (rating between 1 and 10),
  runtime integer check (runtime > 0),
  updated_at timestamptz not null default now(),
  unique (title_id, season, episode)
);

create index episode_views_user_id_idx on public.episode_views (user_id);

alter table public.episode_views enable row level security;

revoke all on table public.episode_views from anon, public;
grant select, insert, update, delete on table public.episode_views to authenticated;

create policy "Ler os próprios episódios" on public.episode_views
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Criar os próprios episódios" on public.episode_views
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.titles t where t.id = title_id and t.user_id = (select auth.uid()))
  );

create policy "Alterar os próprios episódios" on public.episode_views
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.titles t where t.id = title_id and t.user_id = (select auth.uid()))
  );

create policy "Excluir os próprios episódios" on public.episode_views
  for delete to authenticated
  using ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';
