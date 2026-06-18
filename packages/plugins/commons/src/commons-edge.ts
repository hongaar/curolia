import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommonsNearbyCandidate } from "./commons-pin-data";

export type CommonsListNearbyResponse =
  | { candidates: CommonsNearbyCandidate[] }
  | { error: string };

export type CommonsAttachResponse =
  | {
      attachedIds: string[];
      skippedAlreadyOnPin: string[];
    }
  | { error: string };

export async function commonsListNearby(
  supabase: SupabaseClient,
  pinId: string,
): Promise<CommonsListNearbyResponse> {
  const { data, error } =
    await supabase.functions.invoke<CommonsListNearbyResponse>("commons", {
      body: { action: "list_nearby", pinId },
    });
  if (error) throw error;
  if (!data) throw new Error("commons_list_nearby_failed");
  return data;
}

export async function commonsAttachPhotos(
  supabase: SupabaseClient,
  pinId: string,
  candidates: CommonsNearbyCandidate[],
): Promise<CommonsAttachResponse> {
  const { data, error } =
    await supabase.functions.invoke<CommonsAttachResponse>("commons", {
      body: { action: "attach", pinId, candidates },
    });
  if (error) throw error;
  if (!data) throw new Error("commons_attach_failed");
  return data;
}
