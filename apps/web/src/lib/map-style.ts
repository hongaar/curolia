import type { Map as MaplibreMap, StyleSpecification } from "maplibre-gl";

import {
  buildSatelliteLabelLayers,
  OPENFREEMAP_GLYPHS,
  OPENFREEMAP_VECTOR_SOURCE,
} from "./satellite-label-layers";

export type MapStylePreset = "auto" | "street" | "satellite";

export const MAP_STYLE_PRESET_LABELS: Record<
  MapStylePreset,
  { label: string; description: string }
> = {
  auto: { label: "Minimal", description: "Light or dark" },
  street: { label: "Street", description: "Detailed streets" },
  satellite: { label: "Satellite", description: "Aerial imagery" },
};

export const DEFAULT_MAP_STYLE_PRESET: MapStylePreset = "street";

export type MapStyleOptions = {
  hillshades: boolean;
  satelliteLabels: boolean;
};

export const DEFAULT_MAP_STYLE_OPTIONS: MapStyleOptions = {
  hillshades: false,
  satelliteLabels: false,
};

export const MAP_STYLE_STREET_URL =
  "https://tiles.openfreemap.org/styles/liberty";
const MAP_STYLE_LIGHT_URL = "https://tiles.openfreemap.org/styles/positron";
const MAP_STYLE_DARK_URL = "https://tiles.openfreemap.org/styles/dark";

const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export const HILLSHADE_SOURCE_ID = "curolia-hillshade-dem";
export const HILLSHADE_LAYER_ID = "curolia-hillshade";
/** Global Terrarium DEM (Mapterhorn); see https://mapterhorn.com/ */
const HILLSHADE_DEM_TILES = ["https://tiles.mapterhorn.com/{z}/{x}/{y}.webp"];

export function buildSatelliteStyle(labels: boolean): StyleSpecification {
  const sources: StyleSpecification["sources"] = {
    satellite: {
      type: "raster",
      tiles: [SATELLITE_TILE_URL],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© Esri",
    },
  };
  const layers: StyleSpecification["layers"] = [
    { id: "satellite", type: "raster", source: "satellite" },
  ];

  if (labels) {
    sources.openmaptiles = OPENFREEMAP_VECTOR_SOURCE;
    layers.push(...buildSatelliteLabelLayers());
  }

  return {
    version: 8,
    ...(labels ? { glyphs: OPENFREEMAP_GLYPHS } : {}),
    sources,
    layers,
  };
}

export function normalizeMapStylePreset(
  value: string | null | undefined,
): MapStylePreset {
  if (value === "street" || value === "satellite") return value;
  return "auto";
}

export function normalizeMapStyleOptions(
  row:
    | Partial<{
        style_hillshades: boolean | null;
        style_satellite_labels: boolean | null;
      }>
    | null
    | undefined,
): MapStyleOptions {
  return {
    hillshades: row?.style_hillshades === true,
    satelliteLabels: row?.style_satellite_labels === true,
  };
}

function mapStyleUrlForTheme(resolvedTheme: string | undefined): string {
  if (resolvedTheme === "dark") return MAP_STYLE_DARK_URL;
  if (resolvedTheme === "light") return MAP_STYLE_LIGHT_URL;
  if (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  ) {
    return MAP_STYLE_DARK_URL;
  }
  return MAP_STYLE_LIGHT_URL;
}

/** Stable key for comparing whether the basemap needs to change. */
/** Satellite imagery and auto-in-dark use a dark basemap; route lines need brighter paint. */
export function isDarkBasemap(
  preset: MapStylePreset,
  resolvedTheme: string | undefined,
): boolean {
  if (preset === "satellite") return true;
  if (preset === "street") return false;
  if (resolvedTheme === "dark") return true;
  if (resolvedTheme === "light") return false;
  if (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  ) {
    return true;
  }
  return false;
}

export function mapStyleCacheKey(
  preset: MapStylePreset,
  resolvedTheme: string | undefined,
  options: MapStyleOptions = DEFAULT_MAP_STYLE_OPTIONS,
): string {
  if (preset === "auto") {
    return `auto:${resolvedTheme === "dark" ? "dark" : "light"}`;
  }
  if (preset === "street") {
    return `street:${options.hillshades ? "hill" : "flat"}`;
  }
  if (preset === "satellite") {
    return `satellite:${options.satelliteLabels ? "labels" : "plain"}`;
  }
  return preset;
}

export function resolveMapStyle(
  preset: MapStylePreset,
  resolvedTheme: string | undefined,
  options: MapStyleOptions = DEFAULT_MAP_STYLE_OPTIONS,
): string | StyleSpecification {
  switch (preset) {
    case "street":
      return MAP_STYLE_STREET_URL;
    case "satellite":
      return buildSatelliteStyle(options.satelliteLabels);
    case "auto":
    default:
      return mapStyleUrlForTheme(resolvedTheme);
  }
}

function hillshadeInsertBeforeLayerId(map: MaplibreMap): string | undefined {
  const layers = map.getStyle()?.layers;
  if (!layers) return undefined;
  const symbol = layers.find((layer) => layer.type === "symbol");
  return symbol?.id;
}

/** Toggle terrain hillshade overlay on vector basemaps (street / auto). */
export function applyStreetHillshades(
  map: MaplibreMap,
  enabled: boolean,
): void {
  const hasLayer = Boolean(map.getLayer(HILLSHADE_LAYER_ID));
  if (!enabled) {
    if (hasLayer) map.removeLayer(HILLSHADE_LAYER_ID);
    if (map.getSource(HILLSHADE_SOURCE_ID)) {
      map.removeSource(HILLSHADE_SOURCE_ID);
    }
    return;
  }
  if (!map.getSource(HILLSHADE_SOURCE_ID)) {
    map.addSource(HILLSHADE_SOURCE_ID, {
      type: "raster-dem",
      tiles: HILLSHADE_DEM_TILES,
      encoding: "terrarium",
      tileSize: 512,
      maxzoom: 12,
    });
  }
  if (!hasLayer) {
    map.addLayer(
      {
        id: HILLSHADE_LAYER_ID,
        type: "hillshade",
        source: HILLSHADE_SOURCE_ID,
        paint: {
          "hillshade-exaggeration": 0.35,
          "hillshade-shadow-color": "#473B24",
          "hillshade-highlight-color": "#FFFFFF",
        },
      },
      hillshadeInsertBeforeLayerId(map),
    );
  }
}

export function syncMapStyleOverlays(
  map: MaplibreMap,
  preset: MapStylePreset,
  options: MapStyleOptions,
): void {
  const hillshades = preset === "street" && options.hillshades;
  applyStreetHillshades(map, hillshades);
}
