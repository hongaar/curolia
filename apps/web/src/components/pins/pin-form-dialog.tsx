/* eslint-disable react-hooks/set-state-in-effect -- reset form fields when dialog opens/closes */
import { PinLinksEditor } from "@/components/pins/pin-links-editor";
import { useMaxSm } from "@/hooks/use-max-sm";
import { mapViewHref, pinDetailHref } from "@/lib/app-paths";
import { mapAnchorPanelMiddleware } from "@/lib/map-anchor-floating-ui";
import { reversePhotonLocationLabel } from "@/lib/photon-geocode";
import { photosToLightboxItems } from "@/lib/pin-photo-lightbox-items";
import { supabase } from "@/lib/supabase";
import { usePinPhotosSignedUrls } from "@/lib/use-pin-photos";
import { pluginList } from "@/plugins/registry";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import type { Pin, Tag } from "@/types/database";
import { Button } from "@curolia/ui/button";
import { CautionPanel } from "@curolia/ui/caution-panel";
import { Checkbox } from "@curolia/ui/checkbox";
import { Dialog, DialogDescription } from "@curolia/ui/dialog";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import { MarkdownEditor } from "@curolia/ui/markdown-editor";
import {
  PanelDialogBody,
  PanelDialogContent,
  PanelDialogField,
  PanelDialogFooter,
  PanelDialogFormStack,
  PanelDialogHeader,
  PanelDialogTitle,
} from "@curolia/ui/panel-dialog";
import {
  FormErrorText,
  FormField,
  FormMutedText,
  FormSelectTriggerFull,
  PinFormDangerActions,
  PinFormDangerHint,
  PinFormFloatingHost,
  PinFormGrid,
  PinFormMoveList,
  PinFormPanelCard,
  PinFormPanelDialog,
  PinFormPhotoGrid,
  PinFormPhotoPlaceholder,
  PinFormPhotoRemoveButton,
  PinFormPhotoThumb,
  PinFormPlaceText,
  PinFormTagBox,
  PinFormTagOption,
  PinFormUploadInput,
  PinFormUploadLabel,
  PinFormUploadRow,
} from "@curolia/ui/pin-form";
import {
  PinPhotoLightbox,
  PinPhotoThumb,
} from "@curolia/ui/pin-photo-lightbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@curolia/ui/select";
import { autoUpdate, computePosition } from "@floating-ui/dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { Trash2, Upload } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

async function invalidatePinDetailCaches(
  qc: QueryClient,
  pinId: string,
  mapId: string,
) {
  await qc.invalidateQueries({ queryKey: ["pins", mapId] });
  await qc.invalidateQueries({ queryKey: ["pin"] });
  await qc.invalidateQueries({ queryKey: ["pin", pinId] });
  await qc.invalidateQueries({ queryKey: ["pin-side-sheet", pinId] });
}

type PinFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapId: string;
  pin: Pin | null;
  defaultLat?: number;
  defaultLng?: number;
  /** For new pins: screen anchor → floating panel (no modal blur). */
  anchorScreen?: { x: number; y: number } | null;
  /** Fires while creating a pin when tag selection changes (for map preview). */
  onNewPinTagIdsChange?: (tagIds: string[]) => void;
};

