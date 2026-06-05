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
import { OSM_POI_SEARCH_RADIUS_M } from "./constants";
import {
  osmPoiClearPinPoi,
  osmPoiListNearbyCandidates,
  osmPoiSetPinPoi,
} from "./osm-poi-edge";
import { formatOsmPoiErrorMessage } from "./osm-poi-errors";
import { resetOsmPinMetadataCaches } from "./osm-poi-metadata-sync";
import {
  formatOsmPoiDistanceM,
  osmPoiCandidateLine,
  osmPoiElementUrl,
  parseOsmPoiPinPayload,
  resolveOsmPoiLinkedView,
  type OsmPoiNearbyCandidate,
} from "./osm-poi-pin-data";
import { osmPoiPluginMeta } from "./plugin-meta";
import {
  osmPoiEntityDataQueryKey,
  osmPoiNearbyCandidatesQueryKey,
  pinMetadataQueryKey,
} from "./query-keys";

type OsmPoiPinFormEditorProps = {
  supabase: SupabaseClient;
  pinId: string;
  lat: number;
  lng: number;
};

export function OsmPoiPinFormEditor({
  supabase,
  pinId,
  lat,
  lng,
}: OsmPoiPinFormEditorProps) {
  const qc = useQueryClient();
  const pid = osmPoiPluginMeta.typeId;
  const dataRowQueryKey = osmPoiEntityDataQueryKey(pinId);
  const candidatesQueryKey = osmPoiNearbyCandidatesQueryKey(pinId, lat, lng);

  const [pendingCandidate, setPendingCandidate] =
    useState<OsmPoiNearbyCandidate | null>(null);

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

  const payload = parseOsmPoiPinPayload(rowQuery.data?.data);
  const linkedView = resolveOsmPoiLinkedView(payload, pendingCandidate);
  const showPicker = linkedView == null;

  const candidatesQuery = useQuery({
    queryKey: candidatesQueryKey,
    queryFn: async () => {
      const res = await osmPoiListNearbyCandidates(supabase, pinId);
      if ("error" in res) throw new Error(res.error);
      return res.candidates;
    },
    enabled: showPicker && rowQuery.isSuccess,
    staleTime: 60_000,
    retry: false,
  });

  const setMutation = useMutation({
    mutationFn: async (candidate: OsmPoiNearbyCandidate) => {
      const res = await osmPoiSetPinPoi(supabase, {
        pinId,
        osmType: candidate.osmType,
        osmId: candidate.osmId,
      });
      if ("error" in res) throw new Error(res.error);
      return res.payload;
    },
    onMutate: (candidate) => {
      setPendingCandidate(candidate);
      resetOsmPinMetadataCaches(qc, pinId);
    },
    onSuccess: (serverPayload) => {
      setPendingCandidate(null);
      qc.setQueryData(dataRowQueryKey, { data: serverPayload });
      void qc.invalidateQueries({ queryKey: pinMetadataQueryKey(pinId) });
    },
    onError: () => {
      setPendingCandidate(null);
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await osmPoiClearPinPoi(supabase, pinId);
      if ("error" in res) throw new Error(res.error);
    },
    onSuccess: async () => {
      resetOsmPinMetadataCaches(qc, pinId);
      await qc.invalidateQueries({ queryKey: [...dataRowQueryKey] });
      await qc.invalidateQueries({ queryKey: pinMetadataQueryKey(pinId) });
      await qc.invalidateQueries({ queryKey: [...candidatesQueryKey] });
    },
  });

  const candidatesErr = formatOsmPoiErrorMessage(
    candidatesQuery.error instanceof Error ? candidatesQuery.error.message : "",
  );
  const actionErr = formatOsmPoiErrorMessage(
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
                  href={osmPoiElementUrl(linkedView.osmType, linkedView.osmId)}
                  icon={<ExternalLink aria-hidden />}
                >
                  <span>
                    {linkedView.label}
                    <PluginPinLinkMeta>
                      {" "}
                      · {formatOsmPoiDistanceM(linkedView.distanceM)}
                    </PluginPinLinkMeta>
                  </span>
                </PluginPinInlineLink>
              </PluginPinItemMain>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove linked OpenStreetMap place"
                disabled={clearMutation.isPending || setMutation.isPending}
                onClick={() => clearMutation.mutate()}
              >
                <Trash2 aria-hidden />
              </Button>
            </PluginPinItemRow>
          </PluginPinList>
          <PluginPinMutedXs>
            One OSM place per pin. Remove to pick another from nearby features
            (sorted by distance).
          </PluginPinMutedXs>
        </>
      ) : (
        <>
          <PluginPinMuted>
            Pick a nearby OpenStreetMap place (sorted by distance).
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
                  title={osmPoiCandidateLine(candidate)}
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
              No OpenStreetMap places found within {OSM_POI_SEARCH_RADIUS_M} m
              of this pin.
            </PluginPinMuted>
          ) : null}
        </>
      )}
    </>
  );
}
