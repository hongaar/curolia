import type { PinSuggestionSlotProps } from "@curolia/plugin-contract";
import { Button } from "@curolia/ui/button";
import {
  SuggestionCard,
  SuggestionCardList,
} from "@curolia/ui/suggestion-card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { POI_PLUGIN_ID } from "./config";
import { POI_SUGGESTION_STALE_TIME_MS } from "./constants";
import {
  isMapPoiAutoLookupEnabled,
  poiMapPluginQueryKey,
} from "./poi-auto-lookup";
import { poiListNearbyCandidates, poiSetPinPoi } from "./poi-edge";
import { formatPoiErrorMessage } from "./poi-errors";
import { resetPoiPinMetadataCaches } from "./poi-metadata-sync";
import {
  parsePoiPinPayload,
  poiCandidateMeta,
  poiCandidateTitle,
  type PoiNearbyCandidate,
} from "./poi-pin-data";
import { selectPoiSuggestionCandidate } from "./poi-suggestion";
import { poiPluginMeta } from "./plugin-meta";
import {
  pinMetadataQueryKey,
  poiEntityDataQueryKey,
  poiNearbyCandidatesQueryKey,
} from "./query-keys";
import { usePoiPluginReady } from "./use-poi-plugin-ready";

/**
 * Suggests attaching a very-close nearby place to a pin when POI auto-lookup is
 * off for the map and no place is linked yet. Lookups are cached so revisiting
 * the pin does not re-fetch.
 */
export function PoiPinSuggestionSlot({
  supabase,
  userId,
  mapId,
  pinId,
  pinLat,
  pinLng,
}: PinSuggestionSlotProps) {
  const qc = useQueryClient();
  const { pluginReady } = usePoiPluginReady(supabase, { userId, mapId });
  const [dismissed, setDismissed] = useState(false);

  const lat = pinLat ?? null;
  const lng = pinLng ?? null;
  const hasCoords =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  const mapPluginQuery = useQuery({
    queryKey: poiMapPluginQueryKey(mapId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("map_plugins")
        .select("enabled, config")
        .eq("map_id", mapId)
        .eq("plugin_type_id", POI_PLUGIN_ID)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: pluginReady && hasCoords,
  });

  const autoLookupEnabled = isMapPoiAutoLookupEnabled(
    mapPluginQuery.data ?? undefined,
  );

  const rowQuery = useQuery({
    queryKey: poiEntityDataQueryKey(pinId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_entity_data")
        .select("data")
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .eq("plugin_type_id", poiPluginMeta.typeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: pluginReady && hasCoords && !autoLookupEnabled,
  });

  const attachedPayload = parsePoiPinPayload(rowQuery.data?.data);
  const alreadyResolved = rowQuery.data !== undefined;

  // Only look up candidates once we know auto-lookup is off and nothing is
  // attached yet — avoids needless Overpass/Geoapify calls.
  const candidatesEnabled =
    pluginReady &&
    hasCoords &&
    !autoLookupEnabled &&
    alreadyResolved &&
    !attachedPayload;

  const candidatesQuery = useQuery({
    queryKey: poiNearbyCandidatesQueryKey(pinId, lat ?? 0, lng ?? 0),
    queryFn: async () => {
      const res = await poiListNearbyCandidates(supabase, pinId);
      if ("error" in res) throw new Error(res.error);
      return res.candidates;
    },
    enabled: candidatesEnabled,
    staleTime: POI_SUGGESTION_STALE_TIME_MS,
    gcTime: POI_SUGGESTION_STALE_TIME_MS,
    retry: false,
  });

  const attachMutation = useMutation({
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
    onSuccess: async (payload) => {
      qc.setQueryData(poiEntityDataQueryKey(pinId), { data: payload });
      resetPoiPinMetadataCaches(qc, pinId);
      await qc.invalidateQueries({ queryKey: pinMetadataQueryKey(pinId) });
    },
  });

  const suggestion = selectPoiSuggestionCandidate({
    pluginReady,
    autoLookupEnabled,
    attachedPayload,
    candidates: candidatesQuery.data ?? [],
  });

  if (!suggestion || dismissed) return null;

  const errorMessage =
    attachMutation.error instanceof Error
      ? formatPoiErrorMessage(attachMutation.error.message)
      : null;

  return (
    <SuggestionCardList>
      <SuggestionCard
        icon={<MapPin aria-hidden />}
        eyebrow={`Suggested · ${poiPluginMeta.displayName}`}
        title={poiCandidateTitle(suggestion)}
        meta={errorMessage ?? poiCandidateMeta(suggestion)}
        busy={attachMutation.isPending}
        onDismiss={() => setDismissed(true)}
        actions={
          <Button
            type="button"
            size="sm"
            disabled={attachMutation.isPending}
            onClick={() => attachMutation.mutate(suggestion)}
          >
            {attachMutation.isPending ? "Attaching…" : "Attach place"}
          </Button>
        }
      />
    </SuggestionCardList>
  );
}
