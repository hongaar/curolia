import type { SupabaseClient } from "@supabase/supabase-js";
import type { FlickrNearbyCandidate } from "./flickr-pin-data";

export type FlickrListNearbyResponse =
  | { candidates: FlickrNearbyCandidate[] }
  | { error: string };

export type FlickrAttachResponse =
  | {
      attachedIds: string[];
      skippedAlreadyOnPin: string[];
    }
  | { error: string };

export async function flickrListNearby(
  supabase: SupabaseClient,
  pinId: string,
): Promise<FlickrListNearbyResponse> {
  const { data, error } =
    await supabase.functions.invoke<FlickrListNearbyResponse>("flickr", {
      body: { action: "list_nearby", pinId },
    });
  if (error) throw error;
  if (!data) throw new Error("flickr_list_nearby_failed");
  return data;
}

export async function flickrAttachPhotos(
  supabase: SupabaseClient,
  pinId: string,
  candidates: FlickrNearbyCandidate[],
): Promise<FlickrAttachResponse> {
  const { data, error } = await supabase.functions.invoke<FlickrAttachResponse>(
    "flickr",
    {
      body: { action: "attach", pinId, candidates },
    },
  );
  if (error) throw error;
  if (!data) throw new Error("flickr_attach_failed");
  return data;
}
