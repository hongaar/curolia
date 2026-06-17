-- Per-map default view and which map / blog / gallery views are available.

do $$ begin
  create type public.map_view_segment as enum ('map', 'blog', 'gallery');
exception
  when duplicate_object then null;
end $$;

alter table public.maps
  add column if not exists default_map_view public.map_view_segment not null default 'map',
  add column if not exists enabled_map_views jsonb not null default jsonb_build_object(
    'map', true,
    'blog', true,
    'gallery', true
  );

comment on column public.maps.default_map_view is
  'Landing view when opening the map shortcut URL or home link.';
comment on column public.maps.enabled_map_views is
  'Per-view availability (`{ "map": true, "blog": true, "gallery": false }`).';

create or replace function public.map_view_path(
  p_map_id uuid,
  p_view text default null
)
returns text
language sql
stable
set search_path = public
as $$
  select '/'
    || p.slug
    || '/'
    || m.slug
    || '/'
    || coalesce(
      case
        when p_view in ('map', 'blog', 'gallery')
          and coalesce((m.enabled_map_views ->> p_view)::boolean, true)
          then p_view::public.map_view_segment
        else null
      end,
      case
        when coalesce((m.enabled_map_views ->> m.default_map_view::text)::boolean, true)
          then m.default_map_view
        when coalesce((m.enabled_map_views ->> 'map')::boolean, true) then 'map'::public.map_view_segment
        when coalesce((m.enabled_map_views ->> 'blog')::boolean, true) then 'blog'::public.map_view_segment
        else 'gallery'::public.map_view_segment
      end
    )::text
  from public.maps m
  inner join public.profiles p on p.id = m.created_by_user_id
  where m.id = p_map_id;
$$;
