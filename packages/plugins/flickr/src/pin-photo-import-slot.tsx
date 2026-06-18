import type { PinPhotoImportSlotProps } from "@curolia/plugin-contract";
import { Button } from "@curolia/ui/button";
import {
  DialogFooterRow,
  DialogImportButton,
  DialogInlinePrep,
  DialogInlinePrepStatus,
  DialogRoundedButton,
  DialogSpinner,
} from "@curolia/ui/dialog";
import { PhotoGrid, PhotoGridPickerTile } from "@curolia/ui/photo-grid";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { flickrAttachPhotos, flickrListNearby } from "./flickr-edge";
import type { FlickrNearbyCandidate } from "./flickr-pin-data";
import { FlickrIcon } from "./icon";
import { syncPinPhotosToCache } from "./pin-photo-cache";
import { flickrPluginMeta } from "./plugin-meta";
import { flickrNearbyCandidatesQueryKey } from "./query-keys";

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function FlickrPinPhotoImportSlot({
  supabase,
  userId,
  pinId,
  mapId,
}: PinPhotoImportSlotProps) {
  const qc = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const enabledQuery = useQuery({
    queryKey: ["user_plugins", userId, flickrPluginMeta.typeId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_plugins")
        .select("enabled")
        .eq("user_id", userId)
        .eq("plugin_type_id", flickrPluginMeta.typeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });

  const pluginEnabled =
    Boolean(enabledQuery.data?.enabled) && flickrPluginMeta.implemented;

  const candidatesQuery = useQuery({
    queryKey: flickrNearbyCandidatesQueryKey(pinId),
    queryFn: async () => {
      const res = await flickrListNearby(supabase, pinId);
      if ("error" in res) throw new Error(res.error);
      return res.candidates;
    },
    enabled: pluginEnabled && pickerOpen,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const candidates = candidatesQuery.data ?? [];

  const attachMut = useMutation({
    mutationFn: async (items: FlickrNearbyCandidate[]) => {
      const res = await flickrAttachPhotos(supabase, pinId, items);
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    onSuccess: async (result) => {
      const added = result.attachedIds.length;
      const skipped = result.skippedAlreadyOnPin.length;
      if (added > 0) {
        toast.success(
          added === 1
            ? "Added 1 Flickr photo."
            : `Added ${added} Flickr photos.`,
        );
      }
      if (skipped > 0) {
        toast.message(
          skipped === 1
            ? "1 photo was already on this pin."
            : `${skipped} photos were already on this pin.`,
        );
      }
      if (added === 0 && skipped === 0) {
        toast.message("No photos added.");
      }
      setPickerOpen(false);
      setSelected(new Set());
      await syncPinPhotosToCache(qc, supabase, pinId, mapId);
    },
    onError: (e) => {
      toast.error(
        e instanceof Error ? e.message : "Could not add Flickr photos.",
      );
    },
  });

  const selectedCandidates = useMemo(
    () => candidates.filter((c) => selected.has(c.photoId)),
    [candidates, selected],
  );

  if (!pluginEnabled) return null;

  const label = `Add nearby from ${flickrPluginMeta.displayName}`;
  const busy = attachMut.isPending;

  function toggleCandidate(photoId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  function openPicker() {
    setSelected(new Set());
    setPickerOpen(true);
  }

  const errorMessage =
    candidatesQuery.error instanceof Error
      ? candidatesQuery.error.message
      : null;

  return (
    <>
      {pickerOpen ? (
        <DialogInlinePrep
          title="Nearby Flickr photos"
          description="Select geotagged photos from Flickr near this pin. They stay on Flickr."
          onClose={() => {
            if (!busy) setPickerOpen(false);
          }}
        >
          {candidatesQuery.isLoading ? (
            <DialogInlinePrepStatus>Searching Flickr…</DialogInlinePrepStatus>
          ) : errorMessage ? (
            <DialogInlinePrepStatus>{errorMessage}</DialogInlinePrepStatus>
          ) : candidates.length === 0 ? (
            <DialogInlinePrepStatus>
              No Flickr photos found near this pin. Try moving the pin or
              widening your search area later.
            </DialogInlinePrepStatus>
          ) : (
            <PhotoGrid>
              {candidates.map((candidate) => {
                const isSelected = selected.has(candidate.photoId);
                return (
                  <PhotoGridPickerTile
                    key={candidate.photoId}
                    src={candidate.thumbUrl}
                    alt={candidate.title ?? "Flickr photo"}
                    selected={isSelected}
                    disabled={busy}
                    onSelect={() => toggleCandidate(candidate.photoId)}
                    footer={formatDistance(candidate.distanceM)}
                  />
                );
              })}
            </PhotoGrid>
          )}
          <DialogFooterRow>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => setPickerOpen(false)}
            >
              Cancel
            </Button>
            <DialogRoundedButton
              type="button"
              disabled={
                busy ||
                selectedCandidates.length === 0 ||
                candidatesQuery.isLoading
              }
              onClick={() => attachMut.mutate(selectedCandidates)}
            >
              {busy ? (
                <>
                  <DialogSpinner />
                  Adding…
                </>
              ) : selectedCandidates.length > 0 ? (
                `Add ${selectedCandidates.length} photo${selectedCandidates.length === 1 ? "" : "s"}`
              ) : (
                "Add photos"
              )}
            </DialogRoundedButton>
          </DialogFooterRow>
        </DialogInlinePrep>
      ) : null}
      <DialogImportButton
        type="button"
        disabled={busy}
        onClick={openPicker}
        aria-label={label}
        aria-expanded={pickerOpen}
      >
        {busy ? <DialogSpinner /> : null}
        <FlickrIcon size={4} />
        <span>{label}</span>
      </DialogImportButton>
    </>
  );
}
