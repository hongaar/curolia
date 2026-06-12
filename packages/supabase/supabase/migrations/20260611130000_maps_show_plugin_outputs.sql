-- Per-map visibility for plugin cards and subtitles (default: show when unset).

alter table public.maps
  add column if not exists show_plugin_outputs jsonb not null default '{}'::jsonb;

comment on column public.maps.show_plugin_outputs is
  'Per-plugin pin output visibility. Omitted or true shows output; false hides it.';
