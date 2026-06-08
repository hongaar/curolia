import {
  isPinMetadataFieldShown,
  type PinMetadataShowSettings,
} from "@curolia/plugin-contract";

const FOOD_AMENITIES = new Set([
  "restaurant",
  "cafe",
  "fast_food",
  "bar",
  "pub",
  "food_court",
  "ice_cream",
  "bakery",
  "biergarten",
  "bbq",
  "nightclub",
  "canteen",
]);

const FOOD_SHOPS = new Set([
  "bakery",
  "butcher",
  "confectionery",
  "deli",
  "greengrocer",
  "seafood",
  "wine",
  "alcohol",
  "cheese",
  "chocolate",
]);

const OUTDOOR_TOURISM = new Set([
  "camp_site",
  "caravan_site",
  "picnic_site",
  "viewpoint",
  "wilderness_hut",
  "alpine_hut",
  "hostel",
  "hotel",
  "motel",
  "guest_hut",
]);

const OUTDOOR_AMENITIES = new Set([
  "fuel",
  "sanitary_dump_station",
  "charging_station",
  "bicycle_rental",
  "toilets",
]);

const OUTDOOR_LEISURE = new Set([
  "park",
  "playground",
  "nature_reserve",
  "marina",
  "pitch",
  "track",
  "slipway",
]);

const AMENITY_LABELS: Record<string, string> = {
  cafe: "Café",
  fast_food: "Fast food",
  food_court: "Food court",
  ice_cream: "Ice cream",
  sanitary_dump_station: "Dump station",
  charging_station: "EV charging",
  bicycle_rental: "Bike rental",
};

const TOURISM_LABELS: Record<string, string> = {
  camp_site: "Campsite",
  caravan_site: "Caravan site",
  picnic_site: "Picnic site",
  wilderness_hut: "Wilderness hut",
  alpine_hut: "Alpine hut",
  guest_hut: "Guest hut",
};

function titleCaseToken(token: string): string {
  const t = token.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function formatTagValue(value: string): string {
  const known = AMENITY_LABELS[value] ?? TOURISM_LABELS[value] ?? null;
  if (known) return known;
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(titleCaseToken)
    .join(" ");
}

function formatCuisine(value: string): string {
  return value
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part
        .split(/[_\s]+/)
        .filter(Boolean)
        .map(titleCaseToken)
        .join(" "),
    )
    .join(", ");
}

export function isFoodPoi(tags: Record<string, string>): boolean {
  const amenity = tags.amenity;
  if (amenity && FOOD_AMENITIES.has(amenity)) return true;
  const shop = tags.shop;
  if (shop && FOOD_SHOPS.has(shop)) return true;
  if (tags.cuisine?.trim()) return true;
  return false;
}

export function isOutdoorPoi(tags: Record<string, string>): boolean {
  const tourism = tags.tourism;
  if (tourism && OUTDOOR_TOURISM.has(tourism)) return true;
  const amenity = tags.amenity;
  if (amenity && OUTDOOR_AMENITIES.has(amenity)) return true;
  const leisure = tags.leisure;
  if (leisure && OUTDOOR_LEISURE.has(leisure)) return true;
  return false;
}

export function primaryPoiLabel(tags: Record<string, string>): string | null {
  if (tags.amenity) return formatTagValue(tags.amenity);
  if (tags.shop) return formatTagValue(tags.shop);
  if (tags.tourism) return formatTagValue(tags.tourism);
  if (tags.leisure) return formatTagValue(tags.leisure);
  if (tags.man_made) return formatTagValue(tags.man_made);
  if (tags.historic) return formatTagValue(tags.historic);
  if (tags.office) return formatTagValue(tags.office);
  return null;
}

function wheelchairLabel(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "yes" || v === "designated") return "wheelchair yes";
  if (v === "limited") return "wheelchair limited";
  if (v === "no") return "wheelchair no";
  return null;
}

function dogLabel(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "yes" || v === "leashed") return "dogs welcome";
  if (v === "no") return "no dogs";
  return null;
}

/** One-line OSM POI fragment for pin subtitles. */
export function formatPoiSubtitle(
  tags: Record<string, string>,
  showSettings: PinMetadataShowSettings,
): string | null {
  const parts: string[] = [];

  if (isPinMetadataFieldShown("place_type", showSettings)) {
    const primary = primaryPoiLabel(tags);
    if (primary) parts.push(primary);
  }

  if (
    isPinMetadataFieldShown("cuisine", showSettings) &&
    tags.cuisine?.trim()
  ) {
    const cuisine = formatCuisine(tags.cuisine);
    if (cuisine && !parts.includes(cuisine)) parts.push(cuisine);
  }

  if (isPinMetadataFieldShown("wheelchair_access", showSettings)) {
    const wheel = wheelchairLabel(tags.wheelchair);
    if (wheel) parts.push(wheel);
  }

  if (isPinMetadataFieldShown("dog_policy", showSettings)) {
    const dog = dogLabel(tags.dog);
    if (dog) parts.push(dog);
  }

  if (parts.length === 0) return null;
  return parts.join(" · ");
}
