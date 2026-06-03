-- Optional basemap overlays per preset (street hillshades, satellite reference labels).
alter table public.maps
  add column if not exists style_hillshades boolean not null default false,
  add column if not exists style_satellite_labels boolean not null default false;
