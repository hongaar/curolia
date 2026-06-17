import { MapViewInitialLoader } from "@/components/layout/map-view-initial-loader";
import { MapViewSwitcher } from "@/components/layout/map-view-switcher";
import { MapBlogPanel } from "@/components/map/map-blog-panel";
import { MapControlsToolbar } from "@/components/map/map-controls-toolbar";
import { MapGalleryPanel } from "@/components/map/map-gallery-panel";
import {
  MapPanelPinConnectorOverlay,
  type MapPanelPinConnectorAnchor,
} from "@/components/map/map-panel-pin-connector";
import {
  MapPointerContextMenu,
  type MapPointerContextMenuTarget,
} from "@/components/map/map-pointer-context-menu";
import { MapSlugAccessBlocked } from "@/components/map/map-slug-access-blocked";
import { MapTagFiltersControl } from "@/components/map/map-tag-filters-control";
import { PinDetailSideSheet } from "@/components/map/pin-detail-side-sheet";
import {
  PinMap,
  type PinCollisionClickPayload,
  type PinMapHandle,
} from "@/components/map/pin-map";
import {
  PinMapCollisionPicker,
  type PinMapCollisionPickerState,
} from "@/components/map/pin-map-collision-picker";
import { PublicMapOwnerCard } from "@/components/map/public-map-owner-card";
import { PinMapQuickAddDialog } from "@/components/pins/pin-map-quick-add-dialog";
import { TagEntityLabelInput } from "@/components/pins/tag-entity-label-input";
import { useMapMemberRole } from "@/hooks/use-map-access";
import { useMapOwnerCard } from "@/hooks/use-map-owner-card";
import { useMapPanelPinHoverSync } from "@/hooks/use-map-panel-pin-hover-sync";
import { useMapPinPanel } from "@/hooks/use-map-pin-panel";
import { useMapSlugRouteSync } from "@/hooks/use-map-slug-route-sync";
import { useMaxSm } from "@/hooks/use-max-sm";
import { useMinMd } from "@/hooks/use-min-md";
import { useNativeShareLink } from "@/hooks/use-native-share-link";
import { usePublicMapCrawlerBlockMeta } from "@/hooks/use-public-map-crawler-block-meta";
import { useRecordMapVisit } from "@/hooks/use-record-map-visit";
import { mapViewSegmentFromPathname, pinEditHref } from "@/lib/app-paths";
import { createPinAtLocation } from "@/lib/create-pin-at-location";
import { invalidateHomeFeed } from "@/lib/home-feed";
import {
  readStoredMapCamera,
  writeStoredMapCamera,
} from "@/lib/map-camera-storage";
import { normalizeShowPinRoute } from "@/lib/map-pin-route";
import { mapRouteForMap } from "@/lib/map-route";
import {
  normalizeMapStyleOptions,
  normalizeMapStylePreset,
} from "@/lib/map-style";
import {
  applyFilterTagsToSearchParams,
  applyMapCameraToSearchParams,
  applySelectedPinToSearchParams,
  bboxToSyncKey,
  camerasCloseEnough,
  cameraToSyncKey,
  normalizeCameraForUrl,
  parseMapBboxFromSearchParams,
  parseMapCameraFromSearchParams,
  parseSelectedPinTokenFromSearchParams,
  resolveFilterTagIdsFromSearchParams,
  resolvePinIdFromMapToken,
  stripMapBboxFromSearchParams,
  type MapCamera,
} from "@/lib/map-view-params";
import { pinDetailSideSheetTitle } from "@/lib/pin-detail-side-sheet-title";
import {
  fileFromClipboardData,
  isPinFormTextEntryPasteTarget,
  urlFromClipboardData,
} from "@/lib/pin-form-clipboard";
import { createPinFromLinkMetadata } from "@/lib/pin-from-link";
import { fetchLinkMetadata } from "@/lib/pin-links";
import type { PlaceMapHighlight } from "@/lib/pin-map-place-highlight";
import { hasPinTravelSequence } from "@/lib/pin-sequence";
import type { PinWithTags } from "@/lib/pin-with-tags";
import { filterPinsByTags } from "@/lib/pin-with-tags";
import { randomPresetTagColor } from "@/lib/preset-pin-tag-colors";
import { relocatePinAtLocation } from "@/lib/relocate-pin-at-location";
import { resolvePinByMapSlug } from "@/lib/resolve-pin-slug";
import { isStackRoute } from "@/lib/stack-routes";
import { supabase } from "@/lib/supabase";
import { useMapPinsPhotosSignedUrls } from "@/lib/use-pin-photos";
import { useGlobalSearchPlace } from "@/providers/global-search-place-provider";
import { useMap } from "@/providers/map-provider";
import type { Pin, Tag } from "@/types/database";
import { BottomSheet } from "@curolia/ui/bottom-sheet";
import { Button } from "@curolia/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogFormStack,
  DialogHeader,
  DialogTitle,
} from "@curolia/ui/dialog";
import {
  MapBlogSidePanel,
  MapBlogSidePanelScrim,
  MapControlsBottomCenter,
  MapControlsBottomStack,
  MapControlsLayer,
  MapControlsTopLeft,
  MapHost,
  MapLayer,
  MapPageRoot,
  MapPlacementHint,
  MapSidePanel,
  MapVignette,
} from "@curolia/ui/map";
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
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
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

