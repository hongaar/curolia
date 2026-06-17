-- Fix maps left with slug '' when a name change slugifies to the same value.
-- The app used to clear slug on rename; the trigger only restored it when the
-- reclaimed slug differed from the old one, leaving invalid empty slugs.

create or replace function public.maps_set_slug()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_slug text;
  old_slug_valid boolean;
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
      next_slug := public.map_claim_slug(
        new.created_by_user_id,
        new.id,
        new.name
      );
      if next_slug is distinct from old.slug then
        delete from public.map_slug_redirects
        where owner_id = old.created_by_user_id
          and slug = next_slug
          and map_id = old.id;

        insert into public.map_slug_redirects (owner_id, slug, map_id)
        values (old.created_by_user_id, old.slug, old.id)
        on conflict (owner_id, slug) do update
          set map_id = excluded.map_id
          where map_slug_redirects.map_id = excluded.map_id;

        new.slug := next_slug;
      end if;
    elsif new.slug is null or trim(new.slug) = '' then
      next_slug := public.map_claim_slug(
        new.created_by_user_id,
        new.id,
        new.name
      );
      old_slug_valid := old.slug is not null
        and trim(old.slug) <> ''
        and old.slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$';

      if old_slug_valid and next_slug is distinct from old.slug then
        delete from public.map_slug_redirects
        where owner_id = old.created_by_user_id
          and slug = next_slug
          and map_id = old.id;

        insert into public.map_slug_redirects (owner_id, slug, map_id)
        values (old.created_by_user_id, old.slug, old.id)
        on conflict (owner_id, slug) do update
          set map_id = excluded.map_id
          where map_slug_redirects.map_id = excluded.map_id;
      end if;

      new.slug := next_slug;
    elsif new.slug is distinct from old.slug then
      next_slug := public.map_claim_slug(
        new.created_by_user_id,
        new.id,
        new.slug
      );
      if next_slug is distinct from old.slug then
        delete from public.map_slug_redirects
        where owner_id = old.created_by_user_id
          and slug = next_slug
          and map_id = old.id;

        old_slug_valid := old.slug is not null
          and trim(old.slug) <> ''
          and old.slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$';

        if old_slug_valid then
          insert into public.map_slug_redirects (owner_id, slug, map_id)
          values (old.created_by_user_id, old.slug, old.id)
          on conflict (owner_id, slug) do update
            set map_id = excluded.map_id
            where map_slug_redirects.map_id = excluded.map_id;
        end if;

        new.slug := next_slug;
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- Backfill rows broken by the old trigger without recording invalid redirects.
alter table public.maps disable trigger maps_set_slug_before_upd;

update public.maps m
set slug = public.map_claim_slug(
  m.created_by_user_id,
  m.id,
  coalesce(m.name, '')
)
where m.slug is null or trim(m.slug) = '';

alter table public.maps enable trigger maps_set_slug_before_upd;
