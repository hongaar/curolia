/** Keep in sync with `packages/plugins/flickr/src/constants.ts`. */
export const FLICKR_SEARCH_RADIUS_KM = 0.5;
export const FLICKR_NEARBY_CANDIDATES_LIMIT = 24;

/** CC BY, CC BY-SA, CC0, Public domain — safe to surface in the product. */
export const FLICKR_LICENSE_IDS = "4,5,9,10";

export const FLICKR_USER_AGENT =
  "Curolia/1.0 (https://github.com/curolia/curolia; plugin-flickr)";

export type FlickrApiPhoto = {
  id: string;
  owner: string;
  secret: string;
  server: string;
  farm: string;
  title: string;
  latitude?: string;
  longitude?: string;
  pathalias?: string;
  url_s?: string;
  url_m?: string;
  url_z?: string;
  url_l?: string;
  url_o?: string;
  datetaken?: string;
  width_o?: string;
  height_o?: string;
  width_z?: string;
  height_z?: string;
  width_l?: string;
  height_l?: string;
};

export type FlickrNearbyCandidate = {
  photoId: string;
  secret: string;
  server: string;
  farm: number;
  owner: string;
  pathAlias: string | null;
  title: string | null;
  displayUrl: string;
  thumbUrl: string;
  productUrl: string;
  width: number | null;
  height: number | null;
  capturedAt: string | null;
  latitude: number;
  longitude: number;
  distanceM: number;
};

function flickrStaticUrl(
  server: string,
  id: string,
  secret: string,
  size: string,
): string {
  return `https://live.staticflickr.com/${server}/${id}_${secret}_${size}.jpg`;
}

function pickDisplayUrl(photo: FlickrApiPhoto): string | null {
  if (photo.url_z) return photo.url_z;
  if (photo.url_l) return photo.url_l;
  if (photo.url_m) return photo.url_m;
  if (photo.server && photo.secret)
    return flickrStaticUrl(photo.server, photo.id, photo.secret, "z");
  return null;
}

function pickThumbUrl(photo: FlickrApiPhoto): string | null {
  if (photo.url_m) return photo.url_m;
  if (photo.url_s) return photo.url_s;
  if (photo.url_z) return photo.url_z;
  if (photo.server && photo.secret)
    return flickrStaticUrl(photo.server, photo.id, photo.secret, "m");
  return null;
}

function pickDimensions(photo: FlickrApiPhoto): {
  width: number | null;
  height: number | null;
} {
  const pairs: Array<[string | undefined, string | undefined]> = [
    [photo.width_z, photo.height_z],
    [photo.width_l, photo.height_l],
    [photo.width_o, photo.height_o],
  ];
  for (const [w, h] of pairs) {
    const width = w ? parseInt(w, 10) : NaN;
    const height = h ? parseInt(h, 10) : NaN;
    if (
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width > 0 &&
      height > 0
    ) {
      return { width, height };
    }
  }
  return { width: null, height: null };
}

