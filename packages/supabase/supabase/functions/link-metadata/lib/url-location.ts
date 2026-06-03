import { isValidLatLng, parseLatLngPair, pickBestLocation } from "./coords.ts";
import type { ExtractedLocation } from "./types.ts";

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

function hostIncludes(url: URL, fragment: string): boolean {
  return url.hostname.replace(/^www\./i, "").includes(fragment);
}

function googleMaps(url: URL): ExtractedLocation | null {
  const host = url.hostname.replace(/^www\./i, "");
  const isMapsContext =
    host === "maps.google.com" ||
    host === "maps.app.goo.gl" ||
    url.pathname.startsWith("/maps") ||
    (host.endsWith(".google.com") && url.pathname.startsWith("/maps"));
  if (!isMapsContext) return null;

  const place3d = url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place3d) {
    const found = loc(
      Number(place3d[1]),
      Number(place3d[2]),
      "google-maps:!3d4d",
    );
    if (found) return found;
  }

  const at = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) {
    const found = loc(Number(at[1]), Number(at[2]), "google-maps:@");
    if (found) return found;
  }

  const ll = url.searchParams.get("ll");
  if (ll) {
    const pair = parseLatLngPair(ll);
    if (pair) return loc(pair.lat, pair.lng, "google-maps:ll");
  }

  return fromQueryParams(url, "google-maps:query");
}

function appleMaps(url: URL): ExtractedLocation | null {
  if (!hostIncludes(url, "maps.apple.com")) return null;
  const ll = url.searchParams.get("ll");
  if (ll) {
    const pair = parseLatLngPair(ll);
    if (pair) {
      const label =
        url.searchParams.get("q") ?? url.searchParams.get("address");
      return loc(pair.lat, pair.lng, "apple-maps:ll", label);
    }
  }
  const near = url.searchParams.get("near");
  if (near) {
    const pair = parseLatLngPair(near);
    if (pair) return loc(pair.lat, pair.lng, "apple-maps:near");
  }
  return fromQueryParams(url, "apple-maps:query");
}

function openStreetMap(url: URL): ExtractedLocation | null {
  if (!hostIncludes(url, "openstreetmap.org")) return null;
  const hash = url.hash.match(/#map=\d+\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/);
  if (hash) {
    const found = loc(Number(hash[1]), Number(hash[2]), "openstreetmap:hash");
    if (found) return found;
  }
  return fromQueryParams(url, "openstreetmap:query");
}

function geoUri(url: URL): ExtractedLocation | null {
  if (url.protocol !== "geo:") return null;
  const body = url.pathname.replace(/^\//, "") + url.search + url.hash;
  const pair = parseLatLngPair(body.split("?")[0] ?? "");
  if (pair) return loc(pair.lat, pair.lng, "geo-uri");
  return null;
}

function waze(url: URL): ExtractedLocation | null {
  if (!hostIncludes(url, "waze.com")) return null;
  const ll = url.searchParams.get("ll");
  if (!ll) return null;
  const pair = parseLatLngPair(ll);
  return pair ? loc(pair.lat, pair.lng, "waze:ll") : null;
}

function bingMaps(url: URL): ExtractedLocation | null {
  if (!hostIncludes(url, "bing.com")) return null;
  const cp = url.searchParams.get("cp");
  if (cp) {
    const tilde = cp.split("~");
    if (tilde.length === 2) {
      const found = loc(Number(tilde[0]), Number(tilde[1]), "bing-maps:cp");
      if (found) return found;
    }
  }
  return fromQueryParams(url, "bing-maps:query");
}

function duckDuckGoMaps(url: URL): ExtractedLocation | null {
  if (!hostIncludes(url, "duckduckgo.com")) return null;
  if (url.searchParams.get("iaxm") !== "maps") return null;
  const ll = url.searchParams.get("ull");
  if (!ll) return null;
  const pair = parseLatLngPair(decodeURIComponent(ll));
  return pair ? loc(pair.lat, pair.lng, "duckduckgo:ull") : null;
}

function allTrails(url: URL): ExtractedLocation | null {
  if (!hostIncludes(url, "alltrails.com")) return null;
  return fromQueryParams(url, "alltrails:query");
}

function yandexMaps(url: URL): ExtractedLocation | null {
  if (!hostIncludes(url, "yandex.")) return null;
  const ll = url.searchParams.get("ll");
  if (ll) {
    const pair = parseLatLngPair(ll.replace(/%2C/gi, ","));
    if (pair) return loc(pair.lat, pair.lng, "yandex:ll");
  }
  const pt = url.searchParams.get("pt");
  if (pt) {
    const pair = parseLatLngPair(pt);
    if (pair) return loc(pair.lat, pair.lng, "yandex:pt");
  }
  return null;
}

function mapbox(url: URL): ExtractedLocation | null {
  if (!hostIncludes(url, "mapbox.com")) return null;
  const at = url.pathname.match(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) {
    const found = loc(Number(at[1]), Number(at[2]), "mapbox:path");
    if (found) return found;
  }
  return fromQueryParams(url, "mapbox:query");
}

function hereMaps(url: URL): ExtractedLocation | null {
  if (!hostIncludes(url, "here.com") && !hostIncludes(url, "wego.here.com")) {
    return null;
  }
  const map = url.searchParams.get("map");
  if (map) {
    const parts = map.split(",");
    if (parts.length >= 2) {
      const found = loc(Number(parts[0]), Number(parts[1]), "here:map");
      if (found) return found;
    }
  }
  return fromQueryParams(url, "here:query");
}

const URL_EXTRACTORS: ((url: URL) => ExtractedLocation | null)[] = [
  geoUri,
  googleMaps,
  appleMaps,
  openStreetMap,
  waze,
  bingMaps,
  duckDuckGoMaps,
  allTrails,
  yandexMaps,
  mapbox,
  hereMaps,
  (url) => fromQueryParams(url, "generic:query"),
];

/** Try known map/place URL patterns for embedded coordinates. */
export function extractLocationFromUrl(
  url: URL | string,
): ExtractedLocation | null {
  const u = typeof url === "string" ? new URL(url) : url;
  return pickBestLocation(URL_EXTRACTORS.map((fn) => fn(u)));
}
