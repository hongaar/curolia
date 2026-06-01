import type { SupabaseClient } from "@supabase/supabase-js";
import type { LastfmPinPayload } from "./lastfm-pin-data";

export type LastfmSyncResponse =
  | {
      skippedReason: "no_pin_date";
      cleared?: boolean;
    }
  | {
      synced: true;
      payload: LastfmPinPayload;
    }
  | {
      error: string;
      reason?: string;
    };

export async function lastfmSyncPinListening(
  supabase: SupabaseClient,
  pinId: string,
): Promise<LastfmSyncResponse> {
  const { data, error } = await supabase.functions.invoke<LastfmSyncResponse>(
    "lastfm",
    { body: { action: "sync_top_tracks", pinId } },
  );
  if (error) {
    return { error: error.message || "lastfm_sync_failed" };
  }
  if (!data || typeof data !== "object") {
    return { error: "lastfm_sync_invalid_response" };
  }
  return data;
}
