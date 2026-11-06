-- Estrutura do banco. Execute uma vez no SQL Editor do projeto no Supabase.
-- O acesso é restrito por Row Level Security: cada conta só alcança as próprias linhas.

create table if not exists public.titles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  type text not null check (type in ('movie', 'series')),
  status text not null check (status in ('watched', 'watching', 'planned')),
  year integer check (year between 1888 and 2200),
  seasons integer check (seasons >= 0),
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
