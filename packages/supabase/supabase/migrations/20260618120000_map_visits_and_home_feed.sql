-- Map visit history and home feed list RPCs.

-- ---------------------------------------------------------------------------
-- map_visits
-- ---------------------------------------------------------------------------

create table public.map_visits (
  user_id uuid not null references auth.users (id) on delete cascade,
  map_id uuid not null references public.maps (id) on delete cascade,
  visited_at timestamptz not null default now(),
  primary key (user_id, map_id)
);

create index map_visits_user_visited_idx
  on public.map_visits (user_id, visited_at desc);

comment on table public.map_visits is
  'Per-user map open history for the signed-in home feed.';

alter table public.map_visits enable row level security;

create policy "map_visits_select_own"
  on public.map_visits for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "map_visits_insert_own"
  on public.map_visits for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "map_visits_update_own"
  on public.map_visits for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "map_visits_delete_own"
  on public.map_visits for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.can_view_map(p_map_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_map_member(p_map_id)
    or public.is_map_publicly_readable(p_map_id);
$$;

revoke all on function public.can_view_map(uuid) from public;
grant execute on function public.can_view_map(uuid) to authenticated;

create or replace function public.home_map_pin_count(p_map_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.pins p
  where p.map_id = p_map_id;
$$;

revoke all on function public.home_map_pin_count(uuid) from public;
grant execute on function public.home_map_pin_count(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function public.record_map_visit(p_map_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.can_view_map(p_map_id) then
    raise exception 'Map is not accessible';
  end if;

  insert into public.map_visits (user_id, map_id, visited_at)
  values (v_uid, p_map_id, now())
  on conflict (user_id, map_id)
  do update set visited_at = excluded.visited_at;
end;
$$;

revoke all on function public.record_map_visit(uuid) from public;
grant execute on function public.record_map_visit(uuid) to authenticated;

create or replace function public.list_recently_visited_maps(p_limit integer default 16)
returns table (
  map_id uuid,
  name text,
  slug text,
  description text,
  cover_url text,
  icon_emoji text,
  updated_at timestamptz,
  visited_at timestamptz,
  owner_profile_slug text,
  owner_display_name text,
  pin_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.name,
    m.slug,
    m.description,
    m.cover_url,
    m.icon_emoji,
    m.updated_at,
    mv.visited_at,
    pr.slug,
    pr.display_name,
    public.home_map_pin_count(m.id)
  from public.map_visits mv
  inner join public.maps m on m.id = mv.map_id
  inner join public.profiles pr on pr.id = m.created_by_user_id
  where mv.user_id = (select auth.uid())
    and public.can_view_map(m.id)
  order by mv.visited_at desc
  limit greatest(p_limit, 0);
$$;

revoke all on function public.list_recently_visited_maps(integer) from public;
grant execute on function public.list_recently_visited_maps(integer) to authenticated;

create or replace function public.list_recently_edited_maps(p_limit integer default 16)
returns table (
  map_id uuid,
  name text,
  slug text,
  description text,
  cover_url text,
  icon_emoji text,
  updated_at timestamptz,
  visited_at timestamptz,
  owner_profile_slug text,
  owner_display_name text,
  pin_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.name,
    m.slug,
    m.description,
    m.cover_url,
    m.icon_emoji,
    m.updated_at,
    null::timestamptz,
    pr.slug,
    pr.display_name,
    public.home_map_pin_count(m.id)
  from public.map_members jm
  inner join public.maps m on m.id = jm.map_id
  inner join public.profiles pr on pr.id = m.created_by_user_id
  where jm.user_id = (select auth.uid())
    and jm.role in ('owner'::public.map_member_role, 'editor'::public.map_member_role)
  order by m.updated_at desc
  limit greatest(p_limit, 0);
$$;

revoke all on function public.list_recently_edited_maps(integer) from public;
grant execute on function public.list_recently_edited_maps(integer) to authenticated;

create or replace function public.list_followed_recent_public_maps(p_limit integer default 12)
returns table (
  map_id uuid,
  name text,
  slug text,
  description text,
  cover_url text,
  icon_emoji text,
  updated_at timestamptz,
  visited_at timestamptz,
  owner_profile_slug text,
  owner_display_name text,
  pin_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.name,
    m.slug,
    m.description,
    m.cover_url,
    m.icon_emoji,
    m.updated_at,
    null::timestamptz,
    pr.slug,
    pr.display_name,
    public.home_map_pin_count(m.id)
  from public.profile_follows pf
  inner join public.maps m on m.created_by_user_id = pf.following_id
  inner join public.profiles pr on pr.id = m.created_by_user_id
  where pf.follower_id = (select auth.uid())
    and m.is_public = true
    and pr.is_public = true
  order by m.updated_at desc
  limit greatest(p_limit, 0);
$$;

revoke all on function public.list_followed_recent_public_maps(integer) from public;
grant execute on function public.list_followed_recent_public_maps(integer) to authenticated;

create or replace function public.list_discover_recent_public_maps(p_limit integer default 12)
returns table (
  map_id uuid,
  name text,
  slug text,
  description text,
  cover_url text,
  icon_emoji text,
  updated_at timestamptz,
  visited_at timestamptz,
  owner_profile_slug text,
  owner_display_name text,
  pin_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.name,
    m.slug,
    m.description,
    m.cover_url,
    m.icon_emoji,
    m.updated_at,
    null::timestamptz,
    pr.slug,
    pr.display_name,
    public.home_map_pin_count(m.id)
  from public.maps m
  inner join public.profiles pr on pr.id = m.created_by_user_id
  where m.is_public = true
    and pr.is_public = true
    and m.created_by_user_id <> (select auth.uid())
    and not exists (
      select 1
      from public.profile_follows pf
      where pf.follower_id = (select auth.uid())
        and pf.following_id = m.created_by_user_id
    )
  order by m.updated_at desc
  limit greatest(p_limit, 0);
$$;

revoke all on function public.list_discover_recent_public_maps(integer) from public;
grant execute on function public.list_discover_recent_public_maps(integer) to authenticated;
