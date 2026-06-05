export const OSM_POI_PLUGIN_ID = "osm-poi" as const;

/** Per-map OpenStreetMap POI row in `map_plugins`. */
export type OsmPoiMapPluginRow = {
  enabled?: boolean;
};

/** OSM POI enrichment is on only when explicitly enabled on `map_plugins`. */
export function isOsmPoiEnabledForMap(
  jp: OsmPoiMapPluginRow | undefined | null,
): boolean {
  return jp?.enabled === true;
}
