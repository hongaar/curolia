import { MapViewInitialLoader } from "@/components/layout/map-view-initial-loader";
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
import { useMapPinPanel } from "@/hooks/use-map-pin-panel";
import { useMinMd } from "@/hooks/use-min-md";
import { DISCOVER_MAP_STORAGE_ID } from "@/lib/discover-routes";
import { fetchDiscoverPins, type DiscoverPin } from "@/lib/fetch-discover-pins";
import {
  readStoredMapCamera,
  writeStoredMapCamera,
} from "@/lib/map-camera-storage";
import { mapRouteFromParts } from "@/lib/map-route";
import {
  applyMapCameraToSearchParams,
  applySelectedPinToSearchParams,
  bboxToSyncKey,
  camerasCloseEnough,
  cameraToSyncKey,
  normalizeCameraForUrl,
  parseMapBboxFromSearchParams,
  parseMapCameraFromSearchParams,
  parseSelectedPinTokenFromSearchParams,
  resolvePinIdFromMapToken,
  stripMapBboxFromSearchParams,
  type MapCamera,
} from "@/lib/map-view-params";
import { pinDetailSideSheetTitle } from "@/lib/pin-detail-side-sheet-title";
import type { PinWithTags } from "@/lib/pin-with-tags";
import { BottomSheet } from "@curolia/ui/bottom-sheet";
import {
  MapHost,
  MapLayer,
  MapPageRoot,
  MapSidePanel,
  MapVignette,
} from "@curolia/ui/map";
import { useQuery } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";

const PANEL_RIGHT_WIDTH_CSS = "clamp(24rem, 35%, 40rem)";

function discoverMapRoute(pin: DiscoverPin) {
  return mapRouteFromParts(
    pin.discoverMap.ownerProfileSlug,
    pin.discoverMap.mapSlug,
  );
}

function pinsOnSameMap(pins: DiscoverPin[], mapId: string): PinWithTags[] {
  return pins.filter((pin) => pin.map_id === mapId);
}

