-- Store Gravatar SHA-256 hashes on profiles so clients can load Gravatar without email.

alter table public.profiles
  add column if not exists gravatar_hash text;

comment on column public.profiles.gravatar_hash is
  'SHA-256 hex digest of the account email (Gravatar identifier). Not reversible to email.';

create or replace function public.gravatar_hash_for_email(p_email text)
returns text
language sql
immutable
as $$
  select case
    when nullif(lower(trim(p_email)), '') is null then null
    else encode(digest(lower(trim(p_email)), 'sha256'), 'hex')
  end;
$$;

-- Backfill existing profiles from auth.users.
update public.profiles p
set gravatar_hash = public.gravatar_hash_for_email(u.email)
from auth.users u
where u.id = p.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_map_id uuid;
  display text;
begin
  display := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Traveler');

  insert into public.profiles (id, display_name, gravatar_hash)
  values (new.id, display, public.gravatar_hash_for_email(new.email));

  insert into public.maps (name, created_by_user_id)
  values ('My map', new.id)
  returning id into new_map_id;

  insert into public.map_members (map_id, user_id, role)
  values (new_map_id, new.id, 'owner');

  update public.profiles
  set default_map_id = new_map_id
  where id = new.id;

  return new;
end;
$$;

-- Home feed RPCs: include owner avatar + Gravatar hash for card author rows.
-- Postgres cannot change a function's return type with CREATE OR REPLACE; drop first.

drop function if exists public.list_recently_visited_maps(integer);

create function public.list_recently_visited_maps(p_limit integer default 16)
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
    mv.visited_at,
    pr.slug,
    pr.display_name,
    pr.avatar_url,
    pr.gravatar_hash,
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

drop function if exists public.list_recently_edited_maps(integer);

create function public.list_recently_edited_maps(p_limit integer default 16)
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

drop function if exists public.list_followed_recent_public_maps(integer);

create function public.list_followed_recent_public_maps(p_limit integer default 12)
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
    and m.is_public = true
    and pr.is_public = true
  order by m.updated_at desc
  limit greatest(p_limit, 0);
$$;

revoke all on function public.list_followed_recent_public_maps(integer) from public;
grant execute on function public.list_followed_recent_public_maps(integer) to authenticated;

drop function if exists public.list_discover_recent_public_maps(integer);

create function public.list_discover_recent_public_maps(p_limit integer default 12)
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

-- Follow lists: expose Gravatar hash for users without an uploaded avatar.

drop function if exists public.list_profile_followers(uuid);

create function public.list_profile_followers(p_profile_id uuid)
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
    case when p.is_public then p.slug else null end,
    case
      when p.is_public then p.display_name
      else 'Private follower'
    end,
    case when p.is_public then p.avatar_url else null end,
    case when p.is_public then p.gravatar_hash else null end,
    not p.is_public
  from public.profile_follows pf
  inner join public.profiles p on p.id = pf.follower_id
  where pf.following_id = p_profile_id
    and public.can_view_profile_follow_lists(p_profile_id)
  order by pf.created_at desc;
$$;

revoke all on function public.list_profile_followers(uuid) from public;
grant execute on function public.list_profile_followers(uuid) to anon, authenticated;

drop function if exists public.list_profile_following(uuid);

create function public.list_profile_following(p_profile_id uuid)
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
    case when p.is_public then p.slug else null end,
    case
      when p.is_public then p.display_name
      else 'Private profile'
    end,
    case when p.is_public then p.avatar_url else null end,
    case when p.is_public then p.gravatar_hash else null end,
    not p.is_public
  from public.profile_follows pf
  inner join public.profiles p on p.id = pf.following_id
  where pf.follower_id = p_profile_id
    and public.can_view_profile_follow_lists(p_profile_id)
  order by pf.created_at desc;
$$;

revoke all on function public.list_profile_following(uuid) from public;
grant execute on function public.list_profile_following(uuid) to anon, authenticated;
