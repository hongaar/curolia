/** Best-effort link to open a Flickr photo on flickr.com. */
export function flickrProductUrl(
  ref: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!ref) return undefined;

  const explicit = ref.productUrl;
  if (typeof explicit === "string" && explicit.length > 0) return explicit;

  const photoId = ref.photoId;
  if (typeof photoId !== "string" || photoId.length === 0) return undefined;

  const pathAlias = ref.pathAlias;
  if (typeof pathAlias === "string" && pathAlias.length > 0) {
    return `https://www.flickr.com/photos/${encodeURIComponent(pathAlias)}/${encodeURIComponent(photoId)}`;
  }

  const owner = ref.owner;
  if (typeof owner === "string" && owner.length > 0) {
    return `https://www.flickr.com/photos/${encodeURIComponent(owner)}/${encodeURIComponent(photoId)}`;
  }

  return undefined;
}
