-- Auto-dispatch plugin sync jobs from the database (no client trigger).
-- Uses pg_cron + pg_net to POST to plugin-sync-dispatch on a fixed schedule.
-- Rate-limited: one batched dispatch per minute when pending jobs exist.

create schema if not exists private;

create table if not exists private.worker_config (
  key text primary key,
  value text not null
);

comment on table private.worker_config is
  'Worker-only config for pg_net/pg_cron (dispatch URL + secret). Not exposed via Data API.';

alter table private.worker_config enable row level security;

revoke all on schema private from public, anon, authenticated;
revoke all on private.worker_config from public, anon, authenticated;

insert into private.worker_config (key, value)
values
  (
    'plugin_sync_functions_base',
    'http://kong:8000/functions/v1'
  ),
  ('plugin_sync_dispatch_secret', '')
on conflict (key) do nothing;

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

create or replace function private.worker_config_value(p_key text)
returns text
language sql
stable
security definer
set search_path = private, public
as $$
  select value from private.worker_config where key = p_key;
$$;

revoke all on function private.worker_config_value(text) from public, anon, authenticated;

create or replace function private.invoke_plugin_sync_dispatch(p_limit integer default 10)
returns void
language plpgsql
security definer
set search_path = private, public, extensions
as $$
declare
  v_base text;
  v_secret text;
  v_url text;
  v_limit integer := greatest(1, least(coalesce(p_limit, 10), 20));
begin
  v_base := private.worker_config_value('plugin_sync_functions_base');
  v_secret := private.worker_config_value('plugin_sync_dispatch_secret');

  if v_base is null or v_secret is null or length(trim(v_secret)) = 0 then
    return;
  end if;

  if not exists (
    select 1 from public.plugin_sync_jobs where status = 'pending' limit 1
  ) then
    return;
  end if;

  v_url := rtrim(v_base, '/') || '/plugin-sync-dispatch';

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || trim(v_secret)
    ),
    body := jsonb_build_object('limit', v_limit)
  );
end;
$$;

revoke all on function private.invoke_plugin_sync_dispatch(integer) from public, anon, authenticated;

do $$
begin
  perform cron.unschedule('plugin-sync-dispatch');
exception
  when undefined_object then null;
  when others then null;
end $$;

select cron.schedule(
  'plugin-sync-dispatch',
  '* * * * *',
  $$ select private.invoke_plugin_sync_dispatch(10); $$
);

-- Skip re-enqueue when coordinates match the last completed sync for this pin/plugin/event.
create or replace function public.enqueue_plugin_sync_on_pin_move()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and (
      old.lat is distinct from new.lat
      or old.lng is distinct from new.lng
    )
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
