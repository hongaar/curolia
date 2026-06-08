import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { AsyncLruCache } from "./lib/_services/lru-cache.ts";

/** Keep in sync with `packages/plugins/wikidata/src/constants.ts`. */
const SEARCH_RADIUS_KM = 0.5;
const COORD_EPSILON = 0.0001;
const NEARBY_CANDIDATES_LIMIT = 15;
const SPARQL_ROW_LIMIT = 100;
const AUTO_SYNC_CANDIDATES_LIMIT = 5;

const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const WIKIPEDIA_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const USER_AGENT =
  "Curolia/1.0 (https://github.com/curolia/curolia; plugin-wikidata)";

type WikidataPinPayload = {
  schemaVersion: 1;
  lat: number;
  lng: number;
  fetchedAt: string;
  wikidataId: string;
  wikipediaTitle: string;
  wikipediaUrl: string;
  label: string;
  extract: string;
  thumbnailUrl: string | null;
  distanceM: number;
  placeType: string | null;
};

type PinRow = {
  id: string;
  map_id: string;
  lat: number | null;
  lng: number | null;
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
  if (o.schemaVersion !== 1) return null;
  if (typeof o.lat !== "number" || typeof o.lng !== "number") return null;
  if (typeof o.wikipediaTitle !== "string") return null;
  return raw as WikidataPinPayload;
}

function wikidataItemId(uri: string): string | null {
  const m = /\/(Q\d+)$/.exec(uri);
  return m?.[1] ?? null;
}

function wikipediaTitleFromArticleUri(uri: string): string | null {
  const marker = "en.wikipedia.org/wiki/";
  const idx = uri.indexOf(marker);
  if (idx === -1) return null;
  const encoded = uri
    .slice(idx + marker.length)
    .split("#")[0]
    ?.split("?")[0];
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded.replace(/_/g, " "));
  } catch {
    return encoded.replace(/_/g, " ");
  }
}

function buildNearbySparql(lat: number, lng: number, limit: number): string {
  const point = `Point(${lng} ${lat})`;
  return `
SELECT ?place ?placeLabel ?article ?dist (SAMPLE(?typeLabel) AS ?typeLabel) WHERE {
  SERVICE wikibase:around {
    ?place wdt:P625 ?location .
    bd:serviceParam wikibase:center "${point}"^^geo:wktLiteral .
    bd:serviceParam wikibase:radius "${SEARCH_RADIUS_KM}" .
    bd:serviceParam wikibase:distance ?dist .
  }
  ?article schema:about ?place ;
            schema:inLanguage "en" ;
            schema:isPartOf <https://en.wikipedia.org/> .
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
GROUP BY ?place ?placeLabel ?article ?dist
ORDER BY ASC(?dist)
LIMIT ${limit}
`.trim();
}

