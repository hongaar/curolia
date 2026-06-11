-- Optional per-map crawler blocking when the map is publicly shared.

alter table public.maps
  add column if not exists block_public_crawlers boolean not null default false;

comment on column public.maps.block_public_crawlers is
  'When true and is_public, discourage search engines, crawlers, and AI agents from indexing public map URLs.';

create or replace function public.set_map_block_public_crawlers(
  p_map_id uuid,
  p_block boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_map_owner(p_map_id) then
    raise exception 'Only the map owner can change crawler blocking';
  end if;

  update public.maps
  set block_public_crawlers = p_block,
      updated_at = now()
  where id = p_map_id;
end;
$$;

revoke all on function public.set_map_block_public_crawlers(uuid, boolean) from public;
grant execute on function public.set_map_block_public_crawlers(uuid, boolean) to authenticated;
