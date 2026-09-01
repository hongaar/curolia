import type {
  ExploreCategoryContribution,
  ExploreFetchContext,
  ExploreFilterDef,
} from "@curolia/plugin-contract";
import { exploreDefaultFilterValues } from "@curolia/plugin-contract";
import {
  Coffee,
  Fuel,
  Hotel,
  ShoppingBag,
  TreePine,
  Utensils,
} from "lucide-react";

type PoiExploreCategoryId =
  | "poi:coffee"
  | "poi:restaurants"
  | "poi:hotels"
  | "poi:shops"
  | "poi:parks"
  | "poi:fuel";

const POI_FILTERS: Record<PoiExploreCategoryId, readonly ExploreFilterDef[]> = {
  "poi:coffee": [
    {
      id: "hiddenGems",
      label: "Ranking",
      kind: "ranking",
      options: [
        { id: "popular", label: "Popular" },
        { id: "gems", label: "Hidden gems" },
      ],
      defaultValue: "popular",
    },
  ],
  "poi:restaurants": [
    {
      id: "hiddenGems",
      label: "Ranking",
      kind: "ranking",
      options: [
        { id: "popular", label: "Popular" },
        { id: "gems", label: "Hidden gems" },
      ],
      defaultValue: "popular",
    },
  ],
  "poi:hotels": [],
  "poi:shops": [],
  "poi:parks": [],
  "poi:fuel": [],
};

function buildPoiCategory(
  id: PoiExploreCategoryId,
  label: string,
  color: string,
  icon: ExploreCategoryContribution["icon"],
): ExploreCategoryContribution {
  const filters = POI_FILTERS[id];
  return {
    id,
    label,
    color,
    icon,
    chipVariant: "poi",
    filters,
    defaultFilterValues: exploreDefaultFilterValues(filters),
    async fetchResults(ctx: ExploreFetchContext) {
      if (!ctx.services || !ctx.bounds) return [];
      return ctx.services.fetchStaticPlaces({
        categoryId: id,
        bounds: ctx.bounds,
        zoom: ctx.zoom,
        mapCenter: ctx.mapCenter,
        filterValues: ctx.filterValues,
        onUpdate: ctx.onEntriesUpdate,
        fetchUpstreamPages: ctx.fetchUpstreamPages,
        signal: ctx.signal,
      });
    },
  };
}

export const poiExploreCategories: readonly ExploreCategoryContribution[] = [
  buildPoiCategory("poi:coffee", "Coffee", "#92400e", Coffee),
  buildPoiCategory("poi:restaurants", "Restaurants", "#b45309", Utensils),
  buildPoiCategory("poi:hotels", "Hotels", "#7c3aed", Hotel),
  buildPoiCategory("poi:shops", "Shops", "#2563eb", ShoppingBag),
  buildPoiCategory("poi:parks", "Parks", "#15803d", TreePine),
  buildPoiCategory("poi:fuel", "Fuel", "#dc2626", Fuel),
];
