import { MapViewInitialLoader } from "@/components/layout/map-view-initial-loader";
import { MapControlsToolbar } from "@/components/map/map-controls-toolbar";
import {
  MapPointerContextMenu,
  type MapPointerContextMenuTarget,
} from "@/components/map/map-pointer-context-menu";
import { MapSlugAccessBlocked } from "@/components/map/map-slug-access-blocked";
import { MapTagFiltersControl } from "@/components/map/map-tag-filters-control";
import { PinDetailSideSheet } from "@/components/map/pin-detail-side-sheet";
import { PinMap, type PinMapHandle } from "@/components/map/pin-map";
import { AddPinFab } from "@/components/pins/add-pin-fab";
import { EmojiPicker } from "@/components/pins/emoji-picker";
import { PinMapQuickAddDialog } from "@/components/pins/pin-map-quick-add-dialog";
import { PresetColorPicker } from "@/components/pins/preset-color-picker";
import { useMapMemberRole } from "@/hooks/use-map-access";
import { useMapSlugRouteSync } from "@/hooks/use-map-slug-route-sync";
import { useMinMd } from "@/hooks/use-min-md";
import { pinDetailHref } from "@/lib/app-paths";
import {
  readStoredMapCamera,
  writeStoredMapCamera,
} from "@/lib/map-camera-storage";
import {
  normalizeMapStyleOptions,
  normalizeMapStylePreset,
} from "@/lib/map-style";
import {
  applyAddPinToSearchParams,
  applyFilterTagsToSearchParams,
  applyMapCameraToSearchParams,
  applySelectedPinToSearchParams,
  bboxToSyncKey,
  camerasCloseEnough,
  cameraToSyncKey,
  normalizeCameraForUrl,
  parseAddPinFromSearchParams,
  parseMapBboxFromSearchParams,
  parseMapCameraFromSearchParams,
  parseSelectedPinTokenFromSearchParams,
  resolveFilterTagIdsFromSearchParams,
  resolvePinIdFromMapToken,
  stripMapBboxFromSearchParams,
  type MapCamera,
} from "@/lib/map-view-params";
import {
  reversePhotonGeocode,
  reversePhotonPlaceDetails,
} from "@/lib/photon-geocode";
import {
  fileFromClipboardData,
  isPinFormTextEntryPasteTarget,
  urlFromClipboardData,
} from "@/lib/pin-form-clipboard";
import { createPinFromLinkMetadata } from "@/lib/pin-from-link";
import {
  defaultLocationLabelDetail,
  pinGeocodeToJson,
} from "@/lib/pin-geocode";
import { fetchLinkMetadata } from "@/lib/pin-links";
import type { PinWithTags } from "@/lib/pin-with-tags";
import { filterPinsByTags } from "@/lib/pin-with-tags";
import { DEFAULT_PIN_TAG_COLOR } from "@/lib/preset-pin-tag-colors";
import { isStackRoute } from "@/lib/stack-routes";
import { supabase } from "@/lib/supabase";
import { useMap } from "@/providers/map-provider";
import type { Pin, Tag } from "@/types/database";
import { Button } from "@curolia/ui/button";
import { Dialog } from "@curolia/ui/dialog";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import {
  MapControlsBottomStack,
  MapControlsLayer,
  MapHost,
  MapLayer,
  MapPageRoot,
  MapPlacementHint,
  MapSidePanel,
  MapVignette,
} from "@curolia/ui/map";
import {
  PanelDialogBody,
  PanelDialogContent,
  PanelDialogField,
  PanelDialogFooter,
  PanelDialogFormStack,
  PanelDialogHeader,
  PanelDialogTitle,
} from "@curolia/ui/panel-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const PinFormDialog = lazy(() =>
  import("@/components/pins/pin-form-dialog").then((m) => ({
    default: m.PinFormDialog,
  })),
);

/**
 * CSS value passed to MapLayer's --map-panel-right — mirrors the sidePanel
 * `width: clamp(24rem, 35%, 40rem)` so the map controls shift by the same amount.
 */
const PANEL_RIGHT_WIDTH_CSS = "clamp(24rem, 35%, 40rem)";

