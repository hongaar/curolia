import type { GeocodeProperties } from "./types.ts";

/** Stored on `pins.geocode` — reverse-geocode snapshot. */
export type PinGeocode = {
  source: "photon";
  lat: number;
  lng: number;
  fetchedAt: string;
  properties: GeocodeProperties;
};

type GeocodeLevel = "street" | "city" | "region" | "country";

type GeocodeLevelValues = Record<GeocodeLevel, string | null>;

export type LocationLabelDetail =
  | "street_city_region_country"
  | "street_city_country"
  | "city_region_country"
  | "city_country"
  | "region_country"
  | "country";

const LOCATION_LABEL_PATTERNS: {
  value: LocationLabelDetail;
  levels: GeocodeLevel[];
}[] = [
  {
    value: "street_city_region_country",
    levels: ["street", "city", "region", "country"],
  },
  { value: "street_city_country", levels: ["street", "city", "country"] },
  { value: "city_region_country", levels: ["city", "region", "country"] },
  { value: "city_country", levels: ["city", "country"] },
  { value: "region_country", levels: ["region", "country"] },
  { value: "country", levels: ["country"] },
];

/** @deprecated Use {@link availableLocationLabelPatterns} — patterns depend on geocode. */
export const LOCATION_LABEL_DETAILS = LOCATION_LABEL_PATTERNS;

export const DEFAULT_LOCATION_LABEL_DETAIL: LocationLabelDetail =
  "street_city_country";

export function isLocationLabelDetail(v: string): v is LocationLabelDetail {
  return LOCATION_LABEL_PATTERNS.some((p) => p.value === v);
}

function pickLabel(...values: (string | undefined)[]): string | null {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return null;
}

export function geocodeLevelValues(
  properties: GeocodeProperties | undefined,
): GeocodeLevelValues {
  const p = properties ?? {};
  return {
    street: pickLabel(p.street, p.name),
    city: pickLabel(p.city, p.town, p.village),
    region: pickLabel(p.state),
    country: pickLabel(p.country),
  };
}

function joinDistinctLevels(
  levels: GeocodeLevel[],
  values: GeocodeLevelValues,
): string | null {
  const parts: string[] = [];
  for (const level of levels) {
    const v = values[level];
    if (!v) return null;
    if (parts.at(-1) === v) return null;
    parts.push(v);
  }
  if (parts.length < levels.length) return null;
  const joined = parts.join(", ");
  return joined || null;
}

function patternDefinition(
  detail: LocationLabelDetail,
): (typeof LOCATION_LABEL_PATTERNS)[number] | undefined {
  return LOCATION_LABEL_PATTERNS.find((p) => p.value === detail);
}

/** True when every level is present and none collapse to a duplicate neighbor. */
export function patternIsAvailable(
  levels: GeocodeLevel[],
  values: GeocodeLevelValues,
): boolean {
  return joinDistinctLevels(levels, values) !== null;
}

/** Patterns that can be built from this geocode (excludes missing or duplicate levels). */
export function availableLocationLabelPatterns(
  geocode: PinGeocode | null | undefined,
): LocationLabelDetail[] {
  if (!geocode) return [];
  const values = geocodeLevelValues(geocode.properties);
  return LOCATION_LABEL_PATTERNS.filter((p) =>
    patternIsAvailable(p.levels, values),
  ).map((p) => p.value);
}

/** Friendly label for a pin from stored geocode + pattern preference. */
export function defaultLocationLabelDetail(
  geocode: PinGeocode | null | undefined,
): LocationLabelDetail {
  const available = availableLocationLabelPatterns(geocode);
  if (available.includes(DEFAULT_LOCATION_LABEL_DETAIL)) {
    return DEFAULT_LOCATION_LABEL_DETAIL;
  }
  return available[0] ?? DEFAULT_LOCATION_LABEL_DETAIL;
}

export function locationLabelForDetail(
  geocode: PinGeocode | null | undefined,
  detail: LocationLabelDetail,
): string | null {
  if (!geocode) return null;
  const def = patternDefinition(detail);
  if (!def) return null;
  return joinDistinctLevels(def.levels, geocodeLevelValues(geocode.properties));
}

export type PinLocationLabelSource = {
  geocode: PinGeocode | unknown | null;
  location_label_detail: LocationLabelDetail | string;
};

/** Display location label from stored geocode + pattern (not persisted). */
export function pinLocationLabel(pin: PinLocationLabelSource): string | null {
  const geocode = parsePinGeocode(pin.geocode);
  if (!geocode) return null;
  const detail = isLocationLabelDetail(pin.location_label_detail)
    ? pin.location_label_detail
    : defaultLocationLabelDetail(geocode);
  return locationLabelForDetail(geocode, detail);
}

/** Value → preview label for Select (actual place text per pattern). */
export function locationLabelDetailPreviewItems(
  geocode: PinGeocode | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const detail of availableLocationLabelPatterns(geocode)) {
    const label = locationLabelForDetail(geocode, detail);
    if (label) out[detail] = label;
  }
  return out;
}

export function geocodeMatchesCoords(
  geocode: PinGeocode | null | undefined,
  lat: number,
  lng: number,
): boolean {
  if (!geocode) return false;
  return (
    Math.abs(geocode.lat - lat) < 1e-6 && Math.abs(geocode.lng - lng) < 1e-6
  );
}

export function pinGeocodeToJson(
  geocode: PinGeocode | null,
): PinGeocode | null {
  return geocode;
}

export function parsePinGeocode(raw: unknown): PinGeocode | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.source !== "photon") return null;
  const lat = Number(o.lat);
  const lng = Number(o.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const fetchedAt =
    typeof o.fetchedAt === "string" ? o.fetchedAt : new Date(0).toISOString();
  const properties =
    o.properties && typeof o.properties === "object"
      ? (o.properties as GeocodeProperties)
      : {};
  return { source: "photon", lat, lng, fetchedAt, properties };
}
