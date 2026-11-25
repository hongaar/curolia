-- Profiles get their own visibility enum: public / restricted / private.
-- Restricted: signed-in users see a minimal card (name, slug, avatar) and can
-- request to follow; the owner approves requests. Only approved followers see
-- the profile's maps. Crawlers are discouraged.
--
-- Unlisted maps can opt in to being listed on the owner's profile (and in the
-- followed feed) for followers via maps.show_on_profile.

alter type public.notification_type add value if not exists 'profile_follow_request';
alter type public.notification_type add value if not exists 'profile_follow_approved';

-- Profile visibility enum ----------------------------------------------------

create type public.profile_visibility as enum ('public', 'restricted', 'private');

drop policy if exists "profiles_select_public" on public.profiles;
drop function if exists public.set_profile_visibility(public.visibility);

alter table public.profiles
  alter column visibility drop default,
  alter column visibility type public.profile_visibility using (
    case visibility::text
      when 'unlisted' then 'restricted'
      else visibility::text
    end
  )::public.profile_visibility,
  alter column visibility set default 'public';

comment on column public.profiles.visibility is
  'public: listed and indexable; restricted: signed-in users see a minimal card and can request to follow, only approved followers see maps, crawlers discouraged; private: only the owner.';

-- Follow status --------------------------------------------------------------

create type public.follow_status as enum ('pending', 'approved');

alter table public.profile_follows
  add column status public.follow_status not null default 'approved';

comment on column public.profile_follows.status is
  'pending: awaiting approval by a restricted profile owner; approved: active follow.';

-- Map opt-in ------------------------------------------------------------------

alter table public.maps
  add column show_on_profile boolean not null default false;

comment on column public.maps.show_on_profile is
  'Unlisted maps only: list this map on the owner profile and followed feed for followers.';

-- Helpers ---------------------------------------------------------------------

create or replace function public.is_approved_follower(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profile_follows pf
    where pf.follower_id = (select auth.uid())
      and pf.following_id = p_profile_id
      and pf.status = 'approved'
  );
$$;

revoke all on function public.is_approved_follower(uuid) from public;
grant execute on function public.is_approved_follower(uuid) to authenticated;

-- Full profile access: public, owner, or approved follower of a restricted profile.
create or replace function public.is_profile_publicly_readable(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and (
        p.visibility = 'public'
        or (p.visibility = 'restricted' and public.is_approved_follower(p.id))
      )
  );
$$;

create or replace function public.is_profile_followable(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.visibility in ('public', 'restricted')
  );
$$;

create policy "profiles_select_public"
  on public.profiles for select
  to anon, authenticated
  using (
    visibility = 'public'
    or (visibility = 'restricted' and public.is_approved_follower(id))
  );

