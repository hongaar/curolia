-- Per-map enable/disable for interaction plugins (default on when account plugin is on).

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
  select
    exists (
      select 1
      from public.maps m
      join public.user_plugins up
        on up.user_id = m.created_by_user_id
      where m.id = p_map_id
        and up.plugin_type_id = p_plugin_type_id
        and up.enabled = true
    )
    and coalesce(
      (
        select mp.enabled
        from public.map_plugins mp
        where mp.map_id = p_map_id
          and mp.plugin_type_id = p_plugin_type_id
      ),
      true
    );
$$;
