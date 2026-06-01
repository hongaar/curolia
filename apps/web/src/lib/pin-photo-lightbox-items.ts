import type { Photo } from "@/types/database";
import { googlePhotosProductUrl } from "@curolia/plugin-google-photos";

export type PinPhotoLightboxItem = {
  id: string;
  url: string;
  originalProductUrl?: string;
};

/** Deep link to the photo in its source product (Google Photos, etc.). */
export function photoOriginalProductUrl(
  ref: Record<string, unknown> | null,
  sourcePluginId: string | null,
): string | undefined {
  if (!ref || !sourcePluginId) return undefined;

  if (sourcePluginId === "google_photos") {
    return googlePhotosProductUrl(ref);
  }

  const explicit = ref.productUrl;
  return typeof explicit === "string" && explicit.length > 0
    ? explicit
    : undefined;
}

export function photosToLightboxItems(
  photos: Photo[],
  signedUrlByPhotoId: Record<string, string>,
): PinPhotoLightboxItem[] {
  const out: PinPhotoLightboxItem[] = [];
  for (const p of photos) {
    const url = signedUrlByPhotoId[p.id];
    if (url) {
      const originalProductUrl = photoOriginalProductUrl(
        p.external_ref,
        p.source_plugin_id,
      );
      out.push({
        id: p.id,
        url,
        ...(originalProductUrl ? { originalProductUrl } : {}),
      });
    }
  }
  return out;
}

export type PinPhotoMasonrySource = {
  originalProductUrl?: string;
  sourcePluginId: string;
  sourceLabel?: string;
};

export function photoMasonrySource(
  photo: Photo,
): PinPhotoMasonrySource | undefined {
  if (!photo.source_plugin_id) return undefined;

  const originalProductUrl = photoOriginalProductUrl(
    photo.external_ref,
    photo.source_plugin_id,
  );

  return {
    sourcePluginId: photo.source_plugin_id,
    ...(originalProductUrl ? { originalProductUrl } : {}),
  };
}
