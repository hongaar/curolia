-- Reverse-geocode payload and user-chosen label granularity.
alter table public.pins add column if not exists geocode jsonb;

alter table public.pins add column if not exists location_label_detail text not null default 'full';

comment on column public.pins.geocode is
  'Photon reverse-geocode properties at lat/lng; used to derive location_label.';

comment on column public.pins.location_label_detail is
  'Which geocode field grouping to show in location_label (full, street, locality, region, country, name).';

alter table public.pins
  drop constraint if exists pins_location_label_detail_check;

alter table public.pins
  add constraint pins_location_label_detail_check
  check (
    location_label_detail in ('full', 'street', 'locality', 'region', 'country', 'name')
  );
