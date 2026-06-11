import type { PlaceSearchResult } from "./types.ts";

export type PlaceSearchPanelDetail = {
  label: string;
  value: string;
};

function trimLower(value: string): string {
  return value.trim().toLowerCase();
}

function commaSegments(text: string): string[] {
  return text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** True when `value` is already shown in title/subtitle context. */
function isRedundantDetailValue(
  value: string,
  ...context: (string | undefined)[]
): boolean {
  const needle = trimLower(value);
  if (!needle) return true;

  for (const entry of context) {
    if (!entry) continue;
    const haystack = trimLower(entry);
    if (haystack === needle) return true;
    if (commaSegments(entry).some((part) => trimLower(part) === needle)) {
      return true;
    }
  }

  return false;
}

/** Secondary line under the active place title. */
export function placeSearchPanelSubtitle(
  place: PlaceSearchResult,
): string | null {
  const primary = place.primaryName.trim();
  const full = place.fullLabel.trim();

  if (full && primary) {
    const prefix = `${primary},`;
    if (trimLower(full).startsWith(trimLower(prefix))) {
      const rest = full.slice(primary.length + 1).trim();
      if (rest) return rest;
    }
    if (trimLower(full) !== trimLower(primary)) return full;
  } else if (full) {
    return full;
  }

  const props = place.properties;
  if (!props) return null;

  const parts: string[] = [];
  const push = (value?: string) => {
    const trimmed = value?.trim();
    if (!trimmed || isRedundantDetailValue(trimmed, primary)) return;
    if (parts.some((part) => trimLower(part) === trimLower(trimmed))) return;
    parts.push(trimmed);
  };

  push(props.city ?? props.town ?? props.village);
  push(props.state);
  push(props.country);

  return parts.length > 0 ? parts.join(", ") : null;
}

/** Structured detail rows for the active place panel (when geocoder fields exist). */
export function placeSearchPanelDetails(
  place: PlaceSearchResult,
): PlaceSearchPanelDetail[] {
  const primary = place.primaryName.trim();
  const props = place.properties;
  const details: PlaceSearchPanelDetail[] = [];
  const seen = new Set<string>();

  const add = (label: string, value: string | undefined) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    if (isRedundantDetailValue(trimmed, primary)) return;
    const key = trimLower(trimmed);
    if (seen.has(key)) return;
    seen.add(key);
    details.push({ label, value: trimmed });
  };

  if (props) {
    add("Street", props.street);
    if (props.city) add("City", props.city);
    else if (props.town) add("Town", props.town);
    else if (props.village) add("Village", props.village);
    add("Region", props.state);
    add("Country", props.country);
  }

  add("Coordinates", formatPlaceCoordinates(place.lat, place.lng));
  return details;
}

export function formatPlaceCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}
