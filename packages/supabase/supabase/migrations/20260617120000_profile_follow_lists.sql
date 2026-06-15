-- Read-only lists of followers and following for public profiles.

create or replace function public.list_profile_followers(p_profile_id uuid)
returns table (
  profile_id uuid,
  slug text,
  display_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.slug,
    p.display_name,
    p.avatar_url
  from public.profile_follows pf
  inner join public.profiles p on p.id = pf.follower_id
  where pf.following_id = p_profile_id
    and public.is_profile_publicly_readable(p_profile_id)
    and p.is_public = true
  order by pf.created_at desc;
$$;

revoke all on function public.list_profile_followers(uuid) from public;
grant execute on function public.list_profile_followers(uuid) to anon, authenticated;

create or replace function public.list_profile_following(p_profile_id uuid)
returns table (
  profile_id uuid,
  slug text,
  display_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.slug,
    p.display_name,
    p.avatar_url
  from public.profile_follows pf
  inner join public.profiles p on p.id = pf.following_id
  where pf.follower_id = p_profile_id
    and public.is_profile_publicly_readable(p_profile_id)
    and p.is_public = true
  order by pf.created_at desc;
$$;

revoke all on function public.list_profile_following(uuid) from public;
grant execute on function public.list_profile_following(uuid) to anon, authenticated;
