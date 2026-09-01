import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  ENRICHMENT_PLUGINS,
  EXPLORE_CATEGORY_OSM_FILTERS,
  LIVE_LIMIT,
  MAX_TILES_UPSTREAM_PER_REQUEST,
  OVERPASS_TILE_TIMEOUT_MS,
  UPSTREAM_INLINE_BUDGET_MS,
  ZOOM_DATASET,
  type ExploreBounds,
} from "./lib/constants.ts";
import {
  decodeContinuation,
  encodeContinuation,
  type ExploreContinuation,
} from "./lib/continuation.ts";
import {
  fetchClustersInBbox,
  fetchPlaceEntryById,
  fetchPlacesInBbox,
  loadPlaceMetadataBatch,
  type ExploreResultEntry,
} from "./lib/explore-db.ts";
import {
  candidateFromElement,
  fetchOverpassBbox,
  type BboxPlaceCandidate,
} from "./lib/overpass-bbox.ts";
import {
  listStaleExploreTiles,
  tileBounds,
  tileDegForZoom,
  tileTtlMs,
  tilesForBounds,
  touchExploreTile,
  type ExploreTile,
} from "./lib/tiles.ts";

type ExploreStaticBody = {
  action: "explore_static" | "get_place" | "recompute_prominence_batch";
  bounds?: ExploreBounds;
  zoom?: number;
  categoryId?: string;
  mapCenter?: { lng: number; lat: number };
  placeId?: string;
  hiddenGems?: boolean;
  /** Opaque token from a prior page when `hasMore` was true. */
  continuation?: string;
};

type ExploreStaticPageResponse = {
  page: number;
  source: "cache" | "upstream";
  hasMore: boolean;
  continuation?: string;
  entries: ExploreResultEntry[];
};

function cors(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
}

function explorePageResponse(body: ExploreStaticPageResponse): Response {
  return jsonResponse(200, body);
}

function parseBounds(raw: unknown): ExploreBounds | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const west = Number(o.west);
  const south = Number(o.south);
  const east = Number(o.east);
  const north = Number(o.north);
  if (
    !Number.isFinite(west) ||
    !Number.isFinite(south) ||
    !Number.isFinite(east) ||
    !Number.isFinite(north)
  ) {
    return null;
  }
  return { west, south, east, north };
}

async function enqueueEnrichmentJobs(
  admin: ReturnType<typeof createClient>,
  placeId: string,
): Promise<void> {
  for (const pluginTypeId of ENRICHMENT_PLUGINS) {
    const { error } = await admin.rpc("enqueue_place_enrichment_job", {
      p_plugin_type_id: pluginTypeId,
      p_place_id: placeId,
      p_event: "place_discovered",
    });
    if (error && !error.message.includes("place_enrichment_jobs_active_idx")) {
      console.warn(
        "place enrichment enqueue failed",
        pluginTypeId,
        error.message,
      );
    }
  }
}

async function upsertCandidate(
  admin: ReturnType<typeof createClient>,
  candidate: BboxPlaceCandidate,
): Promise<string> {
  const { data: existing } = await admin
    .from("places")
    .select("id")
    .eq("source", "osm")
    .eq("source_ref", candidate.sourceRef)
    .maybeSingle();

  const { data, error } = await admin.rpc("upsert_osm_place", {
    p_source_ref: candidate.sourceRef,
    p_lng: candidate.lng,
    p_lat: candidate.lat,
    p_name: candidate.name,
    p_primary_category: candidate.primaryCategory,
    p_categories: candidate.categories,
    p_osm_tags: candidate.tags,
  });
  if (error) throw error;
  const placeId = data as string;
  if (!existing) {
    await enqueueEnrichmentJobs(admin, placeId);
  }
  return placeId;
}