-- Minimal card for restricted profiles (signed-in viewers only).
create or replace function public.get_restricted_profile_card(p_slug text)
returns table (
  id uuid,
  slug text,
  display_name text,
  avatar_url text,
  gravatar_hash text,
  follow_status public.follow_status
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.slug,
    p.display_name,
    p.avatar_url,
    p.gravatar_hash,
    (
      select pf.status
      from public.profile_follows pf
      where pf.follower_id = (select auth.uid())
        and pf.following_id = p.id
    )
  from public.profiles p
  where lower(p.slug) = lower(p_slug)
    and p.visibility = 'restricted'
    and (select auth.uid()) is not null;
$$;

revoke all on function public.get_restricted_profile_card(text) from public;
grant execute on function public.get_restricted_profile_card(text) to authenticated;

-- Viewer's follow status for any profile (null when not following).
create or replace function public.profile_follow_status(p_following_id uuid)
returns public.follow_status
language sql
stable
security definer
set search_path = public
as $$
  select pf.status
  from public.profile_follows pf
  where pf.follower_id = (select auth.uid())
    and pf.following_id = p_following_id;
$$;

revoke all on function public.profile_follow_status(uuid) from public;
grant execute on function public.profile_follow_status(uuid) to authenticated;

create or replace function public.is_following_profile(p_following_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profile_follows pf
    where pf.follower_id = (select auth.uid())
      and pf.following_id = p_following_id
      and pf.status = 'approved'
  );
$$;

-- Follow lists and counts: approved follows only -------------------------------

create or replace function public.profile_follower_count(p_profile_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.profile_follows pf
  where pf.following_id = p_profile_id
    and pf.status = 'approved'
    and public.can_view_profile_follow_lists(p_profile_id);
$$;

create or replace function public.profile_following_count(p_profile_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.profile_follows pf
  where pf.follower_id = p_profile_id
    and pf.status = 'approved'
    and public.can_view_profile_follow_lists(p_profile_id);
$$;

create or replace function public.list_profile_followers(p_profile_id uuid)
returns table (
  profile_id uuid,
  slug text,
  display_name text,
  avatar_url text,
  gravatar_hash text,
  is_private boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    case when p.visibility <> 'private' then p.slug else null end,
    case
      when p.visibility <> 'private' then p.display_name
      else 'Private follower'
    end,
    case when p.visibility <> 'private' then p.avatar_url else null end,
    case when p.visibility <> 'private' then p.gravatar_hash else null end,
    p.visibility = 'private'
  from public.profile_follows pf
  inner join public.profiles p on p.id = pf.follower_id
  where pf.following_id = p_profile_id
    and pf.status = 'approved'
    and public.can_view_profile_follow_lists(p_profile_id)
  order by pf.created_at desc;
$$;

create or replace function public.list_profile_following(p_profile_id uuid)
returns table (
  profile_id uuid,
  slug text,
  display_name text,
  avatar_url text,
  gravatar_hash text,
  is_private boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    case when p.visibility <> 'private' then p.slug else null end,
    case
      when p.visibility <> 'private' then p.display_name
      else 'Private profile'
    end,
    case when p.visibility <> 'private' then p.avatar_url else null end,
    case when p.visibility <> 'private' then p.gravatar_hash else null end,
    p.visibility = 'private'
  from public.profile_follows pf
  inner join public.profiles p on p.id = pf.following_id
  where pf.follower_id = p_profile_id
    and pf.status = 'approved'
    and public.can_view_profile_follow_lists(p_profile_id)
  order by pf.created_at desc;
$$;

-- Pending requests (owner only).
create or replace function public.list_pending_follow_requests()
returns table (
  profile_id uuid,
  slug text,
  display_name text,
  avatar_url text,
  gravatar_hash text,
  is_private boolean,
  requested_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    case when p.visibility <> 'private' then p.slug else null end,
    coalesce(nullif(trim(p.display_name), ''), p.slug),
    p.avatar_url,
    p.gravatar_hash,
    p.visibility = 'private',
    pf.created_at
  from public.profile_follows pf
  inner join public.profiles p on p.id = pf.follower_id
  where pf.following_id = (select auth.uid())
    and pf.status = 'pending'
  order by pf.created_at desc;
$$;

revoke all on function public.list_pending_follow_requests() from public;
grant execute on function public.list_pending_follow_requests() to authenticated;

-- Follow RPCs -------------------------------------------------------------------

drop function if exists public.follow_profile(uuid);

create function public.follow_profile(p_following_id uuid)
returns public.follow_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_visibility public.profile_visibility;
  v_status public.follow_status;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if v_uid = p_following_id then
    raise exception 'Cannot follow yourself';
  end if;

  select p.visibility into v_visibility
  from public.profiles p
  where p.id = p_following_id;

  if v_visibility is null or v_visibility = 'private' then
    raise exception 'Profile is not followable';
  end if;

  insert into public.profile_follows (follower_id, following_id, status)
  values (
    v_uid,
    p_following_id,
    case when v_visibility = 'restricted' then 'pending' else 'approved' end::public.follow_status
  )
  on conflict do nothing;

  select pf.status into v_status
  from public.profile_follows pf
  where pf.follower_id = v_uid and pf.following_id = p_following_id;

  return v_status;
end;
$$;

revoke all on function public.follow_profile(uuid) from public;
grant execute on function public.follow_profile(uuid) to authenticated;

-- Direct inserts must respect the approval rule too.
drop policy if exists "profile_follows_insert_authenticated" on public.profile_follows;
create policy "profile_follows_insert_authenticated"
  on public.profile_follows for insert
  to authenticated
  with check (
    follower_id = (select auth.uid())
    and public.is_profile_followable(following_id)
    and (
      status = 'pending'
      or exists (
        select 1 from public.profiles p
        where p.id = following_id and p.visibility = 'public'
      )
    )
  );

create or replace function public.approve_follow_request(p_follower_id uuid)
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

  update public.profile_follows
  set status = 'approved'
  where follower_id = p_follower_id
    and following_id = v_uid
    and status = 'pending';

  if not found then
    raise exception 'Follow request not found';
  end if;
end;
$$;

revoke all on function public.approve_follow_request(uuid) from public;
grant execute on function public.approve_follow_request(uuid) to authenticated;

create or replace function public.decline_follow_request(p_follower_id uuid)
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

  delete from public.profile_follows
  where follower_id = p_follower_id
    and following_id = v_uid
    and status = 'pending';
end;
$$;

revoke all on function public.decline_follow_request(uuid) from public;
grant execute on function public.decline_follow_request(uuid) to authenticated;

-- Notifications -------------------------------------------------------------------

create or replace function public.notify_on_profile_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_name text;
begin
  select coalesce(nullif(trim(p.display_name), ''), nullif(trim(p.slug), ''), 'Someone')
  into v_actor_name
  from public.profiles p
  where p.id = new.follower_id;

  if new.status = 'pending' then
    insert into public.notifications (user_id, type, title, body, payload, action_path)
    values (
      new.following_id,
      'profile_follow_request'::public.notification_type,
      'Follow request',
      format('%s wants to follow you', v_actor_name),
      jsonb_build_object('follower_id', new.follower_id, 'following_id', new.following_id),
      public.profile_path(new.following_id) || '?followers=requests'
    );
  else
    insert into public.notifications (user_id, type, title, body, payload, action_path)
    values (
      new.following_id,
      'profile_follow'::public.notification_type,
      'New follower',
      format('%s started following you', v_actor_name),
      jsonb_build_object('follower_id', new.follower_id, 'following_id', new.following_id),
      public.profile_path(new.follower_id)
    );
  end if;

  return new;
end;
$$;

create or replace function public.notify_on_profile_follow_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_name text;
begin
  if old.status = 'pending' and new.status = 'approved' then
    select coalesce(nullif(trim(p.display_name), ''), nullif(trim(p.slug), ''), 'Someone')
    into v_owner_name
    from public.profiles p
    where p.id = new.following_id;

    insert into public.notifications (user_id, type, title, body, payload, action_path)
    values (
      new.follower_id,
      'profile_follow_approved'::public.notification_type,
      'Follow request approved',
      format('%s approved your follow request', v_owner_name),
      jsonb_build_object('follower_id', new.follower_id, 'following_id', new.following_id),
      public.profile_path(new.following_id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profile_follows_notify_approved on public.profile_follows;
create trigger profile_follows_notify_approved
  after update of status on public.profile_follows
  for each row
  execute function public.notify_on_profile_follow_approved();

-- Profile visibility RPC ----------------------------------------------------------

create function public.set_profile_visibility(p_visibility public.profile_visibility)
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

  update public.profiles
  set visibility = p_visibility,
      updated_at = now()
  where id = v_uid;

  -- Leaving restricted: pending requests become approved follows.
  if p_visibility = 'public' then
    update public.profile_follows
    set status = 'approved'
    where following_id = v_uid and status = 'pending';
  end if;
end;
$$;

revoke all on function public.set_profile_visibility(public.profile_visibility) from public;
grant execute on function public.set_profile_visibility(public.profile_visibility) to authenticated;

create or replace function public.set_map_show_on_profile(p_map_id uuid, p_show boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.map_members mm
    where mm.map_id = p_map_id
      and mm.user_id = (select auth.uid())
      and mm.role = 'owner'
  ) then
    raise exception 'Only the map owner can change this setting';
  end if;

  update public.maps
  set show_on_profile = p_show,
      updated_at = now()
  where id = p_map_id;
end;
$$;

revoke all on function public.set_map_show_on_profile(uuid, boolean) from public;
grant execute on function public.set_map_show_on_profile(uuid, boolean) to authenticated;

-- Profile maps (for non-owner viewers) ---------------------------------------------

create or replace function public.list_profile_map_ids(p_profile_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.id
  from public.maps m
  inner join public.profiles pr on pr.id = m.created_by_user_id
  where m.created_by_user_id = p_profile_id
    and (
      -- Public maps on a public profile, or for approved followers.
      (
        m.visibility = 'public'
        and (pr.visibility = 'public' or public.is_approved_follower(pr.id))
      )
      -- Unlisted opt-in maps for approved followers.
      or (
        m.visibility = 'unlisted'
        and m.show_on_profile
        and pr.visibility <> 'private'
        and public.is_approved_follower(pr.id)
      )
      -- Maps the viewer is a member of.
      or exists (
        select 1 from public.map_members mm
        where mm.map_id = m.id and mm.user_id = (select auth.uid())
      )
    );
$$;

revoke all on function public.list_profile_map_ids(uuid) from public;
grant execute on function public.list_profile_map_ids(uuid) to anon, authenticated;

-- Followed feed: approved follows; public maps plus unlisted opt-ins ---------------

create or replace function public.list_followed_recent_public_maps(p_limit integer default 12)
returns table (
  map_id uuid,
  name text,
  slug text,
  description text,
  cover_url text,
  icon_emoji text,
  updated_at timestamptz,
  visited_at timestamptz,
  owner_profile_slug text,
  owner_display_name text,
  owner_avatar_url text,
  owner_gravatar_hash text,
  pin_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.name,
    m.slug,
    m.description,
    m.cover_url,
    m.icon_emoji,
    m.updated_at,
    null::timestamptz,
    pr.slug,
    pr.display_name,
    pr.avatar_url,
    pr.gravatar_hash,
    public.home_map_pin_count(m.id)
  from public.profile_follows pf
  inner join public.maps m on m.created_by_user_id = pf.following_id
  inner join public.profiles pr on pr.id = m.created_by_user_id
  where pf.follower_id = (select auth.uid())
    and pf.status = 'approved'
    and (m.visibility = 'public' or (m.visibility = 'unlisted' and m.show_on_profile))
    and pr.visibility in ('public', 'restricted')
  order by m.updated_at desc
  limit greatest(p_limit, 0);
$$;

-- Discover: restricted profiles' public maps stay listed -------------------------

create or replace function public.list_discover_recent_public_maps(p_limit integer default 12)
returns table (
  map_id uuid,
  name text,
  slug text,
  description text,
  cover_url text,
  icon_emoji text,
  updated_at timestamptz,
  visited_at timestamptz,
  owner_profile_slug text,
  owner_display_name text,
  owner_avatar_url text,
  owner_gravatar_hash text,
  pin_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.name,
    m.slug,
    m.description,
    m.cover_url,
    m.icon_emoji,
    m.updated_at,
    null::timestamptz,
    pr.slug,
    pr.display_name,
    pr.avatar_url,
    pr.gravatar_hash,
    public.home_map_pin_count(m.id)
  from public.maps m
  inner join public.profiles pr on pr.id = m.created_by_user_id
  where m.visibility = 'public'
    and pr.visibility in ('public', 'restricted')
    and m.created_by_user_id <> (select auth.uid())
    and not exists (
      select 1
      from public.profile_follows pf
      where pf.follower_id = (select auth.uid())
        and pf.following_id = m.created_by_user_id
        and pf.status = 'approved'
    )
  order by m.updated_at desc
  limit greatest(p_limit, 0);
$$;

-- Signed-out viewers: only learn that a slug is a restricted profile -----------------

create or replace function public.is_restricted_profile_slug(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where lower(p.slug) = lower(p_slug)
      and p.visibility = 'restricted'
  );
$$;

revoke all on function public.is_restricted_profile_slug(text) from public;
grant execute on function public.is_restricted_profile_slug(text) to anon, authenticated;
