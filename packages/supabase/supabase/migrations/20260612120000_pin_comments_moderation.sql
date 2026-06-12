-- Map owners and editors may moderate (delete) pin comments.

create or replace function public.is_map_editor(p_map_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.map_members jm
    where jm.map_id = p_map_id
      and jm.user_id = (select auth.uid())
      and jm.role in (
        'owner'::public.map_member_role,
        'editor'::public.map_member_role
      )
  );
$$;

revoke all on function public.is_map_editor(uuid) from public;
grant execute on function public.is_map_editor(uuid) to authenticated;

drop policy if exists "pin_comments_delete_author" on public.pin_comments;
create policy "pin_comments_delete_author"
  on public.pin_comments for delete
  to authenticated
  using (
    author_user_id = (select auth.uid())
    or public.is_map_editor(map_id)
  );
