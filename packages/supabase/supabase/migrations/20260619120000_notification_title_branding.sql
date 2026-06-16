-- Drop legacy "Curolia:" branding from notification titles.

update public.notifications
set title = 'Invitation accepted'
where title = 'Curolia: invitation accepted';

update public.notifications
set title = 'You are now the map owner'
where title = 'Curolia: you are now the map owner';

update public.notifications
set title = 'Map invitation'
where title = 'Curolia map invitation';

create or replace function public.invite_map_member(
  p_map_id uuid,
  p_invitee_email text,
  p_invited_role public.map_member_role
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(p_invitee_email));
  v_invitee_user_id uuid;
  v_map_name text;
  v_inv_id uuid;
  v_token uuid;
  v_inviter_name text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_invited_role not in ('viewer', 'editor') then
    raise exception 'Role must be reader (viewer) or contributor (editor)';
  end if;

  if not public.is_map_owner(p_map_id) then
    raise exception 'Only the map owner can invite people';
  end if;

  if v_email = lower(trim(coalesce((select auth.jwt())->>'email', ''))) then
    raise exception 'You cannot invite yourself';
  end if;

  select display_name into v_inviter_name from public.profiles where id = v_uid;
  select name into v_map_name from public.maps where id = p_map_id;

  select au.id
  into v_invitee_user_id
  from auth.users au
  where lower(trim(au.email::text)) = v_email
  limit 1;

  if v_invitee_user_id is not null then
    if exists (
      select 1 from public.map_members jm
      where jm.map_id = p_map_id and jm.user_id = v_invitee_user_id
    ) then
      raise exception 'That user is already a member of this map';
    end if;
  end if;

  if exists (
    select 1 from public.map_invitations ji
    where ji.map_id = p_map_id
      and ji.status = 'pending'
      and lower(trim(ji.invitee_email)) = v_email
  ) then
    raise exception 'An invitation is already pending for this email';
  end if;

  insert into public.map_invitations (
    map_id, invitee_email, invited_role, invited_by_user_id
  )
  values (p_map_id, v_email, p_invited_role, v_uid)
  returning id, token into v_inv_id, v_token;

  if v_invitee_user_id is not null then
    insert into public.notifications (
      user_id, type, title, body, payload, action_path
    )
    values (
      v_invitee_user_id,
      'map_invitation'::public.notification_type,
      'Map invitation',
      format(
        '%s invited you to "%s" as %s.',
        coalesce(v_inviter_name, 'Someone'),
        coalesce(v_map_name, 'a map'),
        case p_invited_role
          when 'viewer'::public.map_member_role then 'a reader'
          else 'a contributor'
        end
      ),
      jsonb_build_object(
        'invitation_id', v_inv_id,
        'map_id', p_map_id,
        'token', v_token::text,
        'role', p_invited_role::text
      ),
      '/invitations?token=' || v_token::text
    );
  end if;

  return v_inv_id;
end;
$$;

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
  v_map_path text;
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

  select name into v_map_name from public.maps where id = v_row.map_id;
  v_map_path := public.map_settings_path(v_row.map_id);

  select display_name into v_acceptor_name from public.profiles where id = v_uid;

  insert into public.notifications (
    user_id, type, title, body, payload, action_path
  )
  values (
    v_row.invited_by_user_id,
    'map_invitation_accepted'::public.notification_type,
    'Invitation accepted',
    format(
      '%s joined "%s".',
      coalesce(v_acceptor_name, v_email),
      coalesce(v_map_name, 'your map')
    ),
    jsonb_build_object('map_id', v_row.map_id, 'user_id', v_uid::text),
    v_map_path
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
  v_map_path text;
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

  v_map_path := public.map_settings_path(p_map_id);

  insert into public.notifications (
    user_id, type, title, body, payload, action_path
  )
  values (
    p_new_owner_user_id,
    'map_ownership_received'::public.notification_type,
    'You are now the map owner',
    'Plugins were cleared because integrations are personal to each owner.',
    jsonb_build_object('map_id', p_map_id),
    v_map_path
  );
end;
$$;
