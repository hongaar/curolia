export type Coords = { lat: number; lng: number };

/** Geographic bounding box (west/south/east/north in degrees). */
export type MapBbox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function isValidMapBbox(b: MapBbox): boolean {
  const { west, south, east, north } = b;
  if (![west, south, east, north].every((x) => Number.isFinite(x)))
    return false;
  if (west >= east || south >= north) return false;
  if (south < -90 || north > 90 || west < -180 || east > 180) return false;
  return true;
}

/** Parse "lat,lng" or "lat lng" with optional cardinal suffixes. */
export function parseLatLngPair(raw: string): Coords | null {
  const s = raw.trim();
  if (!s) return null;

  const cardinal = s.match(
    /^(-?\d+(?:\.\d+)?)\s*([°]?\s*)?([NS])\s*[,;\s]+\s*(-?\d+(?:\.\d+)?)\s*([°]?\s*)?([EW])/i,
  );
  if (cardinal) {
    let lat = Number(cardinal[1]);
    let lng = Number(cardinal[4]);
    if (cardinal[3]!.toUpperCase() === "S") lat = -Math.abs(lat);
    if (cardinal[6]!.toUpperCase() === "W") lng = -Math.abs(lng);
    return isValidLatLng(lat, lng) ? { lat, lng } : null;
  }

  const parts = s.split(/[,;\s]+/).filter(Boolean);
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!isValidLatLng(lat, lng)) return null;
  return { lat, lng };
}

const DMS_COMPONENT =
  /(\d+(?:\.\d+)?)\s*°\s*(\d+(?:\.\d+)?)\s*['′]\s*(\d+(?:\.\d+)?)\s*["″]?\s*([NSEW])/gi;

function dmsComponentToDegrees(
  degrees: number,
  minutes: number,
  seconds: number,
  hemisphere: string,
): number | null {
  if (![degrees, minutes, seconds].every(Number.isFinite)) return null;
  let value = degrees + minutes / 60 + seconds / 3600;
  const h = hemisphere.toUpperCase();
  if (h === "S" || h === "W") value = -Math.abs(value);
  else if (h === "N" || h === "E") value = Math.abs(value);
  else return null;
  return value;
}

/** Parse DMS coordinates like `45°59'02.4"N 8°30'32.9"E`. */
export function parseDmsLatLng(raw: string): Coords | null {
  const matches = [...raw.trim().matchAll(DMS_COMPONENT)];
  if (matches.length < 2) return null;

  const first = dmsComponentToDegrees(
    Number(matches[0]![1]),
    Number(matches[0]![2]),
    Number(matches[0]![3]),
    matches[0]![4]!,
  );
  const second = dmsComponentToDegrees(
    Number(matches[1]![1]),
    Number(matches[1]![2]),
    Number(matches[1]![3]),
    matches[1]![4]!,
  );
  if (first == null || second == null) return null;

  const firstHemisphere = matches[0]![4]!.toUpperCase();
  const secondHemisphere = matches[1]![4]!.toUpperCase();
  let lat: number;
  let lng: number;
  if (
    (firstHemisphere === "N" || firstHemisphere === "S") &&
    (secondHemisphere === "E" || secondHemisphere === "W")
  ) {
    lat = first;
    lng = second;
  } else if (
    (secondHemisphere === "N" || secondHemisphere === "S") &&
    (firstHemisphere === "E" || firstHemisphere === "W")
  ) {
    lat = second;
    lng = first;
  } else {
    return null;
  }

  return isValidLatLng(lat, lng) ? { lat, lng } : null;
}

/** Parse decimal or DMS coordinate pairs from pasted text. */
export function parseLocationCoordinates(raw: string): Coords | null {
  return parseLatLngPair(raw) ?? parseDmsLatLng(raw);
}

export function pickBestLocation(
  candidates: ({
    lat: number;
    lng: number;
    label?: string | null;
    source: string;
  } | null)[],
): { lat: number; lng: number; label?: string | null; source: string } | null {
  for (const c of candidates) {
    if (c) return c;
  }
  return null;
}
