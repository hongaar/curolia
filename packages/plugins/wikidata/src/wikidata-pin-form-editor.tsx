import { Button } from "@curolia/ui/button";
import {
  PluginPinError,
  PluginPinInlineLink,
  PluginPinItemMain,
  PluginPinItemRow,
  PluginPinLinkMeta,
  PluginPinList,
  PluginPinMuted,
  PluginPinMutedXs,
  PluginPinSearchHit,
  PluginPinSearchResults,
  PluginPinSpinner,
} from "@curolia/ui/plugin-pin";
import {
  SearchCombobox,
  type SearchComboboxGroup,
} from "@curolia/ui/search-combobox";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  WIKIDATA_SEARCH_DEBOUNCE_MS,
  WIKIDATA_SEARCH_MIN_CHARS,
  WIKIDATA_SEARCH_RADIUS_KM,
} from "./constants";
import { wikidataPluginMeta } from "./plugin-meta";
import {
  pluginEntityDataRowQueryKey,
  wikidataNearbyCandidatesQueryKey,
  wikidataSearchQueryKey,
} from "./query-keys";
import {
  wikidataClearPinEnrichment,
  wikidataListNearbyCandidates,
  wikidataSearchArticles,
  wikidataSetPinEnrichment,
} from "./wikidata-edge";
import {
  formatWikidataDistanceM,
  parseWikidataPinPayload,
  wikidataCandidateMeta,
  wikidataSearchHitKey,
  type WikidataNearbyCandidate,
  type WikidataSearchHit,
} from "./wikidata-pin-data";

type WikidataPinFormEditorProps = {
  supabase: SupabaseClient;
  pinId: string;
  lat: number;
  lng: number;
};

