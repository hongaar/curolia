import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/react-query";

type PinPhotoRow = {
  id: string;
  pin_id: string;
  storage_path: string | null;
  external_ref: Record<string, unknown> | null;
  sort_order: number;
};

function externalDisplayUrl(
  ref: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!ref) return undefined;
  const displayUrl = ref.displayUrl;
  return typeof displayUrl === "string" && displayUrl.length > 0
    ? displayUrl
    : undefined;
}

function photoIdsKey(photos: PinPhotoRow[]) {
  return photos
    .map(
      (p) =>
        `${p.id}:${p.storage_path ?? externalDisplayUrl(p.external_ref) ?? ""}`,
    )
    .join("|");
}

function mergedSignedUrlsForPin(
  qc: QueryClient,
  pinId: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [, data] of qc.getQueriesData<Record<string, string>>({
    queryKey: ["photo-urls", pinId],
  })) {
    if (data) Object.assign(out, data);
  }
  return out;
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

  const urls = mergedSignedUrlsForPin(qc, pinId);
  const missing = photos.filter((p) => p.storage_path && !urls[p.id]);
  if (missing.length > 0) {
    const paths = missing.map((p) => ({
      id: p.id,
      path: p.storage_path!,
    }));
    const { data: signed, error: signErr } = await supabase.storage
      .from("pin-photos")
      .createSignedUrls(
        paths.map((p) => p.path),
        3600,
      );
    if (!signErr && signed) {
      for (let i = 0; i < paths.length; i++) {
        const row = signed[i];
        if (row?.signedUrl && !row.error) urls[paths[i]!.id] = row.signedUrl;
      }
    }
  }

  for (const photo of photos) {
    if (urls[photo.id]) continue;
    const external = externalDisplayUrl(photo.external_ref);
    if (external) urls[photo.id] = external;
  }

  qc.setQueryData(["photo-urls", pinId, photoIdsKey(photos)], urls);

  void qc.invalidateQueries({ queryKey: ["map-pin-photos", mapId] });
  void qc.invalidateQueries({ queryKey: ["photo-urls-batch", mapId] });
  void qc.invalidateQueries({ queryKey: ["pin-side-sheet", pinId] });
}
