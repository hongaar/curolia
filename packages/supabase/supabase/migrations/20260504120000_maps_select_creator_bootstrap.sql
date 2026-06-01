-- Client creates map then map_members in two requests. SELECT on maps was
-- members-only, so (1) insert().select() could not return the row and (2) the
-- map_members insert policy's EXISTS subquery on maps saw no row under RLS.
-- Allow the creator to read a map until at least one membership row exists.

drop policy if exists "maps_select_member" on public.maps;

create policy "maps_select_member"
  on public.maps for select
  to authenticated
  using (
    public.is_map_member(id)
    or (
      created_by_user_id = (select auth.uid())
      and not exists (
        select 1
        from public.map_members jm
        where jm.map_id = maps.id
      )
    )
  );
