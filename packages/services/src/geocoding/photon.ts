import { isValidMapBbox, type MapBbox } from "../coords.ts";
import type { PinGeocode } from "./pin-geocode.ts";
import type { GeocodeProperties } from "./types.ts";

/** @internal Photon provider — use {@link searchPlaces} etc. from `./client.ts`. */
export type PhotonProps = GeocodeProperties;

export type PhotonPlace = {
  id: string;
  /** Best short label for the list row (ties to the search query when possible). */
  primaryName: string;
  /** Full address / place line (detail). */
  fullLabel: string;
  lat: number;
  lng: number;
  /** Photon/OSM extent when present — used to fit the map more tightly than a point zoom. */
  bbox?: MapBbox;
};

type PhotonResponse = {
  features?: {
    /** GeoJSON Feature bbox: west, south, east, north (minLon, minLat, maxLon, maxLat). */
    bbox?: [number, number, number, number];
    geometry?: { type?: string; coordinates?: [number, number] };
    properties?: GeocodeProperties;
  }[];
};

export function photonLabel(props: PhotonProps | undefined): string {
  if (!props) return "Place";
  const parts: string[] = [];
  const primary = props.name ?? props.street;
  if (primary) parts.push(primary);
  const locality = props.city ?? props.town ?? props.village ?? props.state;
  if (locality && locality !== primary) parts.push(locality);
  if (props.country) parts.push(props.country);
  const joined = parts.filter(Boolean).join(", ");
  return joined || "Place";
}

/** Short row title: prefer the smallest field that contains the query, else a sensible default. */
export function photonPrimaryTitle(
  query: string,
  props: PhotonProps | undefined,
  fullLabel: string,
): string {
  const q = query.trim().toLowerCase();
  const full = fullLabel.trim();
  if (!q) {
    return (
      props?.name?.trim() ||
      props?.street?.trim() ||
      full.split(",")[0]?.trim() ||
      full ||
      "Place"
    );
  }

  const candidates: string[] = [];
  const push = (s: string | undefined) => {
    const t = s?.trim();
    if (t) candidates.push(t);
  };
  push(props?.name);
  push(props?.street);
  push(props?.village);
  push(props?.town);
  push(props?.city);
  push(props?.state);
  push(props?.country);

  const matching = candidates.filter((c) => c.toLowerCase().includes(q));
  if (matching.length > 0) {
    matching.sort((a, b) => a.length - b.length);
    return matching[0]!;
  }

  const prefix = candidates.find((c) => c.toLowerCase().startsWith(q));
  if (prefix) return prefix;

  for (const segment of full
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)) {
    if (segment.toLowerCase().includes(q)) return segment;
  }

  return (
    props?.name?.trim() ||
    props?.street?.trim() ||
    full.split(",")[0]?.trim() ||
    full ||
    "Place"
  );
}

/** MapLibre zoom below which new-pin titles prefer country over finer labels. */
const PIN_TITLE_ZOOM_COUNTRY_MAX = 6;
/** Prefer state/region for titles when zoom is below this. */
const PIN_TITLE_ZOOM_STATE_MAX = 6;
/** Prefer city/town for titles when zoom is below this; at or above, use street/POI names. */
const PIN_TITLE_ZOOM_CITY_MAX = 12;

function pickPhotonLabel(
  ...values: (string | undefined)[]
): string | undefined {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return undefined;
}

/**
 * Default pin title for reverse geocode at a map zoom — avoids street names when
 * the map is zoomed out to country/city scale.
 */
export function photonDefaultTitleForZoom(
  props: PhotonProps | undefined,
  fullLabel: string,
  zoom: number,
): string {
  if (!Number.isFinite(zoom)) {
    return photonPrimaryTitle("", props, fullLabel);
  }

  const segments = fullLabel
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const fallback = () =>
    pickPhotonLabel(
      props?.country,
      props?.state,
      props?.city,
      props?.town,
      props?.village,
      props?.name,
      props?.street,
      segments[0],
      fullLabel.trim(),
    ) ?? "Place";

  if (zoom < PIN_TITLE_ZOOM_COUNTRY_MAX) {
    return (
      pickPhotonLabel(props?.country, props?.state, segments.at(-1)) ??
      fallback()
    );
  }
  if (zoom < PIN_TITLE_ZOOM_STATE_MAX) {
    return (
      pickPhotonLabel(
        props?.state,
        props?.country,
        props?.city,
        props?.town,
        props?.village,
      ) ?? fallback()
    );
  }
  if (zoom < PIN_TITLE_ZOOM_CITY_MAX) {
    return (
      pickPhotonLabel(
        props?.city,
        props?.town,
        props?.village,
        props?.state,
        props?.country,
      ) ?? fallback()
    );
  }

  return photonPrimaryTitle("", props, fullLabel);
}

