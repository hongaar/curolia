-- Allow reclaiming a profile slug that still exists only as your own redirect row.

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
    )
    and not exists (
      select 1
      from public.profile_slug_redirects r
      where r.slug = candidate
        and (
          p_profile_id is null
          or r.profile_id is distinct from p_profile_id
        )
    );

    suffix := suffix + 1;
    candidate := substring(base from 1 for 118) || '-' || suffix::text;
  end loop;

  return candidate;
end;
$$;

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
        delete from public.profile_slug_redirects
        where slug = next_slug
          and profile_id = old.id;

        insert into public.profile_slug_redirects (slug, profile_id)
        values (old.slug, old.id)
        on conflict (slug) do update
          set profile_id = excluded.profile_id
          where profile_slug_redirects.profile_id = excluded.profile_id;

        new.slug := next_slug;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create policy "profile_slug_redirects_delete_own"
  on public.profile_slug_redirects for delete
  to authenticated
  using (profile_id = (select auth.uid()));

create policy "profile_slug_redirects_update_own"
  on public.profile_slug_redirects for update
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
