-- Last editor attribution (separate from creator).

alter table public.pins
  add column modified_by_user_id uuid references public.profiles (id) on delete set null;

comment on column public.pins.modified_by_user_id is 'Profile of the user who last updated this pin.';

create or replace function public.pins_set_modifier_on_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.modified_by_user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists pins_set_modifier_bu on public.pins;
create trigger pins_set_modifier_bu
  before update on public.pins
  for each row
  execute function public.pins_set_modifier_on_update();
