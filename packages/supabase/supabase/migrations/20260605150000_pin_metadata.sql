-- Provider-agnostic structured metadata on pins (phone, website, hours, …).
-- Plugins upsert rows keyed by (pin_id, field_key, source_plugin_id).

create table public.pin_metadata (
  id uuid primary key default gen_random_uuid (),
  map_id uuid not null references public.maps (id) on delete cascade,
  pin_id uuid not null references public.pins (id) on delete cascade,
  field_key text not null,
  source_plugin_id text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pin_metadata_field_key_chk check (
    field_key in ('phone', 'website', 'opening_hours', 'email')
  ),
  constraint pin_metadata_unique_source_field unique (pin_id, field_key, source_plugin_id)
);

create index pin_metadata_map_idx on public.pin_metadata (map_id);
create index pin_metadata_pin_idx on public.pin_metadata (pin_id);
create index pin_metadata_lookup_idx on public.pin_metadata (pin_id, field_key);

comment on table public.pin_metadata is
  'Normalized pin facts contributed by plugins (contact, hours, etc.).';

create or replace function public.pin_metadata_align_pin_map()
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
    raise exception 'Pin not found for pin_metadata';
  end if;
  new.map_id := j_id;
  new.updated_at := now();
  return new;
end;
$$;

create trigger pin_metadata_before_insert
  before insert on public.pin_metadata
  for each row execute function public.pin_metadata_align_pin_map();

create trigger pin_metadata_before_update
  before update on public.pin_metadata
  for each row execute function public.pin_metadata_align_pin_map();

create or replace function public.pin_metadata_delete_when_pin_deleted()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.pin_metadata where pin_id = old.id;
  return old;
end;
$$;

create trigger pins_after_delete_pin_metadata
  after delete on public.pins
  for each row execute function public.pin_metadata_delete_when_pin_deleted();

alter table public.pin_metadata enable row level security;

create policy "pin_metadata_select_member"
  on public.pin_metadata for select
  to authenticated
  using (public.is_map_member(map_id));

create policy "pin_metadata_insert_member"
  on public.pin_metadata for insert
  to authenticated
  with check (public.is_map_member(map_id));

create policy "pin_metadata_update_member"
  on public.pin_metadata for update
  to authenticated
  using (public.is_map_member(map_id))
  with check (public.is_map_member(map_id));

create policy "pin_metadata_delete_member"
  on public.pin_metadata for delete
  to authenticated
  using (public.is_map_member(map_id));
