-- Close the profile row leak: "profiles_select_public_map_owners" exposed the
-- full profile row (bio, notification prefs, …) of any owner of a public or
-- unlisted map, including restricted and private profiles. Map pages now get
-- only what they need through narrow security-definer RPCs.

drop policy if exists "profiles_select_public_map_owners" on public.profiles;

-- Slug → profile id (current slug or redirect). Slugs are already public in
-- map URLs; visibility lets the client pick the right profile view.
create or replace function public.resolve_profile_slug(p_slug text)
returns table (
  profile_id uuid,
  canonical_slug text,
  redirected boolean,
  visibility public.profile_visibility
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.slug, false, p.visibility
  from public.profiles p
  where p.slug = lower(trim(p_slug))
  union all
  select p.id, p.slug, true, p.visibility
  from public.profile_slug_redirects r
  inner join public.profiles p on p.id = r.profile_id
  where r.slug = lower(trim(p_slug))
    and not exists (
      select 1 from public.profiles p2 where p2.slug = lower(trim(p_slug))
    )
  limit 1;
$$;

revoke all on function public.resolve_profile_slug(text) from public;
grant execute on function public.resolve_profile_slug(text) to anon, authenticated;

-- Owner attribution for a map the caller can read. Bio only when the owner's
-- profile itself is readable (public, approved follower, or self).
create or replace function public.get_map_owner_card(p_map_id uuid)
returns table (
  profile_id uuid,
  slug text,
  display_name text,
  avatar_url text,
  bio text
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
    p.avatar_url,
    case
      when public.is_profile_publicly_readable(p.id)
        or p.id = (select auth.uid())
      then p.bio
      else null
    end
  from public.map_members mm
  inner join public.profiles p on p.id = mm.user_id
  where mm.map_id = p_map_id
    and mm.role = 'owner'
    and (
      public.is_map_publicly_readable(p_map_id)
      or exists (
        select 1 from public.map_members me
        where me.map_id = p_map_id and me.user_id = (select auth.uid())
      )
    );
$$;

revoke all on function public.get_map_owner_card(uuid) from public;
grant execute on function public.get_map_owner_card(uuid) to anon, authenticated;

-- Slugs for building map URLs (owner ids come from maps the caller can read).
create or replace function public.profile_slugs(p_ids uuid[])
returns table (id uuid, slug text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.slug
  from public.profiles p
  where p.id = any (p_ids);
$$;

revoke all on function public.profile_slugs(uuid[]) from public;
grant execute on function public.profile_slugs(uuid[]) to anon, authenticated;

-- resolve_profile_slug returns visibility, so this helper is redundant.
drop function if exists public.is_restricted_profile_slug(text);
