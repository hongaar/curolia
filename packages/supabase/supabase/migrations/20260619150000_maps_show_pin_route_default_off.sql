-- Route lines should default off for newly created maps.
alter table public.maps
  alter column show_pin_route set default false;
