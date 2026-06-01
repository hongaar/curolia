-- Sharing: invitations, member management, ownership transfer (clears connectors).
-- Notifications (in-app), profile notification preferences.
-- Tighten RLS: viewers read-only; only owners manage connectors.

-- ---------------------------------------------------------------------------
-- Helpers: edit capability + map owner check (invoker-safe, no recursion)
-- ---------------------------------------------------------------------------

create or replace function public.map_member_can_edit(p_map_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.map_members jm
    where jm.map_id = p_map_id
      and jm.user_id = (select auth.uid())
      and jm.role in ('owner'::public.map_member_role, 'editor'::public.map_member_role)
  );
$$;

create or replace function public.is_map_owner(p_map_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.map_members jm
    where jm.map_id = p_map_id
      and jm.user_id = (select auth.uid())
      and jm.role = 'owner'::public.map_member_role
  );
$$;

revoke all on function public.map_member_can_edit(uuid) from public;
grant execute on function public.map_member_can_edit(uuid) to authenticated;

revoke all on function public.is_map_owner(uuid) from public;
grant execute on function public.is_map_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Tighten write policies: contributors (editor) and owners edit content
-- ---------------------------------------------------------------------------

drop policy if exists "pins_insert_member" on public.pins;
create policy "pins_insert_member"
  on public.pins for insert
  to authenticated
  with check (public.map_member_can_edit(map_id));

drop policy if exists "pins_update_member" on public.pins;
create policy "pins_update_member"
  on public.pins for update
  to authenticated
  using (public.map_member_can_edit(map_id))
  with check (public.map_member_can_edit(map_id));

drop policy if exists "pins_delete_member" on public.pins;
create policy "pins_delete_member"
  on public.pins for delete
  to authenticated
  using (public.map_member_can_edit(map_id));

drop policy if exists "tags_write_member" on public.tags;
create policy "tags_write_member"
  on public.tags for insert
  to authenticated
  with check (public.map_member_can_edit(map_id));

drop policy if exists "tags_update_member" on public.tags;
create policy "tags_update_member"
  on public.tags for update
  to authenticated
  using (public.map_member_can_edit(map_id))
  with check (public.map_member_can_edit(map_id));

drop policy if exists "tags_delete_member" on public.tags;
create policy "tags_delete_member"
  on public.tags for delete
  to authenticated
  using (public.map_member_can_edit(map_id));

drop policy if exists "pin_tags_write_member" on public.pin_tags;
create policy "pin_tags_write_member"
  on public.pin_tags for insert
  to authenticated
  with check (public.map_member_can_edit(public.pin_map_id(pin_id)));

drop policy if exists "pin_tags_delete_member" on public.pin_tags;
create policy "pin_tags_delete_member"
  on public.pin_tags for delete
  to authenticated
  using (public.map_member_can_edit(public.pin_map_id(pin_id)));

drop policy if exists "photos_write_member" on public.photos;
create policy "photos_write_member"
  on public.photos for insert
  to authenticated
  with check (public.map_member_can_edit(map_id));

drop policy if exists "photos_update_member" on public.photos;
create policy "photos_update_member"
  on public.photos for update
  to authenticated
  using (public.map_member_can_edit(map_id))
  with check (public.map_member_can_edit(map_id));

drop policy if exists "photos_delete_member" on public.photos;
create policy "photos_delete_member"
  on public.photos for delete
  to authenticated
  using (public.map_member_can_edit(map_id));

-- Connectors: owner only (per-user tokens; not shared)
drop policy if exists "map_connectors_write_member" on public.map_connectors;
create policy "map_connectors_write_owner"
  on public.map_connectors for insert
  to authenticated
  with check (public.is_map_owner(map_id));

drop policy if exists "map_connectors_update_member" on public.map_connectors;
create policy "map_connectors_update_owner"
  on public.map_connectors for update
  to authenticated
  using (public.is_map_owner(map_id))
  with check (public.is_map_owner(map_id));

