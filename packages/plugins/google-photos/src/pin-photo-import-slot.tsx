import type { PinPhotoImportSlotProps } from "@curolia/plugin-contract";
import { Button } from "@curolia/ui/button";
import { Checkbox } from "@curolia/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogFormStack,
  DialogHeader,
  DialogImportButton,
  DialogMonoBox,
  DialogSpinner,
  DialogTitle,
} from "@curolia/ui/dialog";
import { Label } from "@curolia/ui/label";
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
import { syncPinPhotosToCache } from "./pin-photo-cache";
import { googlePhotosPluginMeta } from "./plugin-meta";

const SKIP_PREP_STORAGE_KEY = "curolia.googlePhotos.skipPickPrep";

function readSkipPrep(): boolean {
  try {
    return window.localStorage.getItem(SKIP_PREP_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSkipPrep(skip: boolean) {
  try {
    if (skip) window.localStorage.setItem(SKIP_PREP_STORAGE_KEY, "1");
    else window.localStorage.removeItem(SKIP_PREP_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

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
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [importPhase, setImportPhase] = useState<"idle" | "picker" | "import">(
    "idle",
  );

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
      setImportPhase("picker");
      try {
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

        setImportPhase("import");
        const importResult = await googlePhotosImportBatched(
          supabase,
          pinId,
          ids,
          sessionId,
          {
            onBatchComplete: async () => {
              await syncPinPhotosToCache(qc, supabase, pinId, mapId);
            },
          },
        );
        return { kind: "imported" as const, ...importResult };
      } finally {
        setImportPhase("idle");
      }
    },
    onSuccess: async (result) => {
      if (!result || result.kind === "none_selected") {
        toast.message("No photos selected.");
        return;
      }
      toastGooglePhotosImportResult(result);
      await syncPinPhotosToCache(qc, supabase, pinId, mapId);
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

  function onImportClick() {
    if (readSkipPrep()) {
      void copySearchPasteAndStartPicker();
      return;
    }
    setDontShowAgain(false);
    setPickPrepOpen(true);
  }

  function onConfirmPrep() {
    if (dontShowAgain) writeSkipPrep(true);
    void copySearchPasteAndStartPicker();
  }

  const label = `Select from ${googlePhotosPluginMeta.displayName}`;

  return (
    <>
      <Dialog open={pickPrepOpen} onOpenChange={setPickPrepOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open Google Photos</DialogTitle>
            <DialogDescription>
              When you click the button below, the pin dates will be copied to
              your clipboard and Google Photos will open. Paste the text into
              search, then pick the photos you want.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <DialogFormStack>
              <DialogMonoBox>{searchPasteLine}</DialogMonoBox>
              <Label>
                <Checkbox
                  checked={dontShowAgain}
                  onCheckedChange={(next) => setDontShowAgain(next === true)}
                />
                Do not show this again
              </Label>
            </DialogFormStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickPrepOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirmPrep}>Copy & open Google Photos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DialogImportButton
        type="button"
        disabled={busy}
        onClick={onImportClick}
        aria-label={label}
      >
        {busy ? <DialogSpinner /> : null}
        <GooglePhotosIcon size={4} />
        <span>{importPhase === "import" ? "Importing photos…" : label}</span>
      </DialogImportButton>
    </>
  );
}
