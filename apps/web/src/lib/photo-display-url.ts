import type { Photo } from "@/types/database";

/** Display URL for pin photos hosted outside Supabase storage (e.g. Flickr). */
export function externalPhotoDisplayUrl(
  ref: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!ref) return undefined;
  const displayUrl = ref.displayUrl;
  return typeof displayUrl === "string" && displayUrl.length > 0
    ? displayUrl
    : undefined;
}

export function photoRowCacheKey(
  photo: Pick<Photo, "id" | "storage_path" | "external_ref">,
): string {
  const external = externalPhotoDisplayUrl(photo.external_ref) ?? "";
  return `${photo.id}:${photo.storage_path ?? external}`;
}

export function photoIdsKey(photos: Photo[]): string {
  return photos.map((p) => photoRowCacheKey(p)).join("|");
}

export function mergePhotoDisplayUrls(
  photos: Photo[],
  signedUrlByPhotoId: Record<string, string>,
): Record<string, string> {
  const out = { ...signedUrlByPhotoId };
  for (const photo of photos) {
    if (out[photo.id]) continue;
    const external = externalPhotoDisplayUrl(photo.external_ref);
    if (external) out[photo.id] = external;
  }
  return out;
}
