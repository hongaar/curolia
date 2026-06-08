-- Allow map-scoped plugin_entity_data (export cache) and daily Google Maps list sync.

alter table public.plugin_entity_data
  drop constraint if exists plugin_entity_data_entity_type_chk;

alter table public.plugin_entity_data
  add constraint plugin_entity_data_entity_type_chk
  check (entity_type in ('pin', 'map'));

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
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.invoke_google_maps_saved_lists_sync()
returns void
language plpgsql
security definer
set search_path = private, public, extensions
as $$
declare
  v_base text;
  v_secret text;
  v_url text;
begin
  v_base := private.worker_config_value('plugin_sync_functions_base');
  v_secret := private.worker_config_value('plugin_sync_dispatch_secret');

  if v_base is null or v_secret is null or length(trim(v_secret)) = 0 then
    return;
  end if;

  v_url := rtrim(v_base, '/') || '/google-maps-saved-lists';

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || trim(v_secret)
    ),
    body := jsonb_build_object('action', 'process_scheduled_syncs')
  );
end;
$$;

revoke all on function private.invoke_google_maps_saved_lists_sync() from public, anon, authenticated;

do $$
begin
  perform cron.unschedule('google-maps-saved-lists-sync');
exception
  when undefined_object then null;
  when others then null;
end $$;

select cron.schedule(
  'google-maps-saved-lists-sync',
  '0 6 * * *',
  $$ select private.invoke_google_maps_saved_lists_sync(); $$
);
