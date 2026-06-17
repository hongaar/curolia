/* eslint-disable react-hooks/set-state-in-effect -- reset form fields when dialog opens/closes */
import { PinLinksEditor } from "@/components/pins/pin-links-editor";
import { TagEntityLabelInput } from "@/components/pins/tag-entity-label-input";
import { useMaxSm } from "@/hooks/use-max-sm";
import { mapViewHref, pinDetailHref } from "@/lib/app-paths";
import { invalidateHomeFeed } from "@/lib/home-feed";
import { imageDimensionsFromFile } from "@/lib/image-dimensions";
import { mapAnchorPanelMiddleware } from "@/lib/map-anchor-floating-ui";
import { mapRouteForMap } from "@/lib/map-route";
import {
  fileFromClipboardData,
  isPinFormTextEntryPasteTarget,
  urlFromClipboardData,
} from "@/lib/pin-form-clipboard";
import { fetchLinkMetadata, type LinkMetadata } from "@/lib/pin-links";
import { photosToLightboxItems } from "@/lib/pin-photo-lightbox-items";
import {
  persistPinPhotoOrder,
  reorderPhotosByIds,
} from "@/lib/pin-photo-order";
import { randomPresetTagColor } from "@/lib/preset-pin-tag-colors";
import { supabase } from "@/lib/supabase";
import { useAddPinLink } from "@/lib/use-add-pin-link";
import { useEnabledPlugins } from "@/lib/use-enabled-plugins";
import { usePinPhotosSignedUrls } from "@/lib/use-pin-photos";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import type { Photo, Pin, Tag } from "@/types/database";
import type { PinEditorFieldSuggestion } from "@curolia/plugin-contract";
import {
  availableLocationLabelPatterns,
  DEFAULT_LOCATION_LABEL_DETAIL,
  defaultLocationLabelDetail,
  geocodeMatchesCoords,
  isLocationLabelDetail,
  locationLabelDetailPreviewItems,
  locationLabelForDetail,
  parsePinGeocode,
  pinGeocodeToJson,
  reverseGeocodeForStorage,
  type LocationLabelDetail,
  type PinGeocode,
} from "@curolia/services/geocoding";
import { BulletList } from "@curolia/ui/bullet-list";
import { Button } from "@curolia/ui/button";
import { CautionPanel } from "@curolia/ui/caution-panel";
import { Checkbox } from "@curolia/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogCardTitle,
  DialogContent,
  DialogDescription,
  DialogField,
  DialogFooter,
  DialogFormStack,
  DialogHeader,
  DialogTitle,
} from "@curolia/ui/dialog";
import {
  FileUploadInput,
  FileUploadLabel,
  FileUploadRow,
} from "@curolia/ui/file-upload";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import { MarkdownEditor } from "@curolia/ui/markdown-editor";
import { OptionList, OptionListItem } from "@curolia/ui/option-list";
import {
  PageFormBlockSpaced,
  PageHeader,
  PageHeaderTitle,
  PageInlineActions,
} from "@curolia/ui/page";
import {
  PhotoGrid,
  PhotoGridPlaceholder,
  PhotoGridRemoveButton,
  PhotoGridThumb,
} from "@curolia/ui/photo-grid";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FormGrid2,
  FormSelectTriggerFull,
  PinFormFloatingHost,
  PinFormGrid,
  PinFormPluginSectionCard,
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
import { Stack } from "@curolia/ui/stack";
import { Text } from "@curolia/ui/text";
import { autoUpdate, computePosition } from "@floating-ui/dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
} from "react";
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
  /** Full-page stack layout (mobile edit route) instead of a modal dialog. */
  layout?: "dialog" | "page";
  /** For new pins: screen anchor → floating panel (no modal blur). */
  anchorScreen?: { x: number; y: number } | null;
  /** Fires while creating a pin when tag selection changes (for map preview). */
  onNewPinTagIdsChange?: (tagIds: string[]) => void;
  /** Skip the edit form and open move/delete confirmation directly. */
  focusAction?: "move" | "delete";
};

