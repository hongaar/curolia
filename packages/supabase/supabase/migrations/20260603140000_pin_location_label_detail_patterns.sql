-- Location label patterns (comma-separated geocode levels), not single-field keys.

alter table public.pins
  drop constraint if exists pins_location_label_detail_check;

update public.pins
set location_label_detail = 'street_city_region_country'
where location_label_detail = 'full';

update public.pins
set location_label_detail = 'street_city_country'
where location_label_detail in ('street', 'name');

update public.pins
set location_label_detail = 'city_country'
where location_label_detail in ('locality', 'city');

update public.pins
set location_label_detail = 'region_country'
where location_label_detail = 'region';

update public.pins
set location_label_detail = 'street_city_country'
where location_label_detail not in (
  'street_city_region_country',
  'street_city_country',
  'city_region_country',
  'city_country',
  'region_country',
  'country'
);

alter table public.pins
  alter column location_label_detail set default 'street_city_country';

alter table public.pins
  add constraint pins_location_label_detail_check
  check (
    location_label_detail in (
      'street_city_region_country',
      'street_city_country',
      'city_region_country',
      'city_country',
      'region_country',
      'country'
    )
  );

comment on column public.pins.location_label_detail is
  'Geocode label pattern: street+city+region+country, street+city+country, city+region+country, city+country, region+country, or country.';
