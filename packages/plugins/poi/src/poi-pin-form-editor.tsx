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
  PluginPinSearchHitCompact,
  PluginPinSearchResults,
  PluginPinSpinner,
} from "@curolia/ui/plugin-pin";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";
import { POI_SEARCH_RADIUS_M } from "./constants";
import {
  poiClearPinPoi,
  poiListNearbyCandidates,
  poiSetPinPoi,
} from "./poi-edge";
import { formatPoiErrorMessage } from "./poi-errors";
import { resetPoiPinMetadataCaches } from "./poi-metadata-sync";
import {
  formatPoiDistanceM,
  poiCandidateLine,
  poiElementUrl,
  poiPayloadFromCandidate,
  parsePoiPinPayload,
  resolvePoiLinkedView,
  type PoiNearbyCandidate,
} from "./poi-pin-data";
import { pinMetadataFromOsmTags } from "./poi-pin-metadata";
import { poiPluginMeta } from "./plugin-meta";
import { POI_PLUGIN_ID } from "./config";
import {
  poiEntityDataQueryKey,
  poiNearbyCandidatesQueryKey,
  pinMetadataQueryKey,
} from "./query-keys";

type PoiPinFormEditorProps = {
  supabase: SupabaseClient;
  pinId: string;
  lat: number;
  lng: number;
};

export function PoiPinFormEditor({
  supabase,
  pinId,
  lat,
  lng,
}: PoiPinFormEditorProps) {
  const qc = useQueryClient();
  const pid = poiPluginMeta.typeId;
  const dataRowQueryKey = poiEntityDataQueryKey(pinId);
  const candidatesQueryKey = poiNearbyCandidatesQueryKey(pinId, lat, lng);

  const [pendingCandidate, setPendingCandidate] =
    useState<PoiNearbyCandidate | null>(null);

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
    placeholderData: keepPreviousData,
  });

  const payload = parsePoiPinPayload(rowQuery.data?.data);
  const linkedView = resolvePoiLinkedView(payload, pendingCandidate);
  const showPicker = linkedView == null;

  const candidatesQuery = useQuery({
    queryKey: candidatesQueryKey,
    queryFn: async () => {
      const res = await poiListNearbyCandidates(supabase, pinId);
      if ("error" in res) throw new Error(res.error);
      return res.candidates;
    },
    enabled: showPicker && rowQuery.isSuccess,
    staleTime: 60_000,
    retry: false,
  });

  const setMutation = useMutation({
    mutationFn: async (candidate: PoiNearbyCandidate) => {
      const res = await poiSetPinPoi(supabase, {
        pinId,
        osmType: candidate.osmType,
        osmId: candidate.osmId,
        tags: candidate.tags,
      });
      if ("error" in res) throw new Error(res.error);
      return res.payload;
    },
    onMutate: (candidate) => {
      setPendingCandidate(candidate);

      // Optimistically seed payload so the linked view shows immediately
      const optimisticPayload = poiPayloadFromCandidate(lat, lng, candidate);
      qc.setQueryData(dataRowQueryKey, { data: optimisticPayload });

      // Optimistically seed pin metadata from candidate tags so the
      // detail view shows metadata without waiting for the server.
      if (candidate.tags && Object.keys(candidate.tags).length > 0) {
        const fields = pinMetadataFromOsmTags(candidate.tags);
        const metadataRows = fields.map((f) => ({
          id: `optimistic-${f.fieldKey}`,
          map_id: "",
          pin_id: pinId,
          field_key: f.fieldKey,
          source_plugin_id: POI_PLUGIN_ID,
          value: f.value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        qc.setQueryData(
          [...pinMetadataQueryKey(pinId), POI_PLUGIN_ID],
          metadataRows,
        );
      } else {
        resetPoiPinMetadataCaches(qc, pinId);
      }
    },
    onSuccess: (serverPayload) => {
      setPendingCandidate(null);
      qc.setQueryData(dataRowQueryKey, { data: serverPayload });
      void qc.invalidateQueries({ queryKey: pinMetadataQueryKey(pinId) });
    },
    onError: () => {
      setPendingCandidate(null);
      resetPoiPinMetadataCaches(qc, pinId);
      void qc.invalidateQueries({ queryKey: dataRowQueryKey });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await poiClearPinPoi(supabase, pinId);
      if ("error" in res) throw new Error(res.error);
    },
    onSuccess: async () => {
      resetPoiPinMetadataCaches(qc, pinId);
      await qc.invalidateQueries({ queryKey: [...dataRowQueryKey] });
      await qc.invalidateQueries({ queryKey: pinMetadataQueryKey(pinId) });
      await qc.invalidateQueries({ queryKey: [...candidatesQueryKey] });
    },
  });

  const candidatesErr = formatPoiErrorMessage(
    candidatesQuery.error instanceof Error ? candidatesQuery.error.message : "",
  );
  const actionErr = formatPoiErrorMessage(
    setMutation.error instanceof Error
      ? setMutation.error.message
      : clearMutation.error instanceof Error
        ? clearMutation.error.message
        : "",
  );

  const showPickerSpinner =
    showPicker &&
    ((rowQuery.isPending && !rowQuery.data) ||
      (candidatesQuery.isFetching && !candidatesQuery.isError));

  return (
    <>
      {actionErr && actionErr !== "" ? (
        <PluginPinError>{actionErr}</PluginPinError>
      ) : null}

      {linkedView ? (
        <>
          {setMutation.isPending || clearMutation.isPending ? (
            <PluginPinSpinner />
          ) : null}
          <PluginPinList>
            <PluginPinItemRow>
              <PluginPinItemMain>
                <PluginPinInlineLink
                  href={poiElementUrl(linkedView.osmType, linkedView.osmId)}
                  icon={<ExternalLink aria-hidden />}
                >
                  <span>
                    {linkedView.label}
                    <PluginPinLinkMeta>
                      {" "}
                      · {formatPoiDistanceM(linkedView.distanceM)}
                    </PluginPinLinkMeta>
                  </span>
                </PluginPinInlineLink>
              </PluginPinItemMain>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove linked place"
                disabled={clearMutation.isPending || setMutation.isPending}
                onClick={() => clearMutation.mutate()}
              >
                <Trash2 aria-hidden />
              </Button>
            </PluginPinItemRow>
          </PluginPinList>
          <PluginPinMutedXs>
            One place per pin. Remove to pick another from nearby features
            (sorted by distance).
          </PluginPinMutedXs>
        </>
      ) : (
        <>
          <PluginPinMuted>
            Pick a nearby place (sorted by distance).
          </PluginPinMuted>
          {showPickerSpinner ? <PluginPinSpinner /> : null}
          {candidatesErr && candidatesErr !== "" ? (
            <PluginPinError>{candidatesErr}</PluginPinError>
          ) : null}
          {candidatesQuery.data?.length ? (
            <PluginPinSearchResults>
              {candidatesQuery.data.map((candidate) => (
                <PluginPinSearchHitCompact
                  key={`${candidate.osmType}/${candidate.osmId}`}
                  title={poiCandidateLine(candidate)}
                  meta={null}
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
              No places found within {POI_SEARCH_RADIUS_M} m of this pin.
            </PluginPinMuted>
          ) : null}
        </>
      )}
    </>
  );
}
