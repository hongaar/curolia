import type { SupabaseClient } from "@supabase/supabase-js";
import { OPEN_METEO_PLUGIN_ID } from "./config";
import {
  fetchCurrentWeather,
  fetchPeriodWeatherSummary,
} from "./open-meteo-api";
import type { OpenMeteoWeatherRequest } from "./open-meteo-dates";
import {
  openMeteoPayloadFromCurrent,
  openMeteoPayloadFromSummary,
  openMeteoPayloadMatches,
  parseOpenMeteoPinPayload,
} from "./open-meteo-pin-data";

export async function syncOpenMeteoPinWeather(
  supabase: SupabaseClient,
  args: {
    pinId: string;
    mapId: string;
    lat: number;
    lng: number;
    request: OpenMeteoWeatherRequest;
  },
): Promise<ReturnType<typeof parseOpenMeteoPinPayload>> {
  const { pinId, mapId, lat, lng, request } = args;

  const { data: row, error: readErr } = await supabase
    .from("plugin_entity_data")
    .select("data")
    .eq("entity_type", "pin")
    .eq("entity_id", pinId)
    .eq("plugin_type_id", OPEN_METEO_PLUGIN_ID)
    .maybeSingle();
  if (readErr) throw readErr;

  const cached = parseOpenMeteoPinPayload(row?.data);
  if (cached && openMeteoPayloadMatches(cached, request, lat, lng)) {
    return cached;
  }

  const payload =
    request.kind === "current"
      ? await syncCurrentWeather(lat, lng, request.period)
      : await syncHistoricalWeather(lat, lng, request.period);

  if (!payload) return null;

  const { error: upsertErr } = await supabase.from("plugin_entity_data").upsert(
    {
      map_id: mapId,
      entity_type: "pin",
      entity_id: pinId,
      plugin_type_id: OPEN_METEO_PLUGIN_ID,
      data: payload as unknown as Record<string, unknown>,
    },
    { onConflict: "entity_type,entity_id,plugin_type_id" },
  );
  if (upsertErr) throw upsertErr;

  return payload;
}

async function syncCurrentWeather(
  lat: number,
  lng: number,
  period: { start: string; end: string },
) {
  const snapshot = await fetchCurrentWeather(lat, lng);
  if (!snapshot) return null;
  return openMeteoPayloadFromCurrent(snapshot, period, lat, lng);
}

async function syncHistoricalWeather(
  lat: number,
  lng: number,
  period: { start: string; end: string },
) {
  const summary = await fetchPeriodWeatherSummary(
    lat,
    lng,
    period.start,
    period.end,
  );
  if (!summary) return null;
  return openMeteoPayloadFromSummary(summary, period, lat, lng);
}
