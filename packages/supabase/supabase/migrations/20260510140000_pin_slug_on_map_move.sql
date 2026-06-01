-- When a pin moves to another map, reclaim slug within the destination map.
-- Storage paths and app logic still update map_id separately; this avoids (map_id, slug) conflicts.

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
    if new.map_id is distinct from old.map_id then
      new.slug := public.pin_claim_slug(new.map_id, new.id, coalesce(new.title, ''));
    elsif new.slug is null or trim(new.slug) = '' then
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
  before update of slug, map_id on public.pins
  for each row execute function public.pins_set_slug();
