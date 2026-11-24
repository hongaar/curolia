-- Public REST API (alpha) keys. Only a sha256 hash of each key is stored; the
-- plaintext is returned once by `create_api_key`.

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  prefix text not null,
  key_hash bytea not null unique,
  scopes text[] not null default array['read']::text[]
    check (scopes <@ array['read', 'write']::text[] and cardinality(scopes) > 0),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index api_keys_user_idx on public.api_keys (user_id);

alter table public.api_keys enable row level security;

revoke all on public.api_keys from anon, authenticated;
grant select (id, user_id, name, prefix, scopes, last_used_at, created_at, revoked_at)
  on public.api_keys to authenticated;
grant update (name, revoked_at) on public.api_keys to authenticated;
grant all on public.api_keys to service_role;

create policy api_keys_select_own
  on public.api_keys for select to authenticated
  using (user_id = auth.uid());

create policy api_keys_update_own
  on public.api_keys for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.create_api_key(p_name text, p_scopes text[])
returns table (id uuid, key text, prefix text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_key text;
  v_prefix text;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  v_key := 'cur_live_' || encode(extensions.gen_random_bytes(24), 'hex');
  v_prefix := left(v_key, 17);
  insert into public.api_keys (user_id, name, prefix, key_hash, scopes)
  values (v_user, trim(p_name), v_prefix, extensions.digest(v_key, 'sha256'), p_scopes)
  returning api_keys.id into v_id;
  return query select v_id, v_key, v_prefix;
end;
$$;

revoke all on function public.create_api_key(text, text[]) from public, anon;
grant execute on function public.create_api_key(text, text[]) to authenticated;

create or replace function public.resolve_api_key(p_key text)
returns table (user_id uuid, scopes text[])
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  update public.api_keys k
  set last_used_at = now()
  where k.key_hash = extensions.digest(p_key, 'sha256')
    and k.revoked_at is null
  returning k.user_id, k.scopes;
end;
$$;

revoke all on function public.resolve_api_key(text) from public, anon, authenticated;
grant execute on function public.resolve_api_key(text) to service_role;
