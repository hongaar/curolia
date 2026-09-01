-- Auto-dispatch place enrichment jobs from the database (no client trigger).
-- Uses pg_cron + pg_net to POST to place-enrichment-dispatch on a fixed schedule.
-- Reuses private.worker_config (functions base URL + PLUGIN_SYNC_DISPATCH_SECRET).

create or replace function private.invoke_place_enrichment_dispatch()
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

  if not exists (
    select 1
    from public.place_enrichment_jobs
    where status = 'pending'
    limit 1
  ) then
    return;
  end if;

  v_url := rtrim(v_base, '/') || '/place-enrichment-dispatch';

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || trim(v_secret)
    ),
    body := '{}'::jsonb
  );
end;
$$;

revoke all on function private.invoke_place_enrichment_dispatch() from public, anon, authenticated;

do $$
begin
  perform cron.unschedule('place-enrichment-dispatch');
exception
  when undefined_object then null;
  when others then null;
end $$;

select cron.schedule(
  'place-enrichment-dispatch',
  '* * * * *',
  $$ select private.invoke_place_enrichment_dispatch(); $$
);
