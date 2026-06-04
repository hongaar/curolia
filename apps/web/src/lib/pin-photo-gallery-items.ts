import type { Photo } from "@/types/database";
import type { PinPhotoGalleryItem } from "@curolia/ui/pin-photo-gallery";

export function photosToGalleryItems(
  photos: Photo[],
  signedUrlByPhotoId: Record<string, string>,
): PinPhotoGalleryItem[] {
  const out: PinPhotoGalleryItem[] = [];
  for (const p of photos) {
    const url = signedUrlByPhotoId[p.id];
    if (!url) continue;
    out.push({
      id: p.id,
      url,
      ...(p.width != null && p.height != null
        ? { width: p.width, height: p.height }
        : {}),
    });
  }
  return out;
}

export function pinPhotoGalleryPlaceholderCount(
  photos: Photo[],
  galleryItems: PinPhotoGalleryItem[],
  loading: boolean,
): number {
  if (!loading || photos.length === 0) return 0;
  return Math.max(0, photos.length - galleryItems.length);
}
