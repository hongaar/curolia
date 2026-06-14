import {
  isMapScopedPluginEnabledOnMap,
  mapScopedPluginEnabledQueryKey,
} from "@/lib/map-scoped-plugin-enabled";
import { pluginList } from "@/plugins/registry";
import type { PluginDefinition } from "@curolia/plugin-contract";
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

export function usePinInteractionPlugins(mapId: string) {
  const candidates = useMemo(() => mapScopedInteractionPlugins(), []);
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

  const interactionPlugins = useMemo(() => {
    return candidates
      .filter((plugin) => activeIds?.has(plugin.id))
      .sort(
        (a, b) =>
          (a.pinInteractionOrder ?? 100) - (b.pinInteractionOrder ?? 100),
      );
  }, [candidates, activeIds]);

  return { interactionPlugins };
}
