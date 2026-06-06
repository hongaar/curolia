-- Store iCal feed tokens in map_plugins.config (plugin-owned JSON), not a dedicated table.

update public.map_plugins mp
set
  config = mp.config || jsonb_build_object('feedToken', t.token::text),
  updated_at = now()
from public.map_ical_feed_tokens t
where
  mp.map_id = t.map_id
  and mp.plugin_type_id = 'ical';

insert into public.map_plugins (
  map_id,
  plugin_type_id,
  enabled,
  config,
  status
)
select
  t.map_id,
  'ical',
  true,
  jsonb_build_object('feedToken', t.token::text),
  'connected'::public.plugin_link_status
from public.map_ical_feed_tokens t
where not exists (
  select 1
  from public.map_plugins mp
  where
    mp.map_id = t.map_id
    and mp.plugin_type_id = 'ical'
);

create index map_plugins_config_feed_token_idx
  on public.map_plugins ((config->>'feedToken'))
  where config ? 'feedToken';

drop table if exists public.map_ical_feed_tokens;

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
  v_map_slug text;
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

  select slug into v_map_slug from public.maps where id = p_map_id;

  insert into public.notifications (
    user_id, type, title, body, payload, action_path
  )
  values (
    p_new_owner_user_id,
    'map_ownership_received'::public.notification_type,
    'Curolia: you are now the map owner',
    'Plugins were cleared because integrations are personal to each owner.',
    jsonb_build_object('map_id', p_map_id),
    '/maps/' || v_map_slug || '/settings'
  );
end;
$$;
