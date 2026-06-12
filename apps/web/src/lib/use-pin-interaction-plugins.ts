import { supabase } from "@/lib/supabase";
import { pluginList } from "@/plugins/registry";
import {
  isPluginOutputShownOnMap,
  resolveMapPluginOutputShow,
  type PluginDefinition,
} from "@curolia/plugin-contract";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/** Implemented plugins with map-scoped pin interaction surfaces. */
export function mapScopedInteractionPlugins(): readonly PluginDefinition[] {
  return pluginList.filter(
    (p) =>
      p.implemented &&
      p.pinOutputScope !== "viewer" &&
      (p.PinInteractionSection || p.PinInteractionComposer),
  );
}

async function isInteractionPluginActiveOnMap(
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

export function usePinInteractionPlugins(mapId: string) {
  const candidates = useMemo(() => mapScopedInteractionPlugins(), []);
  const pluginIds = useMemo(
    () => candidates.map((plugin) => plugin.id),
    [candidates],
  );

  const activeQuery = useQuery({
    queryKey: ["pin_interaction_plugins", mapId, pluginIds],
    queryFn: async () => {
      const results = await Promise.all(
        pluginIds.map(async (pluginId) => ({
          pluginId,
          active: await isInteractionPluginActiveOnMap(mapId, pluginId),
        })),
      );
      return new Set(
        results.filter((row) => row.active).map((row) => row.pluginId),
      );
    },
    enabled: Boolean(mapId) && pluginIds.length > 0,
  });

  const showOutputsQuery = useQuery({
    queryKey: ["maps", mapId, "show_plugin_outputs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maps")
        .select("show_plugin_outputs")
        .eq("id", mapId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(mapId),
  });

  const showSettings = resolveMapPluginOutputShow(
    showOutputsQuery.data?.show_plugin_outputs,
  );

  const activeIds = activeQuery.data;

  const interactionPlugins = useMemo(() => {
    return candidates
      .filter(
        (plugin) =>
          activeIds?.has(plugin.id) &&
          isPluginOutputShownOnMap(showSettings, plugin.id),
      )
      .sort(
        (a, b) =>
          (a.pinInteractionOrder ?? 100) - (b.pinInteractionOrder ?? 100),
      );
  }, [candidates, showSettings, activeIds]);

  return { interactionPlugins, showSettings };
}