export function WikidataPinFormEditor({
  supabase,
  pinId,
  lat,
  lng,
}: WikidataPinFormEditorProps) {
  const qc = useQueryClient();
  const pid = wikidataPluginMeta.typeId;
  const dataRowQueryKey = pluginEntityDataRowQueryKey(pid, "pin", pinId);
  const candidatesQueryKey = wikidataNearbyCandidatesQueryKey(pinId, lat, lng);

  const rowQuery = useQuery({
    queryKey: dataRowQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_entity_data")
        .select("data")
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .eq("plugin_type_id", pid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const payload = parseWikidataPinPayload(rowQuery.data?.data);
  const showPicker = !payload;

  const [search, setSearch] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedQuery(search.trim()),
      WIKIDATA_SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(t);
  }, [search]);

  const setMutation = useMutation({
    mutationFn: async (candidate: WikidataNearbyCandidate) => {
      const res = await wikidataSetPinEnrichment(supabase, {
        pinId,
        wikidataId: candidate.wikidataId,
        wikipediaTitle: candidate.wikipediaTitle,
      });
      if ("error" in res) throw new Error(res.error);
      return res.payload;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [...dataRowQueryKey] });
    },
  });

  const searchQuery = useQuery({
    queryKey: wikidataSearchQueryKey(debouncedQuery),
    queryFn: async () => {
      const res = await wikidataSearchArticles(supabase, debouncedQuery);
      if ("error" in res) throw new Error(res.error);
      return res.results;
    },
    enabled:
      showPicker &&
      debouncedQuery.length >= WIKIDATA_SEARCH_MIN_CHARS &&
      !setMutation.isPending,
    staleTime: 30_000,
  });

  const searchGroups = useMemo((): SearchComboboxGroup<WikidataSearchHit>[] => {
    if (!searchQuery.data) return [];
    return [
      {
        id: "wikipedia",
        label: "Wikipedia",
        items: searchQuery.data,
        emptyMessage: "No matching articles",
      },
    ];
  }, [searchQuery.data]);

  const searchError =
    searchQuery.isError && searchQuery.error instanceof Error
      ? searchQuery.error.message
      : null;

  const candidatesQuery = useQuery({
    queryKey: candidatesQueryKey,
    queryFn: async () => {
      const res = await wikidataListNearbyCandidates(supabase, pinId);
      if ("error" in res) throw new Error(res.error);
      return res.candidates;
    },
    enabled: showPicker && rowQuery.isSuccess,
    staleTime: 60_000,
    retry: false,
  });

  const selectCandidate = (candidate: WikidataNearbyCandidate) => {
    setMutation.mutate(candidate);
  };

  const selectSearchHit = (hit: WikidataSearchHit) => {
    setMutation.mutate({
      wikidataId: hit.wikidataId,
      label: hit.label,
      wikipediaTitle: hit.wikipediaTitle,
      distanceM: 0,
      placeType: null,
      thumbnailUrl: hit.thumbnailUrl,
    });
  };

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await wikidataClearPinEnrichment(supabase, pinId);
      if ("error" in res) throw new Error(res.error);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [...dataRowQueryKey] });
      await qc.invalidateQueries({ queryKey: [...candidatesQueryKey] });
    },
  });

  const candidatesErr =
    candidatesQuery.error instanceof Error
      ? candidatesQuery.error.message
      : null;
  const actionErr =
    setMutation.error instanceof Error
      ? setMutation.error.message
      : clearMutation.error instanceof Error
        ? clearMutation.error.message
        : null;

  const showPickerSpinner =
    showPicker &&
    ((rowQuery.isPending && !rowQuery.data) ||
      candidatesQuery.isPending ||
      setMutation.isPending);

  return (
    <>
      {actionErr ? <PluginPinError>{actionErr}</PluginPinError> : null}

      {payload ? (
        <>
          {clearMutation.isPending ? <PluginPinSpinner /> : null}
          <PluginPinList>
            <PluginPinItemRow>
              <PluginPinItemMain>
                <PluginPinInlineLink
                  href={payload.wikipediaUrl}
                  icon={<ExternalLink aria-hidden />}
                >
                  <span>
                    {payload.label}
                    {payload.distanceM > 0 ? (
                      <PluginPinLinkMeta>
                        {" "}
                        · {formatWikidataDistanceM(payload.distanceM)}
                      </PluginPinLinkMeta>
                    ) : null}
                  </span>
                </PluginPinInlineLink>
              </PluginPinItemMain>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove Wikipedia landmark"
                disabled={clearMutation.isPending}
                onClick={() => clearMutation.mutate()}
              >
                <Trash2 aria-hidden />
              </Button>
            </PluginPinItemRow>
          </PluginPinList>
          <PluginPinMutedXs>
            Remove to pick another nearby landmark or search Wikipedia.
          </PluginPinMutedXs>
        </>
      ) : (
        <>
          <PluginPinMuted>
            Pick a nearby landmark or search Wikipedia for any article.
          </PluginPinMuted>
          {showPickerSpinner ? <PluginPinSpinner /> : null}
          {candidatesErr ? (
            <PluginPinError>{candidatesErr}</PluginPinError>
          ) : null}
          {candidatesQuery.data?.length ? (
            <>
              <PluginPinMutedXs>Nearby</PluginPinMutedXs>
              <PluginPinSearchResults>
                {candidatesQuery.data.map((candidate) => (
                  <PluginPinSearchHit
                    key={candidate.wikidataId}
                    title={candidate.label}
                    meta={wikidataCandidateMeta(candidate)}
                    imageUrl={candidate.thumbnailUrl}
                    disabled={setMutation.isPending}
                    onClick={() => selectCandidate(candidate)}
                  />
                ))}
              </PluginPinSearchResults>
            </>
          ) : null}
          {!candidatesQuery.isFetching &&
          !candidatesErr &&
          candidatesQuery.isSuccess &&
          candidatesQuery.data.length === 0 ? (
            <PluginPinMuted>
              No notable Wikipedia articles found within{" "}
              {Math.round(WIKIDATA_SEARCH_RADIUS_KM * 1000)} m of this pin.
            </PluginPinMuted>
          ) : null}
          <SearchCombobox
            query={search}
            onQueryChange={setSearch}
            placeholder="Search Wikipedia articles…"
            disabled={setMutation.isPending}
            loading={searchQuery.isFetching}
            minChars={WIKIDATA_SEARCH_MIN_CHARS}
            groups={searchGroups}
            getItemKey={wikidataSearchHitKey}
            onSelect={selectSearchHit}
            renderItem={(hit) => ({
              title: hit.label,
              meta: hit.snippet,
              imageUrl: hit.thumbnailUrl,
            })}
            loadingMessage="Searching…"
            emptyMessage="No matching Wikipedia articles"
            errorMessage={searchError}
          />
        </>
      )}
    </>
  );
}
