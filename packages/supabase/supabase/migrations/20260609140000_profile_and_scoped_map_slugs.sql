-- Profile slugs (globally unique), map slugs scoped per owner, redirect tables.

-- -----------------------------------------------------------------------------
-- Profile slugs
-- -----------------------------------------------------------------------------

create or replace function public.profile_claim_slug(
  p_profile_id uuid,
  p_desired text
)
returns text
language plpgsql
set search_path = public
as $$
declare
  base text;
  candidate text;
  suffix int := 0;
begin
  base := public.slugify_text(p_desired);
  if base is null or length(base) = 0 then
    base := 'user';
  end if;
  base := substring(base from 1 for 120);

  candidate := base;
  loop
    exit when not exists (
      select 1
      from public.profiles p
      where p.slug = candidate
        and (
          p_profile_id is null
          or p.id is distinct from p_profile_id
        )
    );

    suffix := suffix + 1;
    candidate := substring(base from 1 for 118) || '-' || suffix::text;
  end loop;

  return candidate;
end;
$$;

revoke all on function public.profile_claim_slug(uuid, text) from public;
grant execute on function public.profile_claim_slug(uuid, text)
  to authenticated, service_role;

alter table public.profiles
  add column if not exists slug text;

update public.profiles p
set slug = public.profile_claim_slug(
  p.id,
  coalesce(
    nullif(trim(p.display_name), ''),
    'user-' || substring(p.id::text from 1 for 8)
  )
)
where p.slug is null or trim(p.slug) = '';

alter table public.profiles
  alter column slug set not null;

alter table public.profiles
  alter column slug set default '';

drop index if exists profiles_slug_key;

create unique index profiles_slug_key
  on public.profiles (slug);

alter table public.profiles
  drop constraint if exists profiles_slug_format_chk;

alter table public.profiles
  add constraint profiles_slug_format_chk
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

create table public.profile_slug_redirects (
  slug text not null,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint profile_slug_redirects_slug_format_chk
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  primary key (slug)
);

create index profile_slug_redirects_profile_idx
  on public.profile_slug_redirects (profile_id);

alter table public.profile_slug_redirects enable row level security;

create policy "profile_slug_redirects_select_all"
  on public.profile_slug_redirects for select
  to anon, authenticated
  using (true);

create policy "profile_slug_redirects_insert_own"
  on public.profile_slug_redirects for insert
  to authenticated
  with check (profile_id = (select auth.uid()));

create or replace function public.profiles_set_slug()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_slug text;
begin
  if tg_op = 'INSERT' then
    if new.slug is null or trim(new.slug) = '' then
      new.slug := public.profile_claim_slug(
        new.id,
        coalesce(
          nullif(trim(new.display_name), ''),
          'user-' || substring(new.id::text from 1 for 8)
        )
      );
    else
      new.slug := public.profile_claim_slug(new.id, new.slug);
    end if;
  elsif tg_op = 'UPDATE' then
    if new.slug is null or trim(new.slug) = '' then
      new.slug := public.profile_claim_slug(
        new.id,
        coalesce(
          nullif(trim(new.display_name), ''),
          'user-' || substring(new.id::text from 1 for 8)
        )
      );
    elsif new.slug is distinct from old.slug then
      next_slug := public.profile_claim_slug(new.id, new.slug);
      if next_slug is distinct from old.slug then
        insert into public.profile_slug_redirects (slug, profile_id)
        values (old.slug, old.id)
        on conflict (slug) do update
          set profile_id = excluded.profile_id;
        new.slug := next_slug;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_slug_before_ins on public.profiles;

create trigger profiles_set_slug_before_ins
  before insert on public.profiles
  for each row execute function public.profiles_set_slug();

drop trigger if exists profiles_set_slug_before_upd on public.profiles;

create trigger profiles_set_slug_before_upd
  before update of slug, display_name on public.profiles
  for each row execute function public.profiles_set_slug();

-- -----------------------------------------------------------------------------
-- Map slugs: unique per owner (not globally)
-- -----------------------------------------------------------------------------

drop function if exists public.map_claim_slug(uuid, text);

create or replace function public.map_claim_slug(
  p_owner_id uuid,
  p_map_id uuid,
  p_desired text
)
returns text
language plpgsql
set search_path = public
as $$
declare
  base text;
  candidate text;
  suffix int := 0;
