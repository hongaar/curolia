import {
  isPluginSyncJobActive,
  parsePinMetadataRow,
  resolveMapPinMetadataShow,
  type PinMetadataRow,
  type PinMetadataShowSettings,
  type PluginSyncJobStatus,
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
import { osmMetadataIsFreshForPayload } from "./osm-poi-metadata-sync";
import {
  osmPoiPayloadMatches,
  parseOsmPoiPinPayload,
  type OsmPoiPinPayload,
} from "./osm-poi-pin-data";
import {
  osmPoiEntityDataQueryKey,
  osmPoiSyncJobQueryKey,
  pinMetadataQueryKey,
} from "./query-keys";
import { OSM_POI_SYNC_EVENT } from "./sync-registry";

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
  const syncJobKey = useMemo(() => osmPoiSyncJobQueryKey(pinId), [pinId]);

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

  const syncJobQuery = useQuery({
    queryKey: syncJobKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_sync_jobs")
        .select("id, status, last_error, updated_at")
        .eq("plugin_type_id", OSM_POI_PLUGIN_ID)
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .eq("event", OSM_POI_SYNC_EVENT)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as {
        id: string;
        status: PluginSyncJobStatus;
        last_error: string | null;
        updated_at: string;
      } | null;
    },
    enabled: canSync,
    refetchInterval: (query) =>
      isPluginSyncJobActive(query.state.data?.status) ? 3000 : false,
  });

  useEffect(() => {
    if (syncJobQuery.data?.status !== "completed") return;
    void qc.invalidateQueries({ queryKey: entityDataKey });
    void qc.invalidateQueries({ queryKey: pinMetadataQueryKey(pinId) });
  }, [syncJobQuery.data?.status, qc, entityDataKey, pinId]);

  const cachedPayload = useMemo(() => {
    const p = parseOsmPoiPinPayload(cachedRowQuery.data?.data);
    if (!p || !osmPoiPayloadMatches(p, lat, lng)) return null;
    return p;
  }, [cachedRowQuery.data, lat, lng]);

  const hasPendingSyncJob = isPluginSyncJobActive(syncJobQuery.data?.status);
  const syncJobFailed = syncJobQuery.data?.status === "failed";

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
    enabled: canSync && cachedPayload != null,
    placeholderData: keepPreviousData,
  });

  const payload = cachedPayload;
  const metadataRows = metadataQuery.data ?? [];
  const hasPoiPayload = Boolean(
    cachedPayload && !cachedPayload.noPoi && cachedPayload.tags,
  );
  const metadataIsFresh =
    !hasPoiPayload ||
    !cachedPayload ||
    osmMetadataIsFreshForPayload(cachedPayload, metadataRows);

  const isMetadataLoading =
    canSync &&
    !syncJobFailed &&
    ((cachedRowQuery.isPending && !cachedRowQuery.data) ||
      hasPendingSyncJob ||
      (hasPoiPayload &&
        !metadataQuery.isError &&
        (metadataQuery.isFetching || !metadataIsFresh)));

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
