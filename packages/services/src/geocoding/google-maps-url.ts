import { isValidLatLng, parseLatLngPair, pickBestLocation } from "../coords.ts";

export type ExtractedLocation = {
  lat: number;
  lng: number;
  label?: string | null;
  source: string;
};

function loc(
  lat: number,
  lng: number,
  source: string,
  label?: string | null,
): ExtractedLocation | null {
  if (!isValidLatLng(lat, lng)) return null;
  return { lat, lng, source, label: label ?? null };
}

function fromQueryParams(url: URL, source: string): ExtractedLocation | null {
  const latKeys = ["lat", "latitude", "mlat"];
  const lngKeys = ["lng", "lon", "long", "longitude", "mlon"];
  for (const lk of latKeys) {
    for (const lgk of lngKeys) {
      const latRaw = url.searchParams.get(lk);
      const lngRaw = url.searchParams.get(lgk);
      if (!latRaw || !lngRaw) continue;
      const lat = Number(latRaw);
      const lng = Number(lngRaw);
      const found = loc(lat, lng, source);
      if (found) return found;
    }
  }
  const q = url.searchParams.get("q") ?? url.searchParams.get("query");
  if (q) {
    const pair = parseLatLngPair(q);
    if (pair) return loc(pair.lat, pair.lng, `${source}:q`);
  }
  return null;
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment.replace(/\+/g, " "));
  } catch {
    return segment.replace(/\+/g, " ");
  }
}

function normalizePlaceLabel(label: string): string | null {
  const trimmed = label.trim();
  if (!trimmed || trimmed.length > 200) return null;
  return trimmed;
}

/** Best-effort place name from a Google Maps URL path or query. */
export function extractTitleFromGoogleMapsUrl(
  url: URL | string,
): string | null {
  const u = typeof url === "string" ? new URL(url) : url;
  const host = u.hostname.replace(/^www\./i, "");
  const isMapsContext =
    host === "maps.google.com" ||
    host === "maps.app.goo.gl" ||
    u.pathname.startsWith("/maps") ||
    (host.endsWith(".google.com") && u.pathname.startsWith("/maps"));
  if (!isMapsContext) return null;

  const place = u.pathname.match(/\/maps\/place\/([^/@]+)/i);
  if (place?.[1]) return normalizePlaceLabel(decodePathSegment(place[1]));

  const search = u.pathname.match(/\/maps\/search\/([^/@?]+)/i);
  if (search?.[1]) return normalizePlaceLabel(decodePathSegment(search[1]));

  const q = u.searchParams.get("q") ?? u.searchParams.get("query");
  if (q) {
    const pair = parseLatLngPair(q);
    if (!pair) return normalizePlaceLabel(q);
  }
  return null;
}

function googleMaps(url: URL): ExtractedLocation | null {
  const host = url.hostname.replace(/^www\./i, "");
  const isMapsContext =
    host === "maps.google.com" ||
    host === "maps.app.goo.gl" ||
    url.pathname.startsWith("/maps") ||
    (host.endsWith(".google.com") && url.pathname.startsWith("/maps"));
  if (!isMapsContext) return null;

  const label = extractTitleFromGoogleMapsUrl(url);

  const place3d = url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place3d) {
    const found = loc(
      Number(place3d[1]),
      Number(place3d[2]),
      "google-maps:!3d4d",
      label,
    );
    if (found) return found;
  }

  const at = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) {
    const found = loc(Number(at[1]), Number(at[2]), "google-maps:@", label);
    if (found) return found;
  }

  const ll = url.searchParams.get("ll");
  if (ll) {
    const pair = parseLatLngPair(ll);
    if (pair) return loc(pair.lat, pair.lng, "google-maps:ll", label);
  }

  const fromQuery = fromQueryParams(url, "google-maps:query");
  if (fromQuery && label) return { ...fromQuery, label };
  return fromQuery;
}

/** Google feature / data ID embedded in Maps place URLs (`0x…:0x…`). */
export function extractGoogleMapsFeatureIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const haystack = u.pathname + u.search + u.hash;
    const match =
      haystack.match(/!1s(0x[a-f0-9]+:0x[a-f0-9]+)/i) ??
      haystack.match(/(?:^|[/?&])1s(0x[a-f0-9]+:0x[a-f0-9]+)/i);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

/**
 * Decimal CID used by legacy Places Details (`?cid=` or derived from feature id).
 * @see https://outscraper.com/place-id-feature-id-cid/
 */
export function extractGoogleMapsCidFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const cidParam = u.searchParams.get("cid")?.trim();
    if (cidParam && /^\d+$/.test(cidParam)) return cidParam;

    const featureId = extractGoogleMapsFeatureIdFromUrl(url);
    if (!featureId) return null;
    const rightHex = featureId.split(":")[1];
    if (!rightHex || !/^0x[a-f0-9]+$/.test(rightHex)) return null;
    return BigInt(rightHex).toString(10);
  } catch {
    return null;
  }
}

/** Stable dedup key from a Google Maps place URL (place CID when present). */
export function normalizeGoogleMapsPlaceKey(url: string): string {
  try {
    const u = new URL(url);
    const pathAndData = u.origin + u.pathname + u.hash;
    const cid =
      pathAndData.match(/!1s([^!&?]+)/)?.[1] ??
      pathAndData.match(/1s([^:!&?]+)/)?.[1];
    if (cid) return `cid:${cid.toLowerCase()}`;
    const path = `${u.hostname}${u.pathname}`.toLowerCase();
    const q = u.searchParams.get("q") ?? u.searchParams.get("query") ?? "";
    return `url:${path}?${q.toLowerCase()}`;
  } catch {
    return `raw:${url.trim().toLowerCase()}`;
  }
}

export function isGoogleMapsPlaceUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./i, "");
    return (
      host === "maps.google.com" ||
      host === "maps.app.goo.gl" ||
      u.pathname.startsWith("/maps") ||
      (host.endsWith(".google.com") && u.pathname.startsWith("/maps"))
    );
  } catch {
    return false;
  }
}

/** Try known Google Maps URL patterns for embedded coordinates. */
export function extractLocationFromGoogleMapsUrl(
  url: URL | string,
): ExtractedLocation | null {
  const u = typeof url === "string" ? new URL(url) : url;
  return pickBestLocation([googleMaps(u)]);
}

/** Lat/lng from embedded URL patterns only (no network). */
export function coordsFromGoogleMapsUrl(
  url: string,
): { lat: number; lng: number } | null {
  try {
    const location = extractLocationFromGoogleMapsUrl(url);
    if (!location) return null;
    return { lat: location.lat, lng: location.lng };
  } catch {
    return null;
  }
}
