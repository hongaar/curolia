-- Ignore duplicate active enrichment jobs (concurrent tile upserts race the NOT EXISTS check).

create or replace function public.enqueue_place_enrichment_job(
  p_plugin_type_id text,
  p_place_id uuid,
  p_event text default 'place_discovered'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.place_enrichment_jobs (plugin_type_id, place_id, event, status, payload)
  select p_plugin_type_id, p_place_id, p_event, 'pending', '{}'::jsonb
  where not exists (
    select 1
    from public.place_enrichment_jobs j
    where j.plugin_type_id = p_plugin_type_id
      and j.place_id = p_place_id
      and j.event = p_event
      and j.status in ('pending', 'processing')
  );
exception
  when unique_violation then
    null;
end;
$$;

revoke all on function public.enqueue_place_enrichment_job from public;
grant execute on function public.enqueue_place_enrichment_job to service_role;
