import type { Map as MaplibreMap } from "maplibre-gl";

/**
 * Placeholder for future POI explore layers on the map.
 * No-op until category data and rendering are implemented.
 */
export function syncExploreLayer(
  map: MaplibreMap,
  activeCategories: readonly string[],
): void {
  void map;
  void activeCategories;
}