type PhotonFeature = NonNullable<PhotonResponse["features"]>[number];

/**
 * Photon/OSM bbox arrays pair longitudes at indices 0 & 2 and latitudes at 1 & 3.
 * Order may be GeoJSON [west,south,east,north] or [west,north,east,south]; min/max fixes both.
 */
function bboxFromLonLatQuadruple(
  nums: readonly [number, number, number, number],
): MapBbox {
  return {
    west: Math.min(nums[0], nums[2]),
    east: Math.max(nums[0], nums[2]),
    south: Math.min(nums[1], nums[3]),
    north: Math.max(nums[1], nums[3]),
  };
}

function photonFeatureToBbox(f: PhotonFeature): MapBbox | undefined {
  const raw = f.bbox;
  if (Array.isArray(raw) && raw.length === 4) {
    const nums = raw.map((x) => Number(x));
    if (nums.every((n) => Number.isFinite(n))) {
      const box = bboxFromLonLatQuadruple(
        nums as [number, number, number, number],
      );
      if (isValidMapBbox(box)) return box;
    }
  }

  const ext = f.properties?.extent;
  if (Array.isArray(ext) && ext.length === 4) {
    const nums = ext.map((x) => Number(x));
    if (nums.every((n) => Number.isFinite(n))) {
      const box = bboxFromLonLatQuadruple(
        nums as [number, number, number, number],
      );
      if (isValidMapBbox(box)) return box;
    }
  }

  return undefined;
}

/** Komoot Photon — public, no API key; usable from the browser (CORS). */
export async function searchPhotonPlaces(
  query: string,
): Promise<PhotonPlace[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "8");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Geocoding request failed");

  const data = (await res.json()) as PhotonResponse;
  const features = data.features ?? [];
  const out: PhotonPlace[] = [];

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const coords = f.geometry?.coordinates;
    if (!coords || coords.length < 2) continue;
    const [lng, lat] = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const fullLabel = photonLabel(f.properties);
    const primaryName = photonPrimaryTitle(q, f.properties, fullLabel);
    const bbox = photonFeatureToBbox(f);
    out.push({
      id: `photon-${i}-${lng.toFixed(4)},${lat.toFixed(4)}`,
      primaryName,
      fullLabel,
      lat,
      lng,
      ...(bbox ? { bbox } : {}),
    });
  }

  return out;
}

async function fetchPhotonReverseFeature(
  lat: number,
  lng: number,
): Promise<PhotonFeature | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const url = new URL("https://photon.komoot.io/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("lang", "en");

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as PhotonResponse;
  const f = data.features?.[0];
  if (!f?.geometry?.coordinates) return null;
  return f;
}

/** Reverse geocode coordinates to a single friendly label (Photon). */
export async function reversePhotonLocationLabel(
  lat: number,
  lng: number,
): Promise<string | null> {
  const f = await fetchPhotonReverseFeature(lat, lng);
  if (!f) return null;
  const label = photonLabel(f.properties).trim();
  return label || null;
}

/**
 * Reverse geocode: full place line plus a short default title. When `zoom` is set,
 * title granularity matches the map scale (country/city vs street).
 */
export async function reversePhotonPlaceDetails(
  lat: number,
  lng: number,
  zoom?: number,
): Promise<{ fullLabel: string | null; shortTitle: string | null }> {
  const f = await fetchPhotonReverseFeature(lat, lng);
  const props = f?.properties;
  if (!f?.geometry?.coordinates || !props) {
    return { fullLabel: null, shortTitle: null };
  }

  const fullLabel = photonLabel(props).trim() || null;
  const shortTitle =
    (zoom !== undefined
      ? photonDefaultTitleForZoom(props, fullLabel ?? "", zoom)
      : photonPrimaryTitle("", props, fullLabel ?? "") || fullLabel || ""
    ).trim() || null;

  return { fullLabel, shortTitle };
}

/** Reverse geocode for persistence on `pins.geocode`. */
export async function reversePhotonGeocode(
  lat: number,
  lng: number,
): Promise<PinGeocode | null> {
  const f = await fetchPhotonReverseFeature(lat, lng);
  const props = f?.properties;
  if (!f?.geometry?.coordinates || !props) return null;

  return {
    source: "photon",
    lat,
    lng,
    fetchedAt: new Date().toISOString(),
    properties: { ...props },
  };
}