function flickrProductUrl(photo: FlickrApiPhoto): string {
  const alias = photo.pathalias?.trim();
  const ownerSegment = alias && alias.length > 0 ? alias : photo.owner;
  return `https://www.flickr.com/photos/${encodeURIComponent(ownerSegment)}/${encodeURIComponent(photo.id)}`;
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

function normalizePhotoList(raw: unknown): FlickrApiPhoto[] {
  if (!raw) return [];
  return Array.isArray(raw)
    ? (raw as FlickrApiPhoto[])
    : [raw as FlickrApiPhoto];
}

export async function searchFlickrNearby(
  apiKey: string,
  lat: number,
  lng: number,
  limit: number,
): Promise<FlickrNearbyCandidate[]> {
  const url = new URL("https://api.flickr.com/services/rest/");
  url.searchParams.set("method", "flickr.photos.search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("nojsoncallback", "1");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("radius", String(FLICKR_SEARCH_RADIUS_KM));
  url.searchParams.set("radius_units", "km");
  url.searchParams.set("has_geo", "1");
  url.searchParams.set("content_type", "1");
  url.searchParams.set("media", "photos");
  url.searchParams.set("safe_search", "1");
  url.searchParams.set("license", FLICKR_LICENSE_IDS);
  url.searchParams.set("sort", "interestingness-desc");
  url.searchParams.set("per_page", String(Math.min(100, Math.max(1, limit))));
  url.searchParams.set(
    "extras",
    "url_s,url_m,url_z,url_l,url_o,owner_name,path_alias,date_taken,geo_datum,geo_is_public,license",
  );

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": FLICKR_USER_AGENT },
  });
  const json = (await res.json()) as {
    stat?: string;
    code?: number;
    message?: string;
    photos?: { photo?: unknown };
  };

  if (!res.ok || json.stat === "fail") {
    const msg = json.message ?? "flickr_search_failed";
    throw new Error(msg);
  }

  const photos = normalizePhotoList(json.photos?.photo);
  const out: FlickrNearbyCandidate[] = [];

  for (const photo of photos) {
    const photoLat = photo.latitude ? parseFloat(photo.latitude) : NaN;
    const photoLng = photo.longitude ? parseFloat(photo.longitude) : NaN;
    const displayUrl = pickDisplayUrl(photo);
    const thumbUrl = pickThumbUrl(photo);
    if (
      !photo.id ||
      !photo.secret ||
      !photo.server ||
      !displayUrl ||
      !thumbUrl ||
      !Number.isFinite(photoLat) ||
      !Number.isFinite(photoLng)
    ) {
      continue;
    }

    const { width, height } = pickDimensions(photo);
    const pathAlias = photo.pathalias?.trim() || null;
    const capturedAt = photo.datetaken?.trim()
      ? new Date(photo.datetaken).toISOString()
      : null;

    out.push({
      photoId: photo.id,
      secret: photo.secret,
      server: photo.server,
      farm: parseInt(photo.farm, 10) || 0,
      owner: photo.owner,
      pathAlias,
      title: photo.title?.trim() || null,
      displayUrl,
      thumbUrl,
      productUrl: flickrProductUrl(photo),
      width,
      height,
      capturedAt:
        capturedAt && Number.isFinite(Date.parse(capturedAt))
          ? capturedAt
          : null,
      latitude: photoLat,
      longitude: photoLng,
      distanceM: haversineM(lat, lng, photoLat, photoLng),
    });
  }

  out.sort((a, b) => a.distanceM - b.distanceM);
  return out.slice(0, limit);
}

export function flickrExternalRef(
  candidate: FlickrNearbyCandidate,
): Record<string, unknown> {
  return {
    kind: "flickr",
    photoId: candidate.photoId,
    secret: candidate.secret,
    server: candidate.server,
    farm: candidate.farm,
    owner: candidate.owner,
    pathAlias: candidate.pathAlias,
    displayUrl: candidate.displayUrl,
    thumbUrl: candidate.thumbUrl,
    productUrl: candidate.productUrl,
  };
}

export function parseFlickrCandidate(
  raw: unknown,
): FlickrNearbyCandidate | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const photoId = o.photoId;
  const secret = o.secret;
  const server = o.server;
  const owner = o.owner;
  const displayUrl = o.displayUrl;
  const thumbUrl = o.thumbUrl;
  const productUrl = o.productUrl;
  const latitude = o.latitude;
  const longitude = o.longitude;
  const distanceM = o.distanceM;
  if (
    typeof photoId !== "string" ||
    typeof secret !== "string" ||
    typeof server !== "string" ||
    typeof owner !== "string" ||
    typeof displayUrl !== "string" ||
    typeof thumbUrl !== "string" ||
    typeof productUrl !== "string" ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    typeof distanceM !== "number"
  ) {
    return null;
  }
  const farm = typeof o.farm === "number" ? o.farm : 0;
  const pathAlias =
    o.pathAlias === null || typeof o.pathAlias === "string"
      ? o.pathAlias
      : null;
  const title =
    o.title === null || typeof o.title === "string" ? o.title : null;
  const width =
    o.width === null || typeof o.width === "number" ? o.width : null;
  const height =
    o.height === null || typeof o.height === "number" ? o.height : null;
  const capturedAt =
    o.capturedAt === null || typeof o.capturedAt === "string"
      ? o.capturedAt
      : null;
  return {
    photoId,
    secret,
    server,
    farm,
    owner,
    pathAlias,
    title,
    displayUrl,
    thumbUrl,
    productUrl,
    width,
    height,
    capturedAt,
    latitude,
    longitude,
    distanceM,
  };
}
