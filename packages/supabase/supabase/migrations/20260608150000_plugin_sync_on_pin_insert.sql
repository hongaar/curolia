-- Enqueue plugin sync jobs when pins are created, not only when lat/lng change.
-- Pin creation is always an INSERT; the app does not expose coordinate editing.

create or replace function public.enqueue_plugin_sync_on_pin_move()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    tg_op = 'INSERT'
    or (
      tg_op = 'UPDATE'
      and (
        old.lat is distinct from new.lat
        or old.lng is distinct from new.lng
      )
    )
  )
  and new.lat is not null
  and new.lng is not null
  then
    delete from public.plugin_sync_jobs j
    where j.entity_type = 'pin'
      and j.entity_id = new.id
      and j.event = 'pin_coordinates_changed'
      and j.status in ('pending', 'processing');

    insert into public.plugin_sync_jobs (
      plugin_type_id,
      entity_type,
      entity_id,
      map_id,
      event,
      payload,
      status
    )
    select
      mp.plugin_type_id,
      'pin',
      new.id,
      new.map_id,
      'pin_coordinates_changed',
      jsonb_build_object('lat', new.lat, 'lng', new.lng),
      'pending'
    from public.map_plugins mp
    where mp.map_id = new.map_id
      and mp.enabled = true
      and coalesce(mp.config->'syncEvents', '[]'::jsonb)
        @> '["pin_coordinates_changed"]'::jsonb
      and not exists (
        select 1
        from public.plugin_sync_jobs j
        where j.plugin_type_id = mp.plugin_type_id
          and j.entity_type = 'pin'
          and j.entity_id = new.id
          and j.event = 'pin_coordinates_changed'
          and j.status = 'completed'
          and (j.payload->>'lat')::double precision is not distinct from new.lat
          and (j.payload->>'lng')::double precision is not distinct from new.lng
      );
  end if;

  return new;
end;
$$;

drop trigger if exists pins_enqueue_plugin_sync on public.pins;
create trigger pins_enqueue_plugin_sync
  after insert or update of lat, lng on public.pins
  for each row
  execute function public.enqueue_plugin_sync_on_pin_move();