async function refreshTileFromUpstream(
  admin: ReturnType<typeof createClient>,
  tile: ExploreTile,
  tileDeg: number,
  categoryId: string,
  mapCenter: { lng: number; lat: number } | null,
  excludedPlaceIds: Set<string>,
): Promise<ExploreResultEntry[]> {
  const osmFilter = EXPLORE_CATEGORY_OSM_FILTERS[categoryId];
  if (!osmFilter) return [];

  const bounds = tileBounds(tile, tileDeg);
  const elements = await fetchOverpassBbox(
    bounds.west,
    bounds.south,
    bounds.east,
    bounds.north,
    osmFilter,
    LIVE_LIMIT,
    OVERPASS_TILE_TIMEOUT_MS,
  );

  const entries: ExploreResultEntry[] = [];
  const seenSourceRefs = new Set<string>();
  for (const el of elements) {
    const candidate = candidateFromElement(el, categoryId);
    if (!candidate || seenSourceRefs.has(candidate.sourceRef)) continue;
    seenSourceRefs.add(candidate.sourceRef);

    const placeId = await upsertCandidate(admin, candidate);
    if (excludedPlaceIds.has(placeId)) continue;

    const entry = await fetchPlaceEntryById(
      admin,
      placeId,
      categoryId,
      mapCenter,
    );
    if (!entry || excludedPlaceIds.has(entry.id)) continue;

    excludedPlaceIds.add(entry.id);
    entries.push(entry);
  }

  await touchExploreTile(admin, categoryId, tileDeg, tile);
  return entries;
}

