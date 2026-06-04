import type { SupabaseClient } from "@supabase/supabase-js";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { isOpenMeteoEnabledForMap, OPEN_METEO_PLUGIN_ID } from "./config";
import { clampPeriodEndToToday, resolvePinPeriodYmd } from "./open-meteo-dates";
import {
  openMeteoPayloadMatches,
  parseOpenMeteoPinPayload,
} from "./open-meteo-pin-data";
import { formatOpenMeteoSubtitleFromPayload } from "./open-meteo-weather";
import {
  openMeteoEntityDataQueryKey,
  openMeteoWeatherQueryKey,
} from "./query-keys";
import { syncOpenMeteoPinWeather } from "./sync-open-meteo-pin-weather";

export type UseOpenMeteoPinSubtitleArgs = {
  supabase: SupabaseClient;
  pinId: string;
  mapId: string;
  lat: number;
  lng: number;
  pinDate?: string | null;
  pinEndDate?: string | null;
  /** When false, skips map plugin lookup and weather fetch. */
  queryEnabled?: boolean;
};

export function useOpenMeteoPinSubtitle({
  supabase,
  pinId,
  mapId,
  lat,
  lng,
  pinDate,
  pinEndDate,
  queryEnabled = true,
}: UseOpenMeteoPinSubtitleArgs): string | null {
  const qc = useQueryClient();

  const period = useMemo(() => {
    const raw = resolvePinPeriodYmd(pinDate, pinEndDate);
    if (!raw) return null;
    return clampPeriodEndToToday(raw);
  }, [pinDate, pinEndDate]);

  const mapPluginQuery = useQuery({
    queryKey: ["map_plugins", mapId, OPEN_METEO_PLUGIN_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("map_plugins")
        .select("enabled")
        .eq("map_id", mapId)
        .eq("plugin_type_id", OPEN_METEO_PLUGIN_ID)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(mapId) && queryEnabled,
    placeholderData: keepPreviousData,
  });

  const mapEnabled = isOpenMeteoEnabledForMap(mapPluginQuery.data);
  const canSync =
    queryEnabled &&
    mapEnabled &&
    period != null &&
    Boolean(pinId) &&
    Boolean(mapId);

  const entityDataKey = useMemo(
    () => openMeteoEntityDataQueryKey(OPEN_METEO_PLUGIN_ID, pinId),
    [pinId],
  );

  const cachedRowQuery = useQuery({
    queryKey: entityDataKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_entity_data")
        .select("data")
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .eq("plugin_type_id", OPEN_METEO_PLUGIN_ID)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: canSync,
    placeholderData: keepPreviousData,
  });

  const cachedPayload = useMemo(() => {
    const p = parseOpenMeteoPinPayload(cachedRowQuery.data?.data);
    if (!p || !period) return null;
    if (!openMeteoPayloadMatches(p, period, lat, lng)) return null;
    return p;
  }, [cachedRowQuery.data, period, lat, lng]);

  const needsSync = canSync && period != null && cachedPayload == null;

  const syncQuery = useQuery({
    queryKey: period
      ? openMeteoWeatherQueryKey(pinId, period.start, period.end, lat, lng)
      : ["open-meteo", "disabled"],
    queryFn: () =>
      syncOpenMeteoPinWeather(supabase, {
        pinId,
        mapId,
        lat,
        lng,
        period: period!,
      }),
    enabled: needsSync,
    staleTime: Infinity,
    retry: 1,
  });

  useEffect(() => {
    if (!syncQuery.isSuccess || !syncQuery.data) return;
    void qc.invalidateQueries({ queryKey: entityDataKey });
  }, [syncQuery.isSuccess, syncQuery.data, qc, entityDataKey]);

  const payload = cachedPayload ?? syncQuery.data ?? null;
  if (!canSync || !payload) return null;
  return formatOpenMeteoSubtitleFromPayload(payload);
}
