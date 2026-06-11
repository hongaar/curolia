import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WikidataNearbyCandidate,
  WikidataPinPayload,
  WikidataSearchHit,
} from "./wikidata-pin-data";

export type WikidataSyncResponse =
  | {
      skippedReason: "no_coordinates";
      cleared?: boolean;
    }
  | {
      synced: true;
      payload: WikidataPinPayload;
    }
  | {
      synced: false;
      reason: "nothing_nearby";
      cleared?: boolean;
    }
  | {
      error: string;
    };

export type WikidataNearbyLookupResponse =
  | {
      result: WikidataPinPayload;
    }
  | {
      reason: "nothing_nearby";
    }
  | {
      error: string;
    };

export type WikidataListCandidatesResponse =
  | {
      candidates: WikidataNearbyCandidate[];
    }
  | {
      error: string;
    };

export type WikidataSetEnrichmentResponse =
  | {
      payload: WikidataPinPayload;
    }
  | {
      error: string;
    };

export type WikidataClearEnrichmentResponse =
  | {
      cleared: true;
    }
  | {
      error: string;
    };

export type WikidataSearchResponse =
  | {
      results: WikidataSearchHit[];
    }
  | {
      error: string;
    };

export async function wikidataSyncPinEnrichment(
  supabase: SupabaseClient,
  pinId: string,
): Promise<WikidataSyncResponse> {
  const { data, error } = await supabase.functions.invoke<WikidataSyncResponse>(
    "wikidata",
    { body: { action: "sync_pin_enrichment", pinId } },
  );
  if (error) {
    return { error: error.message || "wikidata_sync_failed" };
  }
  if (!data || typeof data !== "object") {
    return { error: "wikidata_sync_invalid_response" };
  }
  return data;
}

export async function wikidataLookupNearby(
  supabase: SupabaseClient,
  args: { mapId: string; lat: number; lng: number },
): Promise<WikidataNearbyLookupResponse> {
  const { data, error } =
    await supabase.functions.invoke<WikidataNearbyLookupResponse>("wikidata", {
      body: {
        action: "lookup_nearby",
        mapId: args.mapId,
        lat: args.lat,
        lng: args.lng,
      },
    });
  if (error) {
    return { error: error.message || "wikidata_lookup_failed" };
  }
  if (!data || typeof data !== "object") {
    return { error: "wikidata_lookup_invalid_response" };
  }
  return data;
}

export async function wikidataListNearbyCandidates(
  supabase: SupabaseClient,
  pinId: string,
): Promise<WikidataListCandidatesResponse> {
  const { data, error } =
    await supabase.functions.invoke<WikidataListCandidatesResponse>(
      "wikidata",
      {
        body: { action: "list_nearby_candidates", pinId },
      },
    );
  if (error) {
    return { error: error.message || "wikidata_list_candidates_failed" };
  }
  if (!data || typeof data !== "object") {
    return { error: "wikidata_list_candidates_invalid_response" };
  }
  return data;
}

export async function wikidataSetPinEnrichment(
  supabase: SupabaseClient,
  args: {
    pinId: string;
    wikidataId: string;
    wikipediaTitle: string;
  },
): Promise<WikidataSetEnrichmentResponse> {
  const { data, error } =
    await supabase.functions.invoke<WikidataSetEnrichmentResponse>("wikidata", {
      body: {
        action: "set_pin_enrichment",
        pinId: args.pinId,
        wikidataId: args.wikidataId,
        wikipediaTitle: args.wikipediaTitle,
      },
    });
  if (error) {
    return { error: error.message || "wikidata_set_enrichment_failed" };
  }
  if (!data || typeof data !== "object") {
    return { error: "wikidata_set_enrichment_invalid_response" };
  }
  return data;
}

export async function wikidataClearPinEnrichment(
  supabase: SupabaseClient,
  pinId: string,
): Promise<WikidataClearEnrichmentResponse> {
  const { data, error } =
    await supabase.functions.invoke<WikidataClearEnrichmentResponse>(
      "wikidata",
      { body: { action: "clear_pin_enrichment", pinId } },
    );
  if (error) {
    return { error: error.message || "wikidata_clear_enrichment_failed" };
  }
  if (!data || typeof data !== "object") {
    return { error: "wikidata_clear_enrichment_invalid_response" };
  }
  return data;
}

export async function wikidataSearchArticles(
  supabase: SupabaseClient,
  query: string,
): Promise<WikidataSearchResponse> {
  const { data, error } =
    await supabase.functions.invoke<WikidataSearchResponse>("wikidata", {
      body: { action: "search", query },
    });
  if (error) {
    return { error: error.message || "wikidata_search_failed" };
  }
  if (!data || typeof data !== "object") {
    return { error: "wikidata_search_invalid_response" };
  }
  return data;
}
