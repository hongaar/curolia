-- Pin metadata is now always shown; map editors curate it per pin instead.
alter table public.maps drop column show_pin_metadata;
