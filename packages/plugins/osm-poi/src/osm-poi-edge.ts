import type { SupabaseClient } from "@supabase/supabase-js";
import type { OsmPoiPinPayload } from "./osm-poi-pin-data";

export type OsmPoiSyncResponse =
  | { synced: true; payload: OsmPoiPinPayload }
  | { synced: false; reason: "nothing_nearby"; payload: OsmPoiPinPayload }
  | { skippedReason: "map_plugin_disabled" | "no_coordinates" }
  | { error: string };

export async function osmPoiSyncPin(
  supabase: SupabaseClient,
  pinId: string,
): Promise<OsmPoiSyncResponse> {
  const { data, error } = await supabase.functions.invoke<OsmPoiSyncResponse>(
    "osm-poi",
    { body: { action: "sync_pin_poi", pinId } },
  );
  if (error) {
    return { error: error.message || "osm_poi_sync_failed" };
  }
  if (!data || typeof data !== "object") {
    return { error: "osm_poi_sync_invalid_response" };
  }
  return data;
}
