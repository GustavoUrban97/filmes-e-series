-- Estrutura do banco. Execute uma vez no SQL Editor do projeto no Supabase.
-- O acesso é restrito por Row Level Security: cada conta só alcança as próprias linhas.

create table if not exists public.titles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  type text not null check (type in ('movie', 'series')),
  status text not null check (status in ('watched', 'watching', 'planned')),
  year integer check (year between 1888 and 2200),
  season integer check (season >= 0),
  episode integer check (episode >= 0),
  poster_url text check (poster_url like 'https://image.tmdb.org/t/p/%'),
  tmdb_id integer check (tmdb_id > 0),
  director text,
  runtime integer check (runtime > 0),
  rating integer check (rating between 1 and 10),
  watched_on date,
  genres text[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists titles_user_id_idx on public.titles (user_id);

alter table public.titles enable row level security;

-- Visitantes sem login não têm nenhuma permissão na tabela.
revoke all on table public.titles from anon, public;
grant select, insert, update, delete on table public.titles to authenticated;

drop policy if exists "Ler os próprios títulos" on public.titles;
create policy "Ler os próprios títulos" on public.titles
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Criar os próprios títulos" on public.titles;
create policy "Criar os próprios títulos" on public.titles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Alterar os próprios títulos" on public.titles;
create policy "Alterar os próprios títulos" on public.titles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Excluir os próprios títulos" on public.titles;
create policy "Excluir os próprios títulos" on public.titles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Cada episódio visto, com data, nota e duração próprias.

create table if not exists public.episode_views (
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

create index if not exists episode_views_user_id_idx on public.episode_views (user_id);

alter table public.episode_views enable row level security;

revoke all on table public.episode_views from anon, public;
grant select, insert, update, delete on table public.episode_views to authenticated;

drop policy if exists "Ler os próprios episódios" on public.episode_views;
create policy "Ler os próprios episódios" on public.episode_views
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Criar os próprios episódios" on public.episode_views;
create policy "Criar os próprios episódios" on public.episode_views
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.titles t where t.id = title_id and t.user_id = (select auth.uid()))
  );

drop policy if exists "Alterar os próprios episódios" on public.episode_views;
create policy "Alterar os próprios episódios" on public.episode_views
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.titles t where t.id = title_id and t.user_id = (select auth.uid()))
  );

drop policy if exists "Excluir os próprios episódios" on public.episode_views;
create policy "Excluir os próprios episódios" on public.episode_views
  for delete to authenticated
  using ((select auth.uid()) = user_id);
