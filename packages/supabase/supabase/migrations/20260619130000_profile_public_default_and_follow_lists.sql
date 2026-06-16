-- Default profiles to public; let owners see follow stats on private profiles;
-- include private followers in follower lists.

alter table public.profiles
  alter column is_public set default true;

create or replace function public.can_view_profile_follow_lists(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_profile_publicly_readable(p_profile_id)
    or p_profile_id = (select auth.uid());
$$;

revoke all on function public.can_view_profile_follow_lists(uuid) from public;
grant execute on function public.can_view_profile_follow_lists(uuid) to authenticated;

create or replace function public.profile_follower_count(p_profile_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.profile_follows pf
  where pf.following_id = p_profile_id
    and public.can_view_profile_follow_lists(p_profile_id);
$$;

create or replace function public.profile_following_count(p_profile_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.profile_follows pf
  where pf.follower_id = p_profile_id
    and public.can_view_profile_follow_lists(p_profile_id);
$$;

drop function if exists public.list_profile_followers(uuid);

create function public.list_profile_followers(p_profile_id uuid)
returns table (
  profile_id uuid,
  slug text,
  display_name text,
  avatar_url text,
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
    not p.is_public
  from public.profile_follows pf
  inner join public.profiles p on p.id = pf.following_id
  where pf.follower_id = p_profile_id
    and public.can_view_profile_follow_lists(p_profile_id)
  order by pf.created_at desc;
$$;

revoke all on function public.list_profile_following(uuid) from public;
grant execute on function public.list_profile_following(uuid) to anon, authenticated;
