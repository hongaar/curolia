-- Map slugs: reclaim previous slugs owned by the same map, suffix on collision,
-- and RLS policies so trigger upserts into map_slug_redirects succeed.

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
    )
    and not exists (
      select 1
      from public.map_slug_redirects r
      where r.owner_id = p_owner_id
        and r.slug = candidate
        and (
          p_map_id is null
          or r.map_id is distinct from p_map_id
        )
    );

    suffix := suffix + 1;
    candidate := substring(base from 1 for 118) || '-' || suffix::text;
  end loop;

  return candidate;
end;
$$;

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

        insert into public.map_slug_redirects (owner_id, slug, map_id)
        values (old.created_by_user_id, old.slug, old.id)
        on conflict (owner_id, slug) do update
          set map_id = excluded.map_id
          where map_slug_redirects.map_id = excluded.map_id;

        new.slug := next_slug;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create policy "map_slug_redirects_delete_owner"
  on public.map_slug_redirects for delete
  to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.maps m
      where m.id = map_id
        and m.created_by_user_id = (select auth.uid())
    )
  );

create policy "map_slug_redirects_update_owner"
  on public.map_slug_redirects for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.maps m
      where m.id = map_id
        and m.created_by_user_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.maps m
      where m.id = map_id
        and m.created_by_user_id = (select auth.uid())
    )
  );
