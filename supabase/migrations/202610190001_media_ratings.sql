create table if not exists public.media_ratings (
  provider text not null check (provider in ('tmdb_movie', 'tmdb_tv', 'anilist')),
  catalog_id text not null,
  title text not null,
  poster_url text,
  release_year integer,
  overview text not null default '',
  score smallint,
  watchlist_status text,
  updated_at timestamptz not null default now(),
  primary key (provider, catalog_id)
);

alter table public.media_ratings
  add column if not exists watchlist_status text;

alter table public.media_ratings
  drop constraint if exists media_ratings_watchlist_status_check;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'media_ratings'
      and column_name = 'in_watchlist'
  ) then
    execute $migration$
      update public.media_ratings
      set watchlist_status = 'watchlist'
      where in_watchlist = true and watchlist_status is null
    $migration$;
  end if;
end
$$;

update public.media_ratings
set watchlist_status = null
where watchlist_status in ('up_next', 'want_to_watch');

alter table public.media_ratings
  add constraint media_ratings_watchlist_status_check
  check (watchlist_status = 'watchlist');

alter table public.media_ratings
  drop constraint if exists media_ratings_score_check;
alter table public.media_ratings
  add constraint media_ratings_score_check check (score between 0 and 100);

create table if not exists public.media_catalog_cache (
  provider text not null check (provider in ('tmdb_movie', 'tmdb_tv', 'anilist')),
  catalog_id text not null,
  title text not null,
  poster_url text,
  release_year integer,
  overview text not null default '',
  popularity numeric not null default 0,
  cached_at timestamptz not null default now(),
  primary key (provider, catalog_id)
);

create table if not exists public.media_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.media_ratings enable row level security;
alter table public.media_catalog_cache enable row level security;
alter table public.media_admins enable row level security;

create or replace function public.is_media_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.media_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_media_admin() from public;
grant execute on function public.is_media_admin() to authenticated;

drop policy if exists "Anyone can read media ratings" on public.media_ratings;
create policy "Anyone can read media ratings"
  on public.media_ratings for select
  to anon, authenticated
  using (true);

drop policy if exists "Media admins can add ratings" on public.media_ratings;
create policy "Media admins can add ratings"
  on public.media_ratings for insert
  to authenticated
  with check (public.is_media_admin());

drop policy if exists "Media admins can update ratings" on public.media_ratings;
create policy "Media admins can update ratings"
  on public.media_ratings for update
  to authenticated
  using (public.is_media_admin())
  with check (public.is_media_admin());

drop policy if exists "Media admins can remove ratings" on public.media_ratings;
create policy "Media admins can remove ratings"
  on public.media_ratings for delete
  to authenticated
  using (public.is_media_admin());

drop policy if exists "Users can read their own media admin entry" on public.media_admins;
create policy "Users can read their own media admin entry"
  on public.media_admins for select
  to authenticated
  using (user_id = (select auth.uid()));

grant select on public.media_ratings to anon, authenticated;
grant insert, update, delete on public.media_ratings to authenticated;
grant select on public.media_admins to authenticated;

drop policy if exists "Anyone can read media catalog cache" on public.media_catalog_cache;
create policy "Anyone can read media catalog cache"
  on public.media_catalog_cache for select
  to anon, authenticated
  using (true);

drop policy if exists "Media admins can add catalog cache" on public.media_catalog_cache;
create policy "Media admins can add catalog cache"
  on public.media_catalog_cache for insert
  to authenticated
  with check (public.is_media_admin());

drop policy if exists "Media admins can update catalog cache" on public.media_catalog_cache;
create policy "Media admins can update catalog cache"
  on public.media_catalog_cache for update
  to authenticated
  using (public.is_media_admin())
  with check (public.is_media_admin());

grant select on public.media_catalog_cache to anon, authenticated;
grant insert, update on public.media_catalog_cache to authenticated;
