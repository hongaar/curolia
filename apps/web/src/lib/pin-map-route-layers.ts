import {
  animatedRouteLineGradient,
  pinRouteColor,
  staticRouteLineGradient,
} from "@/lib/pin-map-route-colors";
import {
  orderedPinTravelSequence,
  pinSequenceTagColor,
} from "@/lib/pin-sequence";
import type { PinWithTags } from "@/lib/pin-with-tags";
import type { GeoJSONSource, Map as MaplibreMap } from "maplibre-gl";

export const PIN_ROUTE_SOURCE_ID = "curolia-pin-route";
const PIN_ROUTE_LAYER_PREFIX = "curolia-pin-route-seg-";

export type PinRouteSegment = {
  fromId: string;
  toId: string;
  coordinates: [number, number][];
  colorFrom: string;
  colorTo: string;
};

export function buildPinRouteSegments(pins: PinWithTags[]): PinRouteSegment[] {
  const sequence = orderedPinTravelSequence(pins);
  const segments: PinRouteSegment[] = [];
  for (let i = 0; i < sequence.length - 1; i += 1) {
    const from = sequence[i]!;
    const to = sequence[i + 1]!;
    segments.push({
      fromId: from.id,
      toId: to.id,
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
      colorFrom: pinRouteColor(pinSequenceTagColor(from)),
      colorTo: pinRouteColor(pinSequenceTagColor(to)),
    });
  }
  return segments;
}

function segmentsGeoJson(
  segments: PinRouteSegment[],
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: segments.map((segment, index) => ({
      type: "Feature",
      id: index,
      properties: {
        segmentIndex: index,
        fromId: segment.fromId,
        toId: segment.toId,
        colorFrom: segment.colorFrom,
        colorTo: segment.colorTo,
      },
      geometry: {
        type: "LineString",
        coordinates: segment.coordinates,
      },
    })),
  };
}

function routeLayerInsertBefore(map: MaplibreMap): string | undefined {
  const layers = map.getStyle()?.layers;
  if (!layers) return undefined;
  const symbol = layers.find((layer) => layer.type === "symbol");
  return symbol?.id;
}

function isMapStyleReady(map: MaplibreMap): boolean {
  return map.isStyleLoaded() === true && map.getStyle() != null;
}

function ensureGeoJsonSource(
  map: MaplibreMap,
  sourceId: string,
  data: GeoJSON.FeatureCollection,
): void {
  const existing = map.getSource(sourceId) as GeoJSONSource | undefined;
  if (existing) {
    existing.setData(data);
    return;
  }
  map.addSource(sourceId, {
    type: "geojson",
    data,
    lineMetrics: true,
  });
}

function segmentLayerIds(prefix: string, map: MaplibreMap): string[] {
  return (map.getStyle()?.layers ?? [])
    .map((layer) => layer.id)
    .filter((id) => id.startsWith(prefix));
}

function removeSegmentLayers(map: MaplibreMap, prefix: string): void {
  for (const layerId of segmentLayerIds(prefix, map)) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  }
}

function removeRouteLayers(map: MaplibreMap): void {
  removeSegmentLayers(map, PIN_ROUTE_LAYER_PREFIX);
  if (map.getSource(PIN_ROUTE_SOURCE_ID)) {
    map.removeSource(PIN_ROUTE_SOURCE_ID);
  }
}

function ensureSegmentLayer(
  map: MaplibreMap,
  layerId: string,
  segmentIndex: number,
  paint: Record<string, unknown>,
): void {
  if (map.getLayer(layerId)) return;
  map.addLayer(
    {
      id: layerId,
      type: "line",
      source: PIN_ROUTE_SOURCE_ID,
      filter: ["==", ["get", "segmentIndex"], segmentIndex],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint,
    },
    routeLayerInsertBefore(map),
  );
}

function segmentInvolvesPin(
  segment: PinRouteSegment,
  pinId: string | null,
): boolean {
  return Boolean(pinId && (segment.fromId === pinId || segment.toId === pinId));
}

