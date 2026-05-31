/**
 * Best-effort link to open a picked photo in Google Photos.
 *
 * The Picker API does not expose `productUrl`. The Library API only returns
 * `productUrl` for app-created media (not user library picks) since 2025.
 * When we only have a picker `mediaItemId`, use Google's lr/photo redirect.
 */
export function googlePhotosProductUrl(
  ref: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!ref) return undefined;

  const explicit = ref.productUrl;
  if (typeof explicit === "string" && explicit.length > 0) return explicit;

  const mediaItemId = ref.mediaItemId;
  if (typeof mediaItemId !== "string" || mediaItemId.length === 0) {
    return undefined;
  }

  return `https://photos.google.com/lr/photo/${encodeURIComponent(mediaItemId)}`;
}
