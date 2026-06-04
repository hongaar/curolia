-- Sharing improvements: public maps, drop is_personal, delete map, transfer by email.

-- ---------------------------------------------------------------------------
-- Maps: public flag, remove personal flag
-- ---------------------------------------------------------------------------

alter table public.maps
  add column if not exists is_public boolean not null default false;

alter table public.maps
  drop column if exists is_personal;

-- ---------------------------------------------------------------------------
-- Public map readability helper
-- ---------------------------------------------------------------------------

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
      and m.is_public = true
  );
$$;

revoke all on function public.is_map_publicly_readable(uuid) from public;
grant execute on function public.is_map_publicly_readable(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public read policies for map content
-- ---------------------------------------------------------------------------

drop policy if exists "maps_select_public" on public.maps;
create policy "maps_select_public"
  on public.maps for select
  to anon, authenticated
  using (is_public = true);

drop policy if exists "pins_select_public" on public.pins;
create policy "pins_select_public"
  on public.pins for select
  to anon, authenticated
  using (public.is_map_publicly_readable(map_id));

drop policy if exists "tags_select_public" on public.tags;
create policy "tags_select_public"
  on public.tags for select
  to anon, authenticated
  using (public.is_map_publicly_readable(map_id));

drop policy if exists "pin_tags_select_public" on public.pin_tags;
create policy "pin_tags_select_public"
  on public.pin_tags for select
  to anon, authenticated
  using (public.is_map_publicly_readable(public.pin_map_id(pin_id)));

drop policy if exists "photos_select_public" on public.photos;
create policy "photos_select_public"
  on public.photos for select
  to anon, authenticated
  using (public.is_map_publicly_readable(map_id));

drop policy if exists "pin_links_select_public" on public.pin_links;
create policy "pin_links_select_public"
  on public.pin_links for select
  to anon, authenticated
  using (public.is_map_publicly_readable(public.pin_map_id(pin_id)));

drop policy if exists "pin_photos_select_public" on storage.objects;
create policy "pin_photos_select_public"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'pin-photos'
    and public.is_map_publicly_readable((storage.foldername(name))[1]::uuid)
  );

-- ---------------------------------------------------------------------------
-- Bootstrap: default map without is_personal
-- ---------------------------------------------------------------------------

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

  insert into public.profiles (id, display_name)
  values (new.id, display);

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

-- ---------------------------------------------------------------------------
-- Toggle public visibility (owner only)
-- ---------------------------------------------------------------------------

create or replace function public.set_map_public(
  p_map_id uuid,
  p_is_public boolean
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
    raise exception 'Only the map owner can change public visibility';
  end if;

  update public.maps
  set is_public = p_is_public,
      updated_at = now()
  where id = p_map_id;
end;
$$;

revoke all on function public.set_map_public(uuid, boolean) from public;
grant execute on function public.set_map_public(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Delete map (owner only; cannot delete sole owned map)
-- ---------------------------------------------------------------------------

create or replace function public.delete_map(p_map_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_owned_count int;
  v_fallback_map_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_map_owner(p_map_id) then
    raise exception 'Only the map owner can delete this map';
  end if;

  select count(*)::int
  into v_owned_count
  from public.map_members jm
  where jm.user_id = v_uid
    and jm.role = 'owner'::public.map_member_role;

  if v_owned_count <= 1 then
    raise exception 'You cannot delete your only map';
  end if;

  select jm.map_id
  into v_fallback_map_id
  from public.map_members jm
  where jm.user_id = v_uid
    and jm.role = 'owner'::public.map_member_role
    and jm.map_id <> p_map_id
  order by jm.created_at
  limit 1;

  update public.profiles
  set default_map_id = v_fallback_map_id
  where default_map_id = p_map_id;

  delete from public.maps
  where id = p_map_id;
end;
$$;

revoke all on function public.delete_map(uuid) from public;
grant execute on function public.delete_map(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Transfer ownership by email (adds member if needed)
-- ---------------------------------------------------------------------------

create or replace function public.transfer_map_ownership_by_email(
  p_map_id uuid,
  p_new_owner_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(p_new_owner_email));
  v_new_owner_user_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if length(v_email) = 0 then
    raise exception 'Email is required';
  end if;

  if v_email = lower(trim(coalesce((select auth.jwt())->>'email', ''))) then
    raise exception 'You cannot transfer ownership to yourself';
  end if;

  if not public.is_map_owner(p_map_id) then
    raise exception 'Only the current owner can transfer ownership';
  end if;

  select au.id
  into v_new_owner_user_id
  from auth.users au
  where lower(trim(au.email::text)) = v_email
  limit 1;

  if v_new_owner_user_id is null then
    raise exception 'No account found for that email address';
  end if;

  if not exists (
    select 1
    from public.map_members jm
    where jm.map_id = p_map_id
      and jm.user_id = v_new_owner_user_id
  ) then
    insert into public.map_members (map_id, user_id, role)
    values (p_map_id, v_new_owner_user_id, 'editor'::public.map_member_role);
  end if;

  perform public.transfer_map_ownership(p_map_id, v_new_owner_user_id);
end;
$$;

revoke all on function public.transfer_map_ownership_by_email(uuid, text) from public;
grant execute on function public.transfer_map_ownership_by_email(uuid, text) to authenticated;
