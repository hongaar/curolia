-- Optional per-map icon shown in the UI; null uses built-in default by is_personal.
alter table public.maps
  add column if not exists icon_emoji text;
