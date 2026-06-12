import { supabase } from "@/lib/supabase";
import { useEnabledPlugins } from "@/lib/use-enabled-plugins";
import { pluginList } from "@/plugins/registry";
import {
  isMapScopedPinOutput,
  isPluginOutputShownOnMap,
  isViewerScopedPinOutput,
  resolveMapPluginOutputShow,
  type PluginDefinition,
} from "@curolia/plugin-contract";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/** Implemented plugins with a map-scoped {@link PluginDefinition.PinDetailSection}. */
export function mapScopedDetailPlugins(): readonly PluginDefinition[] {
  return pluginList.filter(
    (p) => p.implemented && p.PinDetailSection && isMapScopedPinOutput(p),
  );
}

export function usePinOutputPlugins(pinId: string, mapId: string) {
  const { plugins: enabledPlugins } = useEnabledPlugins();

  const mapScopedCandidates = useMemo(() => mapScopedDetailPlugins(), []);
  const pluginIds = useMemo(
    () => mapScopedCandidates.map((p) => p.id),
    [mapScopedCandidates],
  );

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

  const entityDataQuery = useQuery({
    queryKey: ["plugin_entity_data", "pin", pinId, "output_plugins", pluginIds],
    queryFn: async () => {
      if (pluginIds.length === 0) return [];
      const { data, error } = await supabase
        .from("plugin_entity_data")
        .select("plugin_type_id")
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .in("plugin_type_id", pluginIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(pinId) && pluginIds.length > 0,
  });

  const showSettings = resolveMapPluginOutputShow(
    showOutputsQuery.data?.show_plugin_outputs,
  );

  const mapOutputPlugins = useMemo(() => {
    const withData = new Set(
      (entityDataQuery.data ?? []).map((row) => row.plugin_type_id),
    );
    return mapScopedCandidates.filter(
      (plugin) =>
        withData.has(plugin.id) &&
        isPluginOutputShownOnMap(showSettings, plugin.id),
    );
  }, [mapScopedCandidates, entityDataQuery.data, showSettings]);

  const viewerOutputPlugins = useMemo(
    () =>
      enabledPlugins.filter(
        (plugin) => plugin.PinDetailSection && isViewerScopedPinOutput(plugin),
      ),
    [enabledPlugins],
  );

  return {
    mapOutputPlugins,
    viewerOutputPlugins,
    showSettings,
  };
}

export function useMapPluginOutputVisible(
  mapId: string | null | undefined,
  pluginId: string,
): boolean {
  const showOutputsQuery = useQuery({
    queryKey: ["maps", mapId, "show_plugin_outputs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maps")
        .select("show_plugin_outputs")
        .eq("id", mapId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(mapId),
  });

  const showSettings = resolveMapPluginOutputShow(
    showOutputsQuery.data?.show_plugin_outputs,
  );
  return isPluginOutputShownOnMap(showSettings, pluginId);
}
