export const OSM_POI_PLUGIN_ID = "osm-poi" as const;

export type OsmPoiTagFamily = "food" | "accessibility" | "outdoor";

export type OsmPoiTagFamilies = Record<OsmPoiTagFamily, boolean>;

/** Per-map OpenStreetMap POI row in `map_plugins`. */
export type OsmPoiMapPluginRow = {
  enabled?: boolean;
  tagFamilies?: Partial<OsmPoiTagFamilies>;
};

const DEFAULT_TAG_FAMILIES: OsmPoiTagFamilies = {
  food: true,
  accessibility: true,
  outdoor: true,
};

export function resolveOsmPoiTagFamilies(
  jp: OsmPoiMapPluginRow | undefined | null,
): OsmPoiTagFamilies {
  const raw = jp?.tagFamilies;
  if (!raw || typeof raw !== "object") return { ...DEFAULT_TAG_FAMILIES };
  return {
    food: raw.food !== false,
    accessibility: raw.accessibility !== false,
    outdoor: raw.outdoor !== false,
  };
}

/** OSM POI enrichment is on only when explicitly enabled on `map_plugins`. */
export function isOsmPoiEnabledForMap(
  jp: OsmPoiMapPluginRow | undefined | null,
): boolean {
  return jp?.enabled === true;
}
