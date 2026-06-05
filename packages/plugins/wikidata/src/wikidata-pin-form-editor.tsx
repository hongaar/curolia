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
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { WIKIDATA_SEARCH_RADIUS_KM } from "./constants";
import { wikidataPluginMeta } from "./plugin-meta";
import {
  pluginEntityDataRowQueryKey,
  wikidataNearbyCandidatesQueryKey,
  wikidataPinSyncQueryKey,
} from "./query-keys";
import {
  wikidataClearPinEnrichment,
  wikidataListNearbyCandidates,
  wikidataSetPinEnrichment,
  wikidataSyncPinEnrichment,
} from "./wikidata-edge";
import {
  formatWikidataDistanceM,
  parseWikidataPinPayload,
  wikidataCandidateMeta,
  type WikidataNearbyCandidate,
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
  const syncQueryKey = wikidataPinSyncQueryKey(pinId, lat, lng);
  const candidatesQueryKey = wikidataNearbyCandidatesQueryKey(pinId, lat, lng);

  const [skipAutoSync, setSkipAutoSync] = useState(false);

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

  const syncQuery = useQuery({
    queryKey: syncQueryKey,
    queryFn: () => wikidataSyncPinEnrichment(supabase, pinId),
    enabled: !skipAutoSync && rowQuery.isSuccess && !payload,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  const autoSyncSettled =
    skipAutoSync || syncQuery.isSuccess || syncQuery.isError;

  useEffect(() => {
    setSkipAutoSync(false);
  }, [lat, lng]);

  useEffect(() => {
    if (!syncQuery.isSuccess || !syncQuery.data) return;
    if ("error" in syncQuery.data) return;
    void qc.invalidateQueries({ queryKey: [...dataRowQueryKey] });
  }, [syncQuery.isSuccess, syncQuery.data, qc, dataRowQueryKey]);

  const candidatesQuery = useQuery({
    queryKey: candidatesQueryKey,
    queryFn: async () => {
      const res = await wikidataListNearbyCandidates(supabase, pinId);
      if ("error" in res) throw new Error(res.error);
      return res.candidates;
    },
    enabled: showPicker && rowQuery.isSuccess && autoSyncSettled,
    staleTime: 60_000,
    retry: false,
  });

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
      setSkipAutoSync(false);
      await qc.invalidateQueries({ queryKey: [...dataRowQueryKey] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await wikidataClearPinEnrichment(supabase, pinId);
      if ("error" in res) throw new Error(res.error);
    },
    onSuccess: async () => {
      setSkipAutoSync(true);
      await qc.invalidateQueries({ queryKey: [...dataRowQueryKey] });
      await qc.invalidateQueries({ queryKey: [...candidatesQueryKey] });
    },
  });

  const syncErr =
    syncQuery.error instanceof Error
      ? syncQuery.error.message
      : syncQuery.data && "error" in syncQuery.data
        ? syncQuery.data.error
        : null;
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
      syncQuery.isPending ||
      (autoSyncSettled && candidatesQuery.isPending) ||
      setMutation.isPending);

  return (
    <>
      {syncErr ? <PluginPinError>{syncErr}</PluginPinError> : null}
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
                    <PluginPinLinkMeta>
                      {" "}
                      · {formatWikidataDistanceM(payload.distanceM)}
                    </PluginPinLinkMeta>
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
            Remove to pick another from nearby Wikipedia articles.
          </PluginPinMutedXs>
        </>
      ) : (
        <>
          <PluginPinMuted>
            Pick a nearby landmark from Wikipedia (sorted by distance).
          </PluginPinMuted>
          {showPickerSpinner ? <PluginPinSpinner /> : null}
          {candidatesErr ? (
            <PluginPinError>{candidatesErr}</PluginPinError>
          ) : null}
          {candidatesQuery.data?.length ? (
            <PluginPinSearchResults>
              {candidatesQuery.data.map((candidate) => (
                <PluginPinSearchHit
                  key={candidate.wikidataId}
                  title={candidate.label}
                  meta={wikidataCandidateMeta(candidate)}
                  imageUrl={candidate.thumbnailUrl}
                  disabled={setMutation.isPending}
                  onClick={() => setMutation.mutate(candidate)}
                />
              ))}
            </PluginPinSearchResults>
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
        </>
      )}
    </>
  );
}
