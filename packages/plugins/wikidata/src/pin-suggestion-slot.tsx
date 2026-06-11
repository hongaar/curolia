import type { PinSuggestionSlotProps } from "@curolia/plugin-contract";
import { Button } from "@curolia/ui/button";
import {
  SuggestionCard,
  SuggestionCardList,
} from "@curolia/ui/suggestion-card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { WIKIDATA_SUGGESTION_STALE_TIME_MS } from "./constants";
import { WikidataIcon } from "./icon";
import { wikidataPluginMeta } from "./plugin-meta";
import {
  pluginEntityDataRowQueryKey,
  wikidataNearbyCandidatesQueryKey,
} from "./query-keys";
import { useWikidataPluginReady } from "./use-wikidata-plugin-ready";
import {
  wikidataListNearbyCandidates,
  wikidataSetPinEnrichment,
} from "./wikidata-edge";
import { wikidataLangInvokeFields } from "./wikidata-lang-context";
import {
  parseWikidataDeclinedPayload,
  parseWikidataPinPayload,
  wikidataCandidateMeta,
  wikidataCandidateTitle,
  wikidataDeclinedPayload,
  type WikidataNearbyCandidate,
} from "./wikidata-pin-data";
import {
  selectWikidataSuggestionCandidate,
  wikidataPinSuggestionSuppressed,
} from "./wikidata-suggestion";
import {
  shouldShowWikipediaLanguageBadge,
  wikipediaLanguageBadge,
} from "./wikipedia-lang";

/**
 * Suggests attaching a very-close notable Wikipedia article to a pin when none
 * is linked yet. Lookups are cached so revisiting the pin does not re-fetch.
 */
export function WikidataPinSuggestionSlot({
  supabase,
  userId,
  mapId,
  pinId,
  pinLat,
  pinLng,
}: PinSuggestionSlotProps) {
  const qc = useQueryClient();
  const pid = wikidataPluginMeta.typeId;
  const { pluginReady } = useWikidataPluginReady(supabase, { userId, mapId });

  const lat = pinLat ?? null;
  const lng = pinLng ?? null;
  const hasCoords =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  const dataRowQueryKey = pluginEntityDataRowQueryKey(pid, "pin", pinId);

  const rowQuery = useQuery({
    queryKey: dataRowQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_entity_data")
        .select("data, updated_at")
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .eq("plugin_type_id", pid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: pluginReady && hasCoords,
  });

  const attachedPayload = parseWikidataPinPayload(rowQuery.data?.data);
  const declinedPayload = parseWikidataDeclinedPayload(rowQuery.data?.data);
  const suggestionSuppressed =
    hasCoords &&
    wikidataPinSuggestionSuppressed(
      attachedPayload,
      declinedPayload,
      lat ?? 0,
      lng ?? 0,
    );

  const candidatesEnabled =
    pluginReady &&
    hasCoords &&
    rowQuery.data !== undefined &&
    !suggestionSuppressed;

  const candidatesQuery = useQuery({
    queryKey: wikidataNearbyCandidatesQueryKey(pinId, lat ?? 0, lng ?? 0),
    queryFn: async () => {
      const res = await wikidataListNearbyCandidates(
        supabase,
        pinId,
        wikidataLangInvokeFields(),
      );
      if ("error" in res) throw new Error(res.error);
      return res.candidates;
    },
    enabled: candidatesEnabled,
    staleTime: WIKIDATA_SUGGESTION_STALE_TIME_MS,
    gcTime: WIKIDATA_SUGGESTION_STALE_TIME_MS,
    retry: false,
  });

  const dismissMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("plugin_entity_data").upsert(
        {
          map_id: mapId,
          entity_type: "pin",
          entity_id: pinId,
          plugin_type_id: pid,
          data: wikidataDeclinedPayload(
            lat ?? 0,
            lng ?? 0,
          ) as unknown as Record<string, unknown>,
        },
        { onConflict: "entity_type,entity_id,plugin_type_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.setQueryData(dataRowQueryKey, {
        data: wikidataDeclinedPayload(lat ?? 0, lng ?? 0),
      });
    },
  });

  const attachMutation = useMutation({
    mutationFn: async (candidate: WikidataNearbyCandidate) => {
      const res = await wikidataSetPinEnrichment(
        supabase,
        {
          pinId,
          wikidataId: candidate.wikidataId,
          wikipediaTitle: candidate.wikipediaTitle,
          wikipediaLang: candidate.wikipediaLang,
        },
        wikidataLangInvokeFields(),
      );
      if ("error" in res) throw new Error(res.error);
      return res.payload;
    },
    onSuccess: async (payload) => {
      qc.setQueryData(dataRowQueryKey, { data: payload });
      await qc.invalidateQueries({ queryKey: dataRowQueryKey });
    },
  });

  const suggestion = selectWikidataSuggestionCandidate({
    pluginReady,
    attachedPayload,
    declinedPayload,
    pinLat: lat ?? 0,
    pinLng: lng ?? 0,
    candidates: candidatesQuery.data ?? [],
  });

  if (!suggestion) return null;

  const errorMessage =
    attachMutation.error instanceof Error
      ? "Could not attach the article. Try again."
      : null;

  return (
    <SuggestionCardList>
      <SuggestionCard
        icon={<WikidataIcon />}
        eyebrow={`Suggested · ${wikidataPluginMeta.displayName}`}
        title={wikidataCandidateTitle(suggestion)}
        badge={
          shouldShowWikipediaLanguageBadge(suggestion.wikipediaLang)
            ? wikipediaLanguageBadge(suggestion.wikipediaLang)
            : undefined
        }
        meta={errorMessage ?? wikidataCandidateMeta(suggestion)}
        thumbnailUrl={suggestion.thumbnailUrl}
        busy={attachMutation.isPending || dismissMutation.isPending}
        onDismiss={() => dismissMutation.mutate()}
        actions={
          <Button
            type="button"
            size="sm"
            disabled={attachMutation.isPending}
            onClick={() => attachMutation.mutate(suggestion)}
          >
            {attachMutation.isPending ? "Attaching…" : "Attach article"}
          </Button>
        }
      />
    </SuggestionCardList>
  );
}
