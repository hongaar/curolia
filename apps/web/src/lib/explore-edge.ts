import type {
  ExploreBounds,
  ExploreFilterValues,
  ExplorePlaceDetail,
  ExploreResultEntry,
} from "@curolia/plugin-contract";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PlacesExplorePageResponse = {
  page: number;
  source: "cache" | "upstream";
  hasMore: boolean;
  continuation?: string;
  entries: ExploreResultEntry[];
};

type PlacesExploreResponse = PlacesExplorePageResponse | { error: string };

type PlacesGetResponse =
  | {
      place: ExplorePlaceDetail & {
        lastEnrichedAt?: string;
        osmTags?: unknown;
      };
    }
  | { error: string };

type RouteGenerateResponse =
  | { entries: ExploreResultEntry[] }
  | { error: string };

async function parseFunctionInvokeError(
  error: unknown,
): Promise<string | null> {
  if (!error || typeof error !== "object") return null;
  const ctx = (error as { context?: Response }).context;
  if (!ctx || typeof ctx.json !== "function") return null;
  try {
    const body = (await ctx.json()) as { error?: unknown };
    if (typeof body?.error === "string" && body.error.trim()) {
      return body.error;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function invokeEdge<T extends object>(
  supabase: SupabaseClient,
  slug: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(slug, {
    body,
    ...(signal ? { signal } : {}),
  });
  if (!error) {
    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      return { error: data.error } as T;
    }
    if (!data || typeof data !== "object") {
      return { error: `${slug}_invalid_response` } as T;
    }
    return data;
  }
  const parsed = await parseFunctionInvokeError(error);
  if (parsed) return { error: parsed } as T;
  return { error: `${slug}_request_failed` } as T;
}

function mergeExploreEntries(
  current: ExploreResultEntry[],
  next: ExploreResultEntry[],
): ExploreResultEntry[] {
  const byId = new Map(current.map((entry) => [entry.id, entry]));
  for (const entry of next) byId.set(entry.id, entry);
  return [...byId.values()];
}

export async function placesExploreStaticPage(
  supabase: SupabaseClient,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<PlacesExploreResponse> {
  return invokeEdge<PlacesExploreResponse>(
    supabase,
    "places",
    { action: "explore_static", ...body },
    signal,
  );
}

export async function placesExploreStatic(
  supabase: SupabaseClient,
  args: {
    bounds: ExploreBounds;
    zoom: number;
    categoryId: string;
    mapCenter: { lng: number; lat: number } | null;
    hiddenGems?: boolean;
    /** When true, automatically fetch upstream pages while `hasMore`. */
    fetchUpstreamPages?: boolean;
    onUpdate?: (entries: ExploreResultEntry[]) => void;
  },
  signal?: AbortSignal,
): Promise<
  PlacesExplorePageResponse | { error: string; entries?: ExploreResultEntry[] }
> {
  let continuation: string | undefined;
  let merged: ExploreResultEntry[] = [];
  let page = 0;
  let source: "cache" | "upstream" = "cache";
  let hasMore = false;

  const first = await placesExploreStaticPage(
    supabase,
    {
      bounds: args.bounds,
      zoom: args.zoom,
      categoryId: args.categoryId,
      mapCenter: args.mapCenter,
      hiddenGems: args.hiddenGems ?? false,
    },
    signal,
  );

  if ("error" in first) {
    return { error: first.error, entries: merged };
  }

  merged = mergeExploreEntries(merged, first.entries);
  args.onUpdate?.(merged);
  page = first.page;
  source = first.source;
  hasMore = first.hasMore;
  continuation = first.continuation;

  if (!args.fetchUpstreamPages || !hasMore || !continuation) {
    return { page, source, hasMore, continuation, entries: merged };
  }

  while (hasMore && continuation) {
    if (signal?.aborted) {
      return { page, source, hasMore, continuation, entries: merged };
    }

    const next = await placesExploreStaticPage(
      supabase,
      { continuation },
      signal,
    );
    if ("error" in next) {
      return { error: next.error, entries: merged };
    }

    merged = mergeExploreEntries(merged, next.entries);
    args.onUpdate?.(merged);
    page = next.page;
    source = next.source;
    hasMore = next.hasMore;
    continuation = next.continuation;
  }

  return { page, source, hasMore: false, entries: merged };
}

export async function placesGetPlace(
  supabase: SupabaseClient,
  placeId: string,
): Promise<PlacesGetResponse> {
  return invokeEdge<PlacesGetResponse>(supabase, "places", {
    action: "get_place",
    placeId,
  });
}

export async function routeGenerate(
  supabase: SupabaseClient,
  args: {
    bounds: ExploreBounds;
    categoryId: string;
    profile: "hiking" | "cycling";
    maxDistanceMeters: number;
    mapCenter: { lng: number; lat: number };
  },
): Promise<RouteGenerateResponse> {
  return invokeEdge<RouteGenerateResponse>(supabase, "route", {
    action: "generate",
    bounds: args.bounds,
    categoryId: args.categoryId,
    profile: args.profile,
    maxDistanceMeters: args.maxDistanceMeters,
    mapCenter: args.mapCenter,
  });
}

export function resolveMaxDistanceMeters(
  filterValues: ExploreFilterValues,
  fallback = 5000,
): number {
  const raw = filterValues.maxDistance;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(1000, Math.min(50_000, raw));
  }
  return fallback;
}
