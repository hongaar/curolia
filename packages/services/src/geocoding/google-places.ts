import type { Coords } from "../coords.ts";

const PLACES_FETCH_TIMEOUT_MS = 12_000;
const LEGACY_DETAILS_URL =
  "https://maps.googleapis.com/maps/api/place/details/json";
const PLACES_SEARCH_TEXT_URL =
  "https://places.googleapis.com/v1/places:searchText";

const GOOGLE_PLACES_REFERRER_KEY_ISSUE =
  "GOOGLE_PLACES_API_KEY is restricted to HTTP referrers (a browser key). " +
  "Create a separate server key for Edge Functions: set Application restrictions " +
  "to None (local dev) or IP addresses (production), enable Places API and " +
  "Places API (New), and update GOOGLE_PLACES_API_KEY.";

const GOOGLE_PLACES_INVALID_KEY_ISSUE =
  "GOOGLE_PLACES_API_KEY is invalid or expired. Create a new key in Google Cloud " +
  "Console, enable Places API and Places API (New), and update the Edge Function env.";

type GooglePlacesClientState = {
  fatalIssue: string | null;
  textSearchDisabled: boolean;
};

function isReferrerRestrictionSignal(
  ...parts: Array<string | undefined>
): boolean {
  const haystack = parts.filter(Boolean).join(" ").toLowerCase();
  return (
    haystack.includes("referer restrictions") ||
    haystack.includes("referer <empty>") ||
    haystack.includes("api_key_http_referrer")
  );
}

function isInvalidKeySignal(...parts: Array<string | undefined>): boolean {
  const haystack = parts.filter(Boolean).join(" ").toLowerCase();
  return (
    haystack.includes("api key expired") ||
    haystack.includes("api_key_invalid") ||
    haystack.includes("api key not valid") ||
    haystack.includes("the provided api key is invalid")
  );
}

export type GooglePlacesClient = {
  fetchCoordsByCid: (cid: string) => Promise<Coords | null>;
  fetchCoordsByTextQuery: (textQuery: string) => Promise<Coords | null>;
  getKeyIssue: () => string | null;
};

export function createGooglePlacesClient(
  apiKey: string | undefined,
): GooglePlacesClient | null {
  const key = apiKey?.trim();
  if (!key) return null;

  const state: GooglePlacesClientState = {
    fatalIssue: null,
    textSearchDisabled: false,
  };

  function noteFatalKeyIssue(message: string): void {
    if (!state.fatalIssue) state.fatalIssue = message;
  }

  function disableTextSearch(): void {
    state.textSearchDisabled = true;
  }

  return {
    getKeyIssue: () => state.fatalIssue,
    fetchCoordsByCid: (cid) => {
      if (state.fatalIssue) return Promise.resolve(null);
      return fetchLegacyPlaceDetailsByCid(key, cid, { noteFatalKeyIssue });
    },
    fetchCoordsByTextQuery: (textQuery) => {
      if (state.fatalIssue || state.textSearchDisabled) {
        return Promise.resolve(null);
      }
      return fetchPlaceCoordsByTextSearch(key, textQuery, {
        disableTextSearch,
      });
    },
  };
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PLACES_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function coordsFromLegacyGeometry(geometry: unknown): Coords | null {
  if (!geometry || typeof geometry !== "object") return null;
  const location = (geometry as { location?: { lat?: number; lng?: number } })
    .location;
  const lat = location?.lat;
  const lng = location?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Legacy Place Details — accepts decimal `cid` from Maps URLs. */
async function fetchLegacyPlaceDetailsByCid(
  apiKey: string,
  cid: string,
  hooks: {
    noteFatalKeyIssue: (message: string) => void;
  },
): Promise<Coords | null> {
  const params = new URLSearchParams({
    cid,
    fields: "geometry",
    key: apiKey,
  });
  try {
    const res = await fetchWithTimeout(`${LEGACY_DETAILS_URL}?${params}`);
    if (!res.ok) {
      console.warn("google places details failed", cid, res.status);
      let errorBody: unknown = null;
      try {
        errorBody = await res.json();
      } catch {
        /* ignore */
      }
      const errorText =
        typeof errorBody === "object" && errorBody
          ? JSON.stringify(errorBody)
          : "";
      if (isReferrerRestrictionSignal(errorText)) {
        hooks.noteFatalKeyIssue(GOOGLE_PLACES_REFERRER_KEY_ISSUE);
      } else if (isInvalidKeySignal(errorText)) {
        hooks.noteFatalKeyIssue(GOOGLE_PLACES_INVALID_KEY_ISSUE);
      }
      return null;
    }
    const body = (await res.json()) as {
      status?: string;
      error_message?: string;
      result?: { geometry?: unknown };
    };
    if (body.status !== "OK") {
      console.warn("google places details status", cid, body.status);
      if (isReferrerRestrictionSignal(body.status, body.error_message)) {
        hooks.noteFatalKeyIssue(GOOGLE_PLACES_REFERRER_KEY_ISSUE);
      } else if (isInvalidKeySignal(body.status, body.error_message)) {
        hooks.noteFatalKeyIssue(GOOGLE_PLACES_INVALID_KEY_ISSUE);
      }
      return null;
    }
    return coordsFromLegacyGeometry(body.result?.geometry);
  } catch (err) {
    console.warn("google places details error", cid, err);
    return null;
  }
}

/** Places API (New) Text Search — first result location. */
async function fetchPlaceCoordsByTextSearch(
  apiKey: string,
  textQuery: string,
  hooks: {
    disableTextSearch: () => void;
  },
): Promise<Coords | null> {
  const query = textQuery.trim();
  if (!query) return null;
  try {
    const res = await fetchWithTimeout(PLACES_SEARCH_TEXT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.location",
      },
      body: JSON.stringify({ textQuery: query }),
    });
    if (!res.ok) {
      console.warn(
        "google places search failed",
        query.slice(0, 80),
        res.status,
      );
      let errorBody: unknown = null;
      try {
        errorBody = await res.json();
      } catch {
        /* ignore */
      }
      const errorText =
        typeof errorBody === "object" && errorBody
          ? JSON.stringify(errorBody).slice(0, 200)
          : null;
      if (
        isReferrerRestrictionSignal(errorText ?? undefined) ||
        isInvalidKeySignal(errorText ?? undefined)
      ) {
        hooks.disableTextSearch();
      }
      return null;
    }
    const body = (await res.json()) as {
      places?: Array<{ location?: { latitude?: number; longitude?: number } }>;
    };
    const location = body.places?.[0]?.location;
    const lat = location?.latitude;
    const lng = location?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch (err) {
    console.warn("google places search error", query.slice(0, 80), err);
    return null;
  }
}
