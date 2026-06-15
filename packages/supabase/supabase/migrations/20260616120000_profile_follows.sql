-- Profile follows: authenticated users can follow public profiles.

-- ---------------------------------------------------------------------------
-- profile_follows
-- ---------------------------------------------------------------------------

create table public.profile_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint profile_follows_no_self_follow check (follower_id <> following_id)
);

create index profile_follows_following_idx
  on public.profile_follows (following_id, created_at desc);

comment on table public.profile_follows is
  'Authenticated users following public profiles.';

alter table public.profile_follows enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

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
      and p.is_public = true
  );
$$;

revoke all on function public.is_profile_followable(uuid) from public;
grant execute on function public.is_profile_followable(uuid) to anon, authenticated;

create or replace function public.profile_path(p_profile_id uuid)
returns text
language sql
stable
set search_path = public
as $$
  select '/' || pr.slug
  from public.profiles pr
  where pr.id = p_profile_id;
$$;

revoke all on function public.profile_path(uuid) from public;
grant execute on function public.profile_path(uuid) to anon, authenticated;

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
    and public.is_profile_publicly_readable(p_profile_id);
$$;

revoke all on function public.profile_follower_count(uuid) from public;
grant execute on function public.profile_follower_count(uuid) to anon, authenticated;

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
    and public.is_profile_publicly_readable(p_profile_id);
$$;

revoke all on function public.profile_following_count(uuid) from public;
grant execute on function public.profile_following_count(uuid) to anon, authenticated;

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
  );
$$;

revoke all on function public.is_following_profile(uuid) from public;
grant execute on function public.is_following_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

drop policy if exists "profile_follows_select_own" on public.profile_follows;
create policy "profile_follows_select_own"
  on public.profile_follows for select
  to authenticated
  using (follower_id = (select auth.uid()));

drop policy if exists "profile_follows_insert_authenticated" on public.profile_follows;
create policy "profile_follows_insert_authenticated"
  on public.profile_follows for insert
  to authenticated
  with check (
    follower_id = (select auth.uid())
    and public.is_profile_followable(following_id)
  );

drop policy if exists "profile_follows_delete_own" on public.profile_follows;
create policy "profile_follows_delete_own"
  on public.profile_follows for delete
  to authenticated
  using (follower_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function public.follow_profile(p_following_id uuid)
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

  if v_uid = p_following_id then
    raise exception 'Cannot follow yourself';
  end if;

  if not public.is_profile_followable(p_following_id) then
    raise exception 'Profile is not followable';
  end if;

  insert into public.profile_follows (follower_id, following_id)
  values (v_uid, p_following_id)
  on conflict do nothing;
end;
$$;

revoke all on function public.follow_profile(uuid) from public;
grant execute on function public.follow_profile(uuid) to authenticated;

create or replace function public.unfollow_profile(p_following_id uuid)
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

  delete from public.profile_follows pf
  where pf.follower_id = v_uid
    and pf.following_id = p_following_id;
end;
$$;

revoke all on function public.unfollow_profile(uuid) from public;
grant execute on function public.unfollow_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

alter type public.notification_type add value if not exists 'profile_follow';

create or replace function public.notify_on_profile_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_name text;
  v_action_path text;
begin
  select coalesce(nullif(trim(p.display_name), ''), nullif(trim(p.slug), ''), 'Someone')
  into v_actor_name
  from public.profiles p
  where p.id = new.follower_id;

  v_action_path := public.profile_path(new.follower_id);

  insert into public.notifications (
    user_id, type, title, body, payload, action_path
  )
  values (
    new.following_id,
    'profile_follow'::public.notification_type,
    'New follower',
    format('%s started following you', v_actor_name),
    jsonb_build_object(
      'follower_id', new.follower_id,
      'following_id', new.following_id
    ),
    v_action_path
  );

  return new;
end;
$$;

drop trigger if exists profile_follows_notify on public.profile_follows;
create trigger profile_follows_notify
  after insert on public.profile_follows
  for each row
  execute function public.notify_on_profile_follow();
