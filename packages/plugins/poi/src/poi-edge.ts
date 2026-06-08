import type { SupabaseClient } from "@supabase/supabase-js";
import type { PoiNearbyCandidate, PoiPinPayload } from "./poi-pin-data";

export type PoiAutoLookupResponse =
  | { synced: true; payload: PoiPinPayload }
  | { synced: false; reason: "nothing_nearby"; payload: PoiPinPayload }
  | {
      skippedReason:
        | "plugin_disabled"
        | "auto_lookup_disabled"
        | "no_coordinates";
    }
  | { error: string };

export type PoiSyncResponse =
  | { synced: true; payload: PoiPinPayload }
  | { synced: false; reason: "nothing_nearby"; payload: PoiPinPayload }
  | { skippedReason: "plugin_disabled" | "no_coordinates" }
  | { error: string };

export type PoiListCandidatesResponse =
  | { candidates: PoiNearbyCandidate[] }
  | { error: string };

export type PoiSetPinPoiResponse =
  | { payload: PoiPinPayload }
  | { error: string };

export type PoiClearPinPoiResponse =
  | { cleared: true; payload?: PoiPinPayload }
  | { error: string };

type PoiEdgeBody = Record<string, unknown>;

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

async function invokePoiEdge<T extends object>(
  supabase: SupabaseClient,
  body: PoiEdgeBody,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>("poi", {
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
      return { error: "poi_invalid_response" } as T;
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

  return { error: "poi_request_failed" } as T;
}

export async function poiSyncPin(
  supabase: SupabaseClient,
  pinId: string,
): Promise<PoiSyncResponse> {
  return invokePoiEdge<PoiSyncResponse>(supabase, {
    action: "sync_pin_poi",
    pinId,
  });
}

/** Run map auto-lookup immediately for one pin (on-demand, not cron). */
export async function poiRunAutoLookup(
  supabase: SupabaseClient,
  pinId: string,
): Promise<PoiAutoLookupResponse> {
  return invokePoiEdge<PoiAutoLookupResponse>(supabase, {
    action: "run_pin_auto_lookup",
    pinId,
  });
}

export async function poiListNearbyCandidates(
  supabase: SupabaseClient,
  pinId: string,
): Promise<PoiListCandidatesResponse> {
  return invokePoiEdge<PoiListCandidatesResponse>(supabase, {
    action: "list_nearby_candidates",
    pinId,
  });
}

export async function poiSetPinPoi(
  supabase: SupabaseClient,
  args: {
    pinId: string;
    osmType: "node" | "way" | "relation";
    osmId: number;
    tags?: Record<string, string>;
    distanceM?: number;
  },
): Promise<PoiSetPinPoiResponse> {
  return invokePoiEdge<PoiSetPinPoiResponse>(supabase, {
    action: "set_pin_poi",
    pinId: args.pinId,
    osmType: args.osmType,
    osmId: args.osmId,
    ...(args.tags ? { tags: args.tags } : {}),
    ...(typeof args.distanceM === "number" && Number.isFinite(args.distanceM)
      ? { distanceM: args.distanceM }
      : {}),
  });
}

export async function poiClearPinPoi(
  supabase: SupabaseClient,
  pinId: string,
): Promise<PoiClearPinPoiResponse> {
  return invokePoiEdge<PoiClearPinPoiResponse>(supabase, {
    action: "clear_pin_poi",
    pinId,
  });
}
