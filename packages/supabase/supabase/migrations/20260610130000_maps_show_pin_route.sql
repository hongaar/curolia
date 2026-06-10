-- Draw chronological route lines between dated pins on the map view.
alter table public.maps
  add column if not exists show_pin_route boolean not null default true;

comment on column public.maps.show_pin_route is
  'When true, the map view draws lines connecting dated pins in chronological order.';

alter table public.maps
  alter column show_pin_route set default true;

update public.maps
set show_pin_route = true
where not show_pin_route;
