import type { ExploreCategoryId } from "@/lib/explore-categories";
import { exploreCategoryById } from "@/lib/explore-categories";
import { fetchExploreResultsForCategories } from "@/lib/explore-results";
import {
  isMapStyleReady,
  scheduleWhenMapStyleReady,
} from "@/lib/pin-map-route-layers";
import type {
  ExploreFilterValues,
  ExploreResultEntry,
} from "@curolia/plugin-contract";
import type { GeoJSONSource, Map as MaplibreMap } from "maplibre-gl";

export const EXPLORE_POI_SOURCE_ID = "curolia-explore-poi";
export const EXPLORE_ROUTE_SOURCE_ID = "curolia-explore-route";
const EXPLORE_POI_LAYER_ID = "curolia-explore-poi-circles";
const EXPLORE_ROUTE_LAYER_ID = "curolia-explore-route-lines";

export type ExploreLayerSyncInput = {
  activeCategories: readonly ExploreCategoryId[];
  filterValuesByCategory: Partial<
    Record<ExploreCategoryId, ExploreFilterValues>
  >;
};

function exploreColor(categoryId: string): string {
  return exploreCategoryById(categoryId)?.color ?? "#64748b";
}

function poiGeoJson(entries: ExploreResultEntry[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: entries
      .filter(
        (
          entry,
        ): entry is ExploreResultEntry & {
          geometry: { kind: "point"; lng: number; lat: number };
        } => entry.geometry.kind === "point",
      )
      .map((entry) => ({
        type: "Feature" as const,
        id: entry.id,
        properties: {
          title: entry.title,
          color: exploreColor(entry.categoryId),
        },
        geometry: {
          type: "Point" as const,
          coordinates: [entry.geometry.lng, entry.geometry.lat] as [
            number,
            number,
          ],
        },
      })),
  };
}

function routeGeoJson(
  entries: ExploreResultEntry[],
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: entries
      .filter(
        (
          entry,
        ): entry is ExploreResultEntry & {
          geometry: {
            kind: "line";
            coordinates: readonly [number, number][];
          };
        } => entry.geometry.kind === "line",
      )
      .map((entry) => ({
        type: "Feature" as const,
        id: entry.id,
        properties: {
          title: entry.title,
          color: exploreColor(entry.categoryId),
        },
        geometry: {
          type: "LineString" as const,
          coordinates: [...entry.geometry.coordinates],
        },
      })),
  };
}

function removeExploreLayers(map: MaplibreMap): void {
  for (const layerId of [EXPLORE_POI_LAYER_ID, EXPLORE_ROUTE_LAYER_ID]) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  }
  for (const sourceId of [EXPLORE_POI_SOURCE_ID, EXPLORE_ROUTE_SOURCE_ID]) {
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }
}

function upsertExploreLayers(
  map: MaplibreMap,
  poiData: GeoJSON.FeatureCollection,
  routeData: GeoJSON.FeatureCollection,
): void {
  const poiSource = map.getSource(EXPLORE_POI_SOURCE_ID) as
    | GeoJSONSource
    | undefined;
  if (poiSource) {
    poiSource.setData(poiData);
  } else {
    map.addSource(EXPLORE_POI_SOURCE_ID, { type: "geojson", data: poiData });
    map.addLayer({
      id: EXPLORE_POI_LAYER_ID,
      type: "circle",
      source: EXPLORE_POI_SOURCE_ID,
      paint: {
        "circle-radius": 7,
        "circle-color": ["get", "color"],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.92,
      },
    });
  }

  const routeSource = map.getSource(EXPLORE_ROUTE_SOURCE_ID) as
    | GeoJSONSource
    | undefined;
  if (routeSource) {
    routeSource.setData(routeData);
  } else {
    map.addSource(EXPLORE_ROUTE_SOURCE_ID, {
      type: "geojson",
      data: routeData,
    });
    map.addLayer({
      id: EXPLORE_ROUTE_LAYER_ID,
      type: "line",
      source: EXPLORE_ROUTE_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": ["get", "color"],
        "line-width": 4,
        "line-opacity": 0.85,
      },
    });
  }
}

import { perfCount } from "@/lib/perf-probe";

export function syncExploreLayer(
  map: MaplibreMap,
  input: ExploreLayerSyncInput,
): void {
  scheduleWhenMapStyleReady(map, () => {
    if (!isMapStyleReady(map)) return false;
    perfCount("exploreLayerSync");

    const { activeCategories, filterValuesByCategory } = input;
    if (activeCategories.length === 0) {
      removeExploreLayers(map);
      return true;
    }

    const center = map.getCenter();
    const entries = fetchExploreResultsForCategories(
      activeCategories,
      filterValuesByCategory,
      { lng: center.lng, lat: center.lat },
    );

    upsertExploreLayers(map, poiGeoJson(entries), routeGeoJson(entries));
    return true;
  });
}
