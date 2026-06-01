import type { SupabaseClient } from "@supabase/supabase-js";
import type { SpotifyPinPayload } from "./spotify-pin-data";

export type SpotifySyncResponse =
  | {
      skippedReason: "no_pin_date";
      cleared?: boolean;
    }
  | {
      synced: true;
      payload: SpotifyPinPayload;
    }
  | {
      error: string;
      reason?: string;
    };

export async function spotifySyncPinListening(
  supabase: SupabaseClient,
  pinId: string,
): Promise<SpotifySyncResponse> {
  const { data, error } = await supabase.functions.invoke<SpotifySyncResponse>(
    "spotify",
    { body: { action: "sync_top_tracks", pinId } },
  );
  if (error) {
    return { error: error.message || "spotify_sync_failed" };
  }
  if (!data || typeof data !== "object") {
    return { error: "spotify_sync_invalid_response" };
  }
  return data;
}
