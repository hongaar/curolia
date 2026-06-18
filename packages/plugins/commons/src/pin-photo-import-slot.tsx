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
import { commonsAttachPhotos, commonsListNearby } from "./commons-edge";
import type { CommonsNearbyCandidate } from "./commons-pin-data";
import { CommonsIcon } from "./icon";
import { syncPinPhotosToCache } from "./pin-photo-cache";
import { commonsPluginMeta } from "./plugin-meta";
import { commonsNearbyCandidatesQueryKey } from "./query-keys";

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function CommonsPinPhotoImportSlot({
  supabase,
  userId,
  pinId,
  mapId,
}: PinPhotoImportSlotProps) {
  const qc = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const enabledQuery = useQuery({
    queryKey: ["user_plugins", userId, commonsPluginMeta.typeId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_plugins")
        .select("enabled")
        .eq("user_id", userId)
        .eq("plugin_type_id", commonsPluginMeta.typeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });

  const pluginEnabled =
    Boolean(enabledQuery.data?.enabled) && commonsPluginMeta.implemented;

  const candidatesQuery = useQuery({
    queryKey: commonsNearbyCandidatesQueryKey(pinId),
    queryFn: async () => {
      const res = await commonsListNearby(supabase, pinId);
      if ("error" in res) throw new Error(res.error);
      return res.candidates;
    },
    enabled: pluginEnabled && pickerOpen,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const candidates = candidatesQuery.data ?? [];

  const attachMut = useMutation({
    mutationFn: async (items: CommonsNearbyCandidate[]) => {
      const res = await commonsAttachPhotos(supabase, pinId, items);
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    onSuccess: async (result) => {
      const added = result.attachedIds.length;
      const skipped = result.skippedAlreadyOnPin.length;
      if (added > 0) {
        toast.success(
          added === 1
            ? "Added 1 Commons photo."
            : `Added ${added} Commons photos.`,
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
        e instanceof Error ? e.message : "Could not add Commons photos.",
      );
    },
  });

  const selectedCandidates = useMemo(
    () => candidates.filter((c) => selected.has(c.fileTitle)),
    [candidates, selected],
  );

  if (!pluginEnabled) return null;

  const label = `Add nearby from ${commonsPluginMeta.displayName}`;
  const busy = attachMut.isPending;

  function toggleCandidate(fileTitle: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fileTitle)) next.delete(fileTitle);
      else next.add(fileTitle);
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
          title="Nearby Commons photos"
          description="Select openly licensed photos from Wikimedia Commons near this pin. Files stay on Commons."
          onClose={() => {
            if (!busy) setPickerOpen(false);
          }}
        >
          {candidatesQuery.isLoading ? (
            <DialogInlinePrepStatus>
              Searching Wikimedia Commons…
            </DialogInlinePrepStatus>
          ) : errorMessage ? (
            <DialogInlinePrepStatus>{errorMessage}</DialogInlinePrepStatus>
          ) : candidates.length === 0 ? (
            <DialogInlinePrepStatus>
              No Commons photos found near this pin. Coverage is best at
              landmarks and documented places.
            </DialogInlinePrepStatus>
          ) : (
            <PhotoGrid>
              {candidates.map((candidate) => {
                const isSelected = selected.has(candidate.fileTitle);
                return (
                  <PhotoGridPickerTile
                    key={candidate.fileTitle}
                    src={candidate.thumbUrl}
                    alt={candidate.title ?? "Commons photo"}
                    selected={isSelected}
                    disabled={busy}
                    onSelect={() => toggleCandidate(candidate.fileTitle)}
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
        <CommonsIcon size={4} />
        <span>{label}</span>
      </DialogImportButton>
    </>
  );
}