export function DiscoverPage() {
  const isWideEnough = useMinMd();
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

  const pinsQuery = useQuery({
    queryKey: ["discover-pins"],
    queryFn: fetchDiscoverPins,
  });

  const pins = useMemo(() => pinsQuery.data ?? [], [pinsQuery.data]);

  const mapFitGenerationRef = useRef(0);
  const didInitFitRef = useRef(false);
  const [mapFitGeneration, setMapFitGeneration] = useState(0);
  const [mapFitResolvedGeneration, setMapFitResolvedGeneration] = useState(0);
  useLayoutEffect(() => {
    mapFitGenerationRef.current = mapFitGeneration;
  }, [mapFitGeneration]);

  const pinsReadyForMapFit = !pinsQuery.isPending;
  const mapFitPending = mapFitGeneration > mapFitResolvedGeneration;
  const mapFitCanResolve =
    Boolean(cameraFromUrl) ||
    Boolean(bboxFromUrl) ||
    Boolean(readStoredMapCamera(DISCOVER_MAP_STORAGE_ID)) ||
    (pinsReadyForMapFit && pins.length === 0);
  const awaitingMapFit = mapFitPending && !mapFitCanResolve;

  /* eslint-disable react-hooks/set-state-in-effect -- initial discover map camera fit */
  useLayoutEffect(() => {
    if (!pinsReadyForMapFit || didInitFitRef.current) return;
    didInitFitRef.current = true;
    if (
      cameraFromUrl ||
      bboxFromUrl ||
      readStoredMapCamera(DISCOVER_MAP_STORAGE_ID)
    ) {
      setMapFitResolvedGeneration((g) => g + 1);
      return;
    }
    setMapFitGeneration((g) => g + 1);
  }, [pinsReadyForMapFit, cameraFromUrl, bboxFromUrl]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    return readStoredMapCamera(DISCOVER_MAP_STORAGE_ID);
  }, [awaitingMapFit, cameraFromUrl, bboxFromUrl]);

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
    if (pins.length === 0) return;

    const generation = mapFitGenerationRef.current;
    mapRef.current?.fitVisiblePins({
      onSettled: () => {
        setMapFitResolvedGeneration(generation);
      },
    });
  }, [awaitingMapFit, searchParams, pinsReadyForMapFit, pins.length]);

  const cameraIdleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const sidebarPinTokenRef = useRef<string | null>(null);
  const cameraFromUrlRef = useRef<MapCamera | null>(null);

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

  useEffect(() => {
    return () => clearTimeout(cameraIdleTimerRef.current);
  }, []);

  const clearCameraIdleTimer = useCallback(() => {
    clearTimeout(cameraIdleTimerRef.current);
  }, []);

  const [pinCollisionPicker, setPinCollisionPicker] =
    useState<PinMapCollisionPickerState | null>(null);

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
    activeMapId: DISCOVER_MAP_STORAGE_ID,
  });

  const selectedDiscoverPin = useMemo(
    () => pins.find((pin) => pin.id === panelPinId) ?? null,
    [pins, panelPinId],
  );

  const selectedMapRoute = useMemo(
    () => (selectedDiscoverPin ? discoverMapRoute(selectedDiscoverPin) : null),
    [selectedDiscoverPin],
  );

  const selectedMapPins = useMemo(
    () =>
      selectedDiscoverPin
        ? pinsOnSameMap(pins, selectedDiscoverPin.map_id)
        : [],
    [pins, selectedDiscoverPin],
  );

  const bottomSheetPin = useMemo(
    () => pins.find((pin) => pin.id === bottomSheetPinId) ?? null,
    [pins, bottomSheetPinId],
  );

  const bottomSheetTitle = pinDetailSideSheetTitle(bottomSheetPin);

  const onSelectPin = useCallback(
    (id: string) => {
      setPinCollisionPicker(null);
      const row = pins.find((pin) => pin.id === id);
      onPinSelectFromMap(id, row);
      setSearchParams((prev) => applySelectedPinToSearchParams(prev, id), {
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

  const onClosePinCollisionPicker = useCallback(() => {
    onCollisionClose();
    setPinCollisionPicker(null);
  }, [onCollisionClose]);

  const onPinCollisionClick = useCallback(
    (payload: PinCollisionClickPayload) => {
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

  const onCameraIdle = useCallback(
    (c: MapCamera) => {
      clearTimeout(cameraIdleTimerRef.current);
      cameraIdleTimerRef.current = setTimeout(() => {
        const normalized = normalizeCameraForUrl(c);
        const pinTok = sidebarPinTokenRef.current;
        const urlCam = cameraFromUrlRef.current;
        if (pinTok && urlCam && !camerasCloseEnough(normalized, urlCam)) return;
        writeStoredMapCamera(DISCOVER_MAP_STORAGE_ID, normalized);
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
    [setSearchParams, userDismissedRef],
  );

  useLayoutEffect(() => {
    syncCollisionPanelCamera(pinCollisionPicker);
  }, [pinCollisionPicker, syncCollisionPanelCamera]);

  if (pinsQuery.isPending) {
    return <MapViewInitialLoader label="Loading discover map…" />;
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
            selectedTagIds={new Set()}
            selectedPinId={mapSelectedPinId}
            collisionFocus={
              pinCollisionPicker
                ? {
                    pinIds: pinCollisionPicker.pinIds,
                    clickedPinId: pinCollisionPicker.clickedPinId,
                  }
                : null
            }
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
          />
        </MapHost>
        {showSidePanel && sidebarPinId && selectedDiscoverPin ? (
          <MapSidePanel
            ref={sidePanelRef}
            animateIn={showSidePanel && sidePanelAnimateIn}
          >
            <PinDetailSideSheet
              key={sidebarPinId}
              pinId={sidebarPinId}
              mapId={selectedDiscoverPin.map_id}
              mapRoute={selectedMapRoute}
              mapPins={selectedMapPins}
              sourceMap={selectedDiscoverPin.discoverMap}
              onNavigatePin={onSelectPin}
              onClose={onClosePinMapPopover}
            />
          </MapSidePanel>
        ) : null}
      </MapLayer>

      {!isWideEnough ? (
        <BottomSheet
          open={bottomSheetOpen}
          popupRef={panelPopupRef}
          dismissRef={bottomSheetDismissRef}
          title={bottomSheetTitle}
          overlay="none"
          modal={false}
          partialHeight="min(85dvh, 40rem)"
          syncHistoryBack
          onDismissStart={beginPanelDismiss}
          onOpenChange={(open) => {
            if (!open) {
              onClosePinMapPopover();
            }
          }}
        >
          {bottomSheetPinId && bottomSheetPin ? (
            <PinDetailSideSheet
              key={bottomSheetPinId}
              pinId={bottomSheetPinId}
              mapId={bottomSheetPin.map_id}
              mapRoute={discoverMapRoute(bottomSheetPin)}
              mapPins={pinsOnSameMap(pins, bottomSheetPin.map_id)}
              sourceMap={bottomSheetPin.discoverMap}
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
          mapRef={mapRef}
          onSelectPin={onPickCollisionPin}
          onClose={onClosePinCollisionPicker}
          popupRef={collisionPopupRef}
          onDismissStart={onCollisionDismissStart}
        />
      ) : null}
    </MapPageRoot>
  );
}
