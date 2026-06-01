-- Map app: profiles, maps, members, pins, tags, photos, connectors + RLS + storage bucket.

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.map_member_role as enum ('owner', 'editor', 'viewer');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.connector_link_status as enum ('disabled', 'pending', 'error', 'connected');
exception
  when duplicate_object then null;
end $$;

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  default_map_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Maps
create table public.maps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  is_personal boolean not null default false,
  created_by_user_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index maps_created_by_idx on public.maps (created_by_user_id);

-- Map members (must exist before is_map_member(), which references this table)
create table public.map_members (
  map_id uuid not null references public.maps (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.map_member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (map_id, user_id)
);

create index map_members_user_idx on public.map_members (user_id);

-- Bypasses RLS on map_members to avoid recursive policy checks.
create or replace function public.is_map_member(p_map_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.map_members jm
    where jm.map_id = p_map_id
      and jm.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_map_member(uuid) from public;
grant execute on function public.is_map_member(uuid) to authenticated, service_role;

alter table public.maps enable row level security;

create policy "maps_select_member"
  on public.maps for select
  to authenticated
  using (public.is_map_member(id));

create policy "maps_insert_self_created"
  on public.maps for insert
  to authenticated
  with check (created_by_user_id = (select auth.uid()));

create policy "maps_update_owner"
  on public.maps for update
  to authenticated
  using (
    exists (
      select 1 from public.map_members jm
      where jm.map_id = maps.id
        and jm.user_id = (select auth.uid())
        and jm.role = 'owner'::public.map_member_role
    )
  )
  with check (
    exists (
      select 1 from public.map_members jm
      where jm.map_id = maps.id
        and jm.user_id = (select auth.uid())
        and jm.role = 'owner'::public.map_member_role
    )
  );

alter table public.map_members enable row level security;

create policy "map_members_select_member"
  on public.map_members for select
  to authenticated
  using (public.is_map_member(map_id));

-- Add yourself when you created the map, or when already a member (future invites).
create policy "map_members_insert_self"
  on public.map_members for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.maps j
      where j.id = map_members.map_id
        and j.created_by_user_id = (select auth.uid())
    )
  );

create policy "map_members_delete_self"
  on public.map_members for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- FK from profiles.default_map_id after maps exist
alter table public.profiles
  add constraint profiles_default_map_fk
  foreign key (default_map_id) references public.maps (id) on delete set null;

