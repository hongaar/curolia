-- Old pin slugs kept as redirects when the title (and slug) changes after creation.

create table public.pin_slug_redirects (
  map_id uuid not null references public.maps (id) on delete cascade,
  slug text not null,
  pin_id uuid not null references public.pins (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint pin_slug_redirects_slug_format_chk
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  primary key (map_id, slug)
);

create index pin_slug_redirects_pin_idx on public.pin_slug_redirects (pin_id);

alter table public.pin_slug_redirects enable row level security;

create policy "pin_slug_redirects_select_member"
  on public.pin_slug_redirects for select
  to authenticated
  using (public.is_map_member(map_id));

create policy "pin_slug_redirects_select_public"
  on public.pin_slug_redirects for select
  to anon, authenticated
  using (public.is_map_publicly_readable(map_id));

create policy "pin_slug_redirects_insert_member"
  on public.pin_slug_redirects for insert
  to authenticated
  with check (public.is_map_member(map_id));

create policy "pin_slug_redirects_update_member"
  on public.pin_slug_redirects for update
  to authenticated
  using (public.is_map_member(map_id))
  with check (public.is_map_member(map_id));

create policy "pin_slug_redirects_delete_member"
  on public.pin_slug_redirects for delete
  to authenticated
  using (public.is_map_member(map_id));

create or replace function public.pins_set_slug()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_slug text;
begin
  if tg_op = 'INSERT' then
    if new.slug is null or trim(new.slug) = '' then
      new.slug := public.pin_claim_slug(new.map_id, new.id, coalesce(new.title, ''));
    else
      new.slug := public.pin_claim_slug(new.map_id, new.id, new.slug);
    end if;
  elsif tg_op = 'UPDATE' then
    if new.map_id is distinct from old.map_id then
      new.slug := public.pin_claim_slug(new.map_id, new.id, coalesce(new.title, ''));
    elsif new.title is distinct from old.title
          and (new.slug is not distinct from old.slug) then
      -- Title-only change: rewrite slug and keep the previous URL as a redirect.
      next_slug := public.pin_claim_slug(new.map_id, new.id, coalesce(new.title, ''));
      if next_slug is distinct from old.slug then
        insert into public.pin_slug_redirects (map_id, slug, pin_id)
        values (old.map_id, old.slug, old.id)
        on conflict (map_id, slug) do update
          set pin_id = excluded.pin_id;
        new.slug := next_slug;
      end if;
    elsif new.slug is null or trim(new.slug) = '' then
      -- Explicit empty slug (e.g. new-pin quick dialog): reclaim from title, no redirect.
      new.slug := public.pin_claim_slug(new.map_id, new.id, coalesce(new.title, ''));
    else
      new.slug := public.pin_claim_slug(new.map_id, new.id, new.slug);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists pins_set_slug_before_upd on public.pins;

create trigger pins_set_slug_before_upd
  before update of title, slug, map_id on public.pins
  for each row execute function public.pins_set_slug();
