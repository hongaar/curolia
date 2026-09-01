import type {
  ExploreCategoryContribution,
  ExploreFetchContext,
  ExploreFilterDef,
} from "@curolia/plugin-contract";
import { exploreDefaultFilterValues } from "@curolia/plugin-contract";
import { Bike, Footprints } from "lucide-react";

type RouteExploreCategoryId = "route:hiking" | "route:cycling";

const ROUTE_FILTERS: Record<
  RouteExploreCategoryId,
  readonly ExploreFilterDef[]
> = {
  "route:hiking": [
    {
      id: "maxDistance",
      label: "Max distance",
      kind: "distance",
      defaultValue: 5000,
      minMeters: 2000,
      maxMeters: 20_000,
      stepMeters: 1000,
    },
  ],
  "route:cycling": [
    {
      id: "maxDistance",
      label: "Max distance",
      kind: "distance",
      defaultValue: 8000,
      minMeters: 3000,
      maxMeters: 30_000,
      stepMeters: 1000,
    },
  ],
};

function buildRouteCategory(
  id: RouteExploreCategoryId,
  label: string,
  color: string,
  icon: ExploreCategoryContribution["icon"],
): ExploreCategoryContribution {
  const filters = ROUTE_FILTERS[id];
  const category: ExploreCategoryContribution = {
    id,
    label,
    color,
    icon,
    chipVariant: "route",
    filters,
    defaultFilterValues: exploreDefaultFilterValues(filters),
    async fetchResults(ctx: ExploreFetchContext) {
      if (!ctx.services || !ctx.bounds || !ctx.mapCenter) return [];
      return ctx.services.generateRoutes({
        categoryId: id,
        bounds: ctx.bounds,
        zoom: ctx.zoom,
        mapCenter: ctx.mapCenter,
        filterValues: ctx.filterValues,
      });
    },
  };
  return category;
}

export const routeExploreCategories: readonly ExploreCategoryContribution[] = [
  buildRouteCategory("route:hiking", "Hiking", "#0f766e", Footprints),
  buildRouteCategory("route:cycling", "Cycling", "#0369a1", Bike),
];