-- Pins
create table public.pins (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.maps (id) on delete cascade,
  title text,
  description text,
  lat double precision not null,
  lng double precision not null,
  visited_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pins_map_idx on public.pins (map_id);
create index pins_map_visited_idx on public.pins (map_id, visited_at desc);

alter table public.pins enable row level security;

create policy "pins_select_member"
  on public.pins for select
  to authenticated
  using (public.is_map_member(map_id));

create policy "pins_insert_member"
  on public.pins for insert
  to authenticated
  with check (public.is_map_member(map_id));

create policy "pins_update_member"
  on public.pins for update
  to authenticated
  using (public.is_map_member(map_id))
  with check (public.is_map_member(map_id));

create policy "pins_delete_member"
  on public.pins for delete
  to authenticated
  using (public.is_map_member(map_id));

-- Tags
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.maps (id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  icon_emoji text not null default '📍',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (map_id, name)
);

create index tags_map_idx on public.tags (map_id);

alter table public.tags enable row level security;

create policy "tags_select_member"
  on public.tags for select
  to authenticated
  using (public.is_map_member(map_id));

create policy "tags_write_member"
  on public.tags for insert
  to authenticated
  with check (public.is_map_member(map_id));

create policy "tags_update_member"
  on public.tags for update
  to authenticated
  using (public.is_map_member(map_id))
  with check (public.is_map_member(map_id));

create policy "tags_delete_member"
  on public.tags for delete
  to authenticated
  using (public.is_map_member(map_id));

-- Pin tags
create table public.pin_tags (
  pin_id uuid not null references public.pins (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (pin_id, tag_id)
);

alter table public.pin_tags enable row level security;

create or replace function public.pin_map_id(p_pin_id uuid)
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select map_id from public.pins where id = p_pin_id;
$$;

create policy "pin_tags_select_member"
  on public.pin_tags for select
  to authenticated
  using (public.is_map_member(public.pin_map_id(pin_id)));

create policy "pin_tags_write_member"
  on public.pin_tags for insert
  to authenticated
  with check (
    public.is_map_member(public.pin_map_id(pin_id))
    and exists (
      select 1 from public.tags t
      where t.id = tag_id and t.map_id = public.pin_map_id(pin_id)
    )
  );

create policy "pin_tags_delete_member"
  on public.pin_tags for delete
  to authenticated
  using (public.is_map_member(public.pin_map_id(pin_id)));

-- Photos
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.maps (id) on delete cascade,
  pin_id uuid not null references public.pins (id) on delete cascade,
  storage_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index photos_pin_idx on public.photos (pin_id);

create or replace function public.photos_set_map_from_pin()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  j_id uuid;
begin
  select t.map_id into j_id from public.pins t where t.id = new.pin_id;
  if j_id is null then
    raise exception 'Pin not found';
  end if;
  new.map_id := j_id;
  return new;
end;
$$;

create trigger photos_set_map_before_insert
  before insert on public.photos
  for each row execute function public.photos_set_map_from_pin();

create trigger photos_set_map_before_update
  before update of pin_id on public.photos
  for each row execute function public.photos_set_map_from_pin();

alter table public.photos enable row level security;

create policy "photos_select_member"
  on public.photos for select
  to authenticated
  using (public.is_map_member(map_id));

create policy "photos_write_member"
  on public.photos for insert
  to authenticated
  with check (public.is_map_member(map_id));

create policy "photos_update_member"
  on public.photos for update
  to authenticated
  using (public.is_map_member(map_id))
  with check (public.is_map_member(map_id));

create policy "photos_delete_member"
  on public.photos for delete
  to authenticated
  using (public.is_map_member(map_id));

-- Connector catalog
create table public.connector_types (
  id text primary key,
  display_name text not null,
  description text
);

alter table public.connector_types enable row level security;

create policy "connector_types_select_authenticated"
  on public.connector_types for select
  to authenticated
  using (true);

insert into public.connector_types (id, display_name, description) values
  ('google_maps', 'Google Maps', 'Sync pins with Google Maps (coming soon).'),
  ('osmand', 'OsmAnd', 'Sync pins with OsmAnd (coming soon).'),
  ('google_photos', 'Google Photos', 'Link photos from Google Photos (coming soon).'),
  ('immich', 'Immich', 'Link photos from Immich (coming soon).')
on conflict (id) do nothing;

-- Per-map connector settings
create table public.map_connectors (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.maps (id) on delete cascade,
  connector_type_id text not null references public.connector_types (id) on delete restrict,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  status public.connector_link_status not null default 'disabled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (map_id, connector_type_id)
);

create index map_connectors_map_idx on public.map_connectors (map_id);

alter table public.map_connectors enable row level security;

create policy "map_connectors_select_member"
  on public.map_connectors for select
  to authenticated
  using (public.is_map_member(map_id));

create policy "map_connectors_write_member"
  on public.map_connectors for insert
  to authenticated
  with check (public.is_map_member(map_id));

create policy "map_connectors_update_member"
  on public.map_connectors for update
  to authenticated
  using (public.is_map_member(map_id))
  with check (public.is_map_member(map_id));

create policy "map_connectors_delete_member"
  on public.map_connectors for delete
  to authenticated
  using (public.is_map_member(map_id));

-- Bootstrap new auth user: profile + personal map + membership + default_map
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

  insert into public.maps (name, is_personal, created_by_user_id)
  values ('My map', true, new.id)
  returning id into new_map_id;

  insert into public.map_members (map_id, user_id, role)
  values (new_map_id, new.id, 'owner');

  update public.profiles
  set default_map_id = new_map_id
  where id = new.id;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage: private bucket for pin photos
insert into storage.buckets (id, name, public)
values ('pin-photos', 'pin-photos', false)
on conflict (id) do nothing;

create policy "pin_photos_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'pin-photos'
    and public.is_map_member((storage.foldername(name))[1]::uuid)
  );

create policy "pin_photos_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'pin-photos'
    and owner = (select auth.uid())
    and public.is_map_member((storage.foldername(name))[1]::uuid)
  );

create policy "pin_photos_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'pin-photos'
    and owner = (select auth.uid())
    and public.is_map_member((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'pin-photos'
    and owner = (select auth.uid())
  );

create policy "pin_photos_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'pin-photos'
    and owner = (select auth.uid())
    and public.is_map_member((storage.foldername(name))[1]::uuid)
  );
