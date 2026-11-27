import { signPinPhotoPaths } from "@curolia/plugin-contract";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/react-query";

type PinPhotoRow = {
  id: string;
  pin_id: string;
  storage_path: string | null;
  sort_order: number;
};

function photoIdsKey(photos: PinPhotoRow[]) {
  return photos.map((p) => `${p.id}:${p.storage_path ?? ""}`).join("|");
}

/**
 * Pull the latest pin photos from the DB and merge signed URLs for any new rows
 * into React Query — without invalidating/refetching the whole list.
 */
export async function syncPinPhotosToCache(
  qc: QueryClient,
  supabase: SupabaseClient,
  pinId: string,
  mapId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("pin_id", pinId)
    .order("sort_order");
  if (error || !data) return;

  const photos = data as PinPhotoRow[];
  qc.setQueryData(["photos", pinId], photos);

  const signed = await signPinPhotoPaths(
    supabase,
    photos.flatMap((p) => (p.storage_path ? [p.storage_path] : [])),
  );
  const urls: Record<string, string> = {};
  for (const photo of photos) {
    const url = photo.storage_path && signed[photo.storage_path];
    if (url) urls[photo.id] = url;
  }

  qc.setQueryData(["photo-urls", pinId, photoIdsKey(photos)], urls);

  void qc.invalidateQueries({ queryKey: ["map-pin-photos", mapId] });
  void qc.invalidateQueries({ queryKey: ["photo-urls-batch", mapId] });
  void qc.invalidateQueries({ queryKey: ["pin-side-sheet", pinId] });
}
