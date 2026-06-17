-- Track which pin photo was used for the map cover (for pin edit UI + cleanup on delete).

alter table public.maps
  add column if not exists cover_photo_id uuid references public.photos (id) on delete set null;

comment on column public.maps.cover_photo_id is
  'When set, the map cover image was copied from this pin photo.';

create index if not exists maps_cover_photo_id_idx
  on public.maps (cover_photo_id)
  where cover_photo_id is not null;
