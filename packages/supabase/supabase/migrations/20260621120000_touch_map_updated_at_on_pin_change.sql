-- Bump maps.updated_at when pins change so home feed "Your maps" reflects pin edits.

create or replace function public.touch_map_updated_at(p_map_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.maps
  set updated_at = now()
  where id = p_map_id;
$$;

revoke all on function public.touch_map_updated_at(uuid) from public;

create or replace function public.touch_map_updated_at_from_pin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.touch_map_updated_at(old.map_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and new.map_id is distinct from old.map_id then
    perform public.touch_map_updated_at(old.map_id);
  end if;

  perform public.touch_map_updated_at(new.map_id);
  return new;
end;
$$;

drop trigger if exists pins_touch_map_updated_at on public.pins;

create trigger pins_touch_map_updated_at
  after insert or update or delete on public.pins
  for each row execute function public.touch_map_updated_at_from_pin();

-- Backfill maps whose pins were edited more recently than the map row.
update public.maps m
set updated_at = sub.last_pin_at
from (
  select p.map_id, max(p.updated_at) as last_pin_at
  from public.pins p
  group by p.map_id
) sub
where m.id = sub.map_id
  and sub.last_pin_at > m.updated_at;
