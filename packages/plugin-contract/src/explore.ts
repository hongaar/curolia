import type { PluginIconComponent } from "./definition";

/** Single- or multi-select filter definition for an explore category. */
export type ExploreFilterDef =
  | {
      id: string;
      label: string;
      kind: "single";
      options: readonly { id: string; label: string }[];
      defaultValue: string;
    }
  | {
      id: string;
      label: string;
      kind: "multi";
      options: readonly { id: string; label: string }[];
      defaultValue: readonly string[];
    }
  | {
      id: string;
      label: string;
      kind: "distance";
      /** Default max distance in meters. */
      defaultValue: number;
      minMeters: number;
      maxMeters: number;
      stepMeters: number;
    }
  | {
      id: string;
      label: string;
      /** Server-side ranking/sort toggle — not matched per entry. */
      kind: "ranking";
      options: readonly { id: string; label: string }[];
      defaultValue: string;
    };

export type ExploreFilterValues = Record<
  string,
  string | readonly string[] | number
>;

export type ExploreChipVariant = "poi" | "route";

export type ExploreBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type ExploreResultGeometry =
  | { kind: "point"; lng: number; lat: number }
  | { kind: "line"; coordinates: readonly [number, number][] };

export type ExploreResultPreview = {
  thumbnailUrl?: string;
  rating?: number;
  categoryLabel?: string;
};

export type ExplorePlaceDetail = {
  placeId: string;
  name: string;
  subtitle?: string;
  lat: number;
  lng: number;
  categories?: readonly string[];
  pinCount?: number;
  prominenceScore?: number;
  metadata?: Readonly<Record<string, unknown>>;
};

export type ExploreRouteDetail = {
  profile: string;
  distanceMeters: number;
  ascentMeters?: number;
  durationSeconds?: number;
  coordinates: readonly [number, number][];
};

export type ExploreClusterDetail = {
  count: number;
  zoomHint?: string;
};

type ExploreResultEntryBase = {
  id: string;
  categoryId: string;
  title: string;
  subtitle?: string;
  /** Distance from the map center in meters, when known. */
  distanceMeters?: number;
  filterValues: ExploreFilterValues;
};

export type ExplorePlaceResultEntry = ExploreResultEntryBase & {
  featureKind: "place";
  geometry: { kind: "point"; lng: number; lat: number };
  placeId?: string;
  preview?: ExploreResultPreview;
  detail?: ExplorePlaceDetail;
};

export type ExploreRouteResultEntry = ExploreResultEntryBase & {
  featureKind: "route";
  geometry: { kind: "line"; coordinates: readonly [number, number][] };
  detail?: ExploreRouteDetail;
};

export type ExploreClusterResultEntry = ExploreResultEntryBase & {
  featureKind: "cluster";
  geometry: { kind: "point"; lng: number; lat: number };
  count: number;
  detail?: ExploreClusterDetail;
};

export type ExploreResultEntry =
  | ExplorePlaceResultEntry
  | ExploreRouteResultEntry
  | ExploreClusterResultEntry;

export type ExploreHostServices = {
  fetchStaticPlaces: (
    input: ExploreStaticFetchInput,
  ) => Promise<ExploreResultEntry[]>;
  generateRoutes: (
    input: ExploreRouteGenerateInput,
  ) => Promise<ExploreResultEntry[]>;
  fetchPlaceDetail?: (placeId: string) => Promise<ExplorePlaceDetail | null>;
};

export type ExploreStaticFetchInput = {
  categoryId: string;
  bounds: ExploreBounds;
  zoom: number;
  mapCenter: { lng: number; lat: number } | null;
  filterValues: ExploreFilterValues;
  /** Progressive explore updates (page 1, then optional upstream pages). */
  onUpdate?: (entries: readonly ExploreResultEntry[]) => void;
  /** Fetch additional upstream pages when page 1 reports `hasMore`. */
  fetchUpstreamPages?: boolean;
  signal?: AbortSignal;
};

export type ExploreRouteGenerateInput = {
  categoryId: string;
  bounds: ExploreBounds;
  zoom: number;
  mapCenter: { lng: number; lat: number };
  filterValues: ExploreFilterValues;
};

export type ExploreFetchContext = {
  mapCenter: { lng: number; lat: number } | null;
  bounds: ExploreBounds | null;
  zoom: number;
  filterValues: ExploreFilterValues;
  services?: ExploreHostServices;
  onEntriesUpdate?: (entries: readonly ExploreResultEntry[]) => void;
  fetchUpstreamPages?: boolean;
  signal?: AbortSignal;
};