/** Desktop blog side panel — two thirds of the viewport width. */
const BLOG_PANEL_WIDTH_CSS = "66.67%";

export function MapPage() {
  const qc = useQueryClient();
  const isWideEnough = useMinMd();
  const isMobile = useMaxSm();
  const navigate = useNavigate();
  const location = useLocation();
  const isBlogView = mapViewSegmentFromPathname(location.pathname) === "blog";
  const isGalleryView =
    mapViewSegmentFromPathname(location.pathname) === "gallery";
  const showBlogPanel = isBlogView && isWideEnough;
  const showGalleryPanel = isGalleryView && isWideEnough;
  const showContentSidePanel = showBlogPanel || showGalleryPanel;
  const contentSidePanelRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const connectorAnchorRef = useRef<MapPanelPinConnectorAnchor | null>(null);
  const suspendContentPanRef = useRef(false);
  const { profileSlug, mapSlug } = useParams<{
    profileSlug: string;
    mapSlug: string;
  }>();
  useMapSlugRouteSync(profileSlug, mapSlug);
  const mapRef = useRef<PinMapHandle>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const bboxFromUrl = useMemo(
    () => parseMapBboxFromSearchParams(searchParams),
    [searchParams],
  );
  const cameraFromUrl = useMemo(
    () => parseMapCameraFromSearchParams(searchParams),
    [searchParams],
  );
  const {
    activeMapId,
    activeMap,
    loading: mapLoading,
    routeMapStatus,
    publicView,
  } = useMap();
  const activeMapRoute = useMemo(
    () => (activeMap ? mapRouteForMap(activeMap) : null),
    [activeMap],
  );
  const { canEdit: memberCanEdit } = useMapMemberRole(activeMapId);
  const canEdit = !publicView && memberCanEdit;
  useRecordMapVisit(activeMapId);
  usePublicMapCrawlerBlockMeta(activeMap, publicView);
  const { profile: ownerProfile, show: showOwnerCard } = useMapOwnerCard();
  const mapStyleOptions = useMemo(
    () => normalizeMapStyleOptions(activeMap),
    [activeMap],
  );
  const prevMapIdRef = useRef<string | null>(null);
  const mapFitGenerationRef = useRef(0);
  const [mapFitGeneration, setMapFitGeneration] = useState(0);
  const [mapFitResolvedGeneration, setMapFitResolvedGeneration] = useState(0);
  useLayoutEffect(() => {
    mapFitGenerationRef.current = mapFitGeneration;
  }, [mapFitGeneration]);
  useLayoutEffect(() => {
    const prev = prevMapIdRef.current;
    const switchedMap =
      prev !== null && activeMapId !== null && prev !== activeMapId;
    const firstLoadWithoutCamera =
      prev === null &&
      activeMapId !== null &&
      !cameraFromUrl &&
      !bboxFromUrl &&
      !readStoredMapCamera(activeMapId);
    if (switchedMap || firstLoadWithoutCamera) {
      setMapFitGeneration((g) => g + 1);
    }
    prevMapIdRef.current = activeMapId;
  }, [activeMapId, cameraFromUrl, bboxFromUrl]);

  const cameraIdleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  /** Authoritative ?pin= token for URL sync — avoids resurrecting pin from stale search prev. */
  const sidebarPinTokenRef = useRef<string | null>(null);
  /** Latest camera parsed from URL — used to avoid idle sync clobbering search deep links. */
  const cameraFromUrlRef = useRef<MapCamera | null>(null);
  const {
    selectedPlace: globalSearchPlace,
    clearSelectedPlace,
    registerAddPinFromPlaceHandler,
  } = useGlobalSearchPlace();
  const globalSearchPlaceHighlight = useMemo((): PlaceMapHighlight | null => {
    if (!globalSearchPlace) return null;
    return {
      lng: globalSearchPlace.lng,
      lat: globalSearchPlace.lat,
      bbox: globalSearchPlace.bbox,
    };
  }, [globalSearchPlace]);

  const [quickAddPin, setQuickAddPin] = useState<Pin | null>(null);
  const [quickAddAnchorScreen, setQuickAddAnchorScreen] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [fullEditPin, setFullEditPin] = useState<Pin | null>(null);
  const [pointerContextMenu, setPointerContextMenu] =
    useState<MapPointerContextMenuTarget | null>(null);
  const [relocatePinId, setRelocatePinId] = useState<string | null>(null);
  const [pinCollisionPicker, setPinCollisionPicker] =
    useState<PinMapCollisionPickerState | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagEditTarget, setTagEditTarget] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(randomPresetTagColor);
  const [newTagEmoji, setNewTagEmoji] = useState("");
  const linkPasteBusyRef = useRef(false);
  useEffect(() => {
    return () => clearTimeout(cameraIdleTimerRef.current);
  }, []);

  const createPinFromSharedLink = useCallback(
    (url: string) => {
      if (!activeMapId || !canEdit || linkPasteBusyRef.current) return;
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
    },
    [activeMapId, canEdit, qc, setSearchParams],
  );

  useNativeShareLink(createPinFromSharedLink);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const data = e.clipboardData;
      if (!data) return;
      if (isPinFormTextEntryPasteTarget(e.target)) return;
      if (fileFromClipboardData(data)) return;
      const url = urlFromClipboardData(data);
      if (!url) return;
      e.preventDefault();
      createPinFromSharedLink(url);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [createPinFromSharedLink]);

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
    setNewTagColor(randomPresetTagColor());
    setNewTagEmoji("");
    setTagDialogOpen(true);
  };

  const openEditTagDialog = (tag: Tag) => {
    setTagEditTarget(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setNewTagEmoji(tag.icon_emoji ?? "");
    setTagDialogOpen(true);
  };

  const pins = useMemo(() => pinsQuery.data ?? [], [pinsQuery.data]);

  const pinIdsWithPhotos = useMemo(
    () => pins.filter((p) => (p.photos?.length ?? 0) > 0).map((p) => p.id),
    [pins],
  );
  const { photosByPinId, signedUrlByPhotoId } = useMapPinsPhotosSignedUrls(
    activeMapId ?? undefined,
    pinIdsWithPhotos,
  );
  const photoUrlByPinId = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [pinId, list] of photosByPinId) {
      const first = [...list]
        .sort((a, b) => a.sort_order - b.sort_order)
        .find((p) => p.storage_path);
      const url = first ? signedUrlByPhotoId[first.id] : undefined;
      if (url) out[pinId] = url;
    }
    return out;
  }, [photosByPinId, signedUrlByPhotoId]);

  const activeRelocatePinId =
    relocatePinId && pins.some((p) => p.id === relocatePinId)
      ? relocatePinId
      : null;

  const showPinRoute = useMemo(
    () =>
      normalizeShowPinRoute(activeMap?.show_pin_route) &&
      hasPinTravelSequence(pins),
    [activeMap?.show_pin_route, pins],
  );

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
    if (parseSelectedPinTokenFromSearchParams(searchParams)) return;
    if (!pinsReadyForMapFit) return;
    if (visiblePinsForFit.length === 0) return;

    const generation = mapFitGenerationRef.current;

    mapRef.current?.fitVisiblePins({
      onSettled: () => {
        setMapFitResolvedGeneration(generation);
      },
    });
  }, [
    awaitingMapFit,
    searchParams,
    pinsReadyForMapFit,
    visiblePinsForFit.length,
    activeMapId,
  ]);

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

  useLayoutEffect(() => {
    cameraFromUrlRef.current = cameraFromUrl;
  }, [cameraFromUrl]);

  const clearCameraIdleTimer = useCallback(() => {
    clearTimeout(cameraIdleTimerRef.current);
  }, []);

  const {
    panelPinId,
    mapSelectedPinId,
    showSidePanel,
    sidePanelRef,
    sidePanelAnimateIn,
    panelPopupRef,
    bottomSheetDismissRef,
    bottomSheetOpen,
    bottomSheetPinId,
    setBottomSheetOpen,
    collisionPopupRef,
    userDismissedRef,
    beginPanelDismiss,
    finishPanelClose: onClosePinMapPopover,
    onCollisionDismissStart,
    onCollisionOpen,
    onCollisionClose,
    onPinSelectFromMap,
    onCollisionPinPick,
    syncCollisionPanelCamera,
    setSidePanelAnimateIn,
  } = useMapPinPanel({
    mapRef,
    isWideEnough,
    sidebarPinId,
    sidebarPinToken,
    sidebarPinTokenRef,
    pins,
    pinsLoading: pinsQuery.isPending,
    pinsFetching: pinsQuery.isFetching,
    setSearchParams,
    clearCameraIdleTimer,
    activeMapId,
    panelInsetMeasureRef: showContentSidePanel
      ? contentSidePanelRef
      : undefined,
    persistentPanelOpen: showContentSidePanel,
  });

  const { hoverPinId, onPinHover, onPinHoverEnd } = useMapPanelPinHoverSync({
    enabled: showContentSidePanel && !showSidePanel,
    sidePanelRef: contentSidePanelRef,
    mapRef,
    pins: visiblePinsForFit,
    mapId: activeMapId ?? undefined,
    mapFitReady: !awaitingMapFit,
    suspendPanRef: suspendContentPanRef,
  });

  const handlePanelPinHover = useCallback(
    (pinId: string, anchor: MapPanelPinConnectorAnchor) => {
      connectorAnchorRef.current = anchor;
      onPinHover(pinId);
    },
    [onPinHover],
  );

  const handlePanelPinHoverEnd = useCallback(() => {
    connectorAnchorRef.current = null;
    onPinHoverEnd();
  }, [onPinHoverEnd]);

  const hoverPin = useMemo(
    () => pins.find((pin) => pin.id === hoverPinId) ?? null,
    [pins, hoverPinId],
  );

  const mapPanelRightWidth = showContentSidePanel
    ? BLOG_PANEL_WIDTH_CSS
    : showSidePanel
      ? PANEL_RIGHT_WIDTH_CSS
      : undefined;

  useLayoutEffect(() => {
    if (!showContentSidePanel) {
      mapRef.current?.clearPanelPadding();
      return;
    }
    const applyContentPanelInset = () => {
      const width = contentSidePanelRef.current?.offsetWidth;
      const camera = mapRef.current?.getCurrentCamera();
      if (!width || !camera) return;
      mapRef.current?.panForPanel(camera.lng, camera.lat, { right: width });
    };
    requestAnimationFrame(applyContentPanelInset);
  }, [showContentSidePanel]);

  const onClosePinCollisionPicker = useCallback(() => {
    onCollisionClose();
    setPinCollisionPicker(null);
  }, [onCollisionClose]);

  const onPinCollisionClick = useCallback(
    (payload: PinCollisionClickPayload) => {
      setQuickAddPin(null);
      setQuickAddAnchorScreen(null);
      const zoomed = mapRef.current?.fitCollisionPins(payload.pinIds) ?? false;
      if (!zoomed) {
        onCollisionOpen(payload.lng, payload.lat);
        setPinCollisionPicker({
          pinIds: payload.pinIds,
          lng: payload.lng,
          lat: payload.lat,
          clickedPinId: payload.clickedPinId,
        });
        setSidePanelAnimateIn(false);
        setSearchParams((prev) => applySelectedPinToSearchParams(prev, null), {
          replace: true,
        });
      }
      mapRef.current?.invalidatePendingMarkerSelection();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [setSearchParams, onCollisionOpen, setSidePanelAnimateIn],
  );

  const onSelectPin = useCallback(
    (id: string) => {
      setPinCollisionPicker(null);
      setQuickAddPin(null);
      setQuickAddAnchorScreen(null);
      const row = pins.find((x) => x.id === id);
      const token = row?.slug ?? id;

      onPinSelectFromMap(id, row);
      setSearchParams((prev) => applySelectedPinToSearchParams(prev, token), {
        replace: true,
      });
    },
    [setSearchParams, pins, onPinSelectFromMap],
  );

  const onPickCollisionPin = useCallback(
    (id: string) => {
      onCollisionPinPick();
      onSelectPin(id);
    },
    [onSelectPin, onCollisionPinPick],
  );

  const onCameraIdle = useCallback(
    (c: MapCamera) => {
      clearTimeout(cameraIdleTimerRef.current);
      cameraIdleTimerRef.current = setTimeout(() => {
        // Base MapPage stays mounted under stack routes; skip URL sync while a
        // stack screen is active so we do not navigate back to /map?pin=.
        if (isStackRoute(window.location.pathname)) return;
        const routeProfile = profileSlug?.trim().toLowerCase();
        const routeMap = mapSlug?.trim().toLowerCase();
        const activeProfile = activeMap?.owner_profile_slug
          ?.trim()
          .toLowerCase();
        const activeSlug = activeMap?.slug?.trim().toLowerCase();
        if (routeMap && activeSlug && routeMap !== activeSlug) return;
        if (routeProfile && activeProfile && routeProfile !== activeProfile) {
          return;
        }
        const normalized = normalizeCameraForUrl(c);
        const pinTok = sidebarPinTokenRef.current;
        const urlCam = cameraFromUrlRef.current;
        if (pinTok && urlCam && !camerasCloseEnough(normalized, urlCam)) return;
        writeStoredMapCamera(activeMapId, normalized);
        setSearchParams(
          (prev) => {
            const prevNoBbox = stripMapBboxFromSearchParams(prev);
            const parsed = parseMapCameraFromSearchParams(prevNoBbox);
            const withPin = applySelectedPinToSearchParams(
              prevNoBbox,
              userDismissedRef.current
                ? null
                : parseSelectedPinTokenFromSearchParams(prevNoBbox),
            );
            const sameCamera =
              parsed && cameraToSyncKey(parsed) === cameraToSyncKey(normalized);
            if (sameCamera) {
              return withPin;
            }
            return applyMapCameraToSearchParams(withPin, normalized);
          },
          { replace: true },
        );
      }, 280);
    },
    [
      activeMapId,
      activeMap,
      profileSlug,
      mapSlug,
      setSearchParams,
      userDismissedRef,
    ],
  );

  useLayoutEffect(() => {
    syncCollisionPanelCamera(pinCollisionPicker);
  }, [pinCollisionPicker, syncCollisionPanelCamera]);

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
      invalidateHomeFeed(qc);
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

  const openQuickAddForPin = useCallback(
    (
      row: Pin,
      lng: number,
      lat: number,
      options?: { preserveCamera?: boolean },
    ) => {
      if (!options?.preserveCamera) {
        mapRef.current?.flyToLocation(lng, lat);
      }
      const p = mapRef.current?.lngLatToScreen(lng, lat);
      setQuickAddAnchorScreen(p ?? null);
      setQuickAddPin(row);
    },
    [],
  );

  const createPinAtCoords = useCallback(
    async (
      lng: number,
      lat: number,
      options?: {
        zoom?: number;
        searchPlace?: Parameters<typeof createPinAtLocation>[0]["searchPlace"];
      },
    ) => {
      if (!activeMapId || !canEdit) return null;
      const row = await createPinAtLocation({
        mapId: activeMapId,
        lat,
        lng,
        zoom: options?.zoom ?? mapRef.current?.getCurrentCamera()?.zoom ?? 12,
        searchPlace: options?.searchPlace,
      });
      toast.success("Pin created");
      await qc.invalidateQueries({ queryKey: ["pins", activeMapId] });
      invalidateHomeFeed(qc);
      return row;
    },
    [activeMapId, canEdit, qc],
  );

  const createPinAndOpenQuickAdd = useCallback(
    async (
      lng: number,
      lat: number,
      options?: {
        zoom?: number;
        searchPlace?: Parameters<typeof createPinAtLocation>[0]["searchPlace"];
        preserveCamera?: boolean;
      },
    ) => {
      const row = await createPinAtCoords(lng, lat, options);
      if (!row) return null;
      openQuickAddForPin(row, lng, lat, {
        preserveCamera: options?.preserveCamera,
      });
      return row;
    },
    [createPinAtCoords, openQuickAddForPin],
  );

  const onRelocatePinAt = useCallback(
    async (pinId: string, lng: number, lat: number) => {
      if (!activeMapId || !canEdit) return;
      try {
        await relocatePinAtLocation({ pinId, lat, lng });
        await qc.invalidateQueries({ queryKey: ["pins", activeMapId] });
        await qc.invalidateQueries({ queryKey: ["pin", pinId] });
        await qc.invalidateQueries({ queryKey: ["pin-side-sheet", pinId] });
        setRelocatePinId(null);
        toast.success("Pin moved");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Could not move this pin.",
        );
      }
    },
    [activeMapId, canEdit, qc],
  );

  const onPlacementClick = useCallback(
    async (lng: number, lat: number, zoom: number) => {
      if (!activeMapId || !canEdit) return;
      setSearchParams((prev) => applySelectedPinToSearchParams(prev, null), {
        replace: true,
      });

      try {
        const row = await createPinAtCoords(lng, lat, { zoom });
        if (!row) return;
        openQuickAddForPin(row, lng, lat);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Could not create pin here.",
        );
      }
    },
    [
      activeMapId,
      canEdit,
      createPinAtCoords,
      openQuickAddForPin,
      setSearchParams,
    ],
  );

  useEffect(() => {
    if (!sidebarPinToken || !activeMapId) return;
    const routeProfileNorm = profileSlug?.trim().toLowerCase();
    const routeMapNorm = mapSlug?.trim().toLowerCase();
    const activeProfileNorm = activeMap?.owner_profile_slug
      ?.trim()
      .toLowerCase();
    const activeSlugNorm = activeMap?.slug?.trim().toLowerCase();
    if (routeMapNorm && activeSlugNorm && routeMapNorm !== activeSlugNorm) {
      return;
    }
    if (
      routeProfileNorm &&
      activeProfileNorm &&
      routeProfileNorm !== activeProfileNorm
    ) {
      return;
    }
    // While the active map's pins are still loading, do not strip ?pin= — the token may
    // belong to the new map (e.g. global search) and is not in the previous list yet.
    const resolved = resolvePinIdFromMapToken(sidebarPinToken, pins);
    if (pinsQuery.isPending || pinsQuery.isFetching) return;
    if (pins.length === 0) return;
    if (resolved) return;

    let cancelled = false;
    void resolvePinByMapSlug(activeMapId, sidebarPinToken).then((match) => {
      if (cancelled) return;
      if (match?.redirected) {
        setSearchParams(
          (prev) => applySelectedPinToSearchParams(prev, match.canonicalSlug),
          { replace: true },
        );
        return;
      }
      if (match) return;
      setSearchParams((prev) => applySelectedPinToSearchParams(prev, null), {
        replace: true,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    sidebarPinToken,
    pins,
    pinsQuery.isPending,
    pinsQuery.isFetching,
    activeMapId,
    activeMap,
    profileSlug,
    mapSlug,
    setSearchParams,
  ]);

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
    registerAddPinFromPlaceHandler((place) => {
      if (!canEdit) return;
      void (async () => {
        try {
          await createPinAndOpenQuickAdd(place.lng, place.lat, {
            searchPlace: place,
            preserveCamera: true,
          });
          clearSelectedPlace();
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Could not create this pin.",
          );
        }
      })();
    });
    return () => registerAddPinFromPlaceHandler(null);
  }, [
    canEdit,
    clearSelectedPlace,
    createPinAndOpenQuickAdd,
    registerAddPinFromPlaceHandler,
  ]);

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

  useEffect(() => {
    if (!pinCollisionPicker) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClosePinCollisionPicker();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinCollisionPicker, onClosePinCollisionPicker]);

  useEffect(() => {
    if (!activeRelocatePinId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRelocatePinId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeRelocatePinId]);

  async function saveTag() {
    if (!activeMapId || !newTagName.trim()) return;
    if (tagEditTarget) {
      const { error } = await supabase
        .from("tags")
        .update({
          name: newTagName.trim(),
          color: newTagColor,
          icon_emoji: newTagEmoji.trim() || null,
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
      icon_emoji: newTagEmoji.trim() || null,
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

  const bottomSheetPin = bottomSheetPinId
    ? (pins.find((pin) => pin.id === bottomSheetPinId) ?? null)
    : null;
  const bottomSheetTitle = pinDetailSideSheetTitle(bottomSheetPin);
  const stackCoversMap = isStackRoute(
    typeof window !== "undefined" ? window.location.pathname : "",
  );

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
      <MapLayer panelRightWidth={mapPanelRightWidth}>
        <MapVignette />
        <MapHost>
          <PinMap
            ref={mapRef}
            pins={pins}
            photoUrlByPinId={photoUrlByPinId}
            selectedTagIds={filterTagIds}
            selectedPinId={mapSelectedPinId}
            scrollHoverPinId={
              showContentSidePanel && !showSidePanel ? hoverPinId : null
            }
            suspendBlogScrollPanRef={suspendContentPanRef}
            collisionFocus={
              pinCollisionPicker
                ? {
                    pinIds: pinCollisionPicker.pinIds,
                    clickedPinId: pinCollisionPicker.clickedPinId,
                  }
                : null
            }
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
            showPinRoute={showPinRoute}
            placeHighlight={globalSearchPlaceHighlight}
            onSelectPin={onSelectPin}
            onPinCollisionClick={onPinCollisionClick}
            initialCamera={resolvedInitialCamera}
            initialBbox={bboxFromUrl}
            cameraSyncKey={cameraSyncKey}
            onCameraIdle={onCameraIdle}
            onMapBackgroundClick={() => {
              if (pinCollisionPicker) {
                onClosePinCollisionPicker();
                return;
              }
              if (panelPinId && !isWideEnough) {
                bottomSheetDismissRef.current?.();
                return;
              }
              if (panelPinId) onClosePinMapPopover();
            }}
            onMapContextMenu={onMapContextMenu}
            onPinContextMenu={onPinContextMenu}
            relocatePinId={canEdit ? activeRelocatePinId : null}
            onRelocateClick={(pinId, lng, lat) => {
              void onRelocatePinAt(pinId, lng, lat);
            }}
          />
        </MapHost>
        <MapControlsLayer>
          {showOwnerCard && ownerProfile ? (
            <MapControlsTopLeft>
              <PublicMapOwnerCard
                profile={ownerProfile}
                surface="floating"
                showBio={false}
              />
            </MapControlsTopLeft>
          ) : null}
          <MapControlsBottomCenter>
            {activeRelocatePinId ? (
              <MapPlacementHint>
                Click the map to move this pin · Esc to cancel
              </MapPlacementHint>
            ) : null}
            <MapViewSwitcher />
          </MapControlsBottomCenter>
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
          </MapControlsBottomStack>
        </MapControlsLayer>
        {showContentSidePanel &&
        hoverPin &&
        typeof hoverPin.lat === "number" &&
        typeof hoverPin.lng === "number" ? (
          <MapPanelPinConnectorOverlay
            show
            pinLng={hoverPin.lng}
            pinLat={hoverPin.lat}
            anchorRef={connectorAnchorRef}
            scrollRootRef={contentScrollRef}
            sidePanelRef={contentSidePanelRef}
            mapRef={mapRef}
          />
        ) : null}
        {showGalleryPanel ? (
          <MapBlogSidePanel ref={contentSidePanelRef}>
            <MapGalleryPanel
              mapSlug={mapSlug}
              embedded
              onViewPin={onSelectPin}
              scrollRootRef={contentScrollRef}
              onPinHover={handlePanelPinHover}
              onPinHoverEnd={handlePanelPinHoverEnd}
              gridColumns={3}
            />
            <MapBlogSidePanelScrim
              show={showSidePanel}
              onDismiss={onClosePinMapPopover}
            />
          </MapBlogSidePanel>
        ) : null}
        {showBlogPanel ? (
          <MapBlogSidePanel ref={contentSidePanelRef}>
            <MapBlogPanel
              mapSlug={mapSlug}
              embedded
              onViewPin={onSelectPin}
              scrollRootRef={contentScrollRef}
              onPinHover={handlePanelPinHover}
              onPinHoverEnd={handlePanelPinHoverEnd}
            />
            <MapBlogSidePanelScrim
              show={showSidePanel}
              onDismiss={onClosePinMapPopover}
            />
          </MapBlogSidePanel>
        ) : null}
        {showSidePanel ? (
          <MapSidePanel
            ref={sidePanelRef}
            animateIn={showSidePanel && sidePanelAnimateIn}
          >
            <PinDetailSideSheet
              key={sidebarPinId}
              pinId={sidebarPinId!}
              mapId={activeMapId!}
              mapRoute={activeMapRoute}
              mapPins={pins}
              onNavigatePin={onSelectPin}
              onClose={onClosePinMapPopover}
            />
          </MapSidePanel>
        ) : null}
      </MapLayer>

      {!isWideEnough ? (
        <BottomSheet
          open={bottomSheetOpen && !stackCoversMap}
          popupRef={panelPopupRef}
          dismissRef={bottomSheetDismissRef}
          title={bottomSheetTitle}
          overlay="none"
          modal={false}
          partialHeight="min(85dvh, 40rem)"
          syncHistoryBack={!stackCoversMap}
          onDismissStart={() => {
            if (!stackCoversMap) beginPanelDismiss();
          }}
          onOpenChange={(open) => {
            if (!open) {
              setBottomSheetOpen(false);
              onClosePinMapPopover();
            }
          }}
        >
          {bottomSheetPinId ? (
            <PinDetailSideSheet
              key={bottomSheetPinId}
              pinId={bottomSheetPinId}
              mapId={activeMapId!}
              mapRoute={activeMapRoute}
              mapPins={pins}
              onNavigatePin={onSelectPin}
              onClose={onClosePinMapPopover}
              bottomSheet
            />
          ) : null}
        </BottomSheet>
      ) : null}

      {pinCollisionPicker ? (
        <PinMapCollisionPicker
          state={pinCollisionPicker}
          pins={pins}
          photoUrlByPinId={photoUrlByPinId}
          mapRef={mapRef}
          onSelectPin={onPickCollisionPin}
          onClose={onClosePinCollisionPicker}
          popupRef={collisionPopupRef}
          onDismissStart={onCollisionDismissStart}
        />
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
          if (!row) return;
          if (isMobile && activeMapRoute && row.slug.trim()) {
            navigate(pinEditHref(activeMapRoute, row.slug));
            return;
          }
          setFullEditPin(row);
        }}
        onMoveMarker={(pinId) => {
          setRelocatePinId(pinId);
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
          if (isMobile && activeMapRoute && t.slug.trim()) {
            navigate(pinEditHref(activeMapRoute, t.slug));
            return;
          }
          setFullEditPin(t);
        }}
        onOpen={(t) => onSelectPin(t.id)}
      />
      {canEdit && fullEditPin && !isMobile ? (
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tagEditTarget ? "Edit tag" : "New tag"}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogFormStack>
              <TagEntityLabelInput
                id="tag-name"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MapPageRoot>
  );
}
