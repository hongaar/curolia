-- URL-safe pin slugs, unique within each map (same shape as tags.slug).

create or replace function public.pin_claim_slug(
  p_map_id uuid,
  p_pin_id uuid,
  p_desired text
)
returns text
language plpgsql
set search_path = public
as $$
declare
  base text;
  candidate text;
  suffix int := 0;
begin
  base := public.slugify_text(p_desired);
  if base is null or length(base) = 0 then
    base := 'pin';
  end if;
  base := substring(base from 1 for 120);

  candidate := base;
  loop
    exit when not exists (
      select 1
      from public.pins tr
      where tr.map_id = p_map_id
        and tr.slug = candidate
        and (
          p_pin_id is null
          or tr.id is distinct from p_pin_id
        )
    );

    suffix := suffix + 1;
    candidate := substring(base from 1 for 118) || '-' || suffix::text;
  end loop;

  return candidate;
end;
$$;

revoke all on function public.pin_claim_slug(uuid, uuid, text) from public;
grant execute on function public.pin_claim_slug(uuid, uuid, text)
  to authenticated, service_role;

alter table public.pins
  add column if not exists slug text;

update public.pins t
set slug = public.pin_claim_slug(t.map_id, t.id, coalesce(t.title, ''))
where t.slug is null or trim(t.slug) = '';

alter table public.pins
  alter column slug set not null;

drop index if exists pins_map_slug_key;

create unique index pins_map_slug_key
  on public.pins (map_id, slug);

alter table public.pins
  add constraint pins_slug_format_chk
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

create or replace function public.pins_set_slug()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.slug is null or trim(new.slug) = '' then
      new.slug := public.pin_claim_slug(new.map_id, new.id, coalesce(new.title, ''));
    else
      new.slug := public.pin_claim_slug(new.map_id, new.id, new.slug);
    end if;
  elsif tg_op = 'UPDATE' then
    -- Title edits do not rewrite slug (stable URLs). Only `slug` changes re-claim.
    if new.slug is null or trim(new.slug) = '' then
      new.slug := public.pin_claim_slug(new.map_id, new.id, coalesce(new.title, ''));
    else
      new.slug := public.pin_claim_slug(new.map_id, new.id, new.slug);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists pins_set_slug_before_ins on public.pins;

create trigger pins_set_slug_before_ins
  before insert on public.pins
  for each row execute function public.pins_set_slug();

drop trigger if exists pins_set_slug_before_upd on public.pins;

create trigger pins_set_slug_before_upd
  before update of slug on public.pins
  for each row execute function public.pins_set_slug();
