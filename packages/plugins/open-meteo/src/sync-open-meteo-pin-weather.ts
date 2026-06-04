import type { SupabaseClient } from "@supabase/supabase-js";
import { OPEN_METEO_PLUGIN_ID } from "./config";
import { fetchPeriodWeatherSummary } from "./open-meteo-api";
import {
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
    period: { start: string; end: string };
  },
): Promise<ReturnType<typeof parseOpenMeteoPinPayload>> {
  const { pinId, mapId, lat, lng, period } = args;

  const { data: row, error: readErr } = await supabase
    .from("plugin_entity_data")
    .select("data")
    .eq("entity_type", "pin")
    .eq("entity_id", pinId)
    .eq("plugin_type_id", OPEN_METEO_PLUGIN_ID)
    .maybeSingle();
  if (readErr) throw readErr;

  const cached = parseOpenMeteoPinPayload(row?.data);
  if (cached && openMeteoPayloadMatches(cached, period, lat, lng)) {
    return cached;
  }

  const summary = await fetchPeriodWeatherSummary(
    lat,
    lng,
    period.start,
    period.end,
  );
  if (!summary) return null;

  const payload = openMeteoPayloadFromSummary(summary, period, lat, lng);
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
