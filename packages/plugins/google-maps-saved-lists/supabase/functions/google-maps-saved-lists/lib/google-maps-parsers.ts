import {
  extractLocationFromMapShareUrl,
  extractTitleFromMapShareUrl,
  isMapShareUrl,
  normalizeMapPlaceKey,
} from "./_services/geocoding/index.ts";

export type ParsedPlace = {
  dedupKey: string;
  title: string;
  note: string | null;
  googleMapsUrl: string;
  lat: number | null;
  lng: number | null;
  source: "starred" | "collection";
  collectionName?: string;
  /** Set after an HTTP coordinate lookup was attempted (even when it failed). */
  coordLookupAttempted?: boolean;
};

type GeoJsonFeature = {
  type?: string;
  geometry?: { type?: string; coordinates?: number[] };
  properties?: Record<string, unknown>;
  google_maps_url?: string;
  location?:
    | { name?: string; address?: string }
    | { name?: string; address?: string }[];
};

export function parseStarredGeoJson(text: string): ParsedPlace[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }

  const features: GeoJsonFeature[] = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      if (
        item &&
        typeof item === "object" &&
        (item as GeoJsonFeature).type === "Feature"
      ) {
        features.push(item as GeoJsonFeature);
      }
    }
  } else if (data && typeof data === "object") {
    const root = data as { type?: string; features?: GeoJsonFeature[] };
    if (Array.isArray(root.features)) features.push(...root.features);
    else if (root.type === "Feature") features.push(root as GeoJsonFeature);
  }

  const out: ParsedPlace[] = [];
  for (const f of features) {
    const coords = f.geometry?.coordinates;
    const lng = coords?.[0];
    const lat = coords?.[1];
    const props = f.properties ?? {};
    const googleMapsUrl =
      (typeof props.google_maps_url === "string"
        ? props.google_maps_url
        : null) ??
      (typeof f.google_maps_url === "string" ? f.google_maps_url : null);
    if (!googleMapsUrl) continue;

    const loc = f.location;
    const locObj = Array.isArray(loc) ? loc[0] : loc;
    const title =
      (typeof locObj?.name === "string" && locObj.name.trim()) ||
      extractTitleFromMapShareUrl(googleMapsUrl) ||
      "Place";

    out.push({
      dedupKey: normalizeMapPlaceKey(googleMapsUrl),
      title,
      note: null,
      googleMapsUrl,
      lat: typeof lat === "number" && lat !== 0 ? lat : null,
      lng: typeof lng === "number" && lng !== 0 ? lng : null,
      source: "starred",
    });
  }
  return out;
}

/** Minimal RFC4180-ish CSV row parser (handles quoted fields). */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && next === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim().length > 0)) rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim().length > 0)) rows.push(row);
  return rows;
}

export type ParsedCollection = {
  name: string;
  description: string | null;
  places: ParsedPlace[];
};

export function parseSavedCollectionsCsv(
  fileName: string,
  text: string,
): ParsedCollection | null {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return null;

  let collectionDescription: string | null = null;
  let headerIdx = 0;

  const first = rows[0]?.[0]?.trim() ?? "";
  if (
    first &&
    !first.toLowerCase().includes("title") &&
    rows.length > 1 &&
    (rows[1]?.[0]?.toLowerCase().includes("title") ||
      rows[1]?.some((c) => {
        const lower = c.toLowerCase();
        return lower === "item_content_url" || lower === "url";
      }))
  ) {
    collectionDescription = first;
    headerIdx = 2;
  }

  const header = rows[headerIdx]?.map((h) => h.trim().toLowerCase()) ?? [];
  let titleIdx = header.indexOf("title");
  let noteIdx = header.indexOf("note");
  let urlIdx = header.indexOf("item_content_url");
  if (urlIdx < 0) urlIdx = header.indexOf("url");

  if (urlIdx < 0) {
    for (let i = 0; i < rows.length; i++) {
      const h = rows[i]?.map((c) => c.trim().toLowerCase()) ?? [];
      const idx = h.indexOf("item_content_url");
      const urlCol = idx >= 0 ? idx : h.indexOf("url");
      if (urlCol >= 0) {
        headerIdx = i;
        titleIdx = h.indexOf("title");
        noteIdx = h.indexOf("note");
        urlIdx = urlCol;
        break;
      }
    }
  }

  if (urlIdx < 0) return null;

  const collectionName =
    fileName
      .replace(/\.csv$/i, "")
      .replace(/^Collection of saved items\s*[-–]?\s*/i, "")
      .trim() || "Saved list";

  const places: ParsedPlace[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i]!;
    const url = r[urlIdx]?.trim() ?? "";
    if (!url || !isMapShareUrl(url)) continue;

    const title =
      (titleIdx >= 0 ? r[titleIdx]?.trim() : "") ||
      extractTitleFromMapShareUrl(url) ||
      "Place";
    const note = noteIdx >= 0 ? r[noteIdx]?.trim() || null : null;
    const loc = extractLocationFromMapShareUrl(url);

    places.push({
      dedupKey: normalizeMapPlaceKey(url),
      title,
      note,
      googleMapsUrl: url,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      source: "collection",
      collectionName,
    });
  }

  return {
    name: collectionName,
    description: collectionDescription,
    places,
  };
}

export { normalizeMapPlaceKey };
