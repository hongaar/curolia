-- Notification deep links and settings URLs use map slug instead of UUID.

create or replace function public.accept_map_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(coalesce((select auth.jwt())->>'email', '')));
  v_row public.map_invitations%rowtype;
  v_map_name text;
  v_map_slug text;
  v_acceptor_name text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row
  from public.map_invitations
  where token = p_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if v_row.id is null then
    raise exception 'Invitation not found or no longer valid';
  end if;

  if lower(trim(v_row.invitee_email)) <> v_email then
    raise exception 'This invitation was sent to a different email address';
  end if;

  if exists (
    select 1 from public.map_members jm
    where jm.map_id = v_row.map_id and jm.user_id = v_uid
  ) then
    update public.map_invitations
    set status = 'accepted'
    where id = v_row.id;
    return v_row.map_id;
  end if;

  insert into public.map_members (map_id, user_id, role)
  values (v_row.map_id, v_uid, v_row.invited_role);

  update public.map_invitations
  set status = 'accepted'
  where id = v_row.id;

  update public.notifications
  set read_at = now()
  where user_id = v_uid
    and type = 'map_invitation'
    and (payload->>'token') = p_token::text
    and read_at is null;

  select name, slug
  into v_map_name, v_map_slug
  from public.maps
  where id = v_row.map_id;

  select display_name into v_acceptor_name from public.profiles where id = v_uid;

  insert into public.notifications (
    user_id, type, title, body, payload, action_path
  )
  values (
    v_row.invited_by_user_id,
    'map_invitation_accepted'::public.notification_type,
    'Curolia: invitation accepted',
    format(
      '%s joined "%s".',
      coalesce(v_acceptor_name, v_email),
      coalesce(v_map_name, 'your map')
    ),
    jsonb_build_object('map_id', v_row.map_id, 'user_id', v_uid::text),
    '/maps/' || v_map_slug || '/settings'
  );

  return v_row.map_id;
end;
$$;

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
