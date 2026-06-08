import type { SupabaseClient } from "@supabase/supabase-js";
import { POI_PLUGIN_ID } from "./config";
import { poiSyncPin } from "./poi-edge";
import {
  poiPayloadMatches,
  parsePoiPinPayload,
  type PoiPinPayload,
} from "./poi-pin-data";

export async function syncPoiPin(
  supabase: SupabaseClient,
  args: { pinId: string; lat: number; lng: number },
): Promise<PoiPinPayload | null> {
  const { pinId, lat, lng } = args;

  const { data: row, error: readErr } = await supabase
    .from("plugin_entity_data")
    .select("data")
    .eq("entity_type", "pin")
    .eq("entity_id", pinId)
    .eq("plugin_type_id", POI_PLUGIN_ID)
    .maybeSingle();
  if (readErr) throw readErr;

  const cached = parsePoiPinPayload(row?.data);
  if (cached && poiPayloadMatches(cached, lat, lng)) {
    return cached;
  }

  const result = await poiSyncPin(supabase, pinId);
  if ("error" in result) throw new Error(result.error);
  if ("skippedReason" in result) return null;
  if ("payload" in result) return result.payload;
  return null;
}
