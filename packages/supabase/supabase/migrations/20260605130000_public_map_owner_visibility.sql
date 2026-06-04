-- Allow public map viewers to resolve the map owner for attribution in the UI.

drop policy if exists "map_members_select_public_owner" on public.map_members;
create policy "map_members_select_public_owner"
  on public.map_members for select
  to anon, authenticated
  using (
    role = 'owner'::public.map_member_role
    and public.is_map_publicly_readable(map_id)
  );

drop policy if exists "profiles_select_public_map_owners" on public.profiles;
create policy "profiles_select_public_map_owners"
  on public.profiles for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.map_members jm
      inner join public.maps m on m.id = jm.map_id
      where jm.user_id = profiles.id
        and jm.role = 'owner'::public.map_member_role
        and m.is_public = true
    )
  );