drop policy if exists "map_connectors_delete_member" on public.map_connectors;
create policy "map_connectors_delete_owner"
  on public.map_connectors for delete
  to authenticated
  using (public.is_map_owner(map_id));

-- ---------------------------------------------------------------------------
-- Profiles: coworker display + notification prefs
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists notification_email_enabled boolean not null default true,
  add column if not exists notification_push_enabled boolean not null default false;

drop policy if exists "profiles_select_coworkers" on public.profiles;
create policy "profiles_select_coworkers"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.map_members jm1
      inner join public.map_members jm2
        on jm1.map_id = jm2.map_id
      where jm1.user_id = (select auth.uid())
        and jm2.user_id = profiles.id
    )
  );

-- ---------------------------------------------------------------------------
-- Invitations + notifications
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.map_invitation_status as enum ('pending', 'accepted', 'declined', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_type as enum (
    'map_invitation',
    'map_invitation_accepted',
    'map_ownership_received'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.map_invitations (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.maps (id) on delete cascade,
  invitee_email text not null,
  invited_role public.map_member_role not null,
  invited_by_user_id uuid not null references auth.users (id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  status public.map_invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  constraint map_invitations_role_check check (invited_role in ('viewer', 'editor')),
  constraint map_invitations_email_nonempty check (length(trim(invitee_email)) > 0)
);

create unique index if not exists map_invitations_one_pending_per_email
  on public.map_invitations (map_id, lower(trim(invitee_email)))
  where status = 'pending';

create index if not exists map_invitations_token_idx on public.map_invitations (token);

alter table public.map_invitations enable row level security;

create policy "map_invitations_select_owner_or_invitee"
  on public.map_invitations for select
  to authenticated
  using (
    public.is_map_owner(map_id)
    or (
      status = 'pending'
      and lower(trim(invitee_email)) = lower(trim(coalesce((select auth.jwt())->>'email', '')))
    )
  );

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  payload jsonb not null default '{}'::jsonb,
  action_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER RPCs
-- ---------------------------------------------------------------------------

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
      'Curolia map invitation',
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

revoke all on function public.invite_map_member(uuid, text, public.map_member_role) from public;
grant execute on function public.invite_map_member(uuid, text, public.map_member_role) to authenticated;

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
    '/maps/' || v_row.map_id::text || '/settings'
  );

  return v_row.map_id;
end;
$$;

revoke all on function public.accept_map_invitation(uuid) from public;
grant execute on function public.accept_map_invitation(uuid) to authenticated;

create or replace function public.decline_map_invitation(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(coalesce((select auth.jwt())->>'email', '')));
  v_row public.map_invitations%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row
  from public.map_invitations
  where token = p_token
    and status = 'pending'
  for update;

  if v_row.id is null then
    raise exception 'Invitation not found';
  end if;

  if lower(trim(v_row.invitee_email)) <> v_email then
    raise exception 'This invitation was sent to a different email address';
  end if;

  update public.map_invitations
  set status = 'declined'
  where id = v_row.id;

  update public.notifications
  set read_at = now()
  where user_id = v_uid
    and type = 'map_invitation'
    and (payload->>'token') = p_token::text
    and read_at is null;
end;
$$;

revoke all on function public.decline_map_invitation(uuid) from public;
grant execute on function public.decline_map_invitation(uuid) to authenticated;

create or replace function public.cancel_map_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row public.map_invitations%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row
  from public.map_invitations
  where id = p_invitation_id
    and status = 'pending'
  for update;

  if v_row.id is null then
    raise exception 'Invitation not found';
  end if;

  if not public.is_map_owner(v_row.map_id) then
    raise exception 'Only the map owner can cancel invitations';
  end if;

  update public.map_invitations
  set status = 'cancelled'
  where id = p_invitation_id;

  delete from public.notifications
  where type = 'map_invitation'
    and (payload->>'invitation_id') = p_invitation_id::text;
end;
$$;

revoke all on function public.cancel_map_invitation(uuid) from public;
grant execute on function public.cancel_map_invitation(uuid) to authenticated;

create or replace function public.remove_map_member(p_map_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_role public.map_member_role;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_map_owner(p_map_id) then
    raise exception 'Only the map owner can remove members';
  end if;

  if p_user_id = v_uid then
    raise exception 'Use transfer ownership before leaving as owner';
  end if;

  select jm.role into v_role
  from public.map_members jm
  where jm.map_id = p_map_id and jm.user_id = p_user_id;

  if v_role is null then
    raise exception 'User is not a member of this map';
  end if;

  if v_role = 'owner'::public.map_member_role then
    raise exception 'Cannot remove another owner';
  end if;

  delete from public.map_members
  where map_id = p_map_id and user_id = p_user_id;
end;
$$;

revoke all on function public.remove_map_member(uuid, uuid) from public;
grant execute on function public.remove_map_member(uuid, uuid) to authenticated;

create or replace function public.update_map_member_role(
  p_map_id uuid,
  p_user_id uuid,
  p_role public.map_member_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_current public.map_member_role;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_map_owner(p_map_id) then
    raise exception 'Only the map owner can change roles';
  end if;

  if p_role = 'owner'::public.map_member_role then
    raise exception 'Use transfer ownership to assign owner';
  end if;

  select jm.role into v_current
  from public.map_members jm
  where jm.map_id = p_map_id and jm.user_id = p_user_id;

  if v_current is null then
    raise exception 'User is not a member of this map';
  end if;

  if v_current = 'owner'::public.map_member_role then
    raise exception 'Cannot change owner role here';
  end if;

  update public.map_members
  set role = p_role
  where map_id = p_map_id and user_id = p_user_id;
end;
$$;

revoke all on function public.update_map_member_role(uuid, uuid, public.map_member_role) from public;
grant execute on function public.update_map_member_role(uuid, uuid, public.map_member_role) to authenticated;

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

  -- Connectors cannot be shared: remove all connector rows for this map.
  delete from public.map_connectors where map_id = p_map_id;
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
    'Connectors were cleared because integrations are personal to each owner.',
    jsonb_build_object('map_id', p_map_id),
    '/maps/' || p_map_id::text || '/settings'
  );
end;
$$;

revoke all on function public.transfer_map_ownership(uuid, uuid) from public;
grant execute on function public.transfer_map_ownership(uuid, uuid) to authenticated;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.notifications
  set read_at = now()
  where id = p_notification_id
    and user_id = v_uid
    and read_at is null;
end;
$$;

revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;

create or replace function public.mark_notification_read_by_token(p_invitation_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.notifications
  set read_at = now()
  where user_id = v_uid
    and read_at is null
    and type = 'map_invitation'
    and (payload->>'token') = p_invitation_token::text;
end;
$$;

revoke all on function public.mark_notification_read_by_token(uuid) from public;
grant execute on function public.mark_notification_read_by_token(uuid) to authenticated;

-- iCal feed tokens: owner-only writes (read stays any member for shared subscribe links)
drop policy if exists "map_ical_feed_tokens_insert_member" on public.map_ical_feed_tokens;
create policy "map_ical_feed_tokens_insert_owner"
  on public.map_ical_feed_tokens for insert
  to authenticated
  with check (public.is_map_owner(map_id));

drop policy if exists "map_ical_feed_tokens_update_member" on public.map_ical_feed_tokens;
create policy "map_ical_feed_tokens_update_owner"
  on public.map_ical_feed_tokens for update
  to authenticated
  using (public.is_map_owner(map_id))
  with check (public.is_map_owner(map_id));

drop policy if exists "map_ical_feed_tokens_delete_member" on public.map_ical_feed_tokens;
create policy "map_ical_feed_tokens_delete_owner"
  on public.map_ical_feed_tokens for delete
  to authenticated
  using (public.is_map_owner(map_id));
