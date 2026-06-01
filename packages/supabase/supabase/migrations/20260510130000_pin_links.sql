-- External links attached to a pin (with display metadata: title + favicon).

create table public.pin_links (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.maps (id) on delete cascade,
  pin_id uuid not null references public.pins (id) on delete cascade,
  url text not null,
  title text,
  favicon_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pin_links_pin_idx on public.pin_links (pin_id);
create index pin_links_map_idx on public.pin_links (map_id);

alter table public.pin_links
  add constraint pin_links_url_scheme_chk
  check (url ~* '^https?://');

-- Auto-populate map_id from the parent pin (mirrors `photos` pattern).
create or replace function public.pin_links_set_map_from_pin()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  j_id uuid;
begin
  select t.map_id into j_id from public.pins t where t.id = new.pin_id;
  if j_id is null then
    raise exception 'Pin not found';
  end if;
  new.map_id := j_id;
  new.updated_at := now();
  return new;
end;
$$;

create trigger pin_links_set_map_before_insert
  before insert on public.pin_links
  for each row execute function public.pin_links_set_map_from_pin();

create trigger pin_links_set_map_before_update
  before update on public.pin_links
  for each row execute function public.pin_links_set_map_from_pin();

alter table public.pin_links enable row level security;

create policy "pin_links_select_member"
  on public.pin_links for select
  to authenticated
  using (public.is_map_member(map_id));

create policy "pin_links_insert_member"
  on public.pin_links for insert
  to authenticated
  with check (public.is_map_member(map_id));

create policy "pin_links_update_member"
  on public.pin_links for update
  to authenticated
  using (public.is_map_member(map_id))
  with check (public.is_map_member(map_id));

create policy "pin_links_delete_member"
  on public.pin_links for delete
  to authenticated
  using (public.is_map_member(map_id));

comment on table public.pin_links is
  'External URLs attached to a pin, with optional auto-imported title and favicon.';
comment on column public.pin_links.title is
  'Page title fetched from the URL when added (best-effort, may be edited).';
comment on column public.pin_links.favicon_url is
  'Resolved favicon URL discovered when the link was added.';
