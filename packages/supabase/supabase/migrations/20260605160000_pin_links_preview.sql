-- Rich link preview fields (description + og image) captured when a link is added.

alter table public.pin_links
  add column description text,
  add column image_url text;

comment on column public.pin_links.description is
  'Page description fetched from the URL when added (og:description / meta description).';
comment on column public.pin_links.image_url is
  'Preview image URL fetched from the URL when added (og:image / twitter:image).';
