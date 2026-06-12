-- In-app notifications when someone else comments or reacts on a pin.

alter type public.notification_type add value if not exists 'pin_comment';
alter type public.notification_type add value if not exists 'pin_reaction';

create or replace function public.map_owner_user_id(p_map_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select jm.user_id
  from public.map_members jm
  where jm.map_id = p_map_id
    and jm.role = 'owner'::public.map_member_role
  limit 1;
$$;

revoke all on function public.map_owner_user_id(uuid) from public;
grant execute on function public.map_owner_user_id(uuid)
  to authenticated, service_role;

create or replace function public.pin_detail_path(p_pin_id uuid)
returns text
language sql
stable
set search_path = public
as $$
  select '/'
    || pr.slug
    || '/'
    || m.slug
    || '/pin/'
    || pin.slug
  from public.pins pin
  inner join public.maps m on m.id = pin.map_id
  inner join public.profiles pr on pr.id = m.created_by_user_id
  where pin.id = p_pin_id;
$$;

revoke all on function public.pin_detail_path(uuid) from public;
grant execute on function public.pin_detail_path(uuid)
  to authenticated, service_role;

create or replace function public.notify_map_owner_on_pin_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_map_name text;
  v_pin_title text;
  v_action_path text;
  v_actor_name text;
  v_body_preview text;
begin
  v_owner_id := public.map_owner_user_id(new.map_id);
  if v_owner_id is null then
    return new;
  end if;

  if new.author_user_id is not null and new.author_user_id = v_owner_id then
    return new;
  end if;

  select
    m.name,
    coalesce(nullif(trim(p.title), ''), 'Untitled place')
  into v_map_name, v_pin_title
  from public.maps m
  inner join public.pins p on p.id = new.pin_id
  where m.id = new.map_id;

  v_action_path := public.pin_detail_path(new.pin_id);

  v_actor_name := trim(new.author_display_name);
  if v_actor_name = '' then
    v_actor_name := 'Someone';
  end if;

  v_body_preview := substring(trim(new.body) from 1 for 120);
  if length(trim(new.body)) > 120 then
    v_body_preview := v_body_preview || '…';
  end if;

  insert into public.notifications (
    user_id, type, title, body, payload, action_path
  )
  values (
    v_owner_id,
    'pin_comment'::public.notification_type,
    'New comment on your map',
    format(
      '%s commented on "%s" in "%s": %s',
      v_actor_name,
      v_pin_title,
      coalesce(v_map_name, 'your map'),
      v_body_preview
    ),
    jsonb_build_object(
      'map_id', new.map_id,
      'pin_id', new.pin_id,
      'comment_id', new.id,
      'author_user_id', new.author_user_id,
      'author_guest_id', new.author_guest_id
    ),
    v_action_path
  );

  return new;
end;
$$;

create or replace function public.notify_map_owner_on_pin_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_map_name text;
  v_pin_title text;
  v_action_path text;
  v_actor_name text;
begin
  v_owner_id := public.map_owner_user_id(new.map_id);
  if v_owner_id is null then
    return new;
  end if;

  if new.user_id is not null and new.user_id = v_owner_id then
    return new;
  end if;

  select
    m.name,
    coalesce(nullif(trim(p.title), ''), 'Untitled place')
  into v_map_name, v_pin_title
  from public.maps m
  inner join public.pins p on p.id = new.pin_id
  where m.id = new.map_id;

  v_action_path := public.pin_detail_path(new.pin_id);

  if new.user_id is not null then
    select coalesce(nullif(trim(display_name), ''), 'Someone')
    into v_actor_name
    from public.profiles
    where id = new.user_id;
  else
    v_actor_name := 'Someone';
  end if;

  insert into public.notifications (
    user_id, type, title, body, payload, action_path
  )
  values (
    v_owner_id,
    'pin_reaction'::public.notification_type,
    'New reaction on your map',
    format(
      '%s reacted %s on "%s" in "%s".',
      v_actor_name,
      trim(new.emoji),
      v_pin_title,
      coalesce(v_map_name, 'your map')
    ),
    jsonb_build_object(
      'map_id', new.map_id,
      'pin_id', new.pin_id,
      'reaction_id', new.id,
      'user_id', new.user_id,
      'guest_id', new.guest_id,
      'emoji', trim(new.emoji)
    ),
    v_action_path
  );

  return new;
end;
$$;

drop trigger if exists pin_comments_notify_map_owner on public.pin_comments;
create trigger pin_comments_notify_map_owner
  after insert on public.pin_comments
  for each row
  execute function public.notify_map_owner_on_pin_comment();

drop trigger if exists pin_reactions_notify_map_owner on public.pin_reactions;
create trigger pin_reactions_notify_map_owner
  after insert on public.pin_reactions
  for each row
  execute function public.notify_map_owner_on_pin_reaction();
