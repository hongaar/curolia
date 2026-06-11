import type { PinGeocode } from "./pin-geocode.ts";
import type { GeocodeProperties, PlaceSearchResult } from "./types.ts";

const OSM_PLACE_LABELS: Record<string, string> = {
  city: "City",
  town: "Town",
  village: "Village",
  hamlet: "Hamlet",
  suburb: "Suburb",
  neighbourhood: "Neighbourhood",
  neighborhood: "Neighbourhood",
  locality: "Locality",
  county: "County",
  state: "Province",
  region: "Region",
  country: "Country",
  continent: "Continent",
  quarter: "Quarter",
  borough: "Borough",
  municipality: "Municipality",
  district: "District",
  island: "Island",
  archipelago: "Archipelago",
  postcode: "Postcode",
};

const OSM_NATURAL_LABELS: Record<string, string> = {
  water: "Water",
  bay: "Bay",
  beach: "Beach",
  peak: "Peak",
  volcano: "Volcano",
  wood: "Woodland",
  coastline: "Coastline",
};

const PHOTON_TYPE_LABELS: Record<string, string> = {
  house: "Address",
  street: "Street",
  locality: "Locality",
  district: "District",
  city: "City",
  county: "County",
  state: "Province",
  country: "Country",
  other: "Place",
};

function titleCaseToken(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** User-facing place category for forward-search rows (Photon / OSM). */
export function placeCategoryLabel(
  props: Pick<GeocodeProperties, "type" | "osm_key" | "osm_value"> | undefined,
): string | undefined {
  if (!props) return undefined;

  const osmKey = props.osm_key?.trim().toLowerCase();
  const osmValue = props.osm_value?.trim().toLowerCase();
  const type = props.type?.trim().toLowerCase();

  if (osmKey === "place" && osmValue) {
    return OSM_PLACE_LABELS[osmValue] ?? titleCaseToken(osmValue);
  }
  if (osmKey === "natural" && osmValue) {
    return OSM_NATURAL_LABELS[osmValue] ?? titleCaseToken(osmValue);
  }
  if (osmKey === "leisure" && osmValue === "park") return "Park";
  if (osmKey === "tourism") {
    if (osmValue === "attraction") return "Landmark";
    if (osmValue === "museum") return "Museum";
    if (osmValue === "viewpoint") return "Viewpoint";
    if (osmValue === "artwork") return "Landmark";
  }
  if (osmKey === "historic") return "Historic site";
  if (osmKey === "building") return "Building";
  if (osmKey === "highway") return "Street";
  if (osmKey === "landuse" && osmValue) return titleCaseToken(osmValue);
  if (osmKey === "boundary" && osmValue === "administrative") {
    return type
      ? (PHOTON_TYPE_LABELS[type] ?? titleCaseToken(type))
      : "Boundary";
  }
  if (osmKey === "amenity" && osmValue) return titleCaseToken(osmValue);

  if (type) {
    return PHOTON_TYPE_LABELS[type] ?? titleCaseToken(type);
  }

  return undefined;
}

/** Map zoom passed to title/label heuristics for a forward-search place category. */
export function placeTitleZoomForCategory(categoryLabel?: string): number {
  const cat = categoryLabel?.trim().toLowerCase();
  if (!cat) return 12;
  if (cat === "country" || cat === "continent") return 5;
  if (
    cat === "province" ||
    cat === "region" ||
    cat === "county" ||
    cat === "state"
  ) {
    return 8;
  }
  if (
    cat === "city" ||
    cat === "town" ||
    cat === "village" ||
    cat === "hamlet" ||
    cat === "suburb" ||
    cat === "neighbourhood" ||
    cat === "neighborhood" ||
    cat === "locality" ||
    cat === "municipality" ||
    cat === "borough" ||
    cat === "district"
  ) {
    return 12;
  }
  return 14;
}

/** Merge forward-search identity into a reverse-geocode snapshot for pin storage. */
export function enrichGeocodeFromSearchPlace(
  geocode: PinGeocode,
  place: Pick<PlaceSearchResult, "primaryName" | "categoryLabel">,
): PinGeocode {
  const name = place.primaryName.trim();
  if (!name) return geocode;

  const props: GeocodeProperties = { ...geocode.properties };
  const cat = place.categoryLabel?.trim().toLowerCase();

  if (cat === "city") props.city = name;
  else if (cat === "town") props.town = name;
  else if (cat === "village" || cat === "hamlet") props.village = name;
  else if (
    cat === "province" ||
    cat === "region" ||
    cat === "county" ||
    cat === "state"
  ) {
    props.state = name;
  } else if (cat === "country" || cat === "continent") props.country = name;
  else props.name = name;

  return { ...geocode, properties: props };
}
