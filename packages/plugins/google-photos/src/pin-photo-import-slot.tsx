import type { PinPhotoImportSlotProps } from "@curolia/plugin-contract";
import {
  PanelDialogFooterRow,
  PanelDialogImportButton,
  PanelDialogInlinePrep,
  PanelDialogMonoBox,
  PanelDialogRoundedButton,
  PanelDialogSpinner,
} from "@curolia/ui/panel-dialog";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  googlePhotosImportBatched,
  googlePhotosPickerCreate,
  googlePhotosPickerList,
  googlePhotosWaitForPickerSelection,
} from "./google-photos-edge";
import { googlePhotosLibrarySearchPasteLine } from "./google-photos-search-paste";
import { GooglePhotosIcon } from "./icon";
import { googlePhotosPluginMeta } from "./plugin-meta";

function toastGooglePhotosImportResult(result: {
  importedIds: string[];
  skippedAlreadyOnPin: string[];
  downloadFailed: string[];
  storageFailed: string[];
}) {
  const imported = result.importedIds.length;
  const already = result.skippedAlreadyOnPin.length;
  const denied = result.downloadFailed.length;
  const storage = result.storageFailed.length;

  if (imported > 0) {
    toast.success(
      imported === 1 ? "Imported 1 photo." : `Imported ${imported} photos.`,
    );
  }
  if (already > 0) {
    toast.message(
      already === 1
        ? "That photo is already on this pin."
        : `${already} photos are already on this pin.`,
    );
  }
  if (denied > 0) {
    toast.error(
      denied === 1
        ? "Google denied download for 1 photo."
        : `Google denied download for ${denied} photos.`,
    );
  }
  if (storage > 0) {
    toast.error(
      storage === 1
        ? "Storage timed out saving 1 photo. Retry import or restart local Supabase."
        : `Storage timed out saving ${storage} photos. Retry import or restart local Supabase.`,
    );
  }
  if (imported === 0 && already === 0 && denied === 0 && storage === 0) {
    toast.message("Nothing imported.");
  }
}

export function GooglePhotosPinPhotoImportSlot({
  supabase,
  userId,
  pinId,
  mapId,
  pinDate,
  pinEndDate,
}: PinPhotoImportSlotProps) {
  const qc = useQueryClient();
  const [pickPrepOpen, setPickPrepOpen] = useState(false);

  const searchPasteLine = useMemo(
    () => googlePhotosLibrarySearchPasteLine(pinDate, pinEndDate),
    [pinDate, pinEndDate],
  );

  const enabledQuery = useQuery({
    queryKey: ["user_plugins", userId, googlePhotosPluginMeta.typeId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_plugins")
        .select("enabled")
        .eq("user_id", userId)
        .eq("plugin_type_id", googlePhotosPluginMeta.typeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });

  const pluginEnabled =
    Boolean(enabledQuery.data?.enabled) && googlePhotosPluginMeta.implemented;

  const pickAndImportMut = useMutation({
    mutationFn: async () => {
      const { sessionId, pickerUri, expireTime } =
        await googlePhotosPickerCreate(supabase, pinId);
      const openUrl = pickerUri.endsWith("/")
        ? `${pickerUri}autoclose`
        : `${pickerUri}/autoclose`;
      const win = window.open(
        openUrl,
        "_blank",
        "popup=yes,width=1100,height=800",
      );
      if (!win) {
        throw new Error("popup_blocked");
      }
      try {
        win.opener = null;
      } catch {
        /* cross-origin */
      }
      const done = await googlePhotosWaitForPickerSelection(
        supabase,
        sessionId,
        expireTime,
        win,
      );
      if (!done) {
        throw new Error("picker_cancelled_or_timed_out");
      }
      const { suggestions: items } = await googlePhotosPickerList(
        supabase,
        sessionId,
      );
      const ids = items
        .map((i) => i.externalId)
        .filter((id): id is string => Boolean(id));
      if (ids.length === 0) {
        return { kind: "none_selected" as const };
      }
      const importResult = await googlePhotosImportBatched(
        supabase,
        pinId,
        ids,
        sessionId,
      );
      return { kind: "imported" as const, ...importResult };
    },
    onSuccess: (result) => {
      if (!result || result.kind === "none_selected") {
        toast.message("No photos selected.");
        return;
      }
      toastGooglePhotosImportResult(result);
      void qc.invalidateQueries({ queryKey: ["photos", pinId] });
      void qc.invalidateQueries({ queryKey: ["photo-urls", pinId] });
      void qc.invalidateQueries({
        queryKey: ["map-pin-photos", mapId],
      });
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "pick_failed";
      if (msg === "popup_blocked") {
        toast.error("Allow pop-ups for this site to open Google Photos.");
        return;
      }
      if (msg === "picker_cancelled_or_timed_out") {
        toast.message("Selection closed or timed out without photos.");
        return;
      }
      toast.error(e instanceof Error ? e.message : "Import failed");
    },
  });

  const busy = pickAndImportMut.isPending;

  if (!pluginEnabled) return null;

  function openPickerOnly() {
    setPickPrepOpen(false);
    pickAndImportMut.mutate();
  }

  async function copySearchPasteAndStartPicker() {
    try {
      await navigator.clipboard.writeText(searchPasteLine);
      toast.success("Date range copied. Paste it into Google Photos search.");
    } catch {
      toast.message(
        "Could not copy automatically — copy the text in the dialog.",
      );
    }
    setPickPrepOpen(false);
    pickAndImportMut.mutate();
  }

  const label = `Select from ${googlePhotosPluginMeta.displayName}`;

  return (
    <>
      {pickPrepOpen ? (
        <PanelDialogInlinePrep
          title="Search in Google Photos"
          description="Copy this line, open Google Photos, paste it into search, then pick the photos you want."
          onClose={() => setPickPrepOpen(false)}
        >
          <PanelDialogMonoBox>{searchPasteLine}</PanelDialogMonoBox>
          <PanelDialogFooterRow>
            <PanelDialogRoundedButton
              type="button"
              variant="outline"
              onClick={() => openPickerOnly()}
            >
              Open only
            </PanelDialogRoundedButton>
            <PanelDialogRoundedButton
              type="button"
              onClick={() => void copySearchPasteAndStartPicker()}
            >
              Copy & open Google Photos
            </PanelDialogRoundedButton>
          </PanelDialogFooterRow>
        </PanelDialogInlinePrep>
      ) : null}
      <PanelDialogImportButton
        type="button"
        disabled={busy}
        onClick={() => setPickPrepOpen(true)}
        aria-label={label}
        aria-expanded={pickPrepOpen}
      >
        {busy ? <PanelDialogSpinner /> : null}
        <GooglePhotosIcon size={4} />
        <span>{label}</span>
      </PanelDialogImportButton>
    </>
  );
}
