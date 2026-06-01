-- Pins: date-only start + optional inclusive end (for iCalendar and UI).
alter table public.pins add column date date;
alter table public.pins add column end_date date;

update public.pins
set date = (visited_at at time zone 'UTC')::date;

alter table public.pins
  alter column date set default (timezone('UTC', now()))::date,
  alter column date set not null;

alter table public.pins
  add constraint pins_end_date_gte_date
  check (end_date is null or end_date >= date);

drop index if exists public.pins_map_visited_idx;

alter table public.pins drop column visited_at;

create index if not exists pins_map_date_idx
  on public.pins (map_id, date desc);

comment on column public.pins.date is 'Start calendar day (UTC date) for the pin.';
comment on column public.pins.end_date is 'Optional inclusive end calendar day; must be >= date.';

-- Opaque token for unguessable public iCalendar URLs (resolved in Edge Function).
create table public.map_ical_feed_tokens (
  map_id uuid primary key references public.maps (id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);

create index map_ical_feed_tokens_token_idx on public.map_ical_feed_tokens (token);

alter table public.map_ical_feed_tokens enable row level security;

create policy "map_ical_feed_tokens_select_member"
  on public.map_ical_feed_tokens for select
  to authenticated
  using (public.is_map_member(map_id));

create policy "map_ical_feed_tokens_insert_member"
  on public.map_ical_feed_tokens for insert
  to authenticated
  with check (public.is_map_member(map_id));

create policy "map_ical_feed_tokens_update_member"
  on public.map_ical_feed_tokens for update
  to authenticated
  using (public.is_map_member(map_id))
  with check (public.is_map_member(map_id));

create policy "map_ical_feed_tokens_delete_member"
  on public.map_ical_feed_tokens for delete
  to authenticated
  using (public.is_map_member(map_id));

update public.connector_types
set description = 'Publish this map''s pins as a subscribe-only iCalendar (.ics) feed.'
where id = 'ical';
