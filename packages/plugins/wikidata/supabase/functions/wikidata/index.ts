import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { AsyncLruCache } from "./lib/_services/lru-cache.ts";
import {
  looksLikeWikidataId,
  pickArticlesForWikidataIds,
  resolveWikidataIdsForTitles,
} from "./lib/wikidata-sitelinks.ts";
import {
  enrichCandidatesWithThumbnails,
  fetchWikipediaSummary,
  searchWikipediaArticles,
  type SearchGroup,
} from "./lib/wikipedia-api.ts";
import {
  readCountryFromGeocode,
  readWikipediaLanguageSetting,
  resolveLangPrefs,
  wikipediaSearchGroupLabel,
} from "./lib/wikipedia-lang.ts";

/** Keep in sync with `packages/plugins/wikidata/src/constants.ts`. */
const SEARCH_RADIUS_KM = 0.5;
const COORD_EPSILON = 0.0001;
const NEARBY_CANDIDATES_LIMIT = 15;
const SPARQL_ROW_LIMIT = 100;
const AUTO_SYNC_CANDIDATES_LIMIT = 5;
const SEARCH_MIN_CHARS = 2;
const SEARCH_RESULTS_LIMIT = 10;

const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const USER_AGENT =
  "Curolia/1.0 (https://github.com/curolia/curolia; plugin-wikidata)";

type WikidataPinPayload = {
  schemaVersion: 2;
  lat: number;
  lng: number;
  fetchedAt: string;
  wikidataId: string;
  wikipediaLang: string;
  wikipediaTitle: string;
  wikipediaUrl: string;
  label: string;
  extract: string;
  thumbnailUrl: string | null;
  distanceM: number;
  placeType: string | null;
};

type WikidataDeclinedPayload = {
  schemaVersion: 1;
  lat: number;
  lng: number;
  fetchedAt: string;
  declined: true;
};

type PinRow = {
  id: string;
  map_id: string;
  lat: number | null;
  lng: number | null;
  geocode: unknown;
};

type SparqlCandidate = {
  wikidataId: string;
  label: string;
  wikipediaTitle: string;
  wikipediaLang: string;
  distanceM: number;
  placeType: string | null;
  thumbnailUrl: string | null;
};

type RequestBody = {
  action?: string;
  pinId?: string;
  mapId?: string;
  lat?: number;
  lng?: number;
  wikidataId?: string;
  wikipediaTitle?: string;
  wikipediaLang?: string;
  query?: string;
  langPrefs?: string[];
  browserLang?: string;
  country?: string;
};

function cors(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function payloadMatches(
  payload: WikidataPinPayload,
  lat: number,
  lng: number,
): boolean {
  return (
    Math.abs(payload.lat - lat) < COORD_EPSILON &&
    Math.abs(payload.lng - lng) < COORD_EPSILON
  );
}

function parsePayload(raw: unknown): WikidataPinPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const version = o.schemaVersion;
  if (version !== 1 && version !== 2) return null;
  if (typeof o.lat !== "number" || typeof o.lng !== "number") return null;
  if (typeof o.wikipediaTitle !== "string") return null;
  if (typeof o.wikipediaUrl !== "string" || typeof o.label !== "string") {
    return null;
  }
  if (typeof o.extract !== "string" || typeof o.distanceM !== "number") {
    return null;
  }
  if (typeof o.wikidataId !== "string" || typeof o.fetchedAt !== "string") {
    return null;
  }
  if (o.thumbnailUrl !== null && typeof o.thumbnailUrl !== "string") {
    return null;
  }
  if (o.placeType !== null && typeof o.placeType !== "string") return null;

  const wikipediaLang =
    version === 2 && typeof o.wikipediaLang === "string"
      ? o.wikipediaLang
      : "en";

  return {
    schemaVersion: 2,
    lat: o.lat,
    lng: o.lng,
    fetchedAt: o.fetchedAt,
    wikidataId: o.wikidataId,
    wikipediaLang,
    wikipediaTitle: o.wikipediaTitle,
    wikipediaUrl: o.wikipediaUrl,
    label: o.label,
    extract: o.extract,
    thumbnailUrl: o.thumbnailUrl as string | null,
    distanceM: o.distanceM,
    placeType: o.placeType as string | null,
  };
}

