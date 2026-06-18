import {
  isMapScopedPluginEnabledOnMap,
  mapScopedPluginEnabledQueryKey,
} from "@/lib/map-scoped-plugin-enabled";
import { pluginList } from "@/plugins/registry";
import type { PluginDefinition } from "@curolia/plugin-contract";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/** Implemented plugins with map-scoped {@link PluginDefinition.PinMetaSummary}. */
export function mapScopedPinMetaSummaryPlugins(): readonly PluginDefinition[] {
  return pluginList.filter(
    (p) => p.implemented && p.pinOutputScope !== "viewer" && p.PinMetaSummary,
  );
}

export function usePinMetaSummaryPlugins(mapId: string) {
  const candidates = useMemo(() => mapScopedPinMetaSummaryPlugins(), []);
  const pluginIds = useMemo(
    () => candidates.map((plugin) => plugin.id),
    [candidates],
  );

  const activeQuery = useQuery({
    queryKey: mapScopedPluginEnabledQueryKey(mapId, pluginIds),
    queryFn: async () => {
      const results = await Promise.all(
        pluginIds.map(async (pluginId) => ({
          pluginId,
          active: await isMapScopedPluginEnabledOnMap(mapId, pluginId),
        })),
      );
      return new Set(
        results.filter((row) => row.active).map((row) => row.pluginId),
      );
    },
    enabled: Boolean(mapId) && pluginIds.length > 0,
  });

  const activeIds = activeQuery.data;

  const metaSummaryPlugins = useMemo(() => {
    return candidates
      .filter((plugin) => activeIds?.has(plugin.id))
      .sort(
        (a, b) =>
          (a.pinMetaSummaryOrder ?? a.pinInteractionOrder ?? 100) -
          (b.pinMetaSummaryOrder ?? b.pinInteractionOrder ?? 100),
      );
  }, [candidates, activeIds]);

  return { metaSummaryPlugins };
}
