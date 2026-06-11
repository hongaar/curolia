import type { PinDraftEnrichmentSlotProps } from "@curolia/plugin-contract";
import { useQuery } from "@tanstack/react-query";
import { wikidataNearbyLookupQueryKey } from "./query-keys";
import { useWikidataPluginReady } from "./use-wikidata-plugin-ready";
import { wikidataLookupNearby } from "./wikidata-edge";
import { WikidataEnrichmentBody } from "./wikidata-enrichment-body";
import { wikidataLangInvokeFields } from "./wikidata-lang-context";

export function WikidataPinDraftEnrichmentSlot({
  supabase,
  userId,
  mapId,
  lat,
  lng,
  hasTitle,
  hasDescription,
  onApplySuggestion,
}: PinDraftEnrichmentSlotProps) {
  const { pluginReady } = useWikidataPluginReady(supabase, { userId, mapId });

  const lookupQuery = useQuery({
    queryKey: wikidataNearbyLookupQueryKey(lat, lng),
    queryFn: () =>
      wikidataLookupNearby(
        supabase,
        { mapId, lat, lng },
        wikidataLangInvokeFields(),
      ),
    enabled: pluginReady,
    staleTime: 60_000,
    retry: false,
  });

  if (!pluginReady) return null;

  const payload =
    lookupQuery.data && "result" in lookupQuery.data
      ? lookupQuery.data.result
      : null;
  const busy = lookupQuery.isFetching;
  const errMsg =
    lookupQuery.error instanceof Error
      ? lookupQuery.error.message
      : lookupQuery.data && "error" in lookupQuery.data
        ? lookupQuery.data.error
        : null;

  return (
    <WikidataEnrichmentBody
      payload={payload}
      busy={busy && !payload}
      errorMessage={errMsg}
      emptyMessage="No notable Wikipedia article found near these coordinates."
      hasPinTitle={hasTitle}
      hasPinDescription={hasDescription}
      onApplyPinSuggestion={onApplySuggestion}
    />
  );
}
