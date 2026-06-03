-- Original pixel dimensions for justified gallery layouts (rows/columns).
alter table public.photos
  add column width integer,
  add column height integer;

alter table public.photos
  add constraint photos_dimensions_positive check (
    (width is null and height is null)
    or (
      width is not null
      and height is not null
      and width > 0
      and height > 0
    )
  );

comment on column public.photos.width is 'Original image width in pixels when known.';
comment on column public.photos.height is 'Original image height in pixels when known.';