function paintForSegment(
  segment: PinRouteSegment,
  selectedPinId: string | null,
  animationPhase: number | undefined,
  darkBasemap: boolean,
): Record<string, unknown> {
  const gradientOptions = { darkBasemap };
  const selected = segmentInvolvesPin(segment, selectedPinId);
  if (selected && animationPhase != null) {
    return {
      "line-gradient": animatedRouteLineGradient(
        segment.colorFrom,
        segment.colorTo,
        animationPhase,
        gradientOptions,
      ),
      "line-width": darkBasemap ? 5 : 4.5,
      "line-opacity": 1,
    };
  }

  return {
    "line-gradient": staticRouteLineGradient(
      segment.colorFrom,
      segment.colorTo,
      gradientOptions,
    ),
    "line-width": darkBasemap ? 3.5 : 3,
    "line-opacity": darkBasemap ? 1 : 0.88,
  };
}

function applySegmentPaint(
  map: MaplibreMap,
  layerId: string,
  paint: Record<string, unknown>,
): void {
  if (!map.getLayer(layerId)) return;
  for (const [key, value] of Object.entries(paint)) {
    map.setPaintProperty(layerId, key, value);
  }
}

function syncSegmentLayers(
  map: MaplibreMap,
  segments: PinRouteSegment[],
  selectedPinId: string | null,
  animationPhase: number | undefined,
  darkBasemap: boolean,
): void {
  const wanted = segments.map(
    (_, index) => `${PIN_ROUTE_LAYER_PREFIX}${index}`,
  );
  const existing = segmentLayerIds(PIN_ROUTE_LAYER_PREFIX, map);
  for (const layerId of existing) {
    if (!wanted.includes(layerId) && map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  }

  segments.forEach((segment, index) => {
    const layerId = `${PIN_ROUTE_LAYER_PREFIX}${index}`;
    const paint = paintForSegment(
      segment,
      selectedPinId,
      animationPhase,
      darkBasemap,
    );
    ensureSegmentLayer(map, layerId, index, paint);
    applySegmentPaint(map, layerId, paint);
  });
}

export type PinRouteSyncOptions = {
  show: boolean;
  segments: PinRouteSegment[];
  selectedPinId: string | null;
  animationPhase?: number;
  darkBasemap?: boolean;
};

export function syncPinRouteLayers(
  map: MaplibreMap,
  options: PinRouteSyncOptions,
): boolean {
  if (!isMapStyleReady(map)) return false;

  if (!options.show || options.segments.length === 0) {
    removeRouteLayers(map);
    return true;
  }

  ensureGeoJsonSource(
    map,
    PIN_ROUTE_SOURCE_ID,
    segmentsGeoJson(options.segments),
  );
  syncSegmentLayers(
    map,
    options.segments,
    options.selectedPinId,
    options.selectedPinId != null ? options.animationPhase : undefined,
    options.darkBasemap === true,
  );
  map.triggerRepaint();
  return true;
}

/** Retry route sync until the style is ready (e.g. after setStyle or while covered). */
export function schedulePinRouteSync(
  map: MaplibreMap,
  getOptions: () => PinRouteSyncOptions,
): void {
  const trySync = (): boolean => syncPinRouteLayers(map, getOptions());

  if (trySync()) return;

  let finished = false;
  const retry = () => {
    if (finished) return;
    if (trySync()) finish();
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    map.off("style.load", retry);
    map.off("load", retry);
    map.off("idle", retry);
    window.clearTimeout(shortDelay);
    window.clearTimeout(longDelay);
  };

  map.on("style.load", retry);
  map.on("load", retry);
  map.on("idle", retry);
  requestAnimationFrame(retry);
  requestAnimationFrame(() => requestAnimationFrame(retry));
  const shortDelay = window.setTimeout(retry, 50);
  const longDelay = window.setTimeout(() => {
    retry();
    finish();
  }, 1_000);
}

export function updatePinRouteAnimation(
  map: MaplibreMap,
  segments: PinRouteSegment[],
  selectedPinId: string,
  animationPhase: number,
  darkBasemap = false,
): void {
  if (!isMapStyleReady(map)) return;

  let updated = false;
  segments.forEach((segment, index) => {
    if (!segmentInvolvesPin(segment, selectedPinId)) return;

    const layerId = `${PIN_ROUTE_LAYER_PREFIX}${index}`;
    const paint = paintForSegment(
      segment,
      selectedPinId,
      animationPhase,
      darkBasemap,
    );
    if (!map.getLayer(layerId)) return;
    applySegmentPaint(map, layerId, paint);
    updated = true;
  });

  if (updated) map.triggerRepaint();
}
