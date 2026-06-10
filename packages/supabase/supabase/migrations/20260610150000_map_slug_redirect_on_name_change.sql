-- When a map name changes the app clears slug so maps_set_slug reclaims from name.
-- That path must record the previous slug in map_slug_redirects (same as pins on title change).

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
    elsif new.name is distinct from old.name
          and (new.slug is not distinct from old.slug) then
      -- Name-only change: rewrite slug and keep the previous URL as a redirect.
      next_slug := public.map_claim_slug(
        new.created_by_user_id,
        new.id,
        new.name
      );
      if next_slug is distinct from old.slug then
        insert into public.map_slug_redirects (owner_id, slug, map_id)
        values (old.created_by_user_id, old.slug, old.id)
        on conflict (owner_id, slug) do update
          set map_id = excluded.map_id;
        new.slug := next_slug;
      end if;
    elsif new.slug is null or trim(new.slug) = '' then
      next_slug := public.map_claim_slug(
        new.created_by_user_id,
        new.id,
        new.name
      );
      if next_slug is distinct from old.slug then
        insert into public.map_slug_redirects (owner_id, slug, map_id)
        values (old.created_by_user_id, old.slug, old.id)
        on conflict (owner_id, slug) do update
          set map_id = excluded.map_id;
      end if;
      new.slug := next_slug;
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
  before update of slug, created_by_user_id, name on public.maps
  for each row execute function public.maps_set_slug();
