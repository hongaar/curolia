-- Generic plugin sync job outbox (plugin-agnostic).
-- Plugins opt in per map via map_plugins.config.syncEvents (JSON array of event names).
-- Each plugin owns its dispatch Edge function and job processor.

do $$ begin
  create type public.plugin_sync_job_status as enum (
    'pending',
    'processing',
    'completed',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

-- Replace OSM-specific preview table if present (local dev iteration).
drop trigger if exists pins_enqueue_osm_poi_sync on public.pins;
drop function if exists public.enqueue_osm_poi_sync_on_pin_move();
drop table if exists public.osm_poi_sync_jobs;
drop type if exists public.osm_poi_sync_job_status;

create table if not exists public.plugin_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  plugin_type_id text not null,
  entity_type text not null default 'pin'
    check (entity_type = 'pin'),
  entity_id uuid not null references public.pins (id) on delete cascade,
  map_id uuid not null references public.maps (id) on delete cascade,
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.plugin_sync_job_status not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plugin_sync_jobs_status_idx
  on public.plugin_sync_jobs (status, created_at);

create index if not exists plugin_sync_jobs_lookup_idx
  on public.plugin_sync_jobs (plugin_type_id, entity_id, created_at desc);

create unique index if not exists plugin_sync_jobs_active_idx
  on public.plugin_sync_jobs (plugin_type_id, entity_type, entity_id, event)
  where status in ('pending', 'processing');

comment on table public.plugin_sync_jobs is
  'Plugin-owned background sync outbox. Subscriptions live in map_plugins.config.syncEvents; processors live in plugin Edge functions.';

alter table public.plugin_sync_jobs enable row level security;

drop policy if exists "plugin_sync_jobs_select_member" on public.plugin_sync_jobs;
create policy "plugin_sync_jobs_select_member"
  on public.plugin_sync_jobs for select
  to authenticated
  using (public.is_map_member(map_id));

create or replace function public.enqueue_plugin_sync_on_pin_move()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and (
      old.lat is distinct from new.lat
      or old.lng is distinct from new.lng
    )
  then
    delete from public.plugin_sync_jobs j
    where j.entity_type = 'pin'
      and j.entity_id = new.id
      and j.event = 'pin_coordinates_changed'
      and j.status in ('pending', 'processing');

    insert into public.plugin_sync_jobs (
      plugin_type_id,
      entity_type,
      entity_id,
      map_id,
      event,
      payload,
      status
    )
    select
      mp.plugin_type_id,
      'pin',
      new.id,
      new.map_id,
      'pin_coordinates_changed',
      jsonb_build_object('lat', new.lat, 'lng', new.lng),
      'pending'
    from public.map_plugins mp
    where mp.map_id = new.map_id
      and mp.enabled = true
      and coalesce(mp.config->'syncEvents', '[]'::jsonb)
        @> '["pin_coordinates_changed"]'::jsonb;
  end if;

  return new;
end;
$$;

drop trigger if exists pins_enqueue_plugin_sync on public.pins;
create trigger pins_enqueue_plugin_sync
  after update of lat, lng on public.pins
  for each row
  execute function public.enqueue_plugin_sync_on_pin_move();
