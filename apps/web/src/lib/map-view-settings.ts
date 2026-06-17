import type { MapViewSegment } from "@/lib/app-paths";
import type { CuroliaMap } from "@/types/database";

export const MAP_VIEW_SEGMENTS: readonly MapViewSegment[] = [
  "map",
  "blog",
  "gallery",
] as const;

export type EnabledMapViews = Record<MapViewSegment, boolean>;

export type MapViewSettings = {
  defaultView: MapViewSegment;
  enabled: EnabledMapViews;
};

export const DEFAULT_ENABLED_MAP_VIEWS: EnabledMapViews = {
  map: true,
  blog: true,
  gallery: true,
};

export const DEFAULT_MAP_VIEW_SETTINGS: MapViewSettings = {
  defaultView: "map",
  enabled: DEFAULT_ENABLED_MAP_VIEWS,
};

function isMapViewSegment(value: string): value is MapViewSegment {
  return MAP_VIEW_SEGMENTS.includes(value as MapViewSegment);
}

export function parseEnabledMapViews(value: unknown): EnabledMapViews {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_ENABLED_MAP_VIEWS };
  }
  const record = value as Record<string, unknown>;
  return {
    map: record.map === false ? false : true,
    blog: record.blog === false ? false : true,
    gallery: record.gallery === false ? false : true,
  };
}

export function enabledMapViewsForSave(
  enabled: EnabledMapViews,
): CuroliaMap["enabled_map_views"] {
  return {
    map: enabled.map,
    blog: enabled.blog,
    gallery: enabled.gallery,
  };
}

export function firstEnabledMapView(settings: MapViewSettings): MapViewSegment {
  for (const view of MAP_VIEW_SEGMENTS) {
    if (settings.enabled[view]) return view;
  }
  return "map";
}

export function normalizeMapViewSettings(
  map:
    | Partial<Pick<CuroliaMap, "default_map_view" | "enabled_map_views">>
    | null
    | undefined,
): MapViewSettings {
  const enabled = parseEnabledMapViews(map?.enabled_map_views);
  const rawDefault = map?.default_map_view ?? "";
  let defaultView: MapViewSegment = isMapViewSegment(rawDefault)
    ? rawDefault
    : DEFAULT_MAP_VIEW_SETTINGS.defaultView;
  if (!enabled[defaultView]) {
    defaultView = firstEnabledMapView({ defaultView: "map", enabled });
  }
  return { defaultView, enabled };
}

export function countEnabledMapViews(enabled: EnabledMapViews): number {
  return MAP_VIEW_SEGMENTS.filter((view) => enabled[view]).length;
}

export function isMapViewEnabled(
  settings: MapViewSettings,
  view: MapViewSegment,
): boolean {
  return settings.enabled[view];
}

export function resolveAccessibleMapView(
  settings: MapViewSettings,
  requested: MapViewSegment,
): MapViewSegment {
  if (settings.enabled[requested]) return requested;
  return settings.defaultView;
}

export function setDefaultMapView(
  settings: MapViewSettings,
  view: MapViewSegment,
): MapViewSettings {
  return {
    defaultView: view,
    enabled: { ...settings.enabled, [view]: true },
  };
}

export function toggleMapViewEnabled(
  settings: MapViewSettings,
  view: MapViewSegment,
  enabled: boolean,
): MapViewSettings {
  if (enabled) {
    return {
      ...settings,
      enabled: { ...settings.enabled, [view]: true },
    };
  }
  if (!settings.enabled[view]) return settings;
  if (countEnabledMapViews(settings.enabled) <= 1) return settings;

  const nextEnabled = { ...settings.enabled, [view]: false };
  const nextDefault =
    settings.defaultView === view
      ? firstEnabledMapView({ ...settings, enabled: nextEnabled })
      : settings.defaultView;
  return { defaultView: nextDefault, enabled: nextEnabled };
}

export function mapViewSettingsDirty(
  map: Partial<Pick<CuroliaMap, "default_map_view" | "enabled_map_views">>,
  next: MapViewSettings,
): boolean {
  const saved = normalizeMapViewSettings(map);
  return (
    saved.defaultView !== next.defaultView ||
    MAP_VIEW_SEGMENTS.some((view) => saved.enabled[view] !== next.enabled[view])
  );
}
