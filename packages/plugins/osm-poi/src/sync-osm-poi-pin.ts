import type { SupabaseClient } from "@supabase/supabase-js";
import { osmPoiSyncPin } from "./osm-poi-edge";
import {
  osmPoiPayloadMatches,
  parseOsmPoiPinPayload,
} from "./osm-poi-pin-data";
import { OSM_POI_PLUGIN_ID } from "./config";

export async function syncOsmPoiPin(
  supabase: SupabaseClient,
  args: { pinId: string; lat: number; lng: number },
): Promise<ReturnType<typeof parseOsmPoiPinPayload>> {
  const { pinId, lat, lng } = args;

  const { data: row, error: readErr } = await supabase
    .from("plugin_entity_data")
    .select("data")
    .eq("entity_type", "pin")
    .eq("entity_id", pinId)
    .eq("plugin_type_id", OSM_POI_PLUGIN_ID)
    .maybeSingle();
  if (readErr) throw readErr;

  const cached = parseOsmPoiPinPayload(row?.data);
  if (cached && osmPoiPayloadMatches(cached, lat, lng)) {
    return cached;
  }

  const result = await osmPoiSyncPin(supabase, pinId);
  if ("error" in result) throw new Error(result.error);
  if ("skippedReason" in result) return null;

  return result.payload;
}
