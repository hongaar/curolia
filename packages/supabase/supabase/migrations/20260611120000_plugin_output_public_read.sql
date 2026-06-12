-- Public map readers may view pin-scoped plugin output (not user-scoped rows).

drop policy if exists "plugin_entity_data_select_public" on public.plugin_entity_data;
create policy "plugin_entity_data_select_public"
  on public.plugin_entity_data for select
  to anon, authenticated
  using (
    entity_type = 'pin'
    and public.is_map_publicly_readable(map_id)
  );

drop policy if exists "pin_metadata_select_public" on public.pin_metadata;
create policy "pin_metadata_select_public"
  on public.pin_metadata for select
  to anon, authenticated
  using (public.is_map_publicly_readable(map_id));