export type ExploreCategoryContribution = {
  /** Unique category id (namespace per plugin, e.g. `poi:coffee`). */
  id: string;
  label: string;
  color: string;
  icon: PluginIconComponent;
  chipVariant: ExploreChipVariant;
  filters: readonly ExploreFilterDef[];
  defaultFilterValues: ExploreFilterValues;
  fetchResults: (
    ctx: ExploreFetchContext,
  ) => ExploreResultEntry[] | Promise<ExploreResultEntry[]>;
  filterResults?: (
    entries: readonly ExploreResultEntry[],
    filterValues: ExploreFilterValues,
  ) => ExploreResultEntry[];
};

export type ExploreOffsetMeters = {
  east: number;
  north: number;
};

export function exploreDefaultFilterValues(
  filters: readonly ExploreFilterDef[],
): ExploreFilterValues {
  const out: ExploreFilterValues = {};
  for (const filter of filters) {
    if (filter.kind === "distance") {
      out[filter.id] = filter.defaultValue;
    } else if (filter.kind === "single" || filter.kind === "ranking") {
      out[filter.id] = filter.defaultValue;
    } else {
      out[filter.id] = [...filter.defaultValue];
    }
  }
  return out;
}

export function resolveExploreFilterValues(
  filters: readonly ExploreFilterDef[],
  defaults: ExploreFilterValues,
  stored: ExploreFilterValues | undefined,
): ExploreFilterValues {
  if (!stored) return { ...defaults };
  const merged: ExploreFilterValues = { ...defaults };
  for (const filter of filters) {
    const value = stored[filter.id];
    if (value === undefined) continue;
    if (filter.kind === "distance" && typeof value === "number") {
      merged[filter.id] = value;
    }
    if (filter.kind === "single" && typeof value === "string") {
      merged[filter.id] = value;
    }
    if (filter.kind === "ranking" && typeof value === "string") {
      merged[filter.id] = value;
    }
    if (filter.kind === "multi" && Array.isArray(value)) {
      merged[filter.id] = value;
    }
  }
  return merged;
}

function entryMatchesSingleFilter(
  entryValue: string | readonly string[] | number | undefined,
  selected: string,
): boolean {
  if (selected === "any") return true;
  if (typeof entryValue === "string") return entryValue === selected;
  return false;
}

function entryMatchesMultiFilter(
  entryValue: string | readonly string[] | number | undefined,
  selected: readonly string[],
): boolean {
  if (selected.length === 0) return true;
  const entryTags = Array.isArray(entryValue)
    ? entryValue
    : entryValue
      ? [entryValue]
      : [];
  return selected.every((tag) => entryTags.includes(tag));
}

export function filterExploreResults(
  category: ExploreCategoryContribution,
  entries: readonly ExploreResultEntry[],
  filterValues: ExploreFilterValues,
): ExploreResultEntry[] {
  if (category.filterResults) {
    return category.filterResults(entries, filterValues);
  }
  return entries.filter((entry) => {
    for (const filter of category.filters) {
      const selected = filterValues[filter.id];
      const entryValue = entry.filterValues[filter.id];
      if (filter.kind === "distance" || filter.kind === "ranking") continue;
      if (filter.kind === "single") {
        if (
          typeof selected !== "string" ||
          !entryMatchesSingleFilter(entryValue, selected)
        ) {
          return false;
        }
      } else if (
        !Array.isArray(selected) ||
        !entryMatchesMultiFilter(entryValue, selected)
      ) {
        return false;
      }
    }
    return true;
  });
}

/** Convert meter offsets from a map center to lng/lat. */
export function exploreOffsetToLngLat(
  center: { lng: number; lat: number },
  offset: ExploreOffsetMeters,
): { lng: number; lat: number } {
  const latRad = (center.lat * Math.PI) / 180;
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = 111_320 * Math.cos(latRad);
  return {
    lat: center.lat + offset.north / metersPerDegreeLat,
    lng: center.lng + offset.east / metersPerDegreeLng,
  };
}

export function exploreOffsetDistanceMeters(
  offset: ExploreOffsetMeters,
): number {
  return Math.hypot(offset.east, offset.north);
}

export function formatExploreDistanceMeters(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function isExplorePlaceEntry(
  entry: ExploreResultEntry,
): entry is ExplorePlaceResultEntry {
  return entry.featureKind === "place";
}

export function isExploreRouteEntry(
  entry: ExploreResultEntry,
): entry is ExploreRouteResultEntry {
  return entry.featureKind === "route";
}

export function isExploreClusterEntry(
  entry: ExploreResultEntry,
): entry is ExploreClusterResultEntry {
  return entry.featureKind === "cluster";
}