async function refreshTilesFromUpstream(
  admin: ReturnType<typeof createClient>,
  tiles: readonly ExploreTile[],
  tileDeg: number,
  categoryId: string,
  mapCenter: { lng: number; lat: number } | null,
  excludedPlaceIds: Set<string>,
): Promise<ExploreResultEntry[]> {
  const entries: ExploreResultEntry[] = [];
  const deadlineMs = Date.now() + UPSTREAM_INLINE_BUDGET_MS;
  for (const tile of tiles) {
    if (Date.now() >= deadlineMs) break;
    try {
      entries.push(
        ...(await refreshTileFromUpstream(
          admin,
          tile,
          tileDeg,
          categoryId,
          mapCenter,
          excludedPlaceIds,
        )),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "tile_refresh_failed";
      console.warn("places tile upstream refresh failed", message, tile);
    }
  }
  return entries;
}

async function fetchDbExploreEntries(
  admin: ReturnType<typeof createClient>,
  bounds: ExploreBounds,
  categoryId: string,
  zoom: number,
  mapCenter: { lng: number; lat: number } | null,
  hiddenGems: boolean,
): Promise<ExploreResultEntry[]> {
  if (zoom < ZOOM_DATASET) {
    const clusters = await fetchClustersInBbox(admin, bounds, categoryId);
    const anchors = await fetchPlacesInBbox(
      admin,
      bounds,
      categoryId,
      mapCenter,
      false,
      8,
    );
    return [...clusters, ...anchors];
  }

  return fetchPlacesInBbox(admin, bounds, categoryId, mapCenter, hiddenGems);
}

function buildContinuation(state: ExploreContinuation): string | undefined {
  if (state.pendingTiles.length === 0) return undefined;
  return encodeContinuation(state);
}

async function handleExploreStaticFirstPage(
  admin: ReturnType<typeof createClient>,
  body: ExploreStaticBody,
): Promise<Response> {
  const bounds = parseBounds(body.bounds);
  const categoryId = body.categoryId;
  const zoom = typeof body.zoom === "number" ? body.zoom : 12;
  const mapCenter = body.mapCenter ?? null;
  const hiddenGems = Boolean(body.hiddenGems);

  if (!bounds || !categoryId) {
    return jsonResponse(400, { error: "bounds_and_category_required" });
  }
  if (!EXPLORE_CATEGORY_OSM_FILTERS[categoryId]) {
    return jsonResponse(400, { error: "unknown_category" });
  }

  try {
    const entries = await fetchDbExploreEntries(
      admin,
      bounds,
      categoryId,
      zoom,
      mapCenter,
      hiddenGems,
    );

    let pendingTiles: ExploreTile[] = [];
    let tileDeg = tileDegForZoom(zoom);
    if (zoom >= ZOOM_DATASET) {
      tileDeg = tileDegForZoom(zoom);
      const tiles = tilesForBounds(bounds, tileDeg);
      pendingTiles = await listStaleExploreTiles(
        admin,
        categoryId,
        tileDeg,
        tiles,
        tileTtlMs(zoom),
      );
    }

    const excludedPlaceIds = entries.map((entry) => entry.id);
    const continuationState: ExploreContinuation = {
      v: 1,
      bounds,
      categoryId,
      zoom,
      mapCenter,
      hiddenGems,
      tileDeg,
      excludedPlaceIds,
      pendingTiles,
      page: 2,
    };

    return explorePageResponse({
      page: 1,
      source: "cache",
      hasMore: pendingTiles.length > 0,
      continuation: buildContinuation(continuationState),
      entries,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "explore_failed";
    console.error("places explore_static page 1", message);
    return jsonResponse(502, { error: message });
  }
}

async function handleExploreStaticContinuation(
  admin: ReturnType<typeof createClient>,
  token: string,
): Promise<Response> {
  const state = decodeContinuation(token);
  if (!state) {
    return jsonResponse(400, { error: "invalid_continuation" });
  }
  if (!EXPLORE_CATEGORY_OSM_FILTERS[state.categoryId]) {
    return jsonResponse(400, { error: "unknown_category" });
  }
  if (state.pendingTiles.length === 0) {
    return explorePageResponse({
      page: state.page,
      source: "upstream",
      hasMore: false,
      entries: [],
    });
  }

  try {
    const excludedPlaceIds = new Set(state.excludedPlaceIds);
    const batch = state.pendingTiles.slice(0, MAX_TILES_UPSTREAM_PER_REQUEST);
    const remainingTiles = state.pendingTiles.slice(
      MAX_TILES_UPSTREAM_PER_REQUEST,
    );

    const entries = await refreshTilesFromUpstream(
      admin,
      batch,
      state.tileDeg,
      state.categoryId,
      state.mapCenter,
      excludedPlaceIds,
    );

    const nextState: ExploreContinuation = {
      ...state,
      excludedPlaceIds: [...excludedPlaceIds],
      pendingTiles: remainingTiles,
      page: state.page + 1,
    };

    return explorePageResponse({
      page: state.page,
      source: "upstream",
      hasMore: remainingTiles.length > 0,
      continuation: buildContinuation(nextState),
      entries,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "explore_failed";
    console.error("places explore_static continuation", message);
    return jsonResponse(502, { error: message });
  }
}

async function handleExploreStatic(
  admin: ReturnType<typeof createClient>,
  body: ExploreStaticBody,
): Promise<Response> {
  if (typeof body.continuation === "string" && body.continuation.trim()) {
    return handleExploreStaticContinuation(admin, body.continuation.trim());
  }
  return handleExploreStaticFirstPage(admin, body);
}

async function handleGetPlace(
  admin: ReturnType<typeof createClient>,
  placeId: string,
): Promise<Response> {
  const { data: row, error } = await admin
    .from("places")
    .select(
      "id, name, lat, lng, primary_category, categories, pin_count, prominence_score, osm_tags, last_enriched_at",
    )
    .eq("id", placeId)
    .maybeSingle();
  if (error) return jsonResponse(500, { error: error.message });
  if (!row) return jsonResponse(404, { error: "place_not_found" });

  const metadataByPlace = await loadPlaceMetadataBatch(admin, [placeId]);
  const metadata = metadataByPlace.get(placeId) ?? {};

  return jsonResponse(200, {
    place: {
      placeId: row.id,
      name: row.name ?? "Place",
      subtitle: row.primary_category ?? undefined,
      lat: row.lat,
      lng: row.lng,
      categories: row.categories,
      pinCount: row.pin_count,
      prominenceScore: row.prominence_score,
      metadata,
      lastEnrichedAt: row.last_enriched_at,
      osmTags: row.osm_tags,
    },
  });
}

async function handleRecomputeProminenceBatch(
  admin: ReturnType<typeof createClient>,
): Promise<Response> {
  const { data: rows, error } = await admin
    .from("places")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) return jsonResponse(500, { error: error.message });

  for (const row of rows ?? []) {
    await admin.rpc("recompute_place_prominence", { p_place_id: row.id });
  }
  return jsonResponse(200, { recomputed: rows?.length ?? 0 });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return jsonResponse(500, { error: "supabase_env_missing" });
  }

  const admin = createClient(supabaseUrl, serviceRole);
  const body = (await req.json().catch(() => ({}))) as ExploreStaticBody;

  switch (body.action) {
    case "explore_static":
      return handleExploreStatic(admin, body);
    case "get_place":
      if (!body.placeId) {
        return jsonResponse(400, { error: "place_id_required" });
      }
      return handleGetPlace(admin, body.placeId);
    case "recompute_prominence_batch":
      return handleRecomputeProminenceBatch(admin);
    default:
      return jsonResponse(400, { error: "unknown_action" });
  }
});
