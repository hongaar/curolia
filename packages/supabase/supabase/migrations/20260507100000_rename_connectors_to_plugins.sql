-- Rename connectors domain → plugins (enum, tables, columns, constraints, policies, indexes).

alter type public.connector_link_status rename to plugin_link_status;

-- Catalog
alter table public.connector_types rename to plugin_types;
alter policy "connector_types_select_authenticated" on public.plugin_types
  rename to "plugin_types_select_authenticated";

-- Per-map settings
alter table public.map_connectors rename to map_plugins;
alter index public.map_connectors_map_idx rename to map_plugins_map_idx;
alter table public.map_plugins rename column connector_type_id to plugin_type_id;

alter table public.map_plugins rename constraint map_connectors_pkey to map_plugins_pkey;
alter table public.map_plugins
  rename constraint map_connectors_map_id_connector_type_id_key to map_plugins_map_id_plugin_type_id_key;
alter table public.map_plugins
  rename constraint map_connectors_connector_type_id_fkey to map_plugins_plugin_type_id_fkey;

alter policy "map_connectors_select_member" on public.map_plugins
  rename to "map_plugins_select_member";
alter policy "map_connectors_write_owner" on public.map_plugins
  rename to "map_plugins_write_owner";
alter policy "map_connectors_update_owner" on public.map_plugins
  rename to "map_plugins_update_owner";
alter policy "map_connectors_delete_owner" on public.map_plugins
  rename to "map_plugins_delete_owner";

-- Account-wide toggles
alter table public.user_connectors rename to user_plugins;
alter index public.user_connectors_user_idx rename to user_plugins_user_idx;
alter table public.user_plugins rename column connector_type_id to plugin_type_id;

alter table public.user_plugins rename constraint user_connectors_pkey to user_plugins_pkey;
alter table public.user_plugins
  rename constraint user_connectors_user_id_connector_type_id_key to user_plugins_user_id_plugin_type_id_key;
alter table public.user_plugins
  rename constraint user_connectors_connector_type_id_fkey to user_plugins_plugin_type_id_fkey;

alter policy "user_connectors_select_own" on public.user_plugins rename to "user_plugins_select_own";
alter policy "user_connectors_insert_own" on public.user_plugins rename to "user_plugins_insert_own";
alter policy "user_connectors_update_own" on public.user_plugins rename to "user_plugins_update_own";
alter policy "user_connectors_delete_own" on public.user_plugins rename to "user_plugins_delete_own";

-- Ownership transfer must delete plugin rows by new table name
create or replace function public.transfer_map_ownership(
  p_map_id uuid,
  p_new_owner_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_new_role public.map_member_role;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_map_owner(p_map_id) then
    raise exception 'Only the current owner can transfer ownership';
  end if;

  if p_new_owner_user_id = v_uid then
    raise exception 'You are already the owner';
  end if;

  select jm.role into v_new_role
  from public.map_members jm
  where jm.map_id = p_map_id and jm.user_id = p_new_owner_user_id;

  if v_new_role is null then
    raise exception 'The new owner must already be a member of this map';
  end if;

  if v_new_role = 'owner'::public.map_member_role then
    raise exception 'Target user is already an owner';
  end if;

  delete from public.map_plugins where map_id = p_map_id;
  delete from public.map_ical_feed_tokens where map_id = p_map_id;

  update public.map_members
  set role = 'editor'::public.map_member_role
  where map_id = p_map_id and user_id = v_uid;

  update public.map_members
  set role = 'owner'::public.map_member_role
  where map_id = p_map_id and user_id = p_new_owner_user_id;

  update public.maps
  set created_by_user_id = p_new_owner_user_id,
      updated_at = now()
  where id = p_map_id;

  insert into public.notifications (
    user_id, type, title, body, payload, action_path
  )
  values (
    p_new_owner_user_id,
    'map_ownership_received'::public.notification_type,
    'Curolia: you are now the map owner',
    'Plugins were cleared because integrations are personal to each owner.',
    jsonb_build_object('map_id', p_map_id),
    '/maps/' || p_map_id::text || '/settings'
  );
end;
$$;
