create extension if not exists pgcrypto;

create table if not exists public.tournament_publications (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    name text not null check (char_length(name) between 1 and 120),
    data jsonb not null default '{}'::jsonb,
    is_public boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists tournament_publications_public_updated_idx
    on public.tournament_publications (updated_at desc) where is_public;

alter table public.tournament_publications enable row level security;

create policy "Public can read published tournaments"
on public.tournament_publications for select
using (is_public or auth.uid() = owner_id);

create policy "Organizers can create their tournaments"
on public.tournament_publications for insert to authenticated
with check (auth.uid() = owner_id);

create policy "Organizers can update their tournaments"
on public.tournament_publications for update to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Organizers can delete their tournaments"
on public.tournament_publications for delete to authenticated
using (auth.uid() = owner_id);

create or replace function public.set_publication_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists tournament_publications_updated_at on public.tournament_publications;
create trigger tournament_publications_updated_at
before update on public.tournament_publications
for each row execute function public.set_publication_updated_at();

grant select on public.tournament_publications to anon;
grant select, insert, update, delete on public.tournament_publications to authenticated;