export function PinFormDialog({
  open,
  onOpenChange,
  mapId,
  pin,
  defaultLat = 0,
  defaultLng = 0,
  layout = "dialog",
  anchorScreen = null,
  onNewPinTagIdsChange,
  focusAction,
}: PinFormDialogProps) {
  const { user } = useAuth();
  const { plugins: enabledPlugins } = useEnabledPlugins();
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
  const [geocode, setGeocode] = useState<PinGeocode | null>(null);
  const [locationLabelDetail, setLocationLabelDetail] =
    useState<LocationLabelDetail>(DEFAULT_LOCATION_LABEL_DETAIL);
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
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(randomPresetTagColor);
  const [newTagEmoji, setNewTagEmoji] = useState("");
  const [tagSaving, setTagSaving] = useState(false);
  const floatingRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<{ x: number; y: number } | null>(null);
  const pendingLinkRef = useRef<LinkMetadata | null>(null);

  const editPinId = pin?.id;
  const addLinkMut = useAddPinLink(editPinId, mapId);
  const { photos, signedUrlByPhotoId } = usePinPhotosSignedUrls(editPinId);
  const lightboxItems = useMemo(
    () => photosToLightboxItems(photos, signedUrlByPhotoId),
    [photos, signedUrlByPhotoId],
  );

  const availableLabelPatterns = useMemo(
    () => availableLocationLabelPatterns(geocode),
    [geocode],
  );

  const locationDetailSelectItems = useMemo(
    () => locationLabelDetailPreviewItems(geocode),
    [geocode],
  );

  const reorderPhotosMut = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      if (!pin) throw new Error("missing_pin");
      await persistPinPhotoOrder(orderedIds);
    },
    onMutate: async (orderedIds) => {
      if (!pin) return;
      await qc.cancelQueries({ queryKey: ["photos", pin.id] });
      const previous = qc.getQueryData<Photo[]>(["photos", pin.id]);
      qc.setQueryData<Photo[]>(["photos", pin.id], (current) =>
        reorderPhotosByIds(current ?? [], orderedIds),
      );
      return { previous };
    },
    onError: (e, _orderedIds, context) => {
      if (pin && context?.previous) {
        qc.setQueryData(["photos", pin.id], context.previous);
      }
      toast.error(e instanceof Error ? e.message : "Could not reorder photos.");
    },
    onSettled: async () => {
      if (!pin) return;
      await qc.invalidateQueries({
        queryKey: ["map-pin-photos", mapId],
      });
      await qc.invalidateQueries({ queryKey: ["pin-side-sheet", pin.id] });
    },
  });

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
    pendingLinkRef.current = null;
    if (pin) {
      setTitle(pin.title ?? "");
      setDescription(pin.description ?? "");
      setDateYmd(pin.date ?? "");
      setEndDateYmd(pin.end_date ?? "");
      setLat(String(pin.lat));
      setLng(String(pin.lng));
      const parsedGeocode = parsePinGeocode(pin.geocode);
      setGeocode(parsedGeocode);
      const patterns = availableLocationLabelPatterns(parsedGeocode);
      const stored = pin.location_label_detail;
      setLocationLabelDetail(
        stored && isLocationLabelDetail(stored) && patterns.includes(stored)
          ? stored
          : defaultLocationLabelDetail(parsedGeocode),
      );
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
      setGeocode(null);
      setLocationLabelDetail(DEFAULT_LOCATION_LABEL_DETAIL);
      setSelectedTags(new Set());
    }
  }, [open, pin, defaultLat, defaultLng]);

  useEffect(() => {
    if (!open) return;
    const latN = Number(lat);
    const lngN = Number(lng);
    if (Number.isNaN(latN) || Number.isNaN(lngN)) return;

    const pinGeocode = pin?.geocode;
    const stored = pinGeocode != null ? parsePinGeocode(pinGeocode) : null;
    if (stored && geocodeMatchesCoords(stored, latN, lngN)) {
      setGeocode(stored);
      setLocationLookupPending(false);
      return;
    }

    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      setLocationLookupPending(true);
      void (async () => {
        try {
          const next = await reverseGeocodeForStorage(latN, lngN);
          if (!cancelled) setGeocode(next);
        } catch {
          if (!cancelled) setGeocode(null);
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
  }, [open, lat, lng, pin?.id, pin?.geocode]);

  useEffect(() => {
    if (!open || !geocode || availableLabelPatterns.length === 0) return;
    setLocationLabelDetail((current: LocationLabelDetail) =>
      availableLabelPatterns.includes(current)
        ? current
        : availableLabelPatterns[0]!,
    );
  }, [open, geocode, availableLabelPatterns]);

  useEffect(() => {
    if (!open || pin) return;
    onNewPinTagIdsChange?.([...selectedTags]);
  }, [open, pin, selectedTags, onNewPinTagIdsChange]);

  useEffect(() => {
    if (!open || !pin || !focusAction) return;
    if (focusAction === "move") {
      setMoveTargetMapId("");
      setMoveOpen(true);
      return;
    }
    setDeleteOpen(true);
  }, [focusAction, open, pin]);

  useEffect(() => {
    if (!open) {
      setPhotoLightbox(null);
      setMoveOpen(false);
      setMoveTargetMapId("");
      setMoving(false);
      setDeleteOpen(false);
      setDeleting(false);
      setTagDialogOpen(false);
      setNewTagName("");
      setNewTagColor(randomPresetTagColor());
      setNewTagEmoji("");
      setTagSaving(false);
    }
  }, [open]);

  function openNewTagDialog() {
    setNewTagName("");
    setNewTagColor(randomPresetTagColor());
    setNewTagEmoji("");
    setTagDialogOpen(true);
  }

  async function createTag() {
    if (!mapId || !newTagName.trim()) return;
    setTagSaving(true);
    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({
          map_id: mapId,
          name: newTagName.trim(),
          color: newTagColor,
          icon_emoji: newTagEmoji.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (!data?.id) throw new Error("No tag id");
      toast.success("Tag created");
      setTagDialogOpen(false);
      setNewTagName("");
      await qc.invalidateQueries({ queryKey: ["tags", mapId] });
      setSelectedTags((prev) => new Set(prev).add(data.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create tag");
    } finally {
      setTagSaving(false);
    }
  }

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
      const targetWithOwner = maps.find((m) => m.id === targetMap.id);
      if (targetWithOwner?.owner_profile_slug) {
        navigate(
          pinDetailHref(mapRouteForMap(targetWithOwner), pinRow.slug.trim()),
        );
      }
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
      const mapForPin = maps.find((j) => j.id === pin.map_id);
      const { error } = await supabase.from("pins").delete().eq("id", pin.id);
      if (error) throw error;
      await invalidatePinDetailCaches(qc, pin.id, pin.map_id);
      await qc.invalidateQueries({
        queryKey: ["map-pin-photos", pin.map_id],
      });
      invalidateHomeFeed(qc);
      setDeleteOpen(false);
      onOpenChange(false);
      toast.success("Pin deleted");
      navigate(
        mapForPin?.owner_profile_slug
          ? mapViewHref("map", mapRouteForMap(mapForPin))
          : "/",
      );
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
            geocode: pinGeocodeToJson(geocode),
            location_label_detail: locationLabelDetail,
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
            geocode: pinGeocodeToJson(geocode),
            location_label_detail: locationLabelDetail,
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

      const pendingLink = !pin ? pendingLinkRef.current : null;
      if (pendingLink) {
        pendingLinkRef.current = null;
        const { error: linkErr } = await supabase.from("pin_links").insert({
          map_id: mapId,
          pin_id: pinId,
          url: pendingLink.finalUrl || pendingLink.url,
          title: pendingLink.title,
          description: pendingLink.description,
          image_url: pendingLink.imageUrl,
          favicon_url: pendingLink.faviconUrl,
          sort_order: 0,
        });
        if (linkErr) throw linkErr;
      }

      if (pin) {
        await invalidatePinDetailCaches(qc, pin.id, mapId);
      } else {
        await qc.invalidateQueries({ queryKey: ["pins", mapId] });
      }
      invalidateHomeFeed(qc);
      toast.success(pin ? "Pin updated" : "Pin created");
      onOpenChange(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not save pin.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const idSuffix = pin ? "e" : "n";
  const latN = Number(lat);
  const lngN = Number(lng);
  const draftCoordsValid = Number.isFinite(latN) && Number.isFinite(lngN);

  function applyPinSuggestion(fields: PinEditorFieldSuggestion) {
    if (fields.title?.trim() && !title.trim()) {
      setTitle(fields.title.trim());
    }
    if (fields.description?.trim() && !description.trim()) {
      setDescription(fields.description.trim());
    }
  }

  async function onUploadPhotos(files: FileList | File[] | null) {
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
      const dims = await imageDimensionsFromFile(file);
      const { error: insErr } = await supabase.from("photos").insert({
        map_id: mapId,
        pin_id: pin.id,
        storage_path: path,
        sort_order: sort++,
        ...(dims ? { width: dims.width, height: dims.height } : {}),
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

  async function prefillFromPastedLink(url: string) {
    try {
      const meta = await fetchLinkMetadata(url);
      pendingLinkRef.current = meta;
      if (meta.title?.trim() && !title.trim()) setTitle(meta.title.trim());
      if (meta.description?.trim() && !description.trim()) {
        setDescription(meta.description.trim());
      }
      if (meta.location) {
        setLat(String(meta.location.lat));
        setLng(String(meta.location.lng));
      } else {
        toast.message(
          "Link saved — add coordinates or pick a place on the map.",
        );
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not read link metadata.",
      );
    }
  }

  function onFormPasteCapture(e: ClipboardEvent) {
    const imageFile = fileFromClipboardData(e.clipboardData);
    if (imageFile) {
      if (!pin) return;
      e.preventDefault();
      void onUploadPhotos([imageFile]);
      return;
    }
    if (isPinFormTextEntryPasteTarget(e.target)) return;
    const url = urlFromClipboardData(e.clipboardData);
    if (!url) return;
    e.preventDefault();
    if (pin) {
      addLinkMut.mutate(url);
      return;
    }
    void prefillFromPastedLink(url);
  }

  const formFields = (
    <PinFormGrid onPasteCapture={open ? onFormPasteCapture : undefined}>
      <Field>
        <FieldLabel htmlFor={`t-title-${idSuffix}`}>Title</FieldLabel>
        <FieldControl>
          <Input
            id={`t-title-${idSuffix}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FieldControl>
      </Field>
      <Field>
        <FieldLabel htmlFor={`t-desc-${idSuffix}`}>Description</FieldLabel>
        <FieldControl>
          <MarkdownEditor
            id={`t-desc-${idSuffix}`}
            value={description}
            onChange={setDescription}
            rows={4}
            placeholder="Notes about this place…"
          />
        </FieldControl>
      </Field>
      {!pin && draftCoordsValid
        ? enabledPlugins.map((p) => {
            const Slot = p.PinDraftEnrichmentSlot;
            if (!Slot) return null;
            const PluginIcon = p.icon;
            return (
              <PinFormPluginSectionCard
                key={`draft-${p.id}`}
                icon={<PluginIcon size={4} />}
                title={p.displayName}
              >
                <Slot
                  supabase={supabase}
                  userId={user?.id}
                  mapId={mapId}
                  lat={latN}
                  lng={lngN}
                  hasTitle={Boolean(title.trim())}
                  hasDescription={Boolean(description.trim())}
                  onApplySuggestion={applyPinSuggestion}
                />
              </PinFormPluginSectionCard>
            );
          })
        : null}
      <Field>
        <FieldLabel htmlFor={`t-location-detail-${idSuffix}`}>
          Location label
        </FieldLabel>
        <FieldControl>
          <Select
            modal={false}
            value={locationLabelDetail}
            onValueChange={(v) => {
              if (v && isLocationLabelDetail(v)) setLocationLabelDetail(v);
            }}
            items={locationDetailSelectItems}
            disabled={
              locationLookupPending ||
              !geocode ||
              availableLabelPatterns.length === 0
            }
          >
            <FormSelectTriggerFull id={`t-location-detail-${idSuffix}`}>
              <SelectValue placeholder="Choose location label" />
            </FormSelectTriggerFull>
            <SelectContent>
              {availableLabelPatterns.map((detail) => (
                <SelectItem key={detail} value={detail}>
                  {locationLabelForDetail(geocode, detail) ?? "—"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldControl>
        {locationLookupPending ? (
          <FieldDescription variant="body">
            Looking up address…
          </FieldDescription>
        ) : !geocode ? (
          <FieldDescription variant="body">
            Move the pin or wait for geocoding to finish.
          </FieldDescription>
        ) : null}
      </Field>
      <FormGrid2>
        <Field>
          <FieldLabel htmlFor={`t-date-${idSuffix}`}>Start date</FieldLabel>
          <FieldControl>
            <Input
              id={`t-date-${idSuffix}`}
              type="date"
              value={dateYmd}
              onChange={(e) => setDateYmd(e.target.value)}
            />
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel htmlFor={`t-end-${idSuffix}`}>End date</FieldLabel>
          <FieldControl>
            <Input
              id={`t-end-${idSuffix}`}
              type="date"
              value={endDateYmd}
              min={dateYmd || undefined}
              onChange={(e) => setEndDateYmd(e.target.value)}
            />
          </FieldControl>
        </Field>
      </FormGrid2>
      {pin ? (
        <>
          <Field>
            <FieldLabel>Photos</FieldLabel>
            {photos.length > 1 ? (
              <FieldDescription variant="body">
                Drag photos to reorder.
              </FieldDescription>
            ) : null}
            {photos.length > 0 ? (
              <PhotoGrid
                items={photos}
                getItemId={(p) => p.id}
                disabled={reorderPhotosMut.isPending}
                onReorder={(next) => {
                  reorderPhotosMut.mutate(next.map((p) => p.id));
                }}
                renderItem={(p, { dragHandle }) => {
                  const url = signedUrlByPhotoId[p.id];
                  const removing =
                    removePhotoMut.isPending &&
                    removePhotoMut.variables === p.id;
                  return url ? (
                    <PhotoGridThumb
                      dragHandle={dragHandle}
                      removeButton={
                        <PhotoGridRemoveButton
                          onClick={() => removePhotoMut.mutate(p.id)}
                          disabled={removing}
                        />
                      }
                    >
                      <PinPhotoThumb
                        url={url}
                        onOpen={() => setPhotoLightbox({ photoId: p.id })}
                      />
                    </PhotoGridThumb>
                  ) : (
                    <PhotoGridThumb dragHandle={dragHandle}>
                      <PhotoGridPlaceholder>…</PhotoGridPlaceholder>
                    </PhotoGridThumb>
                  );
                }}
              />
            ) : null}
            <FileUploadRow>
              <FileUploadLabel
                input={
                  <FileUploadInput
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => void onUploadPhotos(e.target.files)}
                  />
                }
              >
                <Upload aria-hidden />
                <span>Upload photos</span>
              </FileUploadLabel>
              {enabledPlugins.map((p) => {
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
            </FileUploadRow>
          </Field>
          <Field>
            <FieldLabel>Links</FieldLabel>
            <PinLinksEditor pinId={pin.id} mapId={mapId} />
          </Field>
        </>
      ) : null}
      <Field>
        <FieldLabel>Tags</FieldLabel>
        <OptionList>
          {(tagsQuery.data ?? []).map((tag) => (
            <OptionListItem key={tag.id}>
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
              {tag.icon_emoji ? <span>{tag.icon_emoji}</span> : null}
              <span>{tag.name}</span>
            </OptionListItem>
          ))}
          {tagsQuery.data?.length === 0 ? (
            <FieldDescription variant="body">No tags yet.</FieldDescription>
          ) : null}
        </OptionList>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openNewTagDialog}
        >
          <Plus aria-hidden />
          New tag…
        </Button>
      </Field>
      {pin
        ? enabledPlugins.map((p) => {
            const Section = p.PinFormSection;
            if (!Section) return null;
            const PluginIcon = p.icon;
            return (
              <PinFormPluginSectionCard
                key={`form-${p.id}`}
                icon={<PluginIcon size={4} />}
                title={p.displayName}
              >
                <Section
                  supabase={supabase}
                  userId={user?.id}
                  pinId={pin.id}
                  mapId={mapId}
                  pinDate={pin.date}
                  pinEndDate={pin.end_date}
                  pinLat={latN}
                  pinLng={lngN}
                  hasPinTitle={Boolean(title.trim())}
                  hasPinDescription={Boolean(description.trim())}
                  onApplyPinSuggestion={applyPinSuggestion}
                />
              </PinFormPluginSectionCard>
            );
          })
        : null}
      {pin ? (
        <CautionPanel
          title="Danger zone"
          description="Move this pin to another map or delete it permanently."
        >
          <Stack gap="sm">
            <Stack direction="row" wrap gap="sm">
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
            </Stack>
            {otherMaps.length === 0 ? (
              <Text variant="mutedXs">No other maps to move to.</Text>
            ) : null}
          </Stack>
        </CautionPanel>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
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

  const closeFocusedAction = () => {
    if (focusAction) onOpenChange(false);
  };

  const setMoveDialogOpen = (next: boolean) => {
    if (!moving) {
      setMoveOpen(next);
      if (!next) closeFocusedAction();
    }
  };

  const setDeleteDialogOpen = (next: boolean) => {
    if (!next && deleting) return;
    setDeleteOpen(next);
    if (!next) closeFocusedAction();
  };

  const movePinDialog = pin ? (
    <Dialog open={moveOpen} onOpenChange={setMoveDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move pin to another map</DialogTitle>
          <DialogDescription>
            Tags will be removed. If you choose a shared map, other members may
            see this pin. Pick a destination map below.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <DialogFormStack>
            <BulletList>
              <li>
                All tags will be removed from this pin. Tags belong to a map and
                do not carry over.
              </li>
              {moveTargetMap && moveTargetMap.id !== mapId ? (
                <li>
                  This map may be shared with others. Members who can access it
                  may be able to see this pin.
                </li>
              ) : null}
            </BulletList>
            <DialogField>
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
            </DialogField>
          </DialogFormStack>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={moving}
            onClick={() => setMoveDialogOpen(false)}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;

  const tagFormDialog = (
    <Dialog
      open={tagDialogOpen}
      onOpenChange={(next) => {
        if (!next && tagSaving) return;
        setTagDialogOpen(next);
      }}
    >
      <DialogContent>
        <DialogHeader showCloseButton={!tagSaving}>
          <DialogTitle>New tag</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogFormStack>
            <TagEntityLabelInput
              id={`pin-form-tag-name-${idSuffix}`}
              label="Tag"
              name={newTagName}
              onNameChange={setNewTagName}
              placeholder="Tag name"
              color={newTagColor}
              onColorChange={setNewTagColor}
              emoji={newTagEmoji}
              onEmojiChange={setNewTagEmoji}
              emojiClearable
            />
          </DialogFormStack>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={tagSaving}
            onClick={() => setTagDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={tagSaving || !newTagName.trim()}
            onClick={() => void createTag()}
          >
            {tagSaving ? "Creating…" : "Create tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const deletePinDialog = pin ? (
    <Dialog open={deleteOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader showCloseButton={!deleting}>
          <DialogTitle>Delete pin?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>
            This removes the pin from your map. This cannot be undone.
          </DialogDescription>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={() => setDeleteDialogOpen(false)}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;

  if (floatingNew && anchorScreen) {
    return (
      <>
        <PinFormFloatingHost hostRef={floatingRef}>
          <DialogContent modal={false} size={pin ? "wide" : "default"}>
            <DialogHeader showCloseButton onClose={() => onOpenChange(false)}>
              <DialogCardTitle>{dialogTitle}</DialogCardTitle>
            </DialogHeader>
            <DialogBody>{formFields}</DialogBody>
            <DialogFooter>{footerActions}</DialogFooter>
          </DialogContent>
        </PinFormFloatingHost>
        {photoLightboxOverlay}
        {tagFormDialog}
      </>
    );
  }

  if (layout === "page") {
    return (
      <>
        <PageHeader>
          <PageHeaderTitle>{dialogTitle}</PageHeaderTitle>
        </PageHeader>
        <PageFormBlockSpaced>
          {formFields}
          <PageInlineActions>{footerActions}</PageInlineActions>
        </PageFormBlockSpaced>
        {photoLightboxOverlay}
        {tagFormDialog}
        {movePinDialog}
        {deletePinDialog}
      </>
    );
  }

  const showEditDialog = open && !focusAction;

  return (
    <>
      <Dialog open={showEditDialog} onOpenChange={onOpenChange}>
        <DialogContent size={pin ? "wide" : "default"}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <DialogBody>{formFields}</DialogBody>
          <DialogFooter>{footerActions}</DialogFooter>
        </DialogContent>
      </Dialog>
      {photoLightboxOverlay}
      {tagFormDialog}
      {movePinDialog}
      {deletePinDialog}
    </>
  );
}
