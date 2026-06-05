import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  OsmPoiNearbyCandidate,
  OsmPoiPinPayload,
} from "./osm-poi-pin-data";

export type OsmPoiSyncResponse =
  | { synced: true; payload: OsmPoiPinPayload }
  | { synced: false; reason: "nothing_nearby"; payload: OsmPoiPinPayload }
  | { skippedReason: "map_plugin_disabled" | "no_coordinates" }
  | { error: string };

export type OsmPoiListCandidatesResponse =
  | { candidates: OsmPoiNearbyCandidate[] }
  | { error: string };

export type OsmPoiSetPinPoiResponse =
  | { payload: OsmPoiPinPayload }
  | { error: string };

export type OsmPoiClearPinPoiResponse = { cleared: true } | { error: string };

type OsmPoiEdgeBody = Record<string, unknown>;

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
    /* ignore malformed error bodies */
  }
  return null;
}

async function invokeOsmPoiEdge<T extends object>(
  supabase: SupabaseClient,
  body: OsmPoiEdgeBody,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>("osm-poi", {
    body,
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
      return { error: "osm_poi_invalid_response" } as T;
    }
    return data;
  }

  const parsed = await parseFunctionInvokeError(error);
  if (parsed) {
    return { error: parsed } as T;
  }

  const message = error.message?.trim();
  if (message && !message.includes("non-2xx")) {
    return { error: message } as T;
  }

  return { error: "osm_poi_request_failed" } as T;
}

export async function osmPoiSyncPin(
  supabase: SupabaseClient,
  pinId: string,
): Promise<OsmPoiSyncResponse> {
  return invokeOsmPoiEdge<OsmPoiSyncResponse>(supabase, {
    action: "sync_pin_poi",
    pinId,
  });
}

export async function osmPoiListNearbyCandidates(
  supabase: SupabaseClient,
  pinId: string,
): Promise<OsmPoiListCandidatesResponse> {
  return invokeOsmPoiEdge<OsmPoiListCandidatesResponse>(supabase, {
    action: "list_nearby_candidates",
    pinId,
  });
}

export async function osmPoiSetPinPoi(
  supabase: SupabaseClient,
  args: {
    pinId: string;
    osmType: "node" | "way" | "relation";
    osmId: number;
  },
): Promise<OsmPoiSetPinPoiResponse> {
  return invokeOsmPoiEdge<OsmPoiSetPinPoiResponse>(supabase, {
    action: "set_pin_poi",
    pinId: args.pinId,
    osmType: args.osmType,
    osmId: args.osmId,
  });
}

export async function osmPoiClearPinPoi(
  supabase: SupabaseClient,
  pinId: string,
): Promise<OsmPoiClearPinPoiResponse> {
  return invokeOsmPoiEdge<OsmPoiClearPinPoiResponse>(supabase, {
    action: "clear_pin_poi",
    pinId,
  });
}
