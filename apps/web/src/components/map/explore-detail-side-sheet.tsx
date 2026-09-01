import type { Json } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { useExplore } from "@/providers/explore-provider";
import {
  isExplorePlaceEntry,
  isExploreRouteEntry,
  type ExploreResultEntry,
} from "@curolia/plugin-contract";
import { Button } from "@curolia/ui/button";
import {
  PlaceDetailActions,
  PlaceDetailFactList,
  PlaceDetailHeader,
  PlaceDetailRoot,
  PlaceDetailSection,
} from "@curolia/ui/place-detail";
import { useMutation } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { toast } from "sonner";

export function ExploreDetailSideSheet({
  entry,
  mapId,
  canEdit,
  onClose,
  onPinSaved,
}: {
  entry: ExploreResultEntry;
  mapId: string;
  canEdit: boolean;
  onClose: () => void;
  onPinSaved?: (pinId: string) => void;
}) {
  const { setSelectedEntry } = useExplore();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isExplorePlaceEntry(entry) && entry.placeId) {
        const lat = entry.geometry.lat;
        const lng = entry.geometry.lng;
        const { data, error } = await supabase
          .from("pins")
          .insert({
            map_id: mapId,
            title: entry.title,
            lat,
            lng,
            place_id: entry.placeId,
          })
          .select("id")
          .single();
        if (error) throw error;
        return data.id;
      }

      if (isExploreRouteEntry(entry)) {
        const first = entry.geometry.coordinates[0];
        if (!first) throw new Error("route_missing_geometry");
        const [lng, lat] = first;
        const { data: pinRow, error: pinErr } = await supabase
          .from("pins")
          .insert({
            map_id: mapId,
            title: entry.title,
            lat,
            lng,
          })
          .select("id")
          .single();
        if (pinErr) throw pinErr;

        const { error: pluginErr } = await supabase
          .from("plugin_entity_data")
          .upsert({
            map_id: mapId,
            entity_type: "pin",
            entity_id: pinRow.id,
            plugin_type_id: "route",
            data: {
              schemaVersion: 1,
              profile: entry.detail?.profile ?? "hiking",
              distanceMeters: entry.detail?.distanceMeters ?? 0,
              ascentMeters: entry.detail?.ascentMeters,
              durationSeconds: entry.detail?.durationSeconds,
              coordinates: [...entry.geometry.coordinates],
              savedAt: new Date().toISOString(),
            } as Json,
          });
        if (pluginErr) throw pluginErr;
        return pinRow.id;
      }

      throw new Error("unsupported_explore_entry");
    },
    onSuccess: (pinId) => {
      toast.success("Pin saved");
      onPinSaved?.(pinId);
      setSelectedEntry(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not save pin");
    },
  });

  const facts = useMemo(() => {
    const items: { label: string; value: ReactNode }[] = [];
    if (isExplorePlaceEntry(entry) && entry.detail) {
      if (entry.detail.pinCount != null && entry.detail.pinCount > 0) {
        items.push({
          label: "Saved by",
          value: `${entry.detail.pinCount} traveler${entry.detail.pinCount === 1 ? "" : "s"}`,
        });
      }
      if (entry.preview?.categoryLabel) {
        items.push({ label: "Type", value: entry.preview.categoryLabel });
      }
      if (entry.preview?.rating != null) {
        items.push({ label: "Rating", value: String(entry.preview.rating) });
      }
    }
    if (isExploreRouteEntry(entry) && entry.detail) {
      items.push({
        label: "Distance",
        value: `${(entry.detail.distanceMeters / 1000).toFixed(1)} km`,
      });
      if (entry.detail.ascentMeters != null) {
        items.push({
          label: "Ascent",
          value: `${Math.round(entry.detail.ascentMeters)} m`,
        });
      }
    }
    return items;
  }, [entry]);

  const subtitle = isExplorePlaceEntry(entry)
    ? entry.subtitle
    : isExploreRouteEntry(entry)
      ? entry.subtitle
      : undefined;

  return (
    <PlaceDetailRoot>
      <PlaceDetailHeader title={entry.title} subtitle={subtitle} />
      {facts.length > 0 ? (
        <PlaceDetailSection title="Details">
          <PlaceDetailFactList items={facts} />
        </PlaceDetailSection>
      ) : null}
      {isExplorePlaceEntry(entry) && entry.detail?.metadata ? (
        <PlaceDetailSection title="From the world map">
          <p className="text-sm text-muted-foreground">
            This place is part of Curolia&apos;s shared dataset and updates as
            more travelers explore it.
          </p>
        </PlaceDetailSection>
      ) : null}
      <PlaceDetailActions>
        {canEdit ? (
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving…" : "Save pin"}
          </Button>
        ) : null}
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </PlaceDetailActions>
    </PlaceDetailRoot>
  );
}
