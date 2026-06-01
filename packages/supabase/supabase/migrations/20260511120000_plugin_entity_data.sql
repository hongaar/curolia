-- Plugin-owned payloads keyed by entity (pin today; extend entity_type later).

create table public.plugin_entity_data (
  id uuid primary key default gen_random_uuid (),
  map_id uuid not null references public.maps (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  plugin_type_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now (),
  constraint plugin_entity_data_entity_type_chk check (entity_type = 'pin'),
  constraint plugin_entity_data_unique_entity_plugin unique (entity_type, entity_id, plugin_type_id)
);

create index plugin_entity_data_map_idx on public.plugin_entity_data (map_id);
create index plugin_entity_data_lookup_idx on public.plugin_entity_data (entity_type, entity_id);

comment on table public.plugin_entity_data is
  'JSON payloads plugins attach to entities (e.g. pin-scoped Spotify stats).';

create or replace function public.plugin_entity_data_align_pin_map()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  j_id uuid;
begin
  if new.entity_type = 'pin' then
    select t.map_id into j_id from public.pins t where t.id = new.entity_id;
    if j_id is null then
      raise exception 'Pin not found for plugin_entity_data';
    end if;
    new.map_id := j_id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger plugin_entity_data_before_insert
  before insert on public.plugin_entity_data
  for each row execute function public.plugin_entity_data_align_pin_map();

create trigger plugin_entity_data_before_update
  before update on public.plugin_entity_data
  for each row execute function public.plugin_entity_data_align_pin_map();

create or replace function public.plugin_entity_data_delete_when_pin_deleted()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.plugin_entity_data
  where entity_type = 'pin' and entity_id = old.id;
  return old;
end;
$$;

create trigger pins_after_delete_plugin_entity_data
  after delete on public.pins
  for each row execute function public.plugin_entity_data_delete_when_pin_deleted();

alter table public.plugin_entity_data enable row level security;

create policy "plugin_entity_data_select_member"
  on public.plugin_entity_data for select
  to authenticated
  using (public.is_map_member(map_id));

create policy "plugin_entity_data_insert_member"
  on public.plugin_entity_data for insert
  to authenticated
  with check (public.is_map_member(map_id));

create policy "plugin_entity_data_update_member"
  on public.plugin_entity_data for update
  to authenticated
  using (public.is_map_member(map_id))
  with check (public.is_map_member(map_id));

create policy "plugin_entity_data_delete_member"
  on public.plugin_entity_data for delete
  to authenticated
  using (public.is_map_member(map_id));
