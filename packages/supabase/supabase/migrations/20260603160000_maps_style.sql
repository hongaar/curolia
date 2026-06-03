-- Per-map basemap style preset (auto follows app light/dark theme).
do $$ begin
  create type public.map_style as enum ('auto', 'street', 'satellite');
exception
  when duplicate_object then null;
end $$;

alter table public.maps
  add column if not exists style public.map_style not null default 'auto';
