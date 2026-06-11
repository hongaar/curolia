import type { SupabaseClient } from "@supabase/supabase-js";
import type { WikidataLangInvokeFields } from "./wikidata-lang-context";
import type {
  WikidataNearbyCandidate,
  WikidataPinPayload,
  WikidataSearchGroup,
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
      groups: WikidataSearchGroup[];
    }
  | {
      error: string;
    };

function wikidataInvokeBody(
  action: string,
  fields: Record<string, unknown>,
  lang?: WikidataLangInvokeFields,
): Record<string, unknown> {
  return {
    action,
    ...fields,
    ...(lang?.browserLang ? { browserLang: lang.browserLang } : {}),
    ...(lang?.country ? { country: lang.country } : {}),
  };
}

export async function wikidataSyncPinEnrichment(
  supabase: SupabaseClient,
  pinId: string,
  lang?: WikidataLangInvokeFields,
): Promise<WikidataSyncResponse> {
  const { data, error } = await supabase.functions.invoke<WikidataSyncResponse>(
    "wikidata",
    { body: wikidataInvokeBody("sync_pin_enrichment", { pinId }, lang) },
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
  lang?: WikidataLangInvokeFields,
): Promise<WikidataNearbyLookupResponse> {
  const { data, error } =
    await supabase.functions.invoke<WikidataNearbyLookupResponse>("wikidata", {
      body: wikidataInvokeBody(
        "lookup_nearby",
        {
          mapId: args.mapId,
          lat: args.lat,
          lng: args.lng,
        },
        lang,
      ),
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
  lang?: WikidataLangInvokeFields,
): Promise<WikidataListCandidatesResponse> {
  const { data, error } =
    await supabase.functions.invoke<WikidataListCandidatesResponse>(
      "wikidata",
      {
        body: wikidataInvokeBody("list_nearby_candidates", { pinId }, lang),
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
    wikipediaLang: string;
  },
  lang?: WikidataLangInvokeFields,
): Promise<WikidataSetEnrichmentResponse> {
  const { data, error } =
    await supabase.functions.invoke<WikidataSetEnrichmentResponse>("wikidata", {
      body: wikidataInvokeBody(
        "set_pin_enrichment",
        {
          pinId: args.pinId,
          wikidataId: args.wikidataId,
          wikipediaTitle: args.wikipediaTitle,
          wikipediaLang: args.wikipediaLang,
        },
        lang,
      ),
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
  lang?: WikidataLangInvokeFields,
): Promise<WikidataSearchResponse> {
  const { data, error } =
    await supabase.functions.invoke<WikidataSearchResponse>("wikidata", {
      body: wikidataInvokeBody("search", { query }, lang),
    });
  if (error) {
    return { error: error.message || "wikidata_search_failed" };
  }
  if (!data || typeof data !== "object") {
    return { error: "wikidata_search_invalid_response" };
  }
  return data;
}
