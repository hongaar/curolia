import type { PinMetadataRow } from "@curolia/plugin-contract";
import type { QueryClient } from "@tanstack/react-query";
import { OSM_POI_PLUGIN_ID } from "./config";
import type { OsmPoiPinPayload } from "./osm-poi-pin-data";
import { pinMetadataQueryKey } from "./query-keys";

/** True when OSM metadata rows were written at or after the linked POI payload. */
export function osmMetadataIsFreshForPayload(
  payload: OsmPoiPinPayload,
  rows: PinMetadataRow[],
): boolean {
  if (payload.noPoi || rows.length === 0) return false;
  const payloadMs = new Date(payload.fetchedAt).getTime();
  if (!Number.isFinite(payloadMs)) return false;
  const latestMs = Math.max(
    ...rows.map((row) => new Date(row.updated_at).getTime()),
  );
  if (!Number.isFinite(latestMs)) return false;
  return latestMs >= payloadMs - 2000;
}

/** Drop cached OSM metadata so pin details stay on the loading state until fresh rows arrive. */
export function resetOsmPinMetadataCaches(
  qc: QueryClient,
  pinId: string,
): void {
  qc.setQueryData([...pinMetadataQueryKey(pinId), OSM_POI_PLUGIN_ID], []);
  qc.setQueryData(
    pinMetadataQueryKey(pinId),
    (old: PinMetadataRow[] | undefined) =>
      (old ?? []).filter((row) => row.source_plugin_id !== OSM_POI_PLUGIN_ID),
  );
}
