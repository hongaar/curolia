import type { StyleSpecification } from "maplibre-gl";

export type MapStylePreset = "auto" | "street" | "satellite";

export const MAP_STYLE_STREET_URL =
  "https://tiles.openfreemap.org/styles/liberty";
const MAP_STYLE_LIGHT_URL = "https://tiles.openfreemap.org/styles/positron";
const MAP_STYLE_DARK_URL = "https://tiles.openfreemap.org/styles/dark";

const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export const MAP_STYLE_SATELLITE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [SATELLITE_TILE_URL],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© Esri",
    },
  },
  layers: [{ id: "satellite", type: "raster", source: "satellite" }],
};

export function normalizeMapStylePreset(
  value: string | null | undefined,
): MapStylePreset {
  if (value === "street" || value === "satellite") return value;
  return "auto";
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
export function mapStyleCacheKey(
  preset: MapStylePreset,
  resolvedTheme: string | undefined,
): string {
  if (preset === "auto") {
    return `auto:${resolvedTheme === "dark" ? "dark" : "light"}`;
  }
  return preset;
}

export function resolveMapStyle(
  preset: MapStylePreset,
  resolvedTheme: string | undefined,
): string | StyleSpecification {
  switch (preset) {
    case "street":
      return MAP_STYLE_STREET_URL;
    case "satellite":
      return MAP_STYLE_SATELLITE;
    case "auto":
    default:
      return mapStyleUrlForTheme(resolvedTheme);
  }
}
