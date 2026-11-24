-- Replace is_public + block_public_crawlers on maps and profiles with a single
-- visibility enum: public (listed, indexable), unlisted (link/follow only,
-- crawlers discouraged), private.

create type public.visibility as enum ('public', 'unlisted', 'private');

-- Maps ---------------------------------------------------------------------

alter table public.maps
  add column visibility public.visibility not null default 'private';

update public.maps
set visibility = case
  when is_public and block_public_crawlers then 'unlisted'::public.visibility
  when is_public then 'public'::public.visibility
  else 'private'::public.visibility
end;

comment on column public.maps.visibility is
  'public: listed on What''s new / explore and indexable; unlisted: viewable with the link, crawlers discouraged; private: members only.';

-- Profiles -----------------------------------------------------------------

alter table public.profiles
  add column visibility public.visibility not null default 'public';

update public.profiles
set visibility = case
  when is_public and block_public_crawlers then 'unlisted'::public.visibility
  when is_public then 'public'::public.visibility
  else 'private'::public.visibility
end;

comment on column public.profiles.visibility is
  'public: listed and indexable; unlisted: viewable with the link or via follows, crawlers discouraged; private: only the owner.';

-- Drop dependents of the old columns ----------------------------------------

drop trigger if exists maps_sync_place_pin_count on public.maps;
drop policy if exists "maps_select_public" on public.maps;
drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_select_public_map_owners" on public.profiles;

drop function if exists public.set_map_public(uuid, boolean);
drop function if exists public.set_map_block_public_crawlers(uuid, boolean);
drop function if exists public.set_profile_public(boolean);
drop function if exists public.set_profile_block_public_crawlers(boolean);

-- Readability helpers (public + unlisted are viewable) -----------------------

create or replace function public.is_map_publicly_readable(p_map_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.maps m
    where m.id = p_map_id
      and m.visibility in ('public', 'unlisted')
  );
$$;

create or replace function public.is_profile_publicly_readable(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.visibility in ('public', 'unlisted')
  );
$$;

create or replace function public.is_profile_followable(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.visibility in ('public', 'unlisted')
  );
$$;

create policy "maps_select_public"
  on public.maps for select
  to anon, authenticated
  using (visibility in ('public', 'unlisted'));

create policy "profiles_select_public"
  on public.profiles for select
  to anon, authenticated
  using (visibility in ('public', 'unlisted'));

create policy "profiles_select_public_map_owners"
  on public.profiles for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.map_members jm
      inner join public.maps m on m.id = jm.map_id
      where jm.user_id = profiles.id
        and jm.role = 'owner'
        and m.visibility in ('public', 'unlisted')
    )
  );

-- Follow lists: unlisted profiles show up as followers/following -------------

create or replace function public.list_profile_followers(p_profile_id uuid)
returns table (
  profile_id uuid,
  slug text,
  display_name text,
  avatar_url text,
  gravatar_hash text,
  is_private boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    case when p.visibility <> 'private' then p.slug else null end,
    case
      when p.visibility <> 'private' then p.display_name
      else 'Private follower'
    end,
    case when p.visibility <> 'private' then p.avatar_url else null end,
    case when p.visibility <> 'private' then p.gravatar_hash else null end,
    p.visibility = 'private'
  from public.profile_follows pf
  inner join public.profiles p on p.id = pf.follower_id
  where pf.following_id = p_profile_id
    and public.can_view_profile_follow_lists(p_profile_id)
  order by pf.created_at desc;
$$;

create or replace function public.list_profile_following(p_profile_id uuid)
returns table (
  profile_id uuid,
  slug text,
  display_name text,
  avatar_url text,
  gravatar_hash text,
  is_private boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    case when p.visibility <> 'private' then p.slug else null end,
    case
      when p.visibility <> 'private' then p.display_name
      else 'Private profile'
    end,
    case when p.visibility <> 'private' then p.avatar_url else null end,
    case when p.visibility <> 'private' then p.gravatar_hash else null end,
    p.visibility = 'private'
  from public.profile_follows pf
  inner join public.profiles p on p.id = pf.following_id
  where pf.follower_id = p_profile_id
    and public.can_view_profile_follow_lists(p_profile_id)
  order by pf.created_at desc;
$$;

-- What's new: followed feed includes unlisted (you follow them); discover is
-- public only ----------------------------------------------------------------

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
  owner_avatar_url text,
  owner_gravatar_hash text,
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
    pr.avatar_url,
    pr.gravatar_hash,
    public.home_map_pin_count(m.id)
  from public.profile_follows pf
  inner join public.maps m on m.created_by_user_id = pf.following_id
  inner join public.profiles pr on pr.id = m.created_by_user_id
  where pf.follower_id = (select auth.uid())
    and m.visibility = 'public'
    and pr.visibility in ('public', 'unlisted')
  order by m.updated_at desc
  limit greatest(p_limit, 0);
$$;

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
  owner_avatar_url text,
  owner_gravatar_hash text,
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
    pr.avatar_url,
    pr.gravatar_hash,
    public.home_map_pin_count(m.id)
  from public.maps m
  inner join public.profiles pr on pr.id = m.created_by_user_id
  where m.visibility = 'public'
    and pr.visibility = 'public'
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

-- Explore place counts: public maps only --------------------------------------

create or replace function public.recompute_place_pin_count(p_place_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.places p
  set
    pin_count = coalesce((
      select count(*)::integer
      from public.pins j
      inner join public.maps m on m.id = j.map_id
      where j.place_id = p_place_id
        and m.visibility = 'public'
    ), 0),
    updated_at = now()
  where p.id = p_place_id;
$$;

create or replace function public.places_sync_pin_count_on_map_visibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.visibility is distinct from new.visibility then
    update public.places p
    set
      pin_count = coalesce((
        select count(*)::integer
        from public.pins j
        inner join public.maps m on m.id = j.map_id
        where j.place_id = p.id
          and m.visibility = 'public'
      ), 0),
      updated_at = now()
    where p.id in (
      select distinct j.place_id
      from public.pins j
      where j.map_id = new.id
        and j.place_id is not null
    );
  end if;
  return new;
end;
$$;

create trigger maps_sync_place_pin_count
  after update of visibility on public.maps
  for each row execute function public.places_sync_pin_count_on_map_visibility();

-- Setters --------------------------------------------------------------------

create or replace function public.set_map_visibility(
  p_map_id uuid,
  p_visibility public.visibility
)
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

  if not public.is_map_owner(p_map_id) then
    raise exception 'Only the map owner can change visibility';
  end if;

  update public.maps
  set visibility = p_visibility,
      updated_at = now()
  where id = p_map_id;
end;
$$;

revoke all on function public.set_map_visibility(uuid, public.visibility) from public;
grant execute on function public.set_map_visibility(uuid, public.visibility) to authenticated;

create or replace function public.set_profile_visibility(p_visibility public.visibility)
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

  update public.profiles
  set visibility = p_visibility,
      updated_at = now()
  where id = v_uid;
end;
$$;

revoke all on function public.set_profile_visibility(public.visibility) from public;
grant execute on function public.set_profile_visibility(public.visibility) to authenticated;

-- Drop old columns -----------------------------------------------------------

alter table public.maps
  drop column is_public,
  drop column block_public_crawlers;

alter table public.profiles
  drop column is_public,
  drop column block_public_crawlers;
