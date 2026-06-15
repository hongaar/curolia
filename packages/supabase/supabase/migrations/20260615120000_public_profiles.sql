-- Public profiles, map presentation fields, and map cover storage.

-- ---------------------------------------------------------------------------
-- Profiles: public visibility + crawler blocking
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists is_public boolean not null default false,
  add column if not exists block_public_crawlers boolean not null default false;

comment on column public.profiles.is_public is
  'When true, the profile homepage is visible at /{slug}.';

comment on column public.profiles.block_public_crawlers is
  'When true and is_public, discourage search engines and crawlers from indexing the profile page.';

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
      and p.is_public = true
  );
$$;

revoke all on function public.is_profile_publicly_readable(uuid) from public;
grant execute on function public.is_profile_publicly_readable(uuid) to anon, authenticated;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  to anon, authenticated
  using (is_public = true);

create or replace function public.set_profile_public(p_is_public boolean)
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
  set is_public = p_is_public,
      updated_at = now()
  where id = v_uid;
end;
$$;

revoke all on function public.set_profile_public(boolean) from public;
grant execute on function public.set_profile_public(boolean) to authenticated;

create or replace function public.set_profile_block_public_crawlers(p_block boolean)
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
  set block_public_crawlers = p_block,
      updated_at = now()
  where id = v_uid;
end;
$$;

revoke all on function public.set_profile_block_public_crawlers(boolean) from public;
grant execute on function public.set_profile_block_public_crawlers(boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Maps: description + cover URL for profile cards
-- ---------------------------------------------------------------------------

alter table public.maps
  add column if not exists description text,
  add column if not exists cover_url text;

alter table public.maps
  drop constraint if exists maps_description_length;

alter table public.maps
  add constraint maps_description_length
  check (description is null or char_length(description) <= 500);

comment on column public.maps.description is
  'Optional short blurb shown on the owner public profile map card.';

comment on column public.maps.cover_url is
  'Optional cover image URL for the map card on the owner public profile.';

-- ---------------------------------------------------------------------------
-- Storage: map cover images (scoped to map id folder)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('map-covers', 'map-covers', true)
on conflict (id) do nothing;

drop policy if exists "map_covers_select" on storage.objects;
create policy "map_covers_select"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'map-covers'
    and (
      public.is_map_publicly_readable((storage.foldername(name))[1]::uuid)
      or exists (
        select 1
        from public.map_members jm
        where jm.map_id = (storage.foldername(name))[1]::uuid
          and jm.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "map_covers_insert_owner" on storage.objects;
create policy "map_covers_insert_owner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'map-covers'
    and public.is_map_owner((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "map_covers_update_owner" on storage.objects;
create policy "map_covers_update_owner"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'map-covers'
    and public.is_map_owner((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'map-covers'
    and public.is_map_owner((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "map_covers_delete_owner" on storage.objects;
create policy "map_covers_delete_owner"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'map-covers'
    and public.is_map_owner((storage.foldername(name))[1]::uuid)
  );
