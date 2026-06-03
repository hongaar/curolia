import { Button } from "@curolia/ui/button";
import {
  PluginPinInlineLink,
  PluginPinItemMain,
  PluginPinItemRow,
  PluginPinLinkMeta,
  PluginPinList,
  PluginPinMuted,
  PluginPinMutedXs,
  PluginPinSpinner,
} from "@curolia/ui/plugin-pin";
import {
  SearchCombobox,
  type SearchComboboxGroup,
} from "@curolia/ui/search-combobox";
import { useQuery } from "@tanstack/react-query";
import { ListMusic, Music, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  SPOTIFY_LINK_REQUIRED_ERROR,
  SPOTIFY_SEARCH_DEBOUNCE_MS,
  SPOTIFY_SEARCH_MIN_CHARS,
} from "./constants";
import type { SpotifySearchHit } from "./spotify-edge";
import { spotifySearch } from "./spotify-edge";
import { spotifyItemKey } from "./spotify-pin-data";
import type { useSpotifyPinMusic } from "./use-spotify-pin-music";

type SpotifyPinMusicEditorProps = {
  music: ReturnType<typeof useSpotifyPinMusic>;
  showSpinner?: boolean;
};

function libraryHitMeta(hit: SpotifySearchHit): string {
  if (!("libraryScope" in hit)) return catalogHitMeta(hit);
  const kind = hit.kind === "playlist" ? "Playlist" : "Track";
  const scope =
    hit.libraryScope === "playlist" ? "Your playlist" : "Saved track";
  if (hit.subtitle) return `${scope} · ${kind} · ${hit.subtitle}`;
  return `${scope} · ${kind}`;
}

function catalogHitMeta(hit: SpotifySearchHit): string {
  const kind = hit.kind === "playlist" ? "Playlist" : "Track";
  if (hit.subtitle) return `${kind} · ${hit.subtitle}`;
  return kind;
}

export function SpotifyPinMusicEditor({
  music,
  showSpinner = true,
}: SpotifyPinMusicEditorProps) {
  const {
    supabase,
    spotifyLinked,
    selected,
    busy,
    setItemMutation,
    clearMutation,
  } = music;

  const [search, setSearch] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedQuery(search.trim()),
      SPOTIFY_SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(t);
  }, [search]);

  const searchQuery = useQuery({
    queryKey: ["spotify_search", debouncedQuery, spotifyLinked],
    queryFn: async () => {
      const res = await spotifySearch(supabase, debouncedQuery);
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    enabled:
      !selected &&
      debouncedQuery.length >= SPOTIFY_SEARCH_MIN_CHARS &&
      !setItemMutation.isPending,
    staleTime: 30_000,
  });

  const libraryUnavailable =
    searchQuery.data?.libraryUnavailable === SPOTIFY_LINK_REQUIRED_ERROR;

  const groups = useMemo((): SearchComboboxGroup<SpotifySearchHit>[] => {
    if (!searchQuery.data || "error" in searchQuery.data) return [];
    return [
      {
        id: "library",
        label: "Your library",
        items: searchQuery.data.library,
        emptyMessage: libraryUnavailable
          ? "Link Spotify in Settings → Plugins to search your playlists and saved tracks."
          : "No matches in your library",
      },
      {
        id: "catalog",
        label: "Spotify",
        items: searchQuery.data.catalog,
        emptyMessage: "No catalog matches",
      },
    ];
  }, [searchQuery.data, libraryUnavailable]);

  const searchError =
    searchQuery.isError && searchQuery.error instanceof Error
      ? searchQuery.error.message
      : null;

  return (
    <>
      {showSpinner && busy ? <PluginPinSpinner /> : null}
      {selected ? (
        <>
          <PluginPinList>
            <PluginPinItemRow>
              <PluginPinItemMain>
                <PluginPinInlineLink
                  href={selected.openUrl}
                  icon={
                    selected.kind === "playlist" ? (
                      <ListMusic aria-hidden />
                    ) : (
                      <Music aria-hidden />
                    )
                  }
                >
                  <span>
                    {selected.title}
                    {selected.subtitle ? (
                      <PluginPinLinkMeta>
                        {" "}
                        · {selected.subtitle}
                      </PluginPinLinkMeta>
                    ) : null}
                  </span>
                </PluginPinInlineLink>
              </PluginPinItemMain>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove Spotify track or playlist"
                disabled={clearMutation.isPending}
                onClick={() => clearMutation.mutate()}
              >
                <Trash2 aria-hidden />
              </Button>
            </PluginPinItemRow>
          </PluginPinList>
          <PluginPinMutedXs>
            One track or playlist per pin. Remove to search for another.
          </PluginPinMutedXs>
        </>
      ) : (
        <>
          <PluginPinMuted>
            Search your Spotify library and the full catalog. Results appear in
            two groups.
          </PluginPinMuted>
          <SearchCombobox
            query={search}
            onQueryChange={setSearch}
            placeholder="Search tracks and playlists…"
            disabled={setItemMutation.isPending}
            loading={searchQuery.isFetching}
            minChars={SPOTIFY_SEARCH_MIN_CHARS}
            groups={groups}
            getItemKey={(hit) => spotifyItemKey(hit)}
            onSelect={(hit) => setItemMutation.mutate(hit)}
            renderItem={(hit) => ({
              title: hit.title,
              meta: libraryHitMeta(hit),
              imageUrl: hit.imageUrl,
            })}
            loadingMessage="Searching…"
            emptyMessage="No matching tracks or playlists"
            errorMessage={
              searchError ??
              (setItemMutation.isError && setItemMutation.error instanceof Error
                ? setItemMutation.error.message
                : null)
            }
          />
          {libraryUnavailable && spotifyLinked === false ? (
            <PluginPinMutedXs>
              Link Spotify in Settings → Plugins for library results. Catalog
              search still works.
            </PluginPinMutedXs>
          ) : null}
        </>
      )}
    </>
  );
}
