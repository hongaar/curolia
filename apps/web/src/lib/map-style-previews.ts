import type { MapStylePreset } from "@/lib/map-style";

/** Public URLs for map style preview thumbnails (replace files under `apps/web/public/map-style-previews/`). */
export const MAP_STYLE_PREVIEW_SRC: Record<MapStylePreset, string> = {
  auto: "/map-style-previews/auto.png",
  street: "/map-style-previews/street.png",
  satellite: "/map-style-previews/satellite.png",
};
