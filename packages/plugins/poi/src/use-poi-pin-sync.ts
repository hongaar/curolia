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
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { POI_PLUGIN_ID } from "./config";
import {
  isMapPoiAutoLookupEnabled,
  poiMapPluginQueryKey,
  resolvePoiMetadataLoading,
  shouldTriggerPoiAutoLookup,
} from "./poi-auto-lookup";
import { poiRunAutoLookup } from "./poi-edge";
import { poiMetadataIsFreshForPayload } from "./poi-metadata-sync";
import {
  parsePoiPinPayload,
  poiPayloadMatches,
  type PoiPinPayload,
} from "./poi-pin-data";
import {
  pinMetadataQueryKey,
  poiEntityDataQueryKey,
  poiSyncJobQueryKey,
} from "./query-keys";
import { POI_SYNC_EVENT } from "./sync-registry";

export type UsePoiPinSyncArgs = {
  supabase: SupabaseClient;
  pinId: string;
  mapId: string;
  lat: number;
  lng: number;
  /** When false, skips POI metadata fetch (e.g. plugin disabled account-wide). */
  queryEnabled?: boolean;
};

export type PoiPinSyncState = {
  pluginEnabled: boolean;
  autoLookupEnabled: boolean;
  canSync: boolean;
  isMetadataLoading: boolean;
  showSettings: PinMetadataShowSettings;
  payload: PoiPinPayload | null;
  metadataRows: PinMetadataRow[];
};

export function usePoiPinSync({
  supabase,
  pinId,
  mapId,
  lat,
  lng,
  queryEnabled = true,
}: UsePoiPinSyncArgs): PoiPinSyncState {
  const qc = useQueryClient();

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

  const mapPluginQuery = useQuery({
    queryKey: poiMapPluginQueryKey(mapId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("map_plugins")
        .select("enabled, config")
        .eq("map_id", mapId)
        .eq("plugin_type_id", POI_PLUGIN_ID)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(mapId) && queryEnabled,
    placeholderData: keepPreviousData,
  });

  const pluginEnabled = queryEnabled;
  const autoLookupEnabled = isMapPoiAutoLookupEnabled(
    mapPluginQuery.data ?? undefined,
  );
  const showSettings = resolveMapPinMetadataShow(
    showMetadataQuery.data?.show_pin_metadata,
  );

  const canSync =
    pluginEnabled &&
    Boolean(pinId) &&
    Boolean(mapId) &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  const entityDataKey = useMemo(() => poiEntityDataQueryKey(pinId), [pinId]);
  const syncJobKey = useMemo(() => poiSyncJobQueryKey(pinId), [pinId]);

  const cachedRowQuery = useQuery({
    queryKey: entityDataKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_entity_data")
        .select("data")
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .eq("plugin_type_id", POI_PLUGIN_ID)
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
        .eq("plugin_type_id", POI_PLUGIN_ID)
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .eq("event", POI_SYNC_EVENT)
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
    enabled: canSync && autoLookupEnabled,
    refetchInterval: (query) =>
      isPluginSyncJobActive(query.state.data?.status) ? 3000 : false,
  });

  const cachedPayload = useMemo(() => {
    const p = parsePoiPinPayload(cachedRowQuery.data?.data);
    if (!p || !poiPayloadMatches(p, lat, lng)) return null;
    return p;
  }, [cachedRowQuery.data, lat, lng]);

  const autoLookupMutation = useMutation({
    mutationFn: async () => {
      const result = await poiRunAutoLookup(supabase, pinId);
      if ("error" in result) throw new Error(result.error);
      return result;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: entityDataKey }),
        qc.invalidateQueries({ queryKey: syncJobKey }),
        qc.invalidateQueries({ queryKey: pinMetadataQueryKey(pinId) }),
      ]);
    },
  });

  const triggerAutoLookup = shouldTriggerPoiAutoLookup({
    autoLookupEnabled,
    canSync,
    cachedPayload,
    syncJobStatus: syncJobQuery.data?.status,
    autoLookupInFlight: autoLookupMutation.isPending,
    autoLookupFailed: autoLookupMutation.isError,
  });

  useEffect(() => {
    if (!triggerAutoLookup) return;
    void autoLookupMutation.mutateAsync();
  }, [triggerAutoLookup, pinId, lat, lng]);

  useEffect(() => {
    if (syncJobQuery.data?.status !== "completed") return;
    void qc.invalidateQueries({ queryKey: entityDataKey });
    void qc.invalidateQueries({ queryKey: pinMetadataQueryKey(pinId) });
  }, [syncJobQuery.data?.status, qc, entityDataKey, pinId]);

  const hasPoiPayload = Boolean(
    cachedPayload && !cachedPayload.noPoi && cachedPayload.tags,
  );

  const metadataQuery = useQuery({
    queryKey: [...pinMetadataQueryKey(pinId), POI_PLUGIN_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pin_metadata")
        .select(
          "id, map_id, pin_id, field_key, source_plugin_id, value, created_at, updated_at",
        )
        .eq("pin_id", pinId)
        .eq("source_plugin_id", POI_PLUGIN_ID);
      if (error) throw error;
      return (data ?? [])
        .map((row) => parsePinMetadataRow(row))
        .filter((row): row is NonNullable<typeof row> => row != null);
    },
    enabled: canSync && hasPoiPayload,
    placeholderData: keepPreviousData,
  });

  const payload = cachedPayload;
  const metadataRows = metadataQuery.data ?? [];
  const metadataIsFresh =
    !hasPoiPayload ||
    !cachedPayload ||
    poiMetadataIsFreshForPayload(cachedPayload, metadataRows);

  const isMetadataLoading = resolvePoiMetadataLoading({
    pluginEnabled,
    autoLookupEnabled,
    canSync,
    syncJobStatus: syncJobQuery.data?.status,
    entityDataPending: cachedRowQuery.isPending,
    cachedPayload,
    autoLookupInFlight: autoLookupMutation.isPending,
    autoLookupFailed: autoLookupMutation.isError,
    metadataFetching: metadataQuery.isFetching,
    metadataIsFresh,
    metadataQueryError: metadataQuery.isError,
  });

  return {
    pluginEnabled,
    autoLookupEnabled,
    canSync,
    isMetadataLoading,
    showSettings,
    payload,
    metadataRows,
  };
}

export function usePoiPinMetadataLoading(args: UsePoiPinSyncArgs): boolean {
  return usePoiPinSync(args).isMetadataLoading;
}
