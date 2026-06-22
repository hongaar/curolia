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

type PoiDummyEntry = {
  id: string;
  categoryId: PoiExploreCategoryId;
  title: string;
  subtitle?: string;
  filterValues: ExploreFilterValues;
  offset: ExploreOffsetMeters;
};

const POI_FILTERS: Record<PoiExploreCategoryId, readonly ExploreFilterDef[]> = {
  "poi:coffee": [
    {
      id: "price",
      label: "Price",
      kind: "single",
      options: [
        { id: "budget", label: "Budget" },
        { id: "mid", label: "Mid-range" },
        { id: "premium", label: "Premium" },
      ],
      defaultValue: "mid",
    },
    {
      id: "features",
      label: "Features",
      kind: "multi",
      options: [
        { id: "wifi", label: "Wi‑Fi" },
        { id: "outdoor", label: "Outdoor seating" },
        { id: "pastries", label: "Pastries" },
      ],
      defaultValue: [],
    },
  ],
  "poi:restaurants": [
    {
      id: "cuisine",
      label: "Cuisine",
      kind: "single",
      options: [
        { id: "local", label: "Local" },
        { id: "italian", label: "Italian" },
        { id: "asian", label: "Asian" },
      ],
      defaultValue: "local",
    },
    {
      id: "price",
      label: "Price",
      kind: "single",
      options: [
        { id: "budget", label: "Budget" },
        { id: "mid", label: "Mid-range" },
        { id: "fine", label: "Fine dining" },
      ],
      defaultValue: "mid",
    },
  ],
  "poi:hotels": [
    {
      id: "stars",
      label: "Rating",
      kind: "single",
      options: [
        { id: "3", label: "3★" },
        { id: "4", label: "4★" },
        { id: "5", label: "5★" },
      ],
      defaultValue: "4",
    },
    {
      id: "amenities",
      label: "Amenities",
      kind: "multi",
      options: [
        { id: "pool", label: "Pool" },
        { id: "parking", label: "Parking" },
        { id: "breakfast", label: "Breakfast" },
      ],
      defaultValue: [],
    },
  ],
  "poi:shops": [
    {
      id: "type",
      label: "Type",
      kind: "single",
      options: [
        { id: "grocery", label: "Grocery" },
        { id: "fashion", label: "Fashion" },
        { id: "local", label: "Local makers" },
      ],
      defaultValue: "local",
    },
    {
      id: "openNow",
      label: "Hours",
      kind: "single",
      options: [
        { id: "any", label: "Any" },
        { id: "open", label: "Open now" },
      ],
      defaultValue: "any",
    },
  ],
  "poi:parks": [
    {
      id: "size",
      label: "Size",
      kind: "single",
      options: [
        { id: "small", label: "Small" },
        { id: "large", label: "Large" },
      ],
      defaultValue: "large",
    },
    {
      id: "activity",
      label: "Activity",
      kind: "multi",
      options: [
        { id: "playground", label: "Playground" },
        { id: "trails", label: "Trails" },
        { id: "water", label: "Water" },
      ],
      defaultValue: [],
    },
  ],
  "poi:fuel": [
    {
      id: "brand",
      label: "Brand",
      kind: "single",
      options: [
        { id: "major", label: "Major brand" },
        { id: "local", label: "Independent" },
      ],
      defaultValue: "major",
    },
    {
      id: "services",
      label: "Services",
      kind: "multi",
      options: [
        { id: "shop", label: "Shop" },
        { id: "carwash", label: "Car wash" },
        { id: "ev", label: "EV charging" },
      ],
      defaultValue: [],
    },
  ],
};

