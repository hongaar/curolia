import { exploreCategoryById } from "@/lib/explore-categories";
import { perfCount } from "@/lib/perf-probe";
import { isMapStyleReady } from "@/lib/pin-map-route-layers";
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

export const EMPTY_EXPLORE_LAYER: ExploreLayerSyncInput = {
  entries: [],
  selectedEntryId: null,
};

const lastAppliedFingerprintByMap = new WeakMap<MaplibreMap, string>();

export function exploreLayerFingerprint(input: ExploreLayerSyncInput): string {
  const selected = input.selectedEntryId ?? "";
  if (input.entries.length === 0) return `empty:${selected}`;
  return `${selected}|${input.entries
    .map((entry) => {
      switch (entry.featureKind) {
        case "place":
          return `p:${entry.id}:${entry.geometry.lng},${entry.geometry.lat}:${entry.categoryId}`;
        case "route": {
          const coords = entry.geometry.coordinates;
          const last = coords[coords.length - 1];
          return `r:${entry.id}:${coords.length}:${last?.[0]},${last?.[1]}`;
        }
        case "cluster":
          return `c:${entry.id}:${entry.count}:${entry.geometry.lng},${entry.geometry.lat}`;
      }
    })
    .join(";")}`;
}

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

function hasExploreSources(map: MaplibreMap): boolean {
  return Boolean(map.getSource(EXPLORE_POI_SOURCE_ID));
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
  lastAppliedFingerprintByMap.delete(map);
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
  if (!isMapStyleReady(map)) return;

  const empty = input.entries.length === 0;
  const hasLayers = hasExploreSources(map);
  if (empty) {
    if (!hasLayers) return;
    removeExploreLayers(map);
    perfCount("exploreLayerSync");
    return;
  }

  const fingerprint = exploreLayerFingerprint(input);
  if (hasLayers && lastAppliedFingerprintByMap.get(map) === fingerprint) {
    return;
  }

  upsertExploreLayers(
    map,
    poiGeoJson([...input.entries], input.selectedEntryId),
    routeGeoJson([...input.entries], input.selectedEntryId),
    clusterGeoJson([...input.entries]),
  );
  ensureExploreLayerHoverListeners(map);
  lastAppliedFingerprintByMap.set(map, fingerprint);
  perfCount("exploreLayerSync");
}

export const EXPLORE_INTERACTIVE_LAYER_IDS = [
  EXPLORE_POI_LAYER_ID,
  EXPLORE_ROUTE_LAYER_ID,
  EXPLORE_CLUSTER_LAYER_ID,
] as const;
