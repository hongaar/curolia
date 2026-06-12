-- Pin comments and reactions (comments + reactions plugins).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_pin_interaction_plugin_enabled(
  p_map_id uuid,
  p_plugin_type_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.map_plugins mp
    where mp.map_id = p_map_id
      and mp.plugin_type_id = p_plugin_type_id
      and mp.enabled = true
  )
  or exists (
    select 1
    from public.maps m
    join public.user_plugins up
      on up.user_id = m.created_by_user_id
    where m.id = p_map_id
      and up.plugin_type_id = p_plugin_type_id
      and up.enabled = true
  );
$$;

revoke all on function public.is_pin_interaction_plugin_enabled(uuid, text) from public;
grant execute on function public.is_pin_interaction_plugin_enabled(uuid, text) to anon, authenticated;

create or replace function public.map_plugin_config_bool(
  p_map_id uuid,
  p_plugin_type_id text,
  p_key text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select (mp.config ->> p_key)::boolean
      from public.map_plugins mp
      where mp.map_id = p_map_id
        and mp.plugin_type_id = p_plugin_type_id
        and mp.enabled = true
    ),
    false
  );
$$;

revoke all on function public.map_plugin_config_bool(uuid, text, text) from public;
grant execute on function public.map_plugin_config_bool(uuid, text, text) to anon, authenticated;

-- Public readers may read per-map plugin config (anonymous interaction toggles).
drop policy if exists "map_plugins_select_public" on public.map_plugins;
create policy "map_plugins_select_public"
  on public.map_plugins for select
  to anon, authenticated
  using (public.is_map_publicly_readable(map_id));

-- ---------------------------------------------------------------------------
-- pin_comments
-- ---------------------------------------------------------------------------

create table public.pin_comments (
  id uuid primary key default gen_random_uuid(),
  pin_id uuid not null references public.pins (id) on delete cascade,
  map_id uuid not null references public.maps (id) on delete cascade,
  author_user_id uuid references auth.users (id) on delete set null,
  author_display_name text not null,
  author_guest_id text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pin_comments_body_nonempty check (length(trim(body)) > 0),
  constraint pin_comments_display_name_nonempty check (length(trim(author_display_name)) > 0)
);

create index pin_comments_pin_idx on public.pin_comments (pin_id, created_at);
create index pin_comments_map_idx on public.pin_comments (map_id);

comment on table public.pin_comments is
  'Visitor comments on pins (comments plugin).';

create or replace function public.pin_comments_align_pin_map()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_map_id uuid;
begin
  select p.map_id into v_map_id from public.pins p where p.id = new.pin_id;
  if v_map_id is null then
    raise exception 'Pin not found for pin_comments';
  end if;
  new.map_id := v_map_id;
  new.updated_at := now();
  return new;
end;
$$;

create trigger pin_comments_before_insert
  before insert on public.pin_comments
  for each row execute function public.pin_comments_align_pin_map();

create trigger pin_comments_before_update
  before update on public.pin_comments
  for each row execute function public.pin_comments_align_pin_map();

alter table public.pin_comments enable row level security;

create policy "pin_comments_select_member"
  on public.pin_comments for select
  to authenticated
  using (public.is_map_member(map_id));

create policy "pin_comments_select_public"
  on public.pin_comments for select
  to anon, authenticated
  using (public.is_map_publicly_readable(map_id));

create policy "pin_comments_insert_member"
  on public.pin_comments for insert
  to authenticated
  with check (
    public.is_pin_interaction_plugin_enabled(map_id, 'comments')
    and (
      public.is_map_member(map_id)
      or (
        public.is_map_publicly_readable(map_id)
        and public.map_plugin_config_bool(map_id, 'comments', 'allowAnonymousComments')
      )
    )
    and author_user_id = (select auth.uid())
    and author_guest_id is null
  );

create policy "pin_comments_insert_anon"
  on public.pin_comments for insert
  to anon
  with check (
    public.is_pin_interaction_plugin_enabled(map_id, 'comments')
    and public.is_map_publicly_readable(map_id)
    and public.map_plugin_config_bool(map_id, 'comments', 'allowAnonymousComments')
    and author_user_id is null
    and author_guest_id is not null
    and length(trim(author_guest_id)) > 0
  );

create policy "pin_comments_delete_author"
  on public.pin_comments for delete
  to authenticated
  using (
    author_user_id = (select auth.uid())
    or public.is_map_member(map_id)
  );

create policy "pin_comments_delete_guest"
  on public.pin_comments for delete
  to anon
  using (author_user_id is null and author_guest_id is not null);

-- ---------------------------------------------------------------------------
-- pin_reactions
-- ---------------------------------------------------------------------------

create table public.pin_reactions (
  id uuid primary key default gen_random_uuid(),
  pin_id uuid not null references public.pins (id) on delete cascade,
  map_id uuid not null references public.maps (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  guest_id text,
  emoji text not null,
  created_at timestamptz not null default now(),
  constraint pin_reactions_emoji_nonempty check (length(trim(emoji)) > 0),
  constraint pin_reactions_actor_chk check (
    (user_id is not null and guest_id is null)
    or (user_id is null and guest_id is not null)
  )
);

create unique index pin_reactions_user_unique
  on public.pin_reactions (pin_id, user_id, emoji)
  where user_id is not null;

create unique index pin_reactions_guest_unique
  on public.pin_reactions (pin_id, guest_id, emoji)
  where guest_id is not null;

create index pin_reactions_pin_idx on public.pin_reactions (pin_id);

comment on table public.pin_reactions is
  'Emoji reactions on pins (reactions plugin).';

create or replace function public.pin_reactions_align_pin_map()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_map_id uuid;
begin
  select p.map_id into v_map_id from public.pins p where p.id = new.pin_id;
  if v_map_id is null then
    raise exception 'Pin not found for pin_reactions';
  end if;
  new.map_id := v_map_id;
  return new;
end;
$$;

create trigger pin_reactions_before_insert
  before insert on public.pin_reactions
  for each row execute function public.pin_reactions_align_pin_map();

alter table public.pin_reactions enable row level security;

create policy "pin_reactions_select_member"
  on public.pin_reactions for select
  to authenticated
  using (public.is_map_member(map_id));

create policy "pin_reactions_select_public"
  on public.pin_reactions for select
  to anon, authenticated
  using (public.is_map_publicly_readable(map_id));

create policy "pin_reactions_insert_member"
  on public.pin_reactions for insert
  to authenticated
  with check (
    public.is_pin_interaction_plugin_enabled(map_id, 'reactions')
    and (
      public.is_map_member(map_id)
      or (
        public.is_map_publicly_readable(map_id)
        and public.map_plugin_config_bool(map_id, 'reactions', 'allowAnonymousReactions')
      )
    )
    and user_id = (select auth.uid())
    and guest_id is null
  );

create policy "pin_reactions_insert_anon"
  on public.pin_reactions for insert
  to anon
  with check (
    public.is_pin_interaction_plugin_enabled(map_id, 'reactions')
    and public.is_map_publicly_readable(map_id)
    and public.map_plugin_config_bool(map_id, 'reactions', 'allowAnonymousReactions')
    and user_id is null
    and guest_id is not null
    and length(trim(guest_id)) > 0
  );

create policy "pin_reactions_delete_own"
  on public.pin_reactions for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_map_member(map_id)
  );

create policy "pin_reactions_delete_guest"
  on public.pin_reactions for delete
  to anon
  using (user_id is null and guest_id is not null);
