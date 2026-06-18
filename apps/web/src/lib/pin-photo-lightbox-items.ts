import type { Photo } from "@/types/database";
import { commonsProductUrl } from "@curolia/plugin-commons";
import { flickrProductUrl } from "@curolia/plugin-flickr";
import { googlePhotosProductUrl } from "@curolia/plugin-google-photos";

export type PinPhotoLightboxItem = {
  id: string;
  url: string;
  originalProductUrl?: string;
  originalProductLabel?: string;
};

/** Deep link to the photo in its source product (Google Photos, Flickr, etc.). */
export function photoOriginalProductUrl(
  ref: Record<string, unknown> | null,
  sourcePluginId: string | null,
): string | undefined {
  if (!ref || !sourcePluginId) return undefined;

  if (sourcePluginId === "google_photos") {
    return googlePhotosProductUrl(ref);
  }

  if (sourcePluginId === "flickr") {
    return flickrProductUrl(ref);
  }

  if (sourcePluginId === "commons") {
    return commonsProductUrl(ref);
  }

  const explicit = ref.productUrl;
  return typeof explicit === "string" && explicit.length > 0
    ? explicit
    : undefined;
}

function photoOriginalProductLabel(
  sourcePluginId: string | null,
): string | undefined {
  if (sourcePluginId === "google_photos") return "Google Photos";
  if (sourcePluginId === "flickr") return "Flickr";
  if (sourcePluginId === "commons") return "Wikimedia Commons";
  return undefined;
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
      const originalProductLabel = originalProductUrl
        ? photoOriginalProductLabel(p.source_plugin_id)
        : undefined;
      out.push({
        id: p.id,
        url,
        ...(originalProductUrl ? { originalProductUrl } : {}),
        ...(originalProductLabel ? { originalProductLabel } : {}),
      });
    }
  }
  return out;
}