export function MapPage() {
  const qc = useQueryClient();
  const isWideEnough = useMinMd();
  const navigate = useNavigate();
  const { mapSlug } = useParams<{ mapSlug: string }>();
  useMapSlugRouteSync(mapSlug);
  const mapRef = useRef<PinMapHandle>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /** Camera captured just before the side panel opened — restored on close. */
  const prevCameraBeforeSheetRef = useRef<MapCamera | null>(null);
  /** Camera after the open-time pan-for-panel settles — used to detect user adjustments. */
  const postPanCameraBeforeSheetRef = useRef<MapCamera | null>(null);
  /** Track previous sidebarPinId to detect open/close transitions. */
  const prevSidebarPinIdRef = useRef<string | null>(null);
  /** True only when the side panel opens from a map marker click (not URL restore). */
  const [sidePanelAnimateIn, setSidePanelAnimateIn] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const bboxFromUrl = useMemo(
    () => parseMapBboxFromSearchParams(searchParams),
    [searchParams],
  );
  const cameraFromUrl = useMemo(
    () => parseMapCameraFromSearchParams(searchParams),
    [searchParams],
  );
  const addPinFromUrl = useMemo(
    () => parseAddPinFromSearchParams(searchParams),
    [searchParams],
  );
  const {
    activeMapId,
    activeMap,
    loading: mapLoading,
    routeMapStatus,
    publicView,
  } = useMap();
  const { canEdit: memberCanEdit } = useMapMemberRole(activeMapId);
  const canEdit = !publicView && memberCanEdit;
  const mapStyleOptions = useMemo(
    () => normalizeMapStyleOptions(activeMap),
    [activeMap?.style_hillshades, activeMap?.style_satellite_labels],
  );
  const prevMapIdRef = useRef<string | null>(null);
  const [mapFitGeneration, setMapFitGeneration] = useState(0);
  const [mapFitResolvedGeneration, setMapFitResolvedGeneration] = useState(0);

  useLayoutEffect(() => {
    const prev = prevMapIdRef.current;
    if (prev !== null && activeMapId !== null && prev !== activeMapId) {
      setMapFitGeneration((g) => g + 1);
    }
    prevMapIdRef.current = activeMapId;
  }, [activeMapId]);

  const cameraIdleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  /** Authoritative ?pin= token for URL sync — avoids resurrecting pin from stale search prev. */
  const sidebarPinTokenRef = useRef<string | null>(null);
  const [placementActive, setPlacementActive] = useState(false);
  const [quickAddPin, setQuickAddPin] = useState<Pin | null>(null);
  const [quickAddAnchorScreen, setQuickAddAnchorScreen] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [fullEditPin, setFullEditPin] = useState<Pin | null>(null);
  const [pointerContextMenu, setPointerContextMenu] =
    useState<MapPointerContextMenuTarget | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagEditTarget, setTagEditTarget] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_PIN_TAG_COLOR);
  const [newTagEmoji, setNewTagEmoji] = useState("📍");
  const linkPasteBusyRef = useRef(false);
  useEffect(() => {
    return () => clearTimeout(cameraIdleTimerRef.current);
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const data = e.clipboardData;
      if (!data) return;
      if (isPinFormTextEntryPasteTarget(e.target)) return;
      if (fileFromClipboardData(data)) return;
      const url = urlFromClipboardData(data);
      if (!url || !activeMapId || !canEdit || linkPasteBusyRef.current) return;
      e.preventDefault();
      linkPasteBusyRef.current = true;
      void (async () => {
        try {
          const meta = await fetchLinkMetadata(url);
          if (!meta.location) {
            toast.message("No location found in this link.");
            return;
          }
          const pin = await createPinFromLinkMetadata({
            mapId: activeMapId,
            meta,
          });
          toast.success("Pin created");
          await qc.invalidateQueries({ queryKey: ["pins", activeMapId] });
          setSearchParams(
            (prev) => applySelectedPinToSearchParams(prev, null),
            {
              replace: true,
            },
          );
          mapRef.current?.flyToLocation(pin.lng, pin.lat);
          const p = mapRef.current?.lngLatToScreen(pin.lng, pin.lat);
          setQuickAddAnchorScreen(p ?? null);
          setQuickAddPin(pin);
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Could not create pin from link.",
          );
        } finally {
          linkPasteBusyRef.current = false;
        }
      })();
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [activeMapId, canEdit, qc, setSearchParams]);

  const onCameraIdle = useCallback(
    (c: MapCamera) => {
      clearTimeout(cameraIdleTimerRef.current);
      cameraIdleTimerRef.current = setTimeout(() => {
        // Base MapPage stays mounted under stack routes; skip URL sync while a
        // stack screen is active so we do not navigate back to /map?pin=.
        if (isStackRoute(window.location.pathname)) return;
        const normalized = normalizeCameraForUrl(c);
        writeStoredMapCamera(activeMapId, normalized);
        setSearchParams(
          (prev) => {
            const prevNoBbox = stripMapBboxFromSearchParams(prev);
            const parsed = parseMapCameraFromSearchParams(prevNoBbox);
            const withPin = applySelectedPinToSearchParams(
              prevNoBbox,
              sidebarPinTokenRef.current,
            );
            if (
              parsed &&
              cameraToSyncKey(parsed) === cameraToSyncKey(normalized)
            ) {
              return withPin;
            }
            return applyMapCameraToSearchParams(withPin, normalized);
          },
          { replace: true },
        );
      }, 280);
    },
    [activeMapId, setSearchParams],
  );

  const pinsQuery = useQuery({
    queryKey: ["pins", activeMapId],
    queryFn: async () => {
      if (!activeMapId) return [];
      const { data, error } = await supabase
        .from("pins")
        .select(
          `*,
          pin_tags ( tag_id, tags ( id, name, color, icon_emoji ) ),
          photos ( id, storage_path, sort_order )`,
        )
        .eq("map_id", activeMapId)
        .order("date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as PinWithTags[];
    },
    enabled: Boolean(activeMapId) && !mapLoading,
  });

  const tagsQuery = useQuery({
    queryKey: ["tags", activeMapId],
    queryFn: async () => {
      if (!activeMapId) return [];
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("map_id", activeMapId)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(activeMapId) && !mapLoading,
  });

  const tags = useMemo(() => tagsQuery.data ?? [], [tagsQuery.data]);
  const filterTagIds = useMemo(
    () => resolveFilterTagIdsFromSearchParams(searchParams, tags),
    [searchParams, tags],
  );
  const setFilterTagIds = useCallback(
    (action: SetStateAction<Set<string>>) => {
      setSearchParams(
        (prev) => {
          const current = resolveFilterTagIdsFromSearchParams(prev, tags);
          const next = typeof action === "function" ? action(current) : action;
          return applyFilterTagsToSearchParams(prev, next, tags);
        },
        { replace: true },
      );
    },
    [tags, setSearchParams],
  );

  const openNewTagDialog = () => {
    setTagEditTarget(null);
    setNewTagName("");
    setNewTagColor(DEFAULT_PIN_TAG_COLOR);
    setNewTagEmoji("📍");
    setTagDialogOpen(true);
  };

  const openEditTagDialog = (tag: Tag) => {
    setTagEditTarget(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setNewTagEmoji(tag.icon_emoji || "📍");
    setTagDialogOpen(true);
  };

  const pins = useMemo(() => pinsQuery.data ?? [], [pinsQuery.data]);

  const pinsReadyForMapFit =
    Boolean(activeMapId) && !mapLoading && !pinsQuery.isPending;
  const visiblePinsForFit = useMemo(
    () => filterPinsByTags(pins, filterTagIds),
    [pins, filterTagIds],
  );

  const mapFitPending = mapFitGeneration > mapFitResolvedGeneration;
  const mapFitCanResolve =
    Boolean(cameraFromUrl) ||
    (pinsReadyForMapFit && visiblePinsForFit.length === 0);
  const awaitingMapFit = mapFitPending && !mapFitCanResolve;

  useEffect(() => {
    if (!mapFitPending || !mapFitCanResolve) return;
    queueMicrotask(() => {
      setMapFitResolvedGeneration(mapFitGeneration);
    });
  }, [mapFitPending, mapFitCanResolve, mapFitGeneration]);

  const resolvedInitialCamera = useMemo((): MapCamera | null => {
    if (awaitingMapFit) return null;
    if (cameraFromUrl) return cameraFromUrl;
    if (bboxFromUrl) {
      return normalizeCameraForUrl({
        lat: (bboxFromUrl.south + bboxFromUrl.north) / 2,
        lng: (bboxFromUrl.west + bboxFromUrl.east) / 2,
        zoom: 10,
      });
    }
    return readStoredMapCamera(activeMapId);
  }, [awaitingMapFit, cameraFromUrl, bboxFromUrl, activeMapId]);
  const cameraSyncKey = useMemo(() => {
    if (awaitingMapFit) return "";
    if (bboxFromUrl) return `url:bbox:${bboxToSyncKey(bboxFromUrl)}`;
    if (cameraFromUrl) return `url:${cameraToSyncKey(cameraFromUrl)}`;
    if (resolvedInitialCamera)
      return `init:${cameraToSyncKey(resolvedInitialCamera)}`;
    return "";
  }, [awaitingMapFit, bboxFromUrl, cameraFromUrl, resolvedInitialCamera]);

  useEffect(() => {
    if (!awaitingMapFit) return;
    if (!pinsReadyForMapFit) return;
    if (visiblePinsForFit.length === 0) return;
    mapRef.current?.fitVisiblePins();
  }, [awaitingMapFit, pinsReadyForMapFit, visiblePinsForFit.length]);

  const sidebarPinToken = useMemo(
    () => parseSelectedPinTokenFromSearchParams(searchParams),
    [searchParams],
  );
  const sidebarPinId = useMemo(
    () => resolvePinIdFromMapToken(sidebarPinToken, pins),
    [sidebarPinToken, pins],
  );

  useLayoutEffect(() => {
    sidebarPinTokenRef.current = sidebarPinToken;
  }, [sidebarPinToken]);

  const onSelectPin = useCallback(
    (id: string) => {
      setQuickAddPin(null);
      setQuickAddAnchorScreen(null);
      const row = pins.find((x) => x.id === id);
      const token = row?.slug ?? id;

      if (!isWideEnough) {
        // On narrow screens navigate directly to pin detail page
        const resolvedMapSlug = mapSlug?.trim() || activeMap?.slug?.trim();
        if (resolvedMapSlug && row?.slug) {
          navigate(pinDetailHref(resolvedMapSlug, row.slug));
          return;
        }
      }

      setSidePanelAnimateIn(true);
      setSearchParams((prev) => applySelectedPinToSearchParams(prev, token), {
        replace: true,
      });
    },
    [setSearchParams, pins, isWideEnough, mapSlug, activeMap, navigate],
  );

  const onClosePinMapPopover = useCallback(() => {
    setSidePanelAnimateIn(false);
    mapRef.current?.invalidatePendingMarkerSelection();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setSearchParams((prev) => applySelectedPinToSearchParams(prev, null), {
      replace: true,
    });
  }, [setSearchParams]);

  const onMapContextMenu = useCallback(
    (
      lng: number,
      lat: number,
      zoom: number,
      clientX: number,
      clientY: number,
    ) => {
      if (!canEdit) return;
      setPointerContextMenu({
        type: "map",
        lng,
        lat,
        zoom,
        x: clientX,
        y: clientY,
      });
    },
    [canEdit],
  );

  const onPinContextMenu = useCallback(
    (pinId: string, clientX: number, clientY: number) => {
      setPointerContextMenu({
        type: "pin",
        pinId,
        x: clientX,
        y: clientY,
      });
    },
    [],
  );

  const onRemovePinFromMap = useCallback(
    async (pinId: string) => {
      const { error } = await supabase.from("pins").delete().eq("id", pinId);
      if (error) throw error;
      if (activeMapId) {
        await qc.invalidateQueries({ queryKey: ["pins", activeMapId] });
      }
      if (sidebarPinId === pinId) {
        onClosePinMapPopover();
      }
      toast.success("Pin deleted");
    },
    [activeMapId, qc, sidebarPinId, onClosePinMapPopover],
  );

  const pinTagIdsFor = useCallback(
    (pinId: string) => {
      const row = pins.find((p) => p.id === pinId);
      return new Set(
        (row?.pin_tags ?? [])
          .map((pt) => pt.tags?.id ?? pt.tag_id)
          .filter((id): id is string => Boolean(id)),
      );
    },
    [pins],
  );

  const onTogglePinTag = useCallback(
    async (pinId: string, tagId: string, checked: boolean) => {
      const { error } = checked
        ? await supabase
            .from("pin_tags")
            .insert({ pin_id: pinId, tag_id: tagId })
        : await supabase
            .from("pin_tags")
            .delete()
            .eq("pin_id", pinId)
            .eq("tag_id", tagId);
      if (error) throw error;
      if (activeMapId) {
        await qc.invalidateQueries({ queryKey: ["pins", activeMapId] });
      }
    },
    [activeMapId, qc],
  );

  const onPlacementClick = useCallback(
    async (lng: number, lat: number, zoom: number) => {
      if (!activeMapId || !canEdit) return;
      setSearchParams((prev) => applySelectedPinToSearchParams(prev, null), {
        replace: true,
      });

      try {
        const [{ shortTitle }, geocode] = await Promise.all([
          reversePhotonPlaceDetails(lat, lng, zoom),
          reversePhotonGeocode(lat, lng),
        ]);
        const labelDetail = defaultLocationLabelDetail(geocode);
        const { data: row, error } = await supabase
          .from("pins")
          .insert({
            map_id: activeMapId,
            title: shortTitle || null,
            geocode: pinGeocodeToJson(geocode),
            location_label_detail: labelDetail,
            lat,
            lng,
          })
          .select("*")
          .single();
        if (error) throw error;
        toast.success("Pin created");
        await qc.invalidateQueries({ queryKey: ["pins", activeMapId] });

        const p = mapRef.current?.lngLatToScreen(lng, lat);
        setQuickAddAnchorScreen(p ?? null);
        setQuickAddPin(row as Pin);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Could not create pin here.",
        );
      }
    },
    [activeMapId, canEdit, qc, setSearchParams],
  );

  useEffect(() => {
    if (!sidebarPinToken) return;
    // While the active map's pins are still loading, do not strip ?pin= — the token may
    // belong to the new map (e.g. global search) and is not in the previous list yet.
    if (pinsQuery.isPending) return;
    if (pins.length === 0) return;
    if (resolvePinIdFromMapToken(sidebarPinToken, pins)) return;
    setSearchParams((prev) => applySelectedPinToSearchParams(prev, null), {
      replace: true,
    });
  }, [sidebarPinToken, pins, pinsQuery.isPending, setSearchParams]);

  useEffect(() => {
    if (!quickAddPin) return;
    const { lat, lng } = quickAddPin;
    const map = mapRef.current;
    if (!map) return;
    const upd = () => {
      const p = map.lngLatToScreen(lng, lat);
      if (p) setQuickAddAnchorScreen(p);
    };
    upd();
    const raf = requestAnimationFrame(upd);
    const unsub = map.subscribeCamera(upd);
    window.addEventListener("resize", upd);
    return () => {
      cancelAnimationFrame(raf);
      unsub();
      window.removeEventListener("resize", upd);
    };
  }, [quickAddPin]);

  useEffect(() => {
    if (!addPinFromUrl || !canEdit) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- latch placement from one-shot ?add= URL deep link
    setPlacementActive(true);
    setSearchParams(
      (prev) =>
        applyAddPinToSearchParams(
          applySelectedPinToSearchParams(prev, null),
          false,
        ),
      { replace: true },
    );
  }, [addPinFromUrl, canEdit, setSearchParams]);

  useEffect(() => {
    if (!placementActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPlacementActive(false);
        setSearchParams((prev) => applyAddPinToSearchParams(prev, false), {
          replace: true,
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [placementActive, setSearchParams]);

  useEffect(() => {
    if (!sidebarPinToken) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClosePinMapPopover();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarPinToken, onClosePinMapPopover]);

  // Redirect ?pin= → /pins/:mapSlug/:pinSlug on screens too narrow for the side panel
  useEffect(() => {
    if (isWideEnough || !sidebarPinId) return;
    const pin = pins.find((p) => p.id === sidebarPinId);
    if (!pin?.slug) return;
    const resolvedMapSlug = mapSlug?.trim() || activeMap?.slug?.trim();
    if (!resolvedMapSlug) return;
    // Replace map?pin= with pin detail (frozen base strips ?pin= on stack open).
    navigate(pinDetailHref(resolvedMapSlug, pin.slug), { replace: true });
  }, [isWideEnough, sidebarPinId, pins, mapSlug, activeMap, navigate]);

  // Camera management: pan map when side panel opens; restore when it closes
  const pinsRef = useRef(pins);
  useLayoutEffect(() => {
    pinsRef.current = pins;
  }, [pins]);

  useEffect(() => {
    const prevId = prevSidebarPinIdRef.current;
    const currId = sidebarPinId ?? null;
    prevSidebarPinIdRef.current = currId;

    if (!isWideEnough) return;

    if (currId && !prevId) {
      // Panel opening — capture camera, then pan so pin sits in visible left area
      prevCameraBeforeSheetRef.current =
        mapRef.current?.getCurrentCamera() ?? null;
      postPanCameraBeforeSheetRef.current = null;
      const pin = pinsRef.current.find((p) => p.id === currId);
      if (pin && typeof pin.lat === "number" && typeof pin.lng === "number") {
        const panelWidthPx = panelRef.current?.offsetWidth ?? 384;
        mapRef.current?.panForPanel(pin.lng, pin.lat, panelWidthPx, () => {
          postPanCameraBeforeSheetRef.current =
            mapRef.current?.getCurrentCamera() ?? null;
        });
      } else {
        postPanCameraBeforeSheetRef.current = prevCameraBeforeSheetRef.current;
      }
    } else if (!currId && prevId) {
      const prevCamera = prevCameraBeforeSheetRef.current;
      const postPanCamera = postPanCameraBeforeSheetRef.current;
      const currentCamera = mapRef.current?.getCurrentCamera() ?? null;
      const userAdjustedCamera =
        postPanCamera != null &&
        currentCamera != null &&
        !camerasCloseEnough(currentCamera, postPanCamera);

      if (userAdjustedCamera) {
        // User panned/zoomed while the sheet was open — keep their view.
        mapRef.current?.clearPanelPadding();
      } else if (prevCamera) {
        mapRef.current?.restoreCameraAfterPanel(prevCamera);
      }
      prevCameraBeforeSheetRef.current = null;
      postPanCameraBeforeSheetRef.current = null;
    }
  }, [sidebarPinId, isWideEnough]);

  async function saveTag() {
    if (!activeMapId || !newTagName.trim()) return;
    if (tagEditTarget) {
      const { error } = await supabase
        .from("tags")
        .update({
          name: newTagName.trim(),
          color: newTagColor,
          icon_emoji: newTagEmoji || "📍",
          updated_at: new Date().toISOString(),
        })
        .eq("id", tagEditTarget.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Tag updated");
      setTagDialogOpen(false);
      setTagEditTarget(null);
      await qc.invalidateQueries({ queryKey: ["tags", activeMapId] });
      await qc.invalidateQueries({ queryKey: ["pins", activeMapId] });
      return;
    }
    const { error } = await supabase.from("tags").insert({
      map_id: activeMapId,
      name: newTagName.trim(),
      color: newTagColor,
      icon_emoji: newTagEmoji || "📍",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tag created");
    setNewTagName("");
    setTagDialogOpen(false);
    await qc.invalidateQueries({ queryKey: ["tags", activeMapId] });
  }

  function toggleAddPinPlacement() {
    if (!canEdit) return;
    const next = !placementActive;
    setPlacementActive(next);
    setSearchParams(
      (p) => {
        let params = applyAddPinToSearchParams(p, false);
        if (next) {
          params = applySelectedPinToSearchParams(params, null);
        }
        return params;
      },
      { replace: true },
    );
  }

  const showSidePanel = Boolean(sidebarPinId && isWideEnough);

  if (mapLoading) {
    return <MapViewInitialLoader />;
  }

  if (routeMapStatus === "unavailable") {
    return <MapSlugAccessBlocked />;
  }

  if (!activeMapId) {
    return <MapViewInitialLoader label="No map available." busy={false} />;
  }

  return (
    <MapPageRoot>
      <MapLayer
        panelRightWidth={showSidePanel ? PANEL_RIGHT_WIDTH_CSS : undefined}
      >
        <MapVignette />
        <MapHost>
          <PinMap
            ref={mapRef}
            pins={pins}
            selectedTagIds={filterTagIds}
            selectedPinId={sidebarPinId}
            previewPin={null}
            contextDraftPin={
              pointerContextMenu?.type === "map"
                ? {
                    lng: pointerContextMenu.lng,
                    lat: pointerContextMenu.lat,
                  }
                : null
            }
            mapStyle={normalizeMapStylePreset(activeMap?.style)}
            mapStyleOptions={mapStyleOptions}
            onSelectPin={onSelectPin}
            placementMode={canEdit && placementActive}
            onPlacementClick={onPlacementClick}
            initialCamera={resolvedInitialCamera}
            initialBbox={bboxFromUrl}
            cameraSyncKey={cameraSyncKey}
            onCameraIdle={onCameraIdle}
            onMapBackgroundClick={
              sidebarPinId ? onClosePinMapPopover : undefined
            }
            onMapContextMenu={onMapContextMenu}
            onPinContextMenu={onPinContextMenu}
          />
        </MapHost>
        <MapControlsLayer>
          <MapControlsBottomStack>
            <MapTagFiltersControl
              tags={tags}
              filterTagIds={filterTagIds}
              setFilterTagIds={setFilterTagIds}
              onNewTag={openNewTagDialog}
              onEditTag={openEditTagDialog}
              canEdit={canEdit}
            />
            <MapControlsToolbar mapRef={mapRef} />
            {canEdit ? (
              <AddPinFab
                active={placementActive}
                onClick={toggleAddPinPlacement}
              />
            ) : null}
          </MapControlsBottomStack>
        </MapControlsLayer>
        {showSidePanel ? (
          <MapSidePanel
            ref={panelRef}
            animateIn={showSidePanel && sidePanelAnimateIn}
          >
            <PinDetailSideSheet
              key={sidebarPinId}
              pinId={sidebarPinId!}
              mapId={activeMapId!}
              mapSlug={mapSlug?.trim() || activeMap?.slug?.trim() || null}
              onClose={onClosePinMapPopover}
            />
          </MapSidePanel>
        ) : null}
      </MapLayer>

      {canEdit && placementActive ? (
        <MapPlacementHint>Click to add a pin</MapPlacementHint>
      ) : null}

      <MapPointerContextMenu
        target={pointerContextMenu}
        onTargetChange={setPointerContextMenu}
        canEdit={canEdit}
        tags={tags}
        pinTagIdsFor={pinTagIdsFor}
        onTogglePinTag={onTogglePinTag}
        onAddPinAt={onPlacementClick}
        onOpenPin={onSelectPin}
        onEditPin={(pinId) => {
          const row = pins.find((p) => p.id === pinId);
          if (row) setFullEditPin(row);
        }}
        onRemovePin={onRemovePinFromMap}
      />

      <PinMapQuickAddDialog
        open={Boolean(canEdit && quickAddPin)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setQuickAddPin(null);
            setQuickAddAnchorScreen(null);
          }
        }}
        mapId={activeMapId}
        pin={canEdit ? quickAddPin : null}
        anchorScreen={canEdit && quickAddPin ? quickAddAnchorScreen : null}
        onEdit={(t) => {
          setQuickAddPin(null);
          setQuickAddAnchorScreen(null);
          setFullEditPin(t);
        }}
      />
      {canEdit && fullEditPin ? (
        <Suspense fallback={null}>
          <PinFormDialog
            open
            onOpenChange={(open) => {
              if (!open) setFullEditPin(null);
            }}
            mapId={activeMapId}
            pin={fullEditPin}
          />
        </Suspense>
      ) : null}
      <Dialog
        open={tagDialogOpen}
        onOpenChange={(open) => {
          setTagDialogOpen(open);
          if (!open) setTagEditTarget(null);
        }}
      >
        <PanelDialogContent>
          <PanelDialogHeader>
            <PanelDialogTitle>
              {tagEditTarget ? "Edit tag" : "New tag"}
            </PanelDialogTitle>
          </PanelDialogHeader>
          <PanelDialogBody>
            <PanelDialogFormStack>
              <PanelDialogField>
                <Label htmlFor="tag-name">Name</Label>
                <Input
                  id="tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
              </PanelDialogField>
              <PresetColorPicker
                id="tag-color"
                label="Color"
                value={newTagColor}
                onChange={setNewTagColor}
              />
              <EmojiPicker
                id="tag-emoji"
                label="Icon (emoji)"
                value={newTagEmoji}
                onChange={setNewTagEmoji}
              />
            </PanelDialogFormStack>
          </PanelDialogBody>
          <PanelDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTagDialogOpen(false);
                setTagEditTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => void saveTag()}>
              {tagEditTarget ? "Save tag" : "Create tag"}
            </Button>
          </PanelDialogFooter>
        </PanelDialogContent>
      </Dialog>
    </MapPageRoot>
  );
}