export function PinFormDialog({
  open,
  onOpenChange,
  mapId,
  pin,
  defaultLat = 0,
  defaultLng = 0,
  anchorScreen = null,
  onNewPinTagIdsChange,
}: PinFormDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { maps } = useMap();
  const isNarrow = useMaxSm();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateYmd, setDateYmd] = useState("");
  const [endDateYmd, setEndDateYmd] = useState("");
  const [lat, setLat] = useState(String(defaultLat));
  const [lng, setLng] = useState(String(defaultLng));
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [locationLabel, setLocationLabel] = useState("");
  const [locationLookupPending, setLocationLookupPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoLightbox, setPhotoLightbox] = useState<{
    photoId: string;
  } | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTargetMapId, setMoveTargetMapId] = useState("");
  const [moving, setMoving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const floatingRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<{ x: number; y: number } | null>(null);

  const editPinId = pin?.id;
  const { photos, signedUrlByPhotoId } = usePinPhotosSignedUrls(editPinId);
  const lightboxItems = useMemo(
    () => photosToLightboxItems(photos, signedUrlByPhotoId),
    [photos, signedUrlByPhotoId],
  );

  const removePhotoMut = useMutation({
    mutationFn: async (photoId: string) => {
      if (!pin || !mapId) throw new Error("missing_pin");
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) throw new Error("photo_not_found");
      const { error: dbErr } = await supabase
        .from("photos")
        .delete()
        .eq("id", photoId);
      if (dbErr) throw dbErr;
      const path = photo.storage_path?.trim();
      if (path) {
        const { error: stErr } = await supabase.storage
          .from("pin-photos")
          .remove([path]);
        if (stErr) console.error(stErr);
      }
    },
    onSuccess: async (_data, photoId) => {
      setPhotoLightbox((prev) => (prev?.photoId === photoId ? null : prev));
      if (!pin) return;
      await qc.invalidateQueries({ queryKey: ["photos", pin.id] });
      await qc.invalidateQueries({ queryKey: ["photo-urls", pin.id] });
      await qc.invalidateQueries({
        queryKey: ["map-pin-photos", mapId],
      });
      await qc.invalidateQueries({
        queryKey: ["photo-urls-batch", mapId],
      });
      await qc.invalidateQueries({ queryKey: ["pin-side-sheet", pin.id] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Could not remove photo.");
    },
  });

  const floatingNew = Boolean(open && !pin && anchorScreen && !isNarrow);

  const virtualReference = useMemo(
    () => ({
      getBoundingClientRect() {
        const a = anchorRef.current;
        if (!a) return new DOMRect(0, 0, 0, 0);
        return new DOMRect(a.x, a.y, 0, 0);
      },
    }),
    [],
  );

  useLayoutEffect(() => {
    anchorRef.current = anchorScreen;
  }, [anchorScreen]);

  useLayoutEffect(() => {
    if (!floatingNew) return;
    const floating = floatingRef.current;
    if (!floating || !anchorRef.current) return;

    const run = () =>
      computePosition(virtualReference, floating, {
        placement: "right",
        strategy: "fixed",
        middleware: mapAnchorPanelMiddleware(),
      }).then((data) => {
        const el = floatingRef.current;
        if (!el) return;

        Object.assign(el.style, {
          position: "fixed",
          left: `${data.x}px`,
          top: `${data.y}px`,
          right: "auto",
          bottom: "auto",
        });
      });

    void run();
    return autoUpdate(virtualReference, floating, run, {
      animationFrame: true,
      layoutShift: true,
    });
  }, [floatingNew, virtualReference]);

  useEffect(() => {
    if (!floatingNew) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [floatingNew, onOpenChange]);

  const dialogTitle = pin ? "Edit pin" : "New pin";

  const otherMaps = useMemo(
    () => (pin ? maps.filter((j) => j.id !== pin.map_id) : []),
    [maps, pin],
  );

  /** Base UI Select maps values → labels for `<SelectValue>` (otherwise the raw id is shown). */
  const mapSelectItems = useMemo(
    () =>
      Object.fromEntries(otherMaps.map((j) => [j.id, j.name])) as Record<
        string,
        string
      >,
    [otherMaps],
  );

  const moveTargetMap = useMemo(
    () =>
      moveTargetMapId
        ? (maps.find((j) => j.id === moveTargetMapId) ?? null)
        : null,
    [maps, moveTargetMapId],
  );

  const tagsQuery = useQuery({
    queryKey: ["tags", mapId],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("tags")
        .select("*")
        .eq("map_id", mapId)
        .order("name");
      if (err) throw err;
      return (data ?? []) as Tag[];
    },
    enabled: open && Boolean(mapId),
  });

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (pin) {
      setTitle(pin.title ?? "");
      setDescription(pin.description ?? "");
      setDateYmd(pin.date ?? "");
      setEndDateYmd(pin.end_date ?? "");
      setLat(String(pin.lat));
      setLng(String(pin.lng));
      setLocationLabel(pin.location_label ?? "");
      void (async () => {
        const { data } = await supabase
          .from("pin_tags")
          .select("tag_id")
          .eq("pin_id", pin.id);
        setSelectedTags(new Set((data ?? []).map((r) => r.tag_id)));
      })();
    } else {
      setTitle("");
      setDescription("");
      setDateYmd("");
      setEndDateYmd("");
      setLat(String(defaultLat));
      setLng(String(defaultLng));
      setLocationLabel("");
      setSelectedTags(new Set());
    }
  }, [open, pin, defaultLat, defaultLng]);

  useEffect(() => {
    if (!open || pin) return;
    const latN = Number(lat);
    const lngN = Number(lng);
    if (Number.isNaN(latN) || Number.isNaN(lngN)) return;

    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      setLocationLookupPending(true);
      void (async () => {
        try {
          const label = await reversePhotonLocationLabel(latN, lngN);
          if (!cancelled) setLocationLabel(label ?? "");
        } catch {
          if (!cancelled) setLocationLabel("");
        } finally {
          if (!cancelled) setLocationLookupPending(false);
        }
      })();
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      setLocationLookupPending(false);
    };
  }, [open, pin, lat, lng]);

  useEffect(() => {
    if (!open || pin) return;
    onNewPinTagIdsChange?.([...selectedTags]);
  }, [open, pin, selectedTags, onNewPinTagIdsChange]);

  useEffect(() => {
    if (!open) {
      setPhotoLightbox(null);
      setMoveOpen(false);
      setMoveTargetMapId("");
      setMoving(false);
      setDeleteOpen(false);
      setDeleting(false);
    }
  }, [open]);

  async function confirmMovePin() {
    if (!pin || !moveTargetMapId) return;
    const targetMap = maps.find((j) => j.id === moveTargetMapId);
    if (!targetMap) return;

    setMoving(true);
    setError(null);
    const oldMapId = pin.map_id;
    try {
      const { data: photoRows, error: phFetchErr } = await supabase
        .from("photos")
        .select("id, storage_path")
        .eq("pin_id", pin.id);
      if (phFetchErr) throw phFetchErr;

      for (const p of photoRows ?? []) {
        const path = p.storage_path?.trim();
        if (!path) continue;
        const segments = path.split("/").filter(Boolean);
        if (segments.length < 3) continue;
        const tail = segments.slice(2).join("/");
        const newPath = `${moveTargetMapId}/${pin.id}/${tail}`;
        if (newPath === path) continue;

        const { data: blob, error: dlErr } = await supabase.storage
          .from("pin-photos")
          .download(path);
        if (dlErr || !blob) throw dlErr ?? new Error("Photo download failed");
        const { error: upErr } = await supabase.storage
          .from("pin-photos")
          .upload(newPath, blob, {
            upsert: false,
            contentType: blob.type || undefined,
          });
        if (upErr) throw upErr;

        const { error: uErr } = await supabase
          .from("photos")
          .update({
            map_id: moveTargetMapId,
            storage_path: newPath,
          })
          .eq("id", p.id);
        if (uErr) throw uErr;

        await supabase.storage.from("pin-photos").remove([path]);
      }

      const { error: ttErr } = await supabase
        .from("pin_tags")
        .delete()
        .eq("pin_id", pin.id);
      if (ttErr) throw ttErr;

      const { error: tlErr } = await supabase
        .from("pin_links")
        .update({ map_id: moveTargetMapId })
        .eq("pin_id", pin.id);
      if (tlErr) throw tlErr;

      const { data: pinRow, error: trErr } = await supabase
        .from("pins")
        .update({
          map_id: moveTargetMapId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pin.id)
        .select("slug")
        .single();
      if (trErr || !pinRow?.slug) throw trErr ?? new Error("Move failed");

      await qc.invalidateQueries({ queryKey: ["pins", oldMapId] });
      await qc.invalidateQueries({ queryKey: ["pins", moveTargetMapId] });
      await invalidatePinDetailCaches(qc, pin.id, oldMapId);
      await invalidatePinDetailCaches(qc, pin.id, moveTargetMapId);
      await qc.invalidateQueries({ queryKey: ["photos", pin.id] });
      await qc.invalidateQueries({ queryKey: ["photo-urls", pin.id] });
      await qc.invalidateQueries({
        queryKey: ["map-pin-photos", oldMapId],
      });
      await qc.invalidateQueries({
        queryKey: ["map-pin-photos", moveTargetMapId],
      });
      await qc.invalidateQueries({
        queryKey: ["photo-urls-batch", oldMapId],
      });
      await qc.invalidateQueries({
        queryKey: ["photo-urls-batch", moveTargetMapId],
      });

      setMoveOpen(false);
      setMoveTargetMapId("");
      onOpenChange(false);
      toast.success(`Moved to ${targetMap.name}`);
      navigate(pinDetailHref(targetMap.slug.trim(), pinRow.slug.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not move pin");
    } finally {
      setMoving(false);
    }
  }

  async function confirmDeletePin() {
    if (!pin) return;
    setDeleting(true);
    try {
      const mapSlug = maps.find((j) => j.id === pin.map_id)?.slug?.trim() ?? "";
      const { error } = await supabase.from("pins").delete().eq("id", pin.id);
      if (error) throw error;
      await invalidatePinDetailCaches(qc, pin.id, pin.map_id);
      await qc.invalidateQueries({
        queryKey: ["map-pin-photos", pin.map_id],
      });
      setDeleteOpen(false);
      onOpenChange(false);
      toast.success("Pin deleted");
      navigate(mapSlug ? mapViewHref("map", mapSlug) : "/");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not delete this pin.",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    const latN = Number(lat);
    const lngN = Number(lng);
    if (Number.isNaN(latN) || Number.isNaN(lngN)) {
      setError("Latitude and longitude must be numbers.");
      setSaving(false);
      return;
    }

    const start = dateYmd.trim() || null;
    const end = endDateYmd.trim() || null;
    if (end && !start) {
      setError("Clear the end date or set a start date.");
      setSaving(false);
      return;
    }
    if (start && end && end < start) {
      setError("End date must be on or after the start date.");
      setSaving(false);
      return;
    }

    try {
      let pinId = pin?.id;
      if (pin) {
        const { error: uErr } = await supabase
          .from("pins")
          .update({
            title: title || null,
            description: description || null,
            location_label: locationLabel.trim() || null,
            lat: latN,
            lng: lngN,
            date: start,
            end_date: end,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pin.id);
        if (uErr) throw uErr;
      } else {
        const { data: row, error: iErr } = await supabase
          .from("pins")
          .insert({
            map_id: mapId,
            title: title || null,
            description: description || null,
            location_label: locationLabel.trim() || null,
            lat: latN,
            lng: lngN,
            date: start,
            end_date: end,
          })
          .select("id")
          .single();
        if (iErr || !row) throw iErr ?? new Error("No pin id");
        pinId = row.id;
      }

      if (!pinId) throw new Error("Missing pin id");

      const { error: dErr } = await supabase
        .from("pin_tags")
        .delete()
        .eq("pin_id", pinId);
      if (dErr) throw dErr;

      const tagRows = [...selectedTags].map((tag_id) => ({
        pin_id: pinId,
        tag_id,
      }));
      if (tagRows.length > 0) {
        const { error: tErr } = await supabase.from("pin_tags").insert(tagRows);
        if (tErr) throw tErr;
      }

      if (pin) {
        await invalidatePinDetailCaches(qc, pin.id, mapId);
      } else {
        await qc.invalidateQueries({ queryKey: ["pins", mapId] });
      }
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const idSuffix = pin ? "e" : "n";

  async function onUploadPhotos(files: FileList | null) {
    if (!files?.length || !pin || !mapId) return;
    let sort = photos.length;
    for (const file of Array.from(files)) {
      const path = `${mapId}/${pin.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("pin-photos")
        .upload(path, file, {
          upsert: false,
        });
      if (upErr) {
        console.error(upErr);
        continue;
      }
      const { error: insErr } = await supabase.from("photos").insert({
        map_id: mapId,
        pin_id: pin.id,
        storage_path: path,
        sort_order: sort++,
      });
      if (insErr) console.error(insErr);
    }
    await qc.invalidateQueries({ queryKey: ["photos", pin.id] });
    await qc.invalidateQueries({ queryKey: ["photo-urls", pin.id] });
    await qc.invalidateQueries({
      queryKey: ["map-pin-photos", mapId],
    });
    await qc.invalidateQueries({
      queryKey: ["photo-urls-batch", mapId],
    });
    await qc.invalidateQueries({ queryKey: ["pin-side-sheet", pin.id] });
  }

  const formFields = (
    <PinFormGrid>
      <FormField>
        <Label htmlFor={`t-title-${idSuffix}`}>Title</Label>
        <Input
          id={`t-title-${idSuffix}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormField>
      <FormField>
        <Label htmlFor={`t-desc-${idSuffix}`}>Description</Label>
        <MarkdownEditor
          id={`t-desc-${idSuffix}`}
          value={description}
          onChange={setDescription}
          rows={4}
          placeholder="Notes about this place…"
        />
      </FormField>
      <FormField>
        <Label htmlFor={`t-date-${idSuffix}`}>Date</Label>
        <Input
          id={`t-date-${idSuffix}`}
          type="date"
          value={dateYmd}
          onChange={(e) => setDateYmd(e.target.value)}
        />
      </FormField>
      <FormField>
        <Label htmlFor={`t-end-${idSuffix}`}>End date</Label>
        <Input
          id={`t-end-${idSuffix}`}
          type="date"
          value={endDateYmd}
          min={dateYmd || undefined}
          onChange={(e) => setEndDateYmd(e.target.value)}
        />
      </FormField>
      {!pin ? (
        <FormField>
          <Label>Place</Label>
          <PinFormPlaceText pending={locationLookupPending}>
            {locationLookupPending
              ? "Looking up address…"
              : locationLabel
                ? locationLabel
                : "No place name yet…"}
          </PinFormPlaceText>
        </FormField>
      ) : (
        <>
          <FormField>
            <Label>Photos</Label>
            {photos.length > 0 ? (
              <PinFormPhotoGrid>
                {photos.map((p) => {
                  const url = signedUrlByPhotoId[p.id];
                  const removing =
                    removePhotoMut.isPending &&
                    removePhotoMut.variables === p.id;
                  return url ? (
                    <PinFormPhotoThumb
                      key={p.id}
                      removeButton={
                        <PinFormPhotoRemoveButton
                          onClick={() => removePhotoMut.mutate(p.id)}
                          disabled={removing}
                        />
                      }
                    >
                      <PinPhotoThumb
                        url={url}
                        onOpen={() => setPhotoLightbox({ photoId: p.id })}
                      />
                    </PinFormPhotoThumb>
                  ) : (
                    <PinFormPhotoPlaceholder key={p.id}>
                      …
                    </PinFormPhotoPlaceholder>
                  );
                })}
              </PinFormPhotoGrid>
            ) : null}
            <PinFormUploadRow>
              <PinFormUploadLabel
                input={
                  <PinFormUploadInput
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => void onUploadPhotos(e.target.files)}
                  />
                }
              >
                <Upload aria-hidden />
                <span>Upload photos</span>
              </PinFormUploadLabel>
              {pluginList.map((p) => {
                const Slot = p.PinPhotoImportSlot;
                if (!Slot) return null;
                return (
                  <Slot
                    key={p.id}
                    supabase={supabase}
                    userId={user?.id}
                    pinId={pin.id}
                    mapId={mapId}
                    pinDate={pin.date}
                    pinEndDate={pin.end_date}
                  />
                );
              })}
            </PinFormUploadRow>
          </FormField>
          <FormField>
            <Label>Links</Label>
            <PinLinksEditor pinId={pin.id} mapId={mapId} />
          </FormField>
        </>
      )}
      <FormField>
        <Label>Tags</Label>
        <PinFormTagBox>
          {(tagsQuery.data ?? []).map((tag) => (
            <PinFormTagOption key={tag.id}>
              <Checkbox
                checked={selectedTags.has(tag.id)}
                onCheckedChange={(c) => {
                  setSelectedTags((prev) => {
                    const next = new Set(prev);
                    if (c === true) next.add(tag.id);
                    else next.delete(tag.id);
                    return next;
                  });
                }}
              />
              <span>{tag.icon_emoji}</span>
              <span>{tag.name}</span>
            </PinFormTagOption>
          ))}
          {tagsQuery.data?.length === 0 ? (
            <FormMutedText>
              No tags yet — add one from the Tags menu.
            </FormMutedText>
          ) : null}
        </PinFormTagBox>
      </FormField>
      {pin ? (
        <CautionPanel
          title="Danger zone"
          description="Move this pin to another map or delete it permanently."
        >
          <PinFormDangerActions>
            <Button
              type="button"
              variant="secondary"
              disabled={otherMaps.length === 0}
              onClick={() => {
                setMoveTargetMapId("");
                setMoveOpen(true);
              }}
            >
              Move to another map…
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 aria-hidden />
              Delete pin
            </Button>
          </PinFormDangerActions>
          {otherMaps.length === 0 ? (
            <PinFormDangerHint>No other maps to move to.</PinFormDangerHint>
          ) : null}
        </CautionPanel>
      ) : null}
      {error ? <FormErrorText>{error}</FormErrorText> : null}
    </PinFormGrid>
  );

  const footerActions = (
    <>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Cancel
      </Button>
      <Button disabled={saving} onClick={() => void save()}>
        Save
      </Button>
    </>
  );

  const photoLightboxOverlay = pin ? (
    <PinPhotoLightbox
      open={photoLightbox !== null}
      onOpenChange={(o) => {
        if (!o) setPhotoLightbox(null);
      }}
      items={lightboxItems}
      initialPhotoId={photoLightbox?.photoId ?? null}
      title={pin.title?.trim() || "Untitled place"}
    />
  ) : null;

  const movePinDialog = pin ? (
    <Dialog
      open={moveOpen}
      onOpenChange={(next) => {
        if (!moving) setMoveOpen(next);
      }}
    >
      <PanelDialogContent>
        <PanelDialogHeader>
          <PanelDialogTitle>Move pin to another map</PanelDialogTitle>
          <DialogDescription>
            Tags will be removed. If you choose a shared map, other members may
            see this pin. Pick a destination map below.
          </DialogDescription>
        </PanelDialogHeader>
        <PanelDialogBody>
          <PanelDialogFormStack>
            <PinFormMoveList>
              <li>
                All tags will be removed from this pin. Tags belong to a map and
                do not carry over.
              </li>
              {moveTargetMap && !moveTargetMap.is_personal ? (
                <li>
                  This map is shared with others. Members who can access it may
                  be able to see this pin.
                </li>
              ) : null}
            </PinFormMoveList>
            <PanelDialogField>
              <Label htmlFor="move-pin-map">Destination map</Label>
              <Select
                modal={false}
                value={moveTargetMapId === "" ? null : moveTargetMapId}
                onValueChange={(v) => setMoveTargetMapId(v ?? "")}
                items={mapSelectItems}
              >
                <FormSelectTriggerFull id="move-pin-map">
                  <SelectValue placeholder="Choose a map" />
                </FormSelectTriggerFull>
                <SelectContent alignItemWithTrigger={false}>
                  {otherMaps.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PanelDialogField>
          </PanelDialogFormStack>
        </PanelDialogBody>
        <PanelDialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={moving}
            onClick={() => setMoveOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={moving || !moveTargetMapId}
            onClick={() => void confirmMovePin()}
          >
            {moving ? "Moving…" : "Move pin"}
          </Button>
        </PanelDialogFooter>
      </PanelDialogContent>
    </Dialog>
  ) : null;

  const deletePinDialog = pin ? (
    <Dialog
      open={deleteOpen}
      onOpenChange={(next) => {
        if (!next && deleting) return;
        setDeleteOpen(next);
      }}
    >
      <PanelDialogContent showCloseButton={!deleting}>
        <PanelDialogHeader>
          <PanelDialogTitle>Delete pin?</PanelDialogTitle>
          <DialogDescription>
            This removes the pin from your map. This cannot be undone.
          </DialogDescription>
        </PanelDialogHeader>
        <PanelDialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={() => setDeleteOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={() => void confirmDeletePin()}
          >
            {deleting ? "Deleting…" : "Delete pin"}
          </Button>
        </PanelDialogFooter>
      </PanelDialogContent>
    </Dialog>
  ) : null;

  if (floatingNew && anchorScreen) {
    return (
      <>
        <PinFormFloatingHost hostRef={floatingRef}>
          <PinFormPanelCard title={dialogTitle} footer={footerActions}>
            {formFields}
          </PinFormPanelCard>
        </PinFormFloatingHost>
        {photoLightboxOverlay}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <PinFormPanelDialog title={dialogTitle} footer={footerActions}>
          {formFields}
        </PinFormPanelDialog>
      </Dialog>
      {photoLightboxOverlay}
      {movePinDialog}
      {deletePinDialog}
    </>
  );
}
