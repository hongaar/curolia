-- User-scoped plugin_entity_data for Google Maps export cache (reusable across maps).

alter table public.plugin_entity_data
  alter column map_id drop not null;

alter table public.plugin_entity_data
  drop constraint if exists plugin_entity_data_entity_type_chk;

alter table public.plugin_entity_data
  add constraint plugin_entity_data_entity_type_chk
  check (entity_type in ('pin', 'map', 'user'));

create or replace function public.plugin_entity_data_align_pin_map()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  j_id uuid;
begin
  if new.entity_type = 'pin' then
    select t.map_id into j_id from public.pins t where t.id = new.entity_id;
    if j_id is null then
      raise exception 'Pin not found for plugin_entity_data';
    end if;
    new.map_id := j_id;
  elsif new.entity_type = 'map' then
    new.map_id := new.entity_id;
  elsif new.entity_type = 'user' then
    new.map_id := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create policy "plugin_entity_data_select_own_user"
  on public.plugin_entity_data for select
  to authenticated
  using (entity_type = 'user' and entity_id = auth.uid());

create policy "plugin_entity_data_insert_own_user"
  on public.plugin_entity_data for insert
  to authenticated
  with check (entity_type = 'user' and entity_id = auth.uid());

create policy "plugin_entity_data_update_own_user"
  on public.plugin_entity_data for update
  to authenticated
  using (entity_type = 'user' and entity_id = auth.uid())
  with check (entity_type = 'user' and entity_id = auth.uid());

create policy "plugin_entity_data_delete_own_user"
  on public.plugin_entity_data for delete
  to authenticated
  using (entity_type = 'user' and entity_id = auth.uid());
