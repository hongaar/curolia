import {
  parsePinMetadataRow,
  resolveMapPinMetadataShow,
  type PinMetadataRow,
  type PinMetadataShowSettings,
} from "@curolia/plugin-contract";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import {
  isOsmPoiEnabledForMap,
  OSM_POI_PLUGIN_ID,
  type OsmPoiMapPluginRow,
} from "./config";
import { OSM_POI_CACHE_MAX_AGE_MS } from "./constants";
import {
  osmPoiPayloadMatches,
  parseOsmPoiPinPayload,
  type OsmPoiPinPayload,
} from "./osm-poi-pin-data";
import {
  osmPoiEntityDataQueryKey,
  osmPoiSyncQueryKey,
  pinMetadataQueryKey,
} from "./query-keys";
import { syncOsmPoiPin } from "./sync-osm-poi-pin";

export type UseOsmPoiPinSyncArgs = {
  supabase: SupabaseClient;
  pinId: string;
  mapId: string;
  lat: number;
  lng: number;
  /** When false, skips map plugin lookup and POI fetch. */
  queryEnabled?: boolean;
};

export type OsmPoiPinSyncState = {
  mapEnabled: boolean;
  canSync: boolean;
  isMetadataLoading: boolean;
  showSettings: PinMetadataShowSettings;
  payload: OsmPoiPinPayload | null;
  metadataRows: PinMetadataRow[];
};

export function useOsmPoiPinSync({
  supabase,
  pinId,
  mapId,
  lat,
  lng,
  queryEnabled = true,
}: UseOsmPoiPinSyncArgs): OsmPoiPinSyncState {
  const qc = useQueryClient();

  const mapPluginQuery = useQuery({
    queryKey: ["map_plugins", mapId, OSM_POI_PLUGIN_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("map_plugins")
        .select("enabled, config")
        .eq("map_id", mapId)
        .eq("plugin_type_id", OSM_POI_PLUGIN_ID)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(mapId) && queryEnabled,
    placeholderData: keepPreviousData,
  });

  const showMetadataQuery = useQuery({
    queryKey: ["maps", mapId, "show_pin_metadata"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maps")
        .select("show_pin_metadata")
        .eq("id", mapId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(mapId) && queryEnabled,
    placeholderData: keepPreviousData,
  });

  const mapEnabled = isOsmPoiEnabledForMap(
    mapPluginQuery.data as OsmPoiMapPluginRow | undefined,
  );
  const showSettings = resolveMapPinMetadataShow(
    showMetadataQuery.data?.show_pin_metadata,
  );

  const canSync =
    queryEnabled &&
    mapEnabled &&
    Boolean(pinId) &&
    Boolean(mapId) &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  const entityDataKey = useMemo(() => osmPoiEntityDataQueryKey(pinId), [pinId]);

  const cachedRowQuery = useQuery({
    queryKey: entityDataKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_entity_data")
        .select("data")
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .eq("plugin_type_id", OSM_POI_PLUGIN_ID)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: canSync,
    placeholderData: keepPreviousData,
  });

  const cachedPayload = useMemo(() => {
    const p = parseOsmPoiPinPayload(cachedRowQuery.data?.data);
    if (!p || !osmPoiPayloadMatches(p, lat, lng)) return null;
    return p;
  }, [cachedRowQuery.data, lat, lng]);

  const needsSync = canSync && cachedPayload == null;

  const syncQuery = useQuery({
    queryKey: osmPoiSyncQueryKey(pinId, lat, lng),
    queryFn: () => syncOsmPoiPin(supabase, { pinId, lat, lng }),
    enabled: needsSync,
    staleTime: OSM_POI_CACHE_MAX_AGE_MS,
    retry: 1,
  });

  useEffect(() => {
    if (!syncQuery.isSuccess || syncQuery.data === undefined) return;
    void qc.invalidateQueries({ queryKey: entityDataKey });
    void qc.invalidateQueries({ queryKey: pinMetadataQueryKey(pinId) });
  }, [syncQuery.isSuccess, syncQuery.data, qc, entityDataKey, pinId]);

  const metadataQuery = useQuery({
    queryKey: [...pinMetadataQueryKey(pinId), OSM_POI_PLUGIN_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pin_metadata")
        .select(
          "id, map_id, pin_id, field_key, source_plugin_id, value, created_at, updated_at",
        )
        .eq("pin_id", pinId)
        .eq("source_plugin_id", OSM_POI_PLUGIN_ID);
      if (error) throw error;
      return (data ?? [])
        .map((row) => parsePinMetadataRow(row))
        .filter((row): row is NonNullable<typeof row> => row != null);
    },
    enabled: canSync && (cachedPayload != null || syncQuery.isSuccess),
    placeholderData: keepPreviousData,
  });

  const payload = cachedPayload ?? syncQuery.data ?? null;
  const metadataRows = metadataQuery.data ?? [];

  const isMetadataLoading =
    canSync &&
    (cachedRowQuery.isPending ||
      (needsSync && (syncQuery.isPending || syncQuery.isFetching)) ||
      (syncQuery.isSuccess &&
        (metadataQuery.isPending || metadataQuery.isFetching)));

  return {
    mapEnabled,
    canSync,
    isMetadataLoading,
    showSettings,
    payload,
    metadataRows,
  };
}

export function useOsmPoiPinMetadataLoading(
  args: UseOsmPoiPinSyncArgs,
): boolean {
  return useOsmPoiPinSync(args).isMetadataLoading;
}
