/** Keep in sync with `packages/plugins/commons/src/constants.ts`. */
export const COMMONS_SEARCH_RADIUS_M = 500;
export const COMMONS_NEARBY_CANDIDATES_LIMIT = 24;
export const COMMONS_MIN_IMAGE_DIMENSION = 320;

export const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
export const COMMONS_USER_AGENT =
  "Curolia/1.0 (https://github.com/curolia/curolia; plugin-commons)";

const PHOTO_MIME_PREFIXES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export type CommonsNearbyCandidate = {
  fileTitle: string;
  pageId: number;
  title: string | null;
  displayUrl: string;
  thumbUrl: string;
  productUrl: string;
  width: number | null;
  height: number | null;
  licenseShortName: string | null;
  author: string | null;
  latitude: number;
  longitude: number;
  distanceM: number;
};

type ExtMetadataField = { value?: string };
type ImageInfoRow = {
  url?: string;
  thumburl?: string;
  width?: number;
  height?: number;
  mime?: string;
  extmetadata?: Record<string, ExtMetadataField>;
};

type GeoPage = {
  pageid?: number;
  title?: string;
  coordinates?: Array<{
    lat?: number;
    lon?: number;
    dist?: number;
  }>;
  imageinfo?: ImageInfoRow[];
};

function commonsFilePageUrl(fileTitle: string): string {
  const normalized = fileTitle.trim().replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(normalized)}`;
}

function readExtMetadata(
  ext: Record<string, ExtMetadataField> | undefined,
  key: string,
): string | null {
  const raw = ext?.[key]?.value;
  if (typeof raw !== "string") return null;
  const stripped = raw.replace(/<[^>]+>/g, "").trim();
  return stripped.length > 0 ? stripped : null;
}

/** CC0, public domain, CC BY, CC BY-SA — excludes NC/ND and non-free terms. */
export function isAllowedCommonsLicense(licenseShortName: string): boolean {
  const s = licenseShortName.toLowerCase();
  if (
    s.includes("fair use") ||
    s.includes("copyrighted") ||
    s.includes("all rights reserved") ||
    s.includes("non-free") ||
    s.includes("non free")
  ) {
    return false;
  }
  if (
    s.includes("-nc") ||
    s.includes(" non-commercial") ||
    s.includes(" non commercial") ||
    s.includes("-nd") ||
    s.includes(" no derivatives") ||
    s.includes("no derivative")
  ) {
    return false;
  }
  if (s.includes("cc0") || s.includes("cc zero")) return true;
  if (s.includes("public domain") || s.includes("pd-")) return true;
  if (s.includes("cc by-sa") || s.includes("cc-by-sa")) return true;
  if (s.includes("cc by") || s.includes("cc-by")) return true;
  if (s.includes("creative commons attribution")) return true;
  return false;
}

function isPhotoMime(mime: string | undefined): boolean {
  if (!mime) return false;
  const lower = mime.toLowerCase();
  return PHOTO_MIME_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

function haversineM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const r = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

function displayTitleFromFileTitle(fileTitle: string): string {
  const base = fileTitle.replace(/^File:/i, "").replace(/\.[^.]+$/, "");
  return base.replace(/_/g, " ").trim() || fileTitle;
}

function parseGeoPage(
  page: GeoPage,
  searchLat: number,
  searchLng: number,
): CommonsNearbyCandidate | null {
  const fileTitle = page.title?.trim();
  const pageId = page.pageid;
  const coord = page.coordinates?.[0];
  const info = page.imageinfo?.[0];
  if (
    !fileTitle ||
    !fileTitle.startsWith("File:") ||
    typeof pageId !== "number" ||
    !info
  ) {
    return null;
  }

  const lat = coord?.lat;
  const lng = coord?.lon;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  const distanceM = haversineM(searchLat, searchLng, lat, lng);

  const licenseShortName = readExtMetadata(
    info.extmetadata,
    "LicenseShortName",
  );
  if (!licenseShortName || !isAllowedCommonsLicense(licenseShortName)) {
    return null;
  }

  if (!isPhotoMime(info.mime)) return null;

  const width = typeof info.width === "number" ? info.width : null;
  const height = typeof info.height === "number" ? info.height : null;
  if (
    (width != null && width < COMMONS_MIN_IMAGE_DIMENSION) ||
    (height != null && height < COMMONS_MIN_IMAGE_DIMENSION)
  ) {
    return null;
  }

  const displayUrl = info.url?.trim();
  const thumbUrl = info.thumburl?.trim() || displayUrl;
  if (!displayUrl || !thumbUrl) return null;

  const author =
    readExtMetadata(info.extmetadata, "Artist") ??
    readExtMetadata(info.extmetadata, "Credit");

  return {
    fileTitle,
    pageId,
    title: displayTitleFromFileTitle(fileTitle),
    displayUrl,
    thumbUrl,
    productUrl: commonsFilePageUrl(fileTitle),
    width,
    height,
    licenseShortName,
    author,
    latitude: lat,
    longitude: lng,
    distanceM,
  };
}

export async function searchCommonsNearby(
  lat: number,
  lng: number,
  limit: number,
): Promise<CommonsNearbyCandidate[]> {
  const url = new URL(COMMONS_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("generator", "geosearch");
  url.searchParams.set("ggsnamespace", "6");
  url.searchParams.set("ggsprimary", "all");
  url.searchParams.set("ggscoord", `${lat}|${lng}`);
  url.searchParams.set("ggsradius", String(COMMONS_SEARCH_RADIUS_M));
  url.searchParams.set(
    "ggslimit",
    String(Math.min(50, Math.max(1, limit * 3))),
  );
  url.searchParams.set("prop", "coordinates|imageinfo");
  url.searchParams.set("coprop", "type");
  url.searchParams.set("iiprop", "url|size|extmetadata|mime");
  url.searchParams.set("iiurlwidth", "400");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": COMMONS_USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("commons_search_failed");
  }

  const json = (await res.json()) as {
    error?: { code?: string; info?: string };
    query?: { pages?: Record<string, GeoPage> };
  };

  if (json.error) {
    throw new Error(
      json.error.info ?? json.error.code ?? "commons_search_failed",
    );
  }

  const pages = Object.values(json.query?.pages ?? {});
  const out: CommonsNearbyCandidate[] = [];
  for (const page of pages) {
    const candidate = parseGeoPage(page, lat, lng);
    if (candidate) out.push(candidate);
  }

  out.sort((a, b) => a.distanceM - b.distanceM);
  return out.slice(0, limit);
}

export function commonsExternalRef(
  candidate: CommonsNearbyCandidate,
): Record<string, unknown> {
  return {
    kind: "commons",
    fileTitle: candidate.fileTitle,
    pageId: candidate.pageId,
    displayUrl: candidate.displayUrl,
    thumbUrl: candidate.thumbUrl,
    productUrl: candidate.productUrl,
    licenseShortName: candidate.licenseShortName,
    author: candidate.author,
  };
}

export function parseCommonsCandidate(
  raw: unknown,
): CommonsNearbyCandidate | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const fileTitle = o.fileTitle;
  const pageId = o.pageId;
  const displayUrl = o.displayUrl;
  const thumbUrl = o.thumbUrl;
  const productUrl = o.productUrl;
  const latitude = o.latitude;
  const longitude = o.longitude;
  const distanceM = o.distanceM;
  if (
    typeof fileTitle !== "string" ||
    typeof pageId !== "number" ||
    typeof displayUrl !== "string" ||
    typeof thumbUrl !== "string" ||
    typeof productUrl !== "string" ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    typeof distanceM !== "number"
  ) {
    return null;
  }
  const title =
    o.title === null || typeof o.title === "string" ? o.title : null;
  const width =
    o.width === null || typeof o.width === "number" ? o.width : null;
  const height =
    o.height === null || typeof o.height === "number" ? o.height : null;
  const licenseShortName =
    o.licenseShortName === null || typeof o.licenseShortName === "string"
      ? o.licenseShortName
      : null;
  const author =
    o.author === null || typeof o.author === "string" ? o.author : null;
  return {
    fileTitle,
    pageId,
    title,
    displayUrl,
    thumbUrl,
    productUrl,
    width,
    height,
    licenseShortName,
    author,
    latitude,
    longitude,
    distanceM,
  };
}
