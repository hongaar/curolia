-- Per-map display toggles for pin metadata families (does not affect plugin sync).

alter table public.maps
  add column if not exists show_pin_metadata jsonb not null default '{"food":true,"accessibility":true,"outdoor":true}'::jsonb;

comment on column public.maps.show_pin_metadata is
  'Which pin metadata families to show on pins for this map (food, accessibility, outdoor). Does not affect source data sync.';