const POI_DUMMY_ENTRIES: readonly PoiDummyEntry[] = [
  {
    id: "coffee-roast-house",
    categoryId: "poi:coffee",
    title: "Roast House",
    subtitle: "Single-origin pour-overs",
    filterValues: { price: "premium", features: ["wifi", "pastries"] },
    offset: { east: 320, north: 180 },
  },
  {
    id: "coffee-corner-cafe",
    categoryId: "poi:coffee",
    title: "Corner Café",
    subtitle: "Quick espresso bar",
    filterValues: { price: "budget", features: ["outdoor"] },
    offset: { east: -450, north: 90 },
  },
  {
    id: "coffee-garden",
    categoryId: "poi:coffee",
    title: "Garden Coffee",
    subtitle: "Mid-range roastery",
    filterValues: { price: "mid", features: ["wifi", "outdoor"] },
    offset: { east: 120, north: -520 },
  },
  {
    id: "restaurant-trattoria",
    categoryId: "poi:restaurants",
    title: "Trattoria Nova",
    subtitle: "Handmade pasta",
    filterValues: { cuisine: "italian", price: "mid" },
    offset: { east: 680, north: -210 },
  },
  {
    id: "restaurant-night-market",
    categoryId: "poi:restaurants",
    title: "Night Market Stalls",
    subtitle: "Shared tables, local dishes",
    filterValues: { cuisine: "local", price: "budget" },
    offset: { east: -280, north: -340 },
  },
  {
    id: "restaurant-omakase",
    categoryId: "poi:restaurants",
    title: "Omakase Room",
    subtitle: "Chef's tasting menu",
    filterValues: { cuisine: "asian", price: "fine" },
    offset: { east: 540, north: 420 },
  },
  {
    id: "hotel-harbor",
    categoryId: "poi:hotels",
    title: "Harbor View Hotel",
    subtitle: "Waterfront rooms",
    filterValues: { stars: "4", amenities: ["breakfast", "parking"] },
    offset: { east: -620, north: 310 },
  },
  {
    id: "hotel-spa-retreat",
    categoryId: "poi:hotels",
    title: "Spa Retreat",
    subtitle: "Pool and wellness",
    filterValues: { stars: "5", amenities: ["pool", "breakfast"] },
    offset: { east: 890, north: 60 },
  },
  {
    id: "shop-market-hall",
    categoryId: "poi:shops",
    title: "Market Hall",
    subtitle: "Groceries and deli",
    filterValues: { type: "grocery", openNow: "open" },
    offset: { east: -150, north: 640 },
  },
  {
    id: "shop-atelier",
    categoryId: "poi:shops",
    title: "Atelier Row",
    subtitle: "Local makers and crafts",
    filterValues: { type: "local", openNow: "any" },
    offset: { east: 410, north: -780 },
  },
  {
    id: "park-riverside",
    categoryId: "poi:parks",
    title: "Riverside Green",
    subtitle: "Wide lawns and paths",
    filterValues: { size: "large", activity: ["trails", "water"] },
    offset: { east: -840, north: -120 },
  },
  {
    id: "park-playground",
    categoryId: "poi:parks",
    title: "Neighborhood Play Park",
    subtitle: "Shaded playground",
    filterValues: { size: "small", activity: ["playground"] },
    offset: { east: 70, north: 950 },
  },
  {
    id: "fuel-highway-stop",
    categoryId: "poi:fuel",
    title: "Highway Stop",
    subtitle: "24h fuel and shop",
    filterValues: { brand: "major", services: ["shop", "carwash"] },
    offset: { east: 1120, north: -430 },
  },
  {
    id: "fuel-ev-hub",
    categoryId: "poi:fuel",
    title: "EV Hub",
    subtitle: "Fast chargers",
    filterValues: { brand: "local", services: ["ev", "shop"] },
    offset: { east: -960, north: -560 },
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

function poiEntryToResult(
  entry: PoiDummyEntry,
  mapCenter: { lng: number; lat: number } | null,
): ExploreResultEntry {
  const distanceMeters = exploreOffsetDistanceMeters(entry.offset);
  if (!mapCenter) {
    return {
      id: entry.id,
      categoryId: entry.categoryId,
      title: entry.title,
      subtitle: entry.subtitle,
      distanceMeters,
      filterValues: entry.filterValues,
      geometry: { kind: "point", lng: 0, lat: 0 },
    };
  }
  const { lng, lat } = exploreOffsetToLngLat(mapCenter, entry.offset);
  return {
    id: entry.id,
    categoryId: entry.categoryId,
    title: entry.title,
    subtitle: entry.subtitle,
    distanceMeters,
    filterValues: entry.filterValues,
    geometry: { kind: "point", lng, lat },
  };
}

function buildPoiCategory(
  id: PoiExploreCategoryId,
  label: string,
  color: string,
  icon: ExploreCategoryContribution["icon"],
): ExploreCategoryContribution {
  const filters = POI_FILTERS[id];
  const entries = POI_DUMMY_ENTRIES.filter((entry) => entry.categoryId === id);
  const category: ExploreCategoryContribution = {
    id,
    label,
    color,
    icon,
    chipVariant: "poi",
    filters,
    defaultFilterValues: defaultFilterValues(filters),
    fetchResults(ctx: ExploreFetchContext) {
      const raw = entries.map((entry) =>
        poiEntryToResult(entry, ctx.mapCenter),
      );
      return filterExploreResults(category, raw, ctx.filterValues);
    },
  };
  return category;
}

export const poiExploreCategories: readonly ExploreCategoryContribution[] = [
  buildPoiCategory("poi:coffee", "Coffee", "#8b5a2b", Coffee),
  buildPoiCategory("poi:restaurants", "Restaurants", "#c2410c", Utensils),
  buildPoiCategory("poi:hotels", "Hotels", "#2563eb", Hotel),
  buildPoiCategory("poi:shops", "Shops", "#7c3aed", ShoppingBag),
  buildPoiCategory("poi:parks", "Parks", "#15803d", TreePine),
  buildPoiCategory("poi:fuel", "Fuel", "#ca8a04", Fuel),
];
