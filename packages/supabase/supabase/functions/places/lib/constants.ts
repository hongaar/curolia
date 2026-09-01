/** OSM explore category → Overpass filter fragment. */
export const EXPLORE_CATEGORY_OSM_FILTERS: Record<string, string> = {
  "poi:coffee": '["amenity"="cafe"]',
  "poi:restaurants": '["amenity"~"restaurant|fast_food"]',
  "poi:hotels": '["tourism"~"hotel|motel|guest_house|hostel"]',
  "poi:shops": '["shop"]',
  "poi:parks": '["leisure"="park"]',
  "poi:fuel": '["amenity"="fuel"]',
};

export const EXPLORE_CATEGORY_LABELS: Record<string, string> = {
  "poi:coffee": "Café",
  "poi:restaurants": "Restaurant",
  "poi:hotels": "Hotel",
  "poi:shops": "Shop",
  "poi:parks": "Park",
  "poi:fuel": "Fuel",
};

export const ZOOM_LIVE = 13;
export const ZOOM_DATASET = 9;
export const DATASET_LIMIT = 60;
export const LIVE_LIMIT = 80;
export const CLUSTER_LIMIT = 40;
export const CLUSTER_CELL_DEG = 0.75;
export const MAX_TILES_UPSTREAM_PER_REQUEST = 2;
export const OVERPASS_TILE_TIMEOUT_MS = 20_000;
export const UPSTREAM_INLINE_BUDGET_MS = 9_000;

export type ExploreBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export const ENRICHMENT_PLUGINS = ["wikidata", "commons"] as const;
