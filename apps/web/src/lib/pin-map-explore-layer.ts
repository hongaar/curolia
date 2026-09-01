import { exploreCategoryById } from "@/lib/explore-categories";
import type { ExploreResultEntry } from "@curolia/plugin-contract";
import {
  isExploreClusterEntry,
  isExplorePlaceEntry,
  isExploreRouteEntry,
} from "@curolia/plugin-contract";
import type { GeoJSONSource, Map as MaplibreMap, PointLike } from "maplibre-gl";

export const EXPLORE_POI_SOURCE_ID = "curolia-explore-poi";
export const EXPLORE_ROUTE_SOURCE_ID = "curolia-explore-route";
export const EXPLORE_CLUSTER_SOURCE_ID = "curolia-explore-cluster";
const EXPLORE_POI_LAYER_ID = "curolia-explore-poi-circles";
const EXPLORE_ROUTE_LAYER_ID = "curolia-explore-route-lines";
const EXPLORE_CLUSTER_LAYER_ID = "curolia-explore-cluster-circles";
const EXPLORE_CLUSTER_LABEL_LAYER_ID = "curolia-explore-cluster-labels";

export type ExploreLayerSyncInput = {
  entries: readonly ExploreResultEntry[];
  selectedEntryId?: string | null;
};

function exploreColor(categoryId: string): string {
  return exploreCategoryById(categoryId)?.color ?? "#64748b";
}

