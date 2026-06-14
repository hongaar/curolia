import {
  isMapScopedPluginEnabledOnMap,
  mapScopedPluginEnabledQueryKey,
} from "@/lib/map-scoped-plugin-enabled";
import { supabase } from "@/lib/supabase";
import { useEnabledPlugins } from "@/lib/use-enabled-plugins";
import { pluginList } from "@/plugins/registry";
import {
  isMapScopedPinOutput,
  isViewerScopedPinOutput,
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

  const enabledOnMapQuery = useQuery({
    queryKey: mapScopedPluginEnabledQueryKey(mapId, pluginIds),
    queryFn: async () => {
      const results = await Promise.all(
        pluginIds.map(async (pluginId) => ({
          pluginId,
          enabled: await isMapScopedPluginEnabledOnMap(mapId, pluginId),
        })),
      );
      return new Set(
        results.filter((row) => row.enabled).map((row) => row.pluginId),
      );
    },
    enabled: Boolean(mapId) && pluginIds.length > 0,
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

  const enabledOnMap = enabledOnMapQuery.data;

  const mapOutputPlugins = useMemo(() => {
    const withData = new Set(
      (entityDataQuery.data ?? []).map((row) => row.plugin_type_id),
    );
    return mapScopedCandidates.filter(
      (plugin) =>
        withData.has(plugin.id) && enabledOnMap?.has(plugin.id) === true,
    );
  }, [mapScopedCandidates, entityDataQuery.data, enabledOnMap]);

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
  };
}

export function useMapPluginOutputVisible(
  mapId: string | null | undefined,
  pluginId: string,
): boolean {
  const enabledQuery = useQuery({
    queryKey: mapScopedPluginEnabledQueryKey(mapId ?? "", [pluginId]),
    queryFn: async () => isMapScopedPluginEnabledOnMap(mapId!, pluginId),
    enabled: Boolean(mapId),
  });
  return enabledQuery.data === true;
}