begin
  base := public.slugify_text(p_desired);
  if base is null or length(base) = 0 then
    base := 'map';
  end if;
  base := substring(base from 1 for 120);

  candidate := base;
  loop
    exit when not exists (
      select 1
      from public.maps j
      where j.created_by_user_id = p_owner_id
        and j.slug = candidate
        and (
          p_map_id is null
          or j.id is distinct from p_map_id
        )
    );

    suffix := suffix + 1;
    candidate := substring(base from 1 for 118) || '-' || suffix::text;
  end loop;

  return candidate;
end;
$$;

revoke all on function public.map_claim_slug(uuid, uuid, text) from public;
grant execute on function public.map_claim_slug(uuid, uuid, text)
  to authenticated, service_role;

alter table public.maps
  drop constraint if exists maps_slug_key;

drop index if exists maps_slug_key;

create unique index maps_owner_slug_key
  on public.maps (created_by_user_id, slug);

create table public.map_slug_redirects (
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  map_id uuid not null references public.maps (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint map_slug_redirects_slug_format_chk
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  primary key (owner_id, slug)
);

create index map_slug_redirects_map_idx on public.map_slug_redirects (map_id);
create index map_slug_redirects_slug_idx on public.map_slug_redirects (slug);

alter table public.map_slug_redirects enable row level security;

create policy "map_slug_redirects_select_all"
  on public.map_slug_redirects for select
  to anon, authenticated
  using (true);

create policy "map_slug_redirects_insert_owner"
  on public.map_slug_redirects for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.maps m
      where m.id = map_id
        and m.created_by_user_id = (select auth.uid())
    )
  );

create or replace function public.maps_set_slug()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_slug text;
begin
  if tg_op = 'INSERT' then
    if new.slug is null or trim(new.slug) = '' then
      new.slug := public.map_claim_slug(
        new.created_by_user_id,
        new.id,
        new.name
      );
    else
      new.slug := public.map_claim_slug(
        new.created_by_user_id,
        new.id,
        new.slug
      );
    end if;
  elsif tg_op = 'UPDATE' then
    if new.created_by_user_id is distinct from old.created_by_user_id then
      new.slug := public.map_claim_slug(
        new.created_by_user_id,
        new.id,
        coalesce(new.name, '')
      );
    elsif new.slug is null or trim(new.slug) = '' then
      new.slug := public.map_claim_slug(
        new.created_by_user_id,
        new.id,
        new.name
      );
    elsif new.slug is distinct from old.slug then
      next_slug := public.map_claim_slug(
        new.created_by_user_id,
        new.id,
        new.slug
      );
      if next_slug is distinct from old.slug then
        insert into public.map_slug_redirects (owner_id, slug, map_id)
        values (old.created_by_user_id, old.slug, old.id)
        on conflict (owner_id, slug) do update
          set map_id = excluded.map_id;
        new.slug := next_slug;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists maps_set_slug_before_upd on public.maps;

create trigger maps_set_slug_before_upd
  before update of slug, created_by_user_id on public.maps
  for each row execute function public.maps_set_slug();

-- -----------------------------------------------------------------------------
-- Canonical path helpers for notifications
-- -----------------------------------------------------------------------------

create or replace function public.map_view_path(
  p_map_id uuid,
  p_view text default 'map'
)
returns text
language sql
stable
set search_path = public
as $$
  select '/'
    || p.slug
    || '/'
    || m.slug
    || '/'
    || case
      when p_view in ('map', 'blog') then p_view
      else 'map'
    end
  from public.maps m
  inner join public.profiles p on p.id = m.created_by_user_id
  where m.id = p_map_id;
$$;

create or replace function public.map_settings_path(p_map_id uuid)
returns text
language sql
stable
set search_path = public
as $$
  select '/'
    || p.slug
    || '/'
    || m.slug
    || '/settings'
  from public.maps m
  inner join public.profiles p on p.id = m.created_by_user_id
  where m.id = p_map_id;
$$;

revoke all on function public.map_view_path(uuid, text) from public;
grant execute on function public.map_view_path(uuid, text)
  to authenticated, service_role;

revoke all on function public.map_settings_path(uuid) from public;
grant execute on function public.map_settings_path(uuid)
  to authenticated, service_role;

-- Notification deep links
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
    'Curolia: invitation accepted',
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
    'Curolia: you are now the map owner',
    'Plugins were cleared because integrations are personal to each owner.',
    jsonb_build_object('map_id', p_map_id),
    v_map_path
  );
end;
$$;