function poiGeoJson(
  entries: ExploreResultEntry[],
  selectedEntryId: string | null | undefined,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: entries.filter(isExplorePlaceEntry).map((entry) => ({
      type: "Feature" as const,
      id: entry.id,
      properties: {
        entryId: entry.id,
        title: entry.title,
        color: exploreColor(entry.categoryId),
        selected: entry.id === selectedEntryId,
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
  selectedEntryId: string | null | undefined,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: entries.filter(isExploreRouteEntry).map((entry) => ({
      type: "Feature" as const,
      id: entry.id,
      properties: {
        entryId: entry.id,
        title: entry.title,
        color: exploreColor(entry.categoryId),
        selected: entry.id === selectedEntryId,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [...entry.geometry.coordinates],
      },
    })),
  };
}

function clusterGeoJson(
  entries: ExploreResultEntry[],
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: entries.filter(isExploreClusterEntry).map((entry) => ({
      type: "Feature" as const,
      id: entry.id,
      properties: {
        entryId: entry.id,
        count: entry.count,
        title: entry.title,
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

function removeExploreLayers(map: MaplibreMap): void {
  for (const layerId of [
    EXPLORE_CLUSTER_LABEL_LAYER_ID,
    EXPLORE_CLUSTER_LAYER_ID,
    EXPLORE_POI_LAYER_ID,
    EXPLORE_ROUTE_LAYER_ID,
  ]) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  }
  for (const sourceId of [
    EXPLORE_CLUSTER_SOURCE_ID,
    EXPLORE_POI_SOURCE_ID,
    EXPLORE_ROUTE_SOURCE_ID,
  ]) {
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }
}

function upsertExploreLayers(
  map: MaplibreMap,
  poiData: GeoJSON.FeatureCollection,
  routeData: GeoJSON.FeatureCollection,
  clusterData: GeoJSON.FeatureCollection,
): void {
  const upsertSource = (
    sourceId: string,
    data: GeoJSON.FeatureCollection,
  ): GeoJSONSource => {
    const existing = map.getSource(sourceId) as GeoJSONSource | undefined;
    if (existing) {
      existing.setData(data);
      return existing;
    }
    map.addSource(sourceId, { type: "geojson", data });
    return map.getSource(sourceId) as GeoJSONSource;
  };

  upsertSource(EXPLORE_POI_SOURCE_ID, poiData);
  if (!map.getLayer(EXPLORE_POI_LAYER_ID)) {
    map.addLayer({
      id: EXPLORE_POI_LAYER_ID,
      type: "circle",
      source: EXPLORE_POI_SOURCE_ID,
      paint: {
        "circle-radius": ["case", ["get", "selected"], 10, 7],
        "circle-color": ["get", "color"],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.92,
      },
    });
  }

  upsertSource(EXPLORE_ROUTE_SOURCE_ID, routeData);
  if (!map.getLayer(EXPLORE_ROUTE_LAYER_ID)) {
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
        "line-width": ["case", ["get", "selected"], 6, 4],
        "line-opacity": 0.85,
      },
    });
  }

  upsertSource(EXPLORE_CLUSTER_SOURCE_ID, clusterData);
  if (!map.getLayer(EXPLORE_CLUSTER_LAYER_ID)) {
    map.addLayer({
      id: EXPLORE_CLUSTER_LAYER_ID,
      type: "circle",
      source: EXPLORE_CLUSTER_SOURCE_ID,
      paint: {
        "circle-radius": 18,
        "circle-color": "#334155",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.88,
      },
    });
  }
  if (!map.getLayer(EXPLORE_CLUSTER_LABEL_LAYER_ID)) {
    map.addLayer({
      id: EXPLORE_CLUSTER_LABEL_LAYER_ID,
      type: "symbol",
      source: EXPLORE_CLUSTER_SOURCE_ID,
      layout: {
        "text-field": ["to-string", ["get", "count"]],
        "text-size": 12,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      },
      paint: {
        "text-color": "#ffffff",
      },
    });
  }
}

import { perfCount } from "@/lib/perf-probe";
import {
  isMapStyleReady,
  scheduleWhenMapStyleReady,
} from "@/lib/pin-map-route-layers";

const exploreClickHandlersByMap = new WeakMap<
  MaplibreMap,
  (entryId: string) => void
>();

export function attachExploreLayerClickHandler(
  map: MaplibreMap,
  onEntryClick: (entryId: string) => void,
): void {
  exploreClickHandlersByMap.set(map, onEntryClick);
}

function ensureExploreLayerHoverListeners(map: MaplibreMap): void {
  const markerKey = "__curoliaExploreHoverListeners" as const;
  type MapWithMarker = MaplibreMap & { [markerKey]?: boolean };
  const markedMap = map as MapWithMarker;
  if (markedMap[markerKey]) return;
  markedMap[markerKey] = true;

  const layerIds = [
    EXPLORE_POI_LAYER_ID,
    EXPLORE_ROUTE_LAYER_ID,
    EXPLORE_CLUSTER_LAYER_ID,
  ];

  for (const layerId of layerIds) {
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  }
}

export function pickExploreEntryAtPoint(
  map: MaplibreMap,
  point: PointLike,
): string | null {
  if (!map.isStyleLoaded()) return null;
  const layers = EXPLORE_INTERACTIVE_LAYER_IDS.filter((layerId) =>
    Boolean(map.getLayer(layerId)),
  );
  if (layers.length === 0) return null;
  const features = map.queryRenderedFeatures(point, { layers });
  const entryId = features[0]?.properties?.entryId;
  return typeof entryId === "string" ? entryId : null;
}

export function dispatchExploreEntryClick(
  map: MaplibreMap,
  entryId: string,
): void {
  exploreClickHandlersByMap.get(map)?.(entryId);
}

export function syncExploreLayer(
  map: MaplibreMap,
  input: ExploreLayerSyncInput,
): void {
  scheduleWhenMapStyleReady(map, () => {
    if (!isMapStyleReady(map)) return false;
    perfCount("exploreLayerSync");

    const { entries, selectedEntryId } = input;
    if (entries.length === 0) {
      removeExploreLayers(map);
      return true;
    }

    upsertExploreLayers(
      map,
      poiGeoJson([...entries], selectedEntryId),
      routeGeoJson([...entries], selectedEntryId),
      clusterGeoJson([...entries]),
    );
    ensureExploreLayerHoverListeners(map);
    return true;
  });
}

export const EXPLORE_INTERACTIVE_LAYER_IDS = [
  EXPLORE_POI_LAYER_ID,
  EXPLORE_ROUTE_LAYER_ID,
  EXPLORE_CLUSTER_LAYER_ID,
] as const;