function parseDeclinedPayload(raw: unknown): WikidataDeclinedPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 1) return null;
  if (o.declined !== true) return null;
  if (typeof o.lat !== "number" || typeof o.lng !== "number") return null;
  if (typeof o.fetchedAt !== "string") return null;
  return raw as WikidataDeclinedPayload;
}

function declinedPayloadMatches(
  payload: Pick<WikidataDeclinedPayload, "lat" | "lng">,
  lat: number,
  lng: number,
): boolean {
  return (
    Math.abs(payload.lat - lat) < COORD_EPSILON &&
    Math.abs(payload.lng - lng) < COORD_EPSILON
  );
}

function wikidataItemId(uri: string): string | null {
  const m = /\/(Q\d+)$/.exec(uri);
  return m?.[1] ?? null;
}

function buildNearbySparql(lat: number, lng: number, limit: number): string {
  const point = `Point(${lng} ${lat})`;
  return `
SELECT ?place ?placeLabel ?dist (SAMPLE(?typeLabel) AS ?typeLabel) WHERE {
  SERVICE wikibase:around {
    ?place wdt:P625 ?location .
    bd:serviceParam wikibase:center "${point}"^^geo:wktLiteral .
    bd:serviceParam wikibase:radius "${SEARCH_RADIUS_KM}" .
    bd:serviceParam wikibase:distance ?dist .
  }
  ?place wdt:P31/wdt:P279* ?type .
  VALUES ?type {
    wd:Q41176 wd:Q570116 wd:Q838948 wd:Q22698 wd:Q811979 wd:Q4989906
    wd:Q174782 wd:Q1210959 wd:Q15243209 wd:Q6979596 wd:Q12280 wd:Q34627
    wd:Q24354 wd:Q33506 wd:Q23413 wd:Q1248784 wd:Q16917 wd:Q3914
    wd:Q1081138 wd:Q16560 wd:Q317557 wd:Q56242235
  }
  OPTIONAL { ?place wdt:P31 ?directType . ?directType rdfs:label ?typeLabel . FILTER(LANG(?typeLabel) = "en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
GROUP BY ?place ?placeLabel ?dist
ORDER BY ASC(?dist)
LIMIT ${limit}
`.trim();
}

function dedupeCandidates(candidates: SparqlCandidate[]): SparqlCandidate[] {
  const byId = new Map<string, SparqlCandidate>();
  for (const candidate of candidates) {
    const prev = byId.get(candidate.wikidataId);
    if (!prev || candidate.distanceM < prev.distanceM) {
      byId.set(candidate.wikidataId, candidate);
    }
  }
  return [...byId.values()].sort((a, b) => a.distanceM - b.distanceM);
}

function finalizeCandidates(
  candidates: SparqlCandidate[],
  maxResults: number,
): SparqlCandidate[] {
  return dedupeCandidates(candidates).slice(0, maxResults);
}

type SparqlBinding = Record<string, { type: string; value: string }>;

const SPARQL_CANDIDATES_CACHE_SIZE = 128;

const sparqlCandidatesCache = new AsyncLruCache<
  string,
  Array<{
    wikidataId: string;
    label: string;
    distanceM: number;
    placeType: string | null;
  }>
>({
  maxSize: SPARQL_CANDIDATES_CACHE_SIZE,
});

function wikidataCoordCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function normalizeLangPrefs(body: RequestBody, userConfig: unknown): string[] {
  if (Array.isArray(body.langPrefs) && body.langPrefs.length > 0) {
    const prefs: string[] = [];
    for (const lang of body.langPrefs) {
      if (typeof lang !== "string") continue;
      const trimmed = lang.trim().toLowerCase();
      if (trimmed && !prefs.includes(trimmed)) prefs.push(trimmed);
    }
    if (prefs.length > 0) return prefs;
  }

  const setting = readWikipediaLanguageSetting(userConfig);
  return resolveLangPrefs(setting, {
    browserLang: body.browserLang,
    country: body.country,
  });
}

async function fetchSparqlPlacesUncached(
  lat: number,
  lng: number,
): Promise<
  Array<{
    wikidataId: string;
    label: string;
    distanceM: number;
    placeType: string | null;
  }>
> {
  const query = buildNearbySparql(lat, lng, SPARQL_ROW_LIMIT);
  const url = `${WIKIDATA_SPARQL}?format=json&query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": USER_AGENT,
    },
  });
  if (!res.ok) {
    throw new Error(`wikidata_sparql_${res.status}`);
  }
  const json = (await res.json()) as {
    results?: { bindings?: SparqlBinding[] };
  };
  const bindings = json.results?.bindings ?? [];
  const out: Array<{
    wikidataId: string;
    label: string;
    distanceM: number;
    placeType: string | null;
  }> = [];

  for (const row of bindings) {
    const placeUri = row.place?.value;
    const distKm = Number(row.dist?.value);
    if (!placeUri || !Number.isFinite(distKm)) continue;

    const wikidataId = wikidataItemId(placeUri);
    const label = row.placeLabel?.value?.trim();
    if (!wikidataId || !label) continue;

    out.push({
      wikidataId,
      label,
      distanceM: Math.round(distKm * 1000),
      placeType: row.typeLabel?.value?.trim() ?? null,
    });
  }

  const byId = new Map<string, (typeof out)[number]>();
  for (const place of out) {
    const prev = byId.get(place.wikidataId);
    if (!prev || place.distanceM < prev.distanceM) {
      byId.set(place.wikidataId, place);
    }
  }
  return [...byId.values()].sort((a, b) => a.distanceM - b.distanceM);
}

async function queryNearbyCandidates(
  lat: number,
  lng: number,
  maxResults: number,
  langPrefs: string[],
): Promise<SparqlCandidate[]> {
  const places = await sparqlCandidatesCache.getOrFetch(
    `sparql:v2:${wikidataCoordCacheKey(lat, lng)}`,
    () => fetchSparqlPlacesUncached(lat, lng),
  );
  const sliced = places.slice(0, SPARQL_ROW_LIMIT);
  const sparqlLabels = new Map(
    sliced.map((place) => [place.wikidataId, place.label]),
  );
  const articles = await pickArticlesForWikidataIds(
    sliced.map((place) => place.wikidataId),
    langPrefs,
    sparqlLabels,
  );

  const candidates: SparqlCandidate[] = [];
  for (const place of sliced) {
    const article = articles.get(place.wikidataId);
    if (!article) continue;
    candidates.push({
      wikidataId: place.wikidataId,
      label: article.label,
      wikipediaTitle: article.title,
      wikipediaLang: article.lang,
      distanceM: place.distanceM,
      placeType: place.placeType,
      thumbnailUrl: null,
    });
  }

  const finalized = finalizeCandidates(candidates, maxResults);
  return enrichCandidatesWithThumbnails(finalized);
}

async function buildPayloadForCandidate(
  lat: number,
  lng: number,
  candidate: SparqlCandidate,
): Promise<WikidataPinPayload | null> {
  const summary = await fetchWikipediaSummary(
    candidate.wikipediaLang,
    candidate.wikipediaTitle,
  );
  if (!summary) return null;
  const label = looksLikeWikidataId(candidate.label)
    ? summary.title
    : candidate.label;
  return {
    schemaVersion: 2,
    lat,
    lng,
    fetchedAt: new Date().toISOString(),
    wikidataId: candidate.wikidataId,
    wikipediaLang: summary.lang,
    wikipediaTitle: summary.title,
    wikipediaUrl: summary.wikipediaUrl,
    label,
    extract: summary.extract,
    thumbnailUrl: summary.thumbnailUrl,
    distanceM: candidate.distanceM,
    placeType: candidate.placeType,
  };
}

async function resolveNearbyEnrichment(
  lat: number,
  lng: number,
  langPrefs: string[],
): Promise<WikidataPinPayload | null> {
  const candidates = await queryNearbyCandidates(
    lat,
    lng,
    AUTO_SYNC_CANDIDATES_LIMIT,
    langPrefs,
  );
  for (const candidate of candidates) {
    try {
      const payload = await buildPayloadForCandidate(lat, lng, candidate);
      if (payload) return payload;
    } catch (e) {
      console.error(
        "wikipedia summary failed",
        candidate.wikipediaLang,
        candidate.wikipediaTitle,
        e,
      );
    }
  }
  return null;
}

async function loadPinForUser(
  admin: ReturnType<typeof createClient>,
  userId: string,
  pinId: string,
): Promise<
  | { ok: true; pin: PinRow }
  | { ok: false; status: number; body: Record<string, unknown> }
> {
  const { data: pin, error: pinErr } = await admin
    .from("pins")
    .select("id, map_id, lat, lng, geocode")
    .eq("id", pinId)
    .maybeSingle();

  if (pinErr || !pin) {
    return { ok: false, status: 404, body: { error: "pin_not_found" } };
  }

  const t = pin as PinRow;

  if (!(await assertMapMember(admin, t.map_id, userId))) {
    return { ok: false, status: 403, body: { error: "forbidden" } };
  }

  return { ok: true, pin: t };
}

async function upsertPinPayload(
  admin: ReturnType<typeof createClient>,
  pin: PinRow,
  payload: WikidataPinPayload,
): Promise<Response | null> {
  const { error: upsertErr } = await admin.from("plugin_entity_data").upsert(
    {
      map_id: pin.map_id,
      entity_type: "pin",
      entity_id: pin.id,
      plugin_type_id: "wikidata",
      data: payload as unknown as Record<string, unknown>,
    },
    { onConflict: "entity_type,entity_id,plugin_type_id" },
  );

  if (upsertErr) {
    console.error("plugin_entity_data upsert failed", upsertErr);
    return new Response(JSON.stringify({ error: "db_upsert_failed" }), {
      status: 500,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  return null;
}

async function assertMapMember(
  admin: ReturnType<typeof createClient>,
  mapId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("map_members")
    .select("user_id")
    .eq("map_id", mapId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

function langPrefsForPin(
  body: RequestBody,
  userConfig: unknown,
  pin?: PinRow,
): string[] {
  const country =
    body.country ??
    (pin ? readCountryFromGeocode(pin.geocode) : null) ??
    undefined;
  return normalizeLangPrefs({ ...body, country }, userConfig);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/i, "") ?? "";
  if (!jwt) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "invalid_session" }), {
      status: 401,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }
  const userId = userData.user.id;
  const admin = createClient(supabaseUrl, serviceKey);

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "bad_json" }), {
      status: 400,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const { data: userPlugin } = await admin
    .from("user_plugins")
    .select("enabled, config")
    .eq("user_id", userId)
    .eq("plugin_type_id", "wikidata")
    .maybeSingle();

  if (!userPlugin?.enabled) {
    return new Response(JSON.stringify({ error: "plugin_disabled" }), {
      status: 403,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const userConfig = userPlugin.config;

  if (body.action === "search") {
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (query.length < SEARCH_MIN_CHARS) {
      return new Response(JSON.stringify({ error: "query_too_short" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const langPrefs = normalizeLangPrefs(body, userConfig);

    try {
      const groups: SearchGroup[] = await searchWikipediaArticles(
        query,
        langPrefs,
        SEARCH_RESULTS_LIMIT,
        resolveWikidataIdsForTitles,
        wikipediaSearchGroupLabel,
      );
      return new Response(JSON.stringify({ groups }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("wikidata search failed", e);
      return new Response(JSON.stringify({ error: "wikidata_search_failed" }), {
        status: 502,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }
  }

  if (body.action === "lookup_nearby") {
    const mapId = body.mapId?.trim();
    const lat = body.lat;
    const lng = body.lng;
    if (
      !mapId ||
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return new Response(JSON.stringify({ error: "invalid_body" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    if (!(await assertMapMember(admin, mapId, userId))) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const langPrefs = normalizeLangPrefs(body, userConfig);

    try {
      const result = await resolveNearbyEnrichment(lat, lng, langPrefs);
      if (!result) {
        return new Response(JSON.stringify({ reason: "nothing_nearby" }), {
          status: 200,
          headers: { ...cors(), "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ result }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("wikidata lookup_nearby failed", e);
      return new Response(JSON.stringify({ error: "wikidata_lookup_failed" }), {
        status: 502,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }
  }

  if (body.action === "list_nearby_candidates") {
    const pinId = body.pinId?.trim();
    if (!pinId) {
      return new Response(JSON.stringify({ error: "invalid_body" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const loaded = await loadPinForUser(admin, userId, pinId);
    if (!loaded.ok) {
      return new Response(JSON.stringify(loaded.body), {
        status: loaded.status,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const { pin } = loaded;
    const lat = pin.lat;
    const lng = pin.lng;
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return new Response(JSON.stringify({ error: "no_coordinates" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const langPrefs = langPrefsForPin(body, userConfig, pin);

    try {
      const candidates = await queryNearbyCandidates(
        lat,
        lng,
        NEARBY_CANDIDATES_LIMIT,
        langPrefs,
      );
      return new Response(JSON.stringify({ candidates }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("wikidata list_nearby_candidates failed", e);
      return new Response(
        JSON.stringify({ error: "wikidata_list_candidates_failed" }),
        {
          status: 502,
          headers: { ...cors(), "Content-Type": "application/json" },
        },
      );
    }
  }

  if (body.action === "set_pin_enrichment") {
    const pinId = body.pinId?.trim();
    const wikidataId = body.wikidataId?.trim();
    const wikipediaTitle = body.wikipediaTitle?.trim();
    const wikipediaLang = body.wikipediaLang?.trim().toLowerCase();
    if (!pinId || !wikidataId || !wikipediaTitle) {
      return new Response(JSON.stringify({ error: "invalid_body" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const loaded = await loadPinForUser(admin, userId, pinId);
    if (!loaded.ok) {
      return new Response(JSON.stringify(loaded.body), {
        status: loaded.status,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const { pin } = loaded;
    const lat = pin.lat;
    const lng = pin.lng;
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return new Response(JSON.stringify({ error: "no_coordinates" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const langPrefs = langPrefsForPin(body, userConfig, pin);

    try {
      const candidates = await queryNearbyCandidates(
        lat,
        lng,
        NEARBY_CANDIDATES_LIMIT,
        langPrefs,
      );
      const nearby = candidates.find((c) => c.wikidataId === wikidataId);
      const candidate: SparqlCandidate = nearby ?? {
        wikidataId,
        label: wikipediaTitle,
        wikipediaTitle,
        wikipediaLang: wikipediaLang || langPrefs[0] || "en",
        distanceM: 0,
        placeType: null,
        thumbnailUrl: null,
      };
      const payload = await buildPayloadForCandidate(lat, lng, candidate);
      if (!payload) {
        return new Response(
          JSON.stringify({ error: "wikipedia_summary_missing" }),
          {
            status: 502,
            headers: { ...cors(), "Content-Type": "application/json" },
          },
        );
      }

      const upsertErr = await upsertPinPayload(admin, pin, payload);
      if (upsertErr) return upsertErr;

      return new Response(JSON.stringify({ payload }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("wikidata set_pin_enrichment failed", e);
      return new Response(
        JSON.stringify({ error: "wikidata_set_enrichment_failed" }),
        {
          status: 502,
          headers: { ...cors(), "Content-Type": "application/json" },
        },
      );
    }
  }

  if (body.action === "clear_pin_enrichment") {
    const pinId = body.pinId?.trim();
    if (!pinId) {
      return new Response(JSON.stringify({ error: "invalid_body" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const loaded = await loadPinForUser(admin, userId, pinId);
    if (!loaded.ok) {
      return new Response(JSON.stringify(loaded.body), {
        status: loaded.status,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    await admin
      .from("plugin_entity_data")
      .delete()
      .eq("entity_type", "pin")
      .eq("entity_id", loaded.pin.id)
      .eq("plugin_type_id", "wikidata");

    return new Response(JSON.stringify({ cleared: true }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  if (body.action !== "sync_pin_enrichment" || !body.pinId) {
    return new Response(JSON.stringify({ error: "invalid_body" }), {
      status: 400,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const loaded = await loadPinForUser(admin, userId, body.pinId);
  if (!loaded.ok) {
    return new Response(JSON.stringify(loaded.body), {
      status: loaded.status,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const t = loaded.pin;
  const lat = t.lat;
  const lng = t.lng;
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    await admin
      .from("plugin_entity_data")
      .delete()
      .eq("entity_type", "pin")
      .eq("entity_id", t.id)
      .eq("plugin_type_id", "wikidata");

    return new Response(
      JSON.stringify({ skippedReason: "no_coordinates", cleared: true }),
      {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      },
    );
  }

  const langPrefs = langPrefsForPin(body, userConfig, t);

  const { data: cachedRow } = await admin
    .from("plugin_entity_data")
    .select("data")
    .eq("entity_type", "pin")
    .eq("entity_id", t.id)
    .eq("plugin_type_id", "wikidata")
    .maybeSingle();

  const cached = parsePayload(cachedRow?.data);
  if (cached && payloadMatches(cached, lat, lng)) {
    return new Response(JSON.stringify({ synced: true, payload: cached }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const declined = parseDeclinedPayload(cachedRow?.data);
  if (declined && declinedPayloadMatches(declined, lat, lng)) {
    return new Response(
      JSON.stringify({
        synced: false,
        reason: "suggestion_declined",
      }),
      {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      },
    );
  }

  try {
    const payload = await resolveNearbyEnrichment(lat, lng, langPrefs);
    if (!payload) {
      await admin
        .from("plugin_entity_data")
        .delete()
        .eq("entity_type", "pin")
        .eq("entity_id", t.id)
        .eq("plugin_type_id", "wikidata");

      return new Response(
        JSON.stringify({
          synced: false,
          reason: "nothing_nearby",
          cleared: true,
        }),
        {
          status: 200,
          headers: { ...cors(), "Content-Type": "application/json" },
        },
      );
    }

    const { error: upsertErr } = await admin.from("plugin_entity_data").upsert(
      {
        map_id: t.map_id,
        entity_type: "pin",
        entity_id: t.id,
        plugin_type_id: "wikidata",
        data: payload as unknown as Record<string, unknown>,
      },
      { onConflict: "entity_type,entity_id,plugin_type_id" },
    );

    if (upsertErr) {
      console.error("plugin_entity_data upsert failed", upsertErr);
      return new Response(JSON.stringify({ error: "db_upsert_failed" }), {
        status: 500,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ synced: true, payload }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("wikidata sync failed", e);
    return new Response(JSON.stringify({ error: "wikidata_sync_failed" }), {
      status: 502,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }
});
