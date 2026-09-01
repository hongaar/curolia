-- RPC helpers for the places Edge Function (service-role only).

create or replace function public.upsert_osm_place(
  p_source_ref text,
  p_lng double precision,
  p_lat double precision,
  p_name text,
  p_primary_category text,
  p_categories text[],
  p_osm_tags jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  insert into public.places (
    source,
    source_ref,
    geom,
    name,
    primary_category,
    categories,
    osm_tags
  )
  values (
    'osm',
    p_source_ref,
    extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    p_name,
    p_primary_category,
    coalesce(p_categories, '{}'),
    coalesce(p_osm_tags, '{}'::jsonb)
  )
  on conflict (source, source_ref) do update
  set
    geom = excluded.geom,
    name = coalesce(excluded.name, public.places.name),
    primary_category = coalesce(excluded.primary_category, public.places.primary_category),
    categories = case
      when cardinality(excluded.categories) > 0 then excluded.categories
      else public.places.categories
    end,
    osm_tags = excluded.osm_tags,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.upsert_osm_place from public;
grant execute on function public.upsert_osm_place to service_role;

create or replace function public.places_in_bbox(
  p_west double precision,
  p_south double precision,
  p_east double precision,
  p_north double precision,
  p_categories text[] default null,
  p_limit integer default 60
)
returns setof public.places
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p.*
  from public.places p
  where p.geom && extensions.st_makeenvelope(p_west, p_south, p_east, p_north, 4326)::extensions.geography
    and (
      p_categories is null
      or cardinality(p_categories) = 0
      or p.primary_category = any (p_categories)
      or p.categories && p_categories
    )
  order by p.prominence_score desc, p.pin_count desc, p.name asc nulls last
  limit greatest(1, least(p_limit, 200));
$$;

revoke all on function public.places_in_bbox from public;
grant execute on function public.places_in_bbox to service_role, anon, authenticated;

create or replace function public.places_cluster_in_bbox(
  p_west double precision,
  p_south double precision,
  p_east double precision,
  p_north double precision,
  p_cell_deg double precision default 0.75,
  p_limit integer default 40
)
returns table (
  cluster_lng double precision,
  cluster_lat double precision,
  place_count bigint,
  top_prominence double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with filtered as (
    select
      p.id,
      p.prominence_score,
      extensions.st_x(p.geom::extensions.geometry) as lng,
      extensions.st_y(p.geom::extensions.geometry) as lat,
      floor(extensions.st_x(p.geom::extensions.geometry) / p_cell_deg) as cell_x,
      floor(extensions.st_y(p.geom::extensions.geometry) / p_cell_deg) as cell_y
    from public.places p
    where p.geom && extensions.st_makeenvelope(p_west, p_south, p_east, p_north, 4326)::extensions.geography
  ),
  grouped as (
    select
      cell_x,
      cell_y,
      count(*)::bigint as place_count,
      max(prominence_score) as top_prominence,
      avg(lng) as cluster_lng,
      avg(lat) as cluster_lat
    from filtered
    group by cell_x, cell_y
    order by place_count desc, top_prominence desc
    limit greatest(1, least(p_limit, 100))
  )
  select cluster_lng, cluster_lat, place_count, top_prominence
  from grouped;
$$;

revoke all on function public.places_cluster_in_bbox from public;
grant execute on function public.places_cluster_in_bbox to service_role, anon, authenticated;

create or replace function public.recompute_place_prominence(p_place_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pin_count integer;
  v_meta_count integer;
  v_rating double precision;
  v_score double precision;
begin
  select pin_count into v_pin_count from public.places where id = p_place_id;
  if not found then return; end if;

  select count(*)::integer into v_meta_count
  from public.place_metadata pm
  where pm.place_id = p_place_id;

  select coalesce((pm.value ->> 'value')::double precision, 0)
  into v_rating
  from public.place_metadata pm
  where pm.place_id = p_place_id and pm.field_key = 'rating'
  order by pm.updated_at desc
  limit 1;

  v_score :=
    (coalesce(v_pin_count, 0) * 10.0)
    + (coalesce(v_meta_count, 0) * 2.0)
    + (coalesce(v_rating, 0) * 5.0);

  update public.places
  set prominence_score = v_score, updated_at = now()
  where id = p_place_id;
end;
$$;

revoke all on function public.recompute_place_prominence from public;
grant execute on function public.recompute_place_prominence to service_role;