function finalizeCandidates(
  candidates: SparqlCandidate[],
  maxResults: number,
): SparqlCandidate[] {
  return dedupeCandidates(candidates).slice(0, maxResults);
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

type SparqlBinding = Record<string, { type: string; value: string }>;

type SparqlCandidate = {
  wikidataId: string;
  label: string;
  wikipediaTitle: string;
  distanceM: number;
  placeType: string | null;
  thumbnailUrl: string | null;
};

type WikiSummary = {
  title: string;
  extract: string;
  thumbnailUrl: string | null;
  wikipediaUrl: string;
};

const SPARQL_CANDIDATES_CACHE_SIZE = 128;
const WIKIPEDIA_SUMMARY_CACHE_SIZE = 256;

const sparqlCandidatesCache = new AsyncLruCache<string, SparqlCandidate[]>({
  maxSize: SPARQL_CANDIDATES_CACHE_SIZE,
});
const wikipediaSummaryCache = new AsyncLruCache<string, WikiSummary | null>({
  maxSize: WIKIPEDIA_SUMMARY_CACHE_SIZE,
});

function wikidataCoordCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function wikipediaTitleCacheKey(title: string): string {
  return title.trim().replace(/\s+/g, "_").toLowerCase();
}

async function queryNearbyCandidates(
  lat: number,
  lng: number,
  maxResults: number,
): Promise<SparqlCandidate[]> {
  const deduped = await sparqlCandidatesCache.getOrFetch(
    `sparql:v1:${wikidataCoordCacheKey(lat, lng)}`,
    () => fetchSparqlCandidatesUncached(lat, lng),
  );
  const sliced = finalizeCandidates(deduped, maxResults);
  return enrichCandidatesWithThumbnails(sliced);
}

async function fetchSparqlCandidatesUncached(
  lat: number,
  lng: number,
): Promise<SparqlCandidate[]> {
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
  const out: SparqlCandidate[] = [];

  for (const row of bindings) {
    const placeUri = row.place?.value;
    const articleUri = row.article?.value;
    const distKm = Number(row.dist?.value);
    if (!placeUri || !articleUri || !Number.isFinite(distKm)) continue;

    const wikidataId = wikidataItemId(placeUri);
    const wikipediaTitle = wikipediaTitleFromArticleUri(articleUri);
    const label = row.placeLabel?.value?.trim();
    if (!wikidataId || !wikipediaTitle || !label) continue;

    out.push({
      wikidataId,
      label,
      wikipediaTitle,
      distanceM: Math.round(distKm * 1000),
      placeType: row.typeLabel?.value?.trim() ?? null,
      thumbnailUrl: null,
    });
  }

  return dedupeCandidates(out);
}

async function fetchWikipediaSummary(
  title: string,
): Promise<WikiSummary | null> {
  return wikipediaSummaryCache.getOrFetch(
    `wiki:summary:en:${wikipediaTitleCacheKey(title)}`,
    () => fetchWikipediaSummaryUncached(title),
  );
}

async function fetchWikipediaSummaryUncached(
  title: string,
): Promise<WikiSummary | null> {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"));
  const res = await fetch(`${WIKIPEDIA_SUMMARY}${encoded}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`wikipedia_summary_${res.status}`);
  }
  const json = (await res.json()) as Record<string, unknown>;
  const extract = typeof json.extract === "string" ? json.extract.trim() : "";
  const resolvedTitle =
    typeof json.title === "string" ? json.title.trim() : title;
  const thumb = json.thumbnail as { source?: string } | undefined;
  const urls = json.content_urls as { desktop?: { page?: string } } | undefined;
  const pageUrl = urls?.desktop?.page?.trim();
  if (!extract || !pageUrl) return null;

  return {
    title: resolvedTitle,
    extract,
    thumbnailUrl: typeof thumb?.source === "string" ? thumb.source : null,
    wikipediaUrl: pageUrl,
  };
}

async function fetchWikipediaThumbnail(title: string): Promise<string | null> {
  const summary = await fetchWikipediaSummary(title);
  return summary?.thumbnailUrl ?? null;
}

async function enrichCandidatesWithThumbnails(
  candidates: SparqlCandidate[],
): Promise<SparqlCandidate[]> {
  return Promise.all(
    candidates.map(async (candidate) => {
      try {
        const thumbnailUrl = await fetchWikipediaThumbnail(
          candidate.wikipediaTitle,
        );
        return {
          ...candidate,
          thumbnailUrl,
        };
      } catch (e) {
        console.error(
          "wikipedia thumbnail failed",
          candidate.wikipediaTitle,
          e,
        );
        return candidate;
      }
    }),
  );
}

async function resolveNearbyEnrichment(
  lat: number,
  lng: number,
): Promise<WikidataPinPayload | null> {
  const candidates = await queryNearbyCandidates(
    lat,
    lng,
    AUTO_SYNC_CANDIDATES_LIMIT,
  );
  for (const candidate of candidates) {
    try {
      const summary = await fetchWikipediaSummary(candidate.wikipediaTitle);
      if (!summary) continue;
      return {
        schemaVersion: 1,
        lat,
        lng,
        fetchedAt: new Date().toISOString(),
        wikidataId: candidate.wikidataId,
        wikipediaTitle: summary.title,
        wikipediaUrl: summary.wikipediaUrl,
        label: candidate.label,
        extract: summary.extract,
        thumbnailUrl: summary.thumbnailUrl,
        distanceM: candidate.distanceM,
        placeType: candidate.placeType,
      };
    } catch (e) {
      console.error("wikipedia summary failed", candidate.wikipediaTitle, e);
    }
  }
  return null;
}

async function buildPayloadForCandidate(
  lat: number,
  lng: number,
  candidate: SparqlCandidate,
): Promise<WikidataPinPayload | null> {
  const summary = await fetchWikipediaSummary(candidate.wikipediaTitle);
  if (!summary) return null;
  return {
    schemaVersion: 1,
    lat,
    lng,
    fetchedAt: new Date().toISOString(),
    wikidataId: candidate.wikidataId,
    wikipediaTitle: summary.title,
    wikipediaUrl: summary.wikipediaUrl,
    label: candidate.label,
    extract: summary.extract,
    thumbnailUrl: summary.thumbnailUrl,
    distanceM: candidate.distanceM,
    placeType: candidate.placeType,
  };
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
    .select("id, map_id, lat, lng")
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

  let body: {
    action?: string;
    pinId?: string;
    mapId?: string;
    lat?: number;
    lng?: number;
    wikidataId?: string;
    wikipediaTitle?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "bad_json" }), {
      status: 400,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const { data: userPlugin } = await admin
    .from("user_plugins")
    .select("enabled")
    .eq("user_id", userId)
    .eq("plugin_type_id", "wikidata")
    .maybeSingle();

  if (!userPlugin?.enabled) {
    return new Response(JSON.stringify({ error: "plugin_disabled" }), {
      status: 403,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
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

    try {
      const result = await resolveNearbyEnrichment(lat, lng);
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

    try {
      const candidates = await queryNearbyCandidates(
        lat,
        lng,
        NEARBY_CANDIDATES_LIMIT,
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

    try {
      const candidates = await queryNearbyCandidates(
        lat,
        lng,
        NEARBY_CANDIDATES_LIMIT,
      );
      const candidate = candidates.find((c) => c.wikidataId === wikidataId) ?? {
        wikidataId,
        label: wikipediaTitle,
        wikipediaTitle,
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

  try {
    const payload = await resolveNearbyEnrichment(lat, lng);
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
