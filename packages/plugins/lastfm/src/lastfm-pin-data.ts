/** Shape stored in `plugin_entity_data.data` for `plugin_type_id = lastfm`, `entity_type = pin`. */
export type LastfmPinPayload = {
  schemaVersion: 1;
  periodStart: string | null;
  periodEnd: string | null;
  syncedAt: string;
  limitedByPagination: boolean;
  scannedPages: number;
  playsInRange: number;
  tracks: LastfmPinTrackRow[];
};

export type LastfmPinTrackRow = {
  /** Stable id for UI keys — Last.fm track URL. */
  trackId: string;
  title: string;
  openUrl: string;
  playCount: number;
};

export function parseLastfmPinPayload(raw: unknown): LastfmPinPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 1) return null;
  if (!Array.isArray(o.tracks)) return null;
  return raw as LastfmPinPayload;
}
