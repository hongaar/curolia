import type { MapBbox } from "@curolia/services/coords";
import type { GeoJSONSource, Map as MaplibreMap } from "maplibre-gl";

import {
  isMapStyleReady,
  scheduleWhenMapStyleReady,
} from "./pin-map-route-layers";

export const PLACE_HIGHLIGHT_SOURCE_ID = "curolia-place-highlight";
const PLACE_HIGHLIGHT_FILL_LAYER_ID = "curolia-place-highlight-fill";
const PLACE_HIGHLIGHT_LINE_LAYER_ID = "curolia-place-highlight-line";
const PLACE_HIGHLIGHT_COLOR = "#e8590c";

const EARTH_RADIUS_M = 6_371_008.8;
const DEFAULT_RADIUS_M = 350;
const MIN_RADIUS_M = 200;
const MAX_RADIUS_M = 80_000;

export type PlaceMapHighlight = {
  lng: number;
  lat: number;
  bbox?: MapBbox;
};

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function placeHighlightRadiusMeters(
  highlight: PlaceMapHighlight,
): number {
  const { bbox, lat, lng } = highlight;
  if (!bbox) return DEFAULT_RADIUS_M;

  const corners: [number, number][] = [
    [bbox.west, bbox.south],
    [bbox.east, bbox.south],
    [bbox.west, bbox.north],
    [bbox.east, bbox.north],
  ];
  const maxCorner = Math.max(
    ...corners.map(([cornerLng, cornerLat]) =>
      haversineMeters(lat, lng, cornerLat, cornerLng),
    ),
  );
  return Math.min(MAX_RADIUS_M, Math.max(MIN_RADIUS_M, maxCorner * 1.08));
}

/** Geographic bounds of the highlight circle — use for map fitBounds. */
export function placeHighlightFitBbox(highlight: PlaceMapHighlight): MapBbox {
  const radiusMeters = placeHighlightRadiusMeters(highlight);
  const ring = circlePolygon(highlight.lng, highlight.lat, radiusMeters)
    .coordinates[0]!;

  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const [lng, lat] of ring) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }

  return { west, south, east, north };
}

function circlePolygon(
  lng: number,
  lat: number,
  radiusMeters: number,
  points = 64,
): GeoJSON.Polygon {
  const ring: [number, number][] = [];
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const angularDistance = radiusMeters / EARTH_RADIUS_M;

  for (let i = 0; i <= points; i += 1) {
    const bearing = (i / points) * 2 * Math.PI;
    const sinLat =
      Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing);
    const lat2 = Math.asin(sinLat);
    const lng2 =
      lngRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
        Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(lat2),
      );
    ring.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }

  return { type: "Polygon", coordinates: [ring] };
}

function highlightGeoJson(
  highlight: PlaceMapHighlight,
): GeoJSON.FeatureCollection {
  const radiusMeters = placeHighlightRadiusMeters(highlight);
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: circlePolygon(highlight.lng, highlight.lat, radiusMeters),
      },
    ],
  };
}

function removePlaceHighlightLayers(map: MaplibreMap): void {
  for (const layerId of [
    PLACE_HIGHLIGHT_LINE_LAYER_ID,
    PLACE_HIGHLIGHT_FILL_LAYER_ID,
  ]) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  }
  if (map.getSource(PLACE_HIGHLIGHT_SOURCE_ID)) {
    map.removeSource(PLACE_HIGHLIGHT_SOURCE_ID);
  }
}

function upsertPlaceHighlightLayers(
  map: MaplibreMap,
  highlight: PlaceMapHighlight,
): void {
  const data = highlightGeoJson(highlight);
  const existing = map.getSource(PLACE_HIGHLIGHT_SOURCE_ID) as
    | GeoJSONSource
    | undefined;
  if (existing) {
    existing.setData(data);
  } else {
    map.addSource(PLACE_HIGHLIGHT_SOURCE_ID, {
      type: "geojson",
      data,
    });
    map.addLayer({
      id: PLACE_HIGHLIGHT_FILL_LAYER_ID,
      type: "fill",
      source: PLACE_HIGHLIGHT_SOURCE_ID,
      paint: {
        "fill-color": PLACE_HIGHLIGHT_COLOR,
        "fill-opacity": 0.14,
      },
    });
    map.addLayer({
      id: PLACE_HIGHLIGHT_LINE_LAYER_ID,
      type: "line",
      source: PLACE_HIGHLIGHT_SOURCE_ID,
      paint: {
        "line-color": PLACE_HIGHLIGHT_COLOR,
        "line-width": 2,
        "line-opacity": 0.72,
      },
    });
  }
}

export type PlaceHighlightReader = () => PlaceMapHighlight | null;

/** Always read highlight via `readHighlight` so delayed style-ready retries see the latest value. */
export function syncPlaceHighlightLayer(
  map: MaplibreMap,
  readHighlight: PlaceHighlightReader,
): void {
  scheduleWhenMapStyleReady(map, () => {
    if (!isMapStyleReady(map)) return false;
    const highlight = readHighlight();
    if (!highlight) {
      removePlaceHighlightLayers(map);
    } else {
      upsertPlaceHighlightLayers(map, highlight);
    }
    return true;
  });
}
