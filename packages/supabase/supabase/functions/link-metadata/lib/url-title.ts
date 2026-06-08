import { parseLatLngPair } from "./_services/coords.ts";

const GENERIC_TITLE_PATTERNS = [
  /^google maps$/i,
  /^maps\s*[-–—]?\s*google$/i,
  /^apple maps$/i,
  /^maps$/i,
];

export function isGenericLinkTitle(title: string | null | undefined): boolean {
  const trimmed = title?.trim();
  if (!trimmed) return true;
  return GENERIC_TITLE_PATTERNS.some((pattern) => pattern.test(trimmed));
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

/** Best-effort place or query name from map URL paths and query params. */
export function extractTitleFromUrl(url: URL | string): string | null {
  const u = typeof url === "string" ? new URL(url) : url;
  return googleMapsPlaceName(u) ?? appleMapsPlaceName(u);
}

function googleMapsPlaceName(url: URL): string | null {
  const host = url.hostname.replace(/^www\./i, "");
  const isMapsContext =
    host === "maps.google.com" ||
    host === "maps.app.goo.gl" ||
    url.pathname.startsWith("/maps") ||
    (host.endsWith(".google.com") && url.pathname.startsWith("/maps"));
  if (!isMapsContext) return null;

  const place = url.pathname.match(/\/maps\/place\/([^/@]+)/i);
  if (place?.[1]) return normalizePlaceLabel(decodePathSegment(place[1]));

  const search = url.pathname.match(/\/maps\/search\/([^/@?]+)/i);
  if (search?.[1]) return normalizePlaceLabel(decodePathSegment(search[1]));

  const destination = url.pathname.match(/\/maps\/dir\/[^/]+\/([^/@?]+)/i);
  if (destination?.[1]) {
    return normalizePlaceLabel(decodePathSegment(destination[1]));
  }

  for (const key of ["q", "query", "place"]) {
    const value = url.searchParams.get(key);
    if (!value || parseLatLngPair(value)) continue;
    const label = normalizePlaceLabel(decodePathSegment(value));
    if (label) return label;
  }

  return null;
}

function appleMapsPlaceName(url: URL): string | null {
  if (!url.hostname.replace(/^www\./i, "").includes("maps.apple.com")) {
    return null;
  }
  for (const key of ["q", "address", "name"]) {
    const value = url.searchParams.get(key);
    if (!value || parseLatLngPair(value)) continue;
    const label = normalizePlaceLabel(decodePathSegment(value));
    if (label) return label;
  }
  return null;
}

export function resolveLinkTitle(options: {
  parsedTitle: string | null;
  finalUrl: string;
  locationLabel?: string | null;
}): string | null {
  const urlTitle = extractTitleFromUrl(options.finalUrl);
  if (isGenericLinkTitle(options.parsedTitle)) {
    return urlTitle ?? options.locationLabel ?? options.parsedTitle;
  }
  return options.parsedTitle;
}
