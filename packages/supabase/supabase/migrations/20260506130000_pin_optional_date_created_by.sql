-- Optional pin start date + creator (profiles FK for joins / RLS).

alter table public.pins alter column date drop default;
alter table public.pins alter column date drop not null;

alter table public.pins drop constraint if exists pins_end_date_gte_date;

alter table public.pins
  add constraint pins_end_date_requires_start_and_gte
  check (
    end_date is null
    or (date is not null and end_date >= date)
  );

comment on column public.pins.date is 'Optional start calendar day (UTC) for the pin.';

alter table public.pins
  add column created_by_user_id uuid references public.profiles (id) on delete set null;

comment on column public.pins.created_by_user_id is 'Profile of the user who created this pin row.';

create or replace function public.pins_set_creator_on_insert()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.created_by_user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists pins_set_creator_bi on public.pins;
create trigger pins_set_creator_bi
  before insert on public.pins
  for each row
  execute function public.pins_set_creator_on_insert();
