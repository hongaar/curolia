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

/** Parse "lat,lng" or "lat lng" with optional cardinal suffixes. */
export function parseLatLngPair(
  raw: string,
): { lat: number; lng: number } | null {
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
