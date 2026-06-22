import type {
  ExploreCategoryContribution,
  ExploreFetchContext,
  ExploreFilterDef,
  ExploreFilterValues,
  ExploreOffsetMeters,
  ExploreResultEntry,
} from "@curolia/plugin-contract";
import {
  exploreOffsetDistanceMeters,
  exploreOffsetToLngLat,
  filterExploreResults,
} from "@curolia/plugin-contract";
import { Bike, Footprints } from "lucide-react";

type RouteExploreCategoryId = "route:hiking" | "route:cycling";

type RouteDummyEntry = {
  id: string;
  categoryId: RouteExploreCategoryId;
  title: string;
  subtitle?: string;
  filterValues: ExploreFilterValues;
  path: readonly ExploreOffsetMeters[];
};

const ROUTE_FILTERS: Record<
  RouteExploreCategoryId,
  readonly ExploreFilterDef[]
> = {
  "route:hiking": [
    {
      id: "difficulty",
      label: "Difficulty",
      kind: "single",
      options: [
        { id: "easy", label: "Easy" },
        { id: "moderate", label: "Moderate" },
        { id: "hard", label: "Hard" },
      ],
      defaultValue: "moderate",
    },
    {
      id: "length",
      label: "Length",
      kind: "single",
      options: [
        { id: "short", label: "Under 5 km" },
        { id: "long", label: "5 km+" },
      ],
      defaultValue: "short",
    },
  ],
  "route:cycling": [
    {
      id: "surface",
      label: "Surface",
      kind: "single",
      options: [
        { id: "paved", label: "Paved" },
        { id: "trail", label: "Trail" },
      ],
      defaultValue: "paved",
    },
    {
      id: "difficulty",
      label: "Difficulty",
      kind: "single",
      options: [
        { id: "easy", label: "Easy" },
        { id: "moderate", label: "Moderate" },
      ],
      defaultValue: "easy",
    },
  ],
};

const ROUTE_DUMMY_ENTRIES: readonly RouteDummyEntry[] = [
  {
    id: "hike-ridge-loop",
    categoryId: "route:hiking",
    title: "Ridge Loop",
    subtitle: "Forest lookout",
    filterValues: { difficulty: "moderate", length: "short" },
    path: [
      { east: -400, north: 200 },
      { east: -120, north: 680 },
      { east: 280, north: 520 },
      { east: 180, north: 80 },
      { east: -400, north: 200 },
    ],
  },
  {
    id: "hike-summit-trail",
    categoryId: "route:hiking",
    title: "Summit Trail",
    subtitle: "Steep climb with views",
    filterValues: { difficulty: "hard", length: "long" },
    path: [
      { east: 520, north: -300 },
      { east: 980, north: 140 },
      { east: 760, north: 820 },
      { east: 320, north: 640 },
    ],
  },
  {
    id: "cycle-river-path",
    categoryId: "route:cycling",
    title: "River Path",
    subtitle: "Flat paved route",
    filterValues: { surface: "paved", difficulty: "easy" },
    path: [
      { east: -700, north: 0 },
      { east: -200, north: 120 },
      { east: 300, north: 40 },
      { east: 900, north: -80 },
    ],
  },
  {
    id: "cycle-forest-trail",
    categoryId: "route:cycling",
    title: "Forest Trail",
    subtitle: "Gravel and roots",
    filterValues: { surface: "trail", difficulty: "moderate" },
    path: [
      { east: -300, north: -500 },
      { east: 100, north: -820 },
      { east: 480, north: -640 },
      { east: 620, north: -280 },
    ],
  },
];

function defaultFilterValues(
  filters: readonly ExploreFilterDef[],
): ExploreFilterValues {
  const out: ExploreFilterValues = {};
  for (const filter of filters) {
    out[filter.id] =
      filter.kind === "single" ? filter.defaultValue : [...filter.defaultValue];
  }
  return out;
}

function routeEntryToResult(
  entry: RouteDummyEntry,
  mapCenter: { lng: number; lat: number } | null,
): ExploreResultEntry {
  const first = entry.path[0];
  const distanceMeters = first ? exploreOffsetDistanceMeters(first) : undefined;
  const coordinates = mapCenter
    ? entry.path.map(
        (point) =>
          [
            exploreOffsetToLngLat(mapCenter, point).lng,
            exploreOffsetToLngLat(mapCenter, point).lat,
          ] as [number, number],
      )
    : entry.path.map(() => [0, 0] as [number, number]);

  return {
    id: entry.id,
    categoryId: entry.categoryId,
    title: entry.title,
    subtitle: entry.subtitle,
    distanceMeters,
    filterValues: entry.filterValues,
    geometry: { kind: "line", coordinates },
  };
}

function buildRouteCategory(
  id: RouteExploreCategoryId,
  label: string,
  color: string,
  icon: ExploreCategoryContribution["icon"],
): ExploreCategoryContribution {
  const filters = ROUTE_FILTERS[id];
  const entries = ROUTE_DUMMY_ENTRIES.filter(
    (entry) => entry.categoryId === id,
  );
  const category: ExploreCategoryContribution = {
    id,
    label,
    color,
    icon,
    chipVariant: "route",
    filters,
    defaultFilterValues: defaultFilterValues(filters),
    fetchResults(ctx: ExploreFetchContext) {
      const raw = entries.map((entry) =>
        routeEntryToResult(entry, ctx.mapCenter),
      );
      return filterExploreResults(category, raw, ctx.filterValues);
    },
  };
  return category;
}

export const routeExploreCategories: readonly ExploreCategoryContribution[] = [
  buildRouteCategory("route:hiking", "Hiking", "#0f766e", Footprints),
  buildRouteCategory("route:cycling", "Cycling", "#0369a1", Bike),
];
