-- location_label is derived on the client from geocode + location_label_detail.
alter table public.pins drop column if exists location_label;

comment on column public.pins.location_label_detail is
  'Which geocode field grouping to show for the derived location label (street_city_country, …).';
