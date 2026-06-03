/** Shape stored in `plugin_entity_data.data` for `plugin_type_id = spotify`, `entity_type = pin`. */

export type SpotifyPinItemKind = "track" | "playlist";

export type SpotifyPinItem = {
  kind: SpotifyPinItemKind;
  spotifyId: string;
  title: string;
  /** Artists for tracks; short description for playlists (e.g. track count). */
  subtitle: string | null;
  openUrl: string;
  imageUrl: string | null;
  addedAt: string;
};

export type SpotifyPinPayload = {
  schemaVersion: 2;
  items: SpotifyPinItem[];
};

export function spotifyItemKey(
  item: Pick<SpotifyPinItem, "kind" | "spotifyId">,
) {
  return `${item.kind}:${item.spotifyId}`;
}

export function parseSpotifyPinPayload(raw: unknown): SpotifyPinPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 2) return null;
  if (!Array.isArray(o.items)) return null;
  const items = o.items.filter(isSpotifyPinItem).slice(0, 1);
  return { schemaVersion: 2, items };
}

/** At most one track or playlist per pin. */
export function getSpotifyPinItem(
  payload: SpotifyPinPayload,
): SpotifyPinItem | null {
  return payload.items[0] ?? null;
}

function isSpotifyPinItem(raw: unknown): raw is SpotifyPinItem {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return (
    (o.kind === "track" || o.kind === "playlist") &&
    typeof o.spotifyId === "string" &&
    o.spotifyId.length > 0 &&
    typeof o.title === "string" &&
    o.title.length > 0 &&
    typeof o.openUrl === "string" &&
    o.openUrl.length > 0 &&
    (o.subtitle === null || typeof o.subtitle === "string") &&
    (o.imageUrl === null || typeof o.imageUrl === "string") &&
    typeof o.addedAt === "string"
  );
}

export function emptySpotifyPinPayload(): SpotifyPinPayload {
  return { schemaVersion: 2, items: [] };
}
