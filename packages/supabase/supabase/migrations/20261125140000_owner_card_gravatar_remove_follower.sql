-- Owner card: include gravatar_hash so map attribution matches the profile
-- page avatar. Owners can remove existing followers (restricted profiles).

drop function if exists public.get_map_owner_card(uuid);

create function public.get_map_owner_card(p_map_id uuid)
returns table (
  profile_id uuid,
  slug text,
  display_name text,
  avatar_url text,
  gravatar_hash text,
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
    p.gravatar_hash,
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

create or replace function public.remove_follower(p_follower_id uuid)
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

  delete from public.profile_follows
  where follower_id = p_follower_id
    and following_id = v_uid;
end;
$$;

revoke all on function public.remove_follower(uuid) from public;
grant execute on function public.remove_follower(uuid) to authenticated;
