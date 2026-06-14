import { supabase } from "@/lib/supabase";

/** Account plugin on for the map owner and not disabled on `map_plugins`. */
export async function isMapScopedPluginEnabledOnMap(
  mapId: string,
  pluginId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc(
    "is_pin_interaction_plugin_enabled",
    {
      p_map_id: mapId,
      p_plugin_type_id: pluginId,
    },
  );
  if (error) throw error;
  return data === true;
}

export function mapScopedPluginEnabledQueryKey(
  mapId: string,
  pluginIds: readonly string[],
) {
  return ["map_scoped_plugin_enabled", mapId, ...pluginIds] as const;
}
