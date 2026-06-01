/** Shape stored in `plugin_entity_data.data` for `plugin_type_id = spotify`, `entity_type = pin`. */
export type SpotifyPinPayload = {
  schemaVersion: 1;
  /** Pin period used for this snapshot (YYYY-MM-DD). */
  periodStart: string | null;
  periodEnd: string | null;
  syncedAt: string;
  limitedByPagination: boolean;
  scannedPages: number;
  playsInRange: number;
  tracks: SpotifyPinTrackRow[];
};

export type SpotifyPinTrackRow = {
  trackId: string;
  title: string;
  openUrl: string;
  playCount: number;
};

export function parseSpotifyPinPayload(raw: unknown): SpotifyPinPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 1) return null;
  if (!Array.isArray(o.tracks)) return null;
  return raw as SpotifyPinPayload;
}
