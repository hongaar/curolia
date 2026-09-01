-- Global places dataset for Explore (PostGIS-backed, public-read).

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- places
-- ---------------------------------------------------------------------------

create table public.places (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'osm',
  source_ref text not null,
  geom extensions.geography (point, 4326) not null,
  lat double precision generated always as (st_y (geom::geometry)) stored,
  lng double precision generated always as (st_x (geom::geometry)) stored,
  name text,
  primary_category text,
  categories text[] not null default '{}',
  prominence_score double precision not null default 0,
  pin_count integer not null default 0,
  osm_tags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_enriched_at timestamptz,
  constraint places_source_ref_unique unique (source, source_ref)
);

create index places_geom_idx on public.places using gist (geom);

create index places_prominence_idx on public.places (prominence_score desc);

create index places_primary_category_idx on public.places (primary_category);

comment on table public.places is
  'Shared global place catalog (OSM-sourced). Public read; service-role write.';

alter table public.places enable row level security;

create policy "places_select_public"
  on public.places for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- place_metadata
-- ---------------------------------------------------------------------------

create table public.place_metadata (
  id uuid primary key default gen_random_uuid (),
  place_id uuid not null references public.places (id) on delete cascade,
  field_key text not null,
  source_plugin_id text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint place_metadata_field_key_chk check (
    field_key in (
      'phone',
      'website',
      'opening_hours',
      'email',
      'place_type',
      'place_name',
      'cuisine',
      'wheelchair_access',
      'dog_policy',
      'brand',
      'operator',
      'dietary_options',
      'place_categories',
      'rating',
      'review_count',
      'wikipedia_extract',
      'wikipedia_url',
      'photo_url',
      'wikidata_id',
      'commons_photo_count'
    )
  ),
  constraint place_metadata_unique_source_field unique (place_id, field_key, source_plugin_id)
);

create index place_metadata_place_idx on public.place_metadata (place_id);

create index place_metadata_lookup_idx on public.place_metadata (place_id, field_key);

comment on table public.place_metadata is
  'Normalized facts for global places, contributed by enrichment plugins.';

create or replace function public.place_metadata_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger place_metadata_before_insert
  before insert on public.place_metadata
  for each row execute function public.place_metadata_touch_updated_at();

create trigger place_metadata_before_update
  before update on public.place_metadata
  for each row execute function public.place_metadata_touch_updated_at();

alter table public.place_metadata enable row level security;

create policy "place_metadata_select_public"
  on public.place_metadata for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- place_enrichment_jobs
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.place_enrichment_job_status as enum (
    'pending',
    'processing',
    'completed',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

create table public.place_enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  plugin_type_id text not null,
  place_id uuid not null references public.places (id) on delete cascade,
  event text not null default 'place_discovered',
  payload jsonb not null default '{}'::jsonb,
  status public.place_enrichment_job_status not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index place_enrichment_jobs_status_idx
  on public.place_enrichment_jobs (status, created_at);

create index place_enrichment_jobs_lookup_idx
  on public.place_enrichment_jobs (plugin_type_id, place_id, created_at desc);

create unique index place_enrichment_jobs_active_idx
  on public.place_enrichment_jobs (plugin_type_id, place_id, event)
  where status in ('pending', 'processing');

comment on table public.place_enrichment_jobs is
  'Background enrichment outbox for global places (wikidata, commons, …).';

alter table public.place_enrichment_jobs enable row level security;

create policy "place_enrichment_jobs_select_authenticated"
  on public.place_enrichment_jobs for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- pins.place_id
-- ---------------------------------------------------------------------------

alter table public.pins
  add column place_id uuid references public.places (id) on delete set null;

create index pins_place_id_idx on public.pins (place_id)
  where place_id is not null;

-- Maintain places.pin_count from pins on public maps only.
create or replace function public.recompute_place_pin_count(p_place_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.places p
  set
    pin_count = coalesce((
      select count(*)::integer
      from public.pins j
      inner join public.maps m on m.id = j.map_id
      where j.place_id = p_place_id
        and m.is_public = true
    ), 0),
    updated_at = now()
  where p.id = p_place_id;
$$;

create or replace function public.places_sync_pin_count_on_pin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.place_id is not null then
      perform public.recompute_place_pin_count(new.place_id);
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.place_id is distinct from new.place_id then
      if old.place_id is not null then
        perform public.recompute_place_pin_count(old.place_id);
      end if;
      if new.place_id is not null then
        perform public.recompute_place_pin_count(new.place_id);
      end if;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.place_id is not null then
      perform public.recompute_place_pin_count(old.place_id);
    end if;
    return old;
  end if;

  return null;
end;
$$;

create trigger pins_sync_place_pin_count
  after insert or update of place_id or delete on public.pins
  for each row execute function public.places_sync_pin_count_on_pin_change();

-- Recompute pin_count when map visibility changes.
create or replace function public.places_sync_pin_count_on_map_visibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_public is distinct from new.is_public then
    update public.places p
    set
      pin_count = coalesce((
        select count(*)::integer
        from public.pins j
        inner join public.maps m on m.id = j.map_id
        where j.place_id = p.id
          and m.is_public = true
      ), 0),
      updated_at = now()
    where p.id in (
      select distinct j.place_id
      from public.pins j
      where j.map_id = new.id
        and j.place_id is not null
    );
  end if;
  return new;
end;
$$;

create trigger maps_sync_place_pin_count
  after update of is_public on public.maps
  for each row execute function public.places_sync_pin_count_on_map_visibility();
