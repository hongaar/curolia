-- Tile freshness tracking for explore upstream refresh + safe enrichment enqueue.

create table public.place_explore_tiles (
  category_id text not null,
  tile_deg double precision not null,
  tile_x integer not null,
  tile_y integer not null,
  fetched_at timestamptz not null default now(),
  primary key (category_id, tile_deg, tile_x, tile_y)
);

create index place_explore_tiles_fetched_at_idx
  on public.place_explore_tiles (category_id, fetched_at desc);

comment on table public.place_explore_tiles is
  'Tracks when a category bbox tile was last refreshed from upstream OSM.';

alter table public.place_explore_tiles enable row level security;

-- Enqueue only when no pending/processing job exists (partial unique index is not ON CONFLICT-safe).
create or replace function public.enqueue_place_enrichment_job(
  p_plugin_type_id text,
  p_place_id uuid,
  p_event text default 'place_discovered'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.place_enrichment_jobs (plugin_type_id, place_id, event, status, payload)
  select p_plugin_type_id, p_place_id, p_event, 'pending', '{}'::jsonb
  where not exists (
    select 1
    from public.place_enrichment_jobs j
    where j.plugin_type_id = p_plugin_type_id
      and j.place_id = p_place_id
      and j.event = p_event
      and j.status in ('pending', 'processing')
  );
end;
$$;

revoke all on function public.enqueue_place_enrichment_job from public;
grant execute on function public.enqueue_place_enrichment_job to service_role;

create or replace function public.touch_place_explore_tile(
  p_category_id text,
  p_tile_deg double precision,
  p_tile_x integer,
  p_tile_y integer
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.place_explore_tiles (category_id, tile_deg, tile_x, tile_y, fetched_at)
  values (p_category_id, p_tile_deg, p_tile_x, p_tile_y, now())
  on conflict (category_id, tile_deg, tile_x, tile_y) do update
  set fetched_at = excluded.fetched_at;
$$;

revoke all on function public.touch_place_explore_tile from public;
grant execute on function public.touch_place_explore_tile to service_role;
