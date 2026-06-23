-- pgcrypto lives in the `extensions` schema on Supabase. `handle_new_user` runs with
-- `search_path = public`, so `gravatar_hash_for_email` must qualify `digest` or signup
-- fails with "function digest(text, unknown) does not exist".

create or replace function public.gravatar_hash_for_email(p_email text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select case
    when nullif(lower(trim(p_email)), '') is null then null
    else encode(extensions.digest(lower(trim(p_email)), 'sha256'), 'hex')
  end;
$$;
