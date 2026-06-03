import type { SupabaseClient } from "@supabase/supabase-js";
import type { SpotifyPinItem } from "./spotify-pin-data";

export type SpotifyResolveResponse =
  | { item: Omit<SpotifyPinItem, "addedAt"> }
  | { error: string };

export type SpotifyLibrarySearchHit = Omit<SpotifyPinItem, "addedAt"> & {
  libraryScope: "playlist" | "saved";
};

export type SpotifyCatalogSearchHit = Omit<SpotifyPinItem, "addedAt">;

export type SpotifySearchHit =
  | SpotifyLibrarySearchHit
  | SpotifyCatalogSearchHit;

export type SpotifySearchResponse =
  | {
      library: SpotifyLibrarySearchHit[];
      catalog: SpotifyCatalogSearchHit[];
      libraryUnavailable?: string;
    }
  | { error: string };

export async function spotifyResolveUrl(
  supabase: SupabaseClient,
  url: string,
): Promise<SpotifyResolveResponse> {
  const { data, error } = await spotifyInvoke<SpotifyResolveResponse>(
    supabase,
    {
      action: "resolve",
      url,
    },
  );
  if (error) return { error };
  if (!data || typeof data !== "object") {
    return { error: "spotify_resolve_invalid_response" };
  }
  return data;
}

export async function spotifySearch(
  supabase: SupabaseClient,
  query: string,
): Promise<SpotifySearchResponse> {
  const { data, error } = await spotifyInvoke<SpotifySearchResponse>(supabase, {
    action: "search",
    query,
  });
  if (error) return { error };
  if (!data || typeof data !== "object") {
    return { error: "spotify_search_invalid_response" };
  }
  return data;
}

async function spotifyInvoke<T>(
  supabase: SupabaseClient,
  body: Record<string, string>,
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke<T>("spotify", {
    body,
  });
  if (error) {
    return { data: null, error: error.message || "spotify_request_failed" };
  }
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error?: string }).error;
    if (typeof err === "string") return { data: null, error: err };
  }
  return { data: data ?? null, error: null };
}
