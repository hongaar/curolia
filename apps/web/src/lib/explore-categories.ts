import type { LucideIcon } from "lucide-react";
import {
  Bike,
  Coffee,
  Footprints,
  Fuel,
  Hotel,
  ShoppingBag,
  TreePine,
  Utensils,
} from "lucide-react";

export type ExplorePoiCategoryId =
  | "coffee"
  | "restaurants"
  | "hotels"
  | "shops"
  | "parks"
  | "fuel";

export type ExploreRouteCategoryId = "hiking" | "cycling";

export type ExploreCategoryId = ExplorePoiCategoryId | ExploreRouteCategoryId;

export type ExploreCategoryKind = "poi" | "route";

export type ExploreCategory = {
  id: ExploreCategoryId;
  label: string;
  icon: LucideIcon;
  kind: ExploreCategoryKind;
};

/** Placeholder POI categories — map rendering will follow in a later pass. */
export const EXPLORE_POI_CATEGORIES: readonly ExploreCategory[] = [
  { id: "coffee", label: "Coffee", icon: Coffee, kind: "poi" },
  { id: "restaurants", label: "Restaurants", icon: Utensils, kind: "poi" },
  { id: "hotels", label: "Hotels", icon: Hotel, kind: "poi" },
  { id: "shops", label: "Shops", icon: ShoppingBag, kind: "poi" },
  { id: "parks", label: "Parks", icon: TreePine, kind: "poi" },
  { id: "fuel", label: "Fuel", icon: Fuel, kind: "poi" },
] as const;

/** Route layers (OpenRouteService) — distinct from POI chips; rendering follows later. */
export const EXPLORE_ROUTE_CATEGORIES: readonly ExploreCategory[] = [
  { id: "hiking", label: "Hiking", icon: Footprints, kind: "route" },
  { id: "cycling", label: "Cycling", icon: Bike, kind: "route" },
] as const;

export const EXPLORE_CATEGORIES: readonly ExploreCategory[] = [
  ...EXPLORE_POI_CATEGORIES,
  ...EXPLORE_ROUTE_CATEGORIES,
];

export function exploreCategoryById(
  id: ExploreCategoryId,
): ExploreCategory | undefined {
  return EXPLORE_CATEGORIES.find((category) => category.id === id);
}
