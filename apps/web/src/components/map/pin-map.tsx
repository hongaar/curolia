import {
  mapStyleCacheKey,
  normalizeMapStylePreset,
  resolveMapStyle,
  type MapStylePreset,
} from "@/lib/map-style";
import {
  cameraToSyncKey,
  camerasCloseEnough,
  isValidMapBbox,
  normalizeCameraForUrl,
  type MapBbox,
  type MapCamera,
} from "@/lib/map-view-params";
import { ensureNativeLocationPermission } from "@/lib/native-geolocation";
import { filterPinsByTags, type PinWithTags } from "@/lib/pin-with-tags";
import { MapCanvas } from "@curolia/ui/map";
import {
  createMapMarkerMount,
  type MapMarkerMount,
} from "@curolia/ui/map-marker";
import { Tooltip, TooltipContent, TooltipTitle } from "@curolia/ui/tooltip";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

const HOVER_LEAVE_MS = 140;

/** Marker hover preview: screen x/y updated while the map camera moves. */
type PinHoverPreview = {
  pin: PinWithTags;
  lng: number;
  lat: number;
  x: number;
  y: number;
};

export type { PinWithTags };

export type PinMapHandle = {
  lngLatToScreen: (lng: number, lat: number) => { x: number; y: number } | null;
  subscribeCamera: (cb: () => void) => () => void;
  /** Fit map camera to currently filtered pins (same logic as former auto-fit). */
  fitVisiblePins: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  /** Request browser geolocation and fly the map toward the user's position. */
  triggerGeolocate: () => void;
  /** Return the current map center + zoom (normalized for URL/storage). */
  getCurrentCamera: () => MapCamera | null;
  /**
   * Ease to keep `lng/lat` visible in the left portion of the map,
   * accounting for a right-side panel of `panelWidthPx` pixels.
   */
  panForPanel: (
    lng: number,
    lat: number,
    panelWidthPx: number,
    onSettled?: () => void,
  ) => void;
  /** Restore a previously saved camera and reset panel padding to 0. */
  restoreCameraAfterPanel: (camera: MapCamera) => void;
  /** Drop right-side panel padding while keeping the current center and zoom. */
  clearPanelPadding: () => void;
  /** Drop stale marker pointer gestures (e.g. mouseup after ESC closed the sheet). */
  invalidatePendingMarkerSelection: () => void;
  /** Fly the map to a coordinate (e.g. after creating a pin from a pasted link). */
  flyToLocation: (lng: number, lat: number, zoom?: number) => void;
};

export type PinMapPreviewPin = {
  lat: number;
  lng: number;
  color: string | null;
  icon: string;
};

type PinMapProps = {
  pins: PinWithTags[];
  selectedTagIds: Set<string>;
  onSelectPin: (id: string) => void;
  /** Pin whose detail panel is open — distinct marker styling. */
  selectedPinId?: string | null;
  /** Draft pin while creating a pin (e.g. New pin dialog). */
  previewPin?: PinMapPreviewPin | null;
  placementMode?: boolean;
  onPlacementClick?: (lng: number, lat: number, zoom: number) => void;
  /** When set (from URL or localStorage fallback), map uses this view. */
  initialCamera?: MapCamera | null;
  /** When set (from URL), map fits this extent with padding instead of center/zoom fly. */
  initialBbox?: MapBbox | null;
  /** Stable key for the active camera source (`url:…` | `init:…`); when it changes, the map jumps to `initialCamera`. */
  cameraSyncKey?: string;
  /** Fired after pan/zoom settles (moveend); used to persist camera in the address bar. */
  onCameraIdle?: (camera: MapCamera) => void;
  /** Map canvas click when not in placement mode (e.g. dismiss nav overlay on mobile). */
  onMapBackgroundClick?: () => void;
  /** Per-map basemap preset from map settings. */
  mapStyle?: MapStylePreset;
};

const CAMERA_DURATION_MS = 850;
/** Fit-bounds inset per side as a fraction of map container width. */
const CAMERA_FIT_PADDING_WIDTH_FRACTION = 0.1;
const CAMERA_FIT_PADDING_MIN_PX = 48;
const CAMERA_MAX_ZOOM = 14;
const SINGLE_PIN_ZOOM = 10;

function cameraFitPaddingPx(map: maplibregl.Map): number {
  const width = map.getContainer().clientWidth;
  if (width <= 0) return 80;
  return Math.max(
    CAMERA_FIT_PADDING_MIN_PX,
    Math.round(width * CAMERA_FIT_PADDING_WIDTH_FRACTION),
  );
}

function geolocationToastMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as GeolocationPositionError).code;
    if (code === 1) return "Location permission denied.";
    if (code === 2) return "Position unavailable.";
    if (code === 3) return "Location request timed out.";
  }
  if (err instanceof Error) return err.message;
  return "Could not get your location.";
}

function cameraCloseEnough(map: maplibregl.Map, target: MapCamera) {
  const cur = map.getCenter();
  return camerasCloseEnough(
    { lat: cur.lat, lng: cur.lng, zoom: map.getZoom() },
    target,
  );
}

export const PinMap = forwardRef<PinMapHandle, PinMapProps>(function PinMap(
  {
    pins,
    selectedTagIds,
    onSelectPin,
    selectedPinId = null,
    previewPin = null,
    placementMode = false,
    onPlacementClick,
    initialCamera = null,
    initialBbox = null,
    cameraSyncKey = "",
    onCameraIdle,
    onMapBackgroundClick,
    mapStyle = "auto",
  },
  ref,
) {
  const { resolvedTheme } = useTheme();
  const mapStylePreset = normalizeMapStylePreset(mapStyle);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pinHover, setPinHover] = useState<PinHoverPreview | null>(null);
  const hoverFloatingRef = useRef<HTMLDivElement>(null);
  const hoverAnchorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const hoverVirtualReference = useMemo(
    () => ({
      getBoundingClientRect() {
        const a = hoverAnchorRef.current;
        return new DOMRect(a.x, a.y, 0, 0);
      },
    }),
    [],
  );
  const appliedMapStyleKeyRef = useRef<string>("");
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const markerMountByPinIdRef = useRef<Map<string, MapMarkerMount>>(new Map());
  const markerVisualByPinIdRef = useRef(
    new Map<string, { selected: boolean; hovered: boolean; zIndex: string }>(),
  );
  const previewMarkerRef = useRef<maplibregl.Marker | null>(null);
  const geolocateControlRef = useRef<maplibregl.GeolocateControl | null>(null);
  const onPlacementClickRef = useRef(onPlacementClick);
  const onSelectPinRef = useRef(onSelectPin);
  const onCameraIdleRef = useRef(onCameraIdle);
  const onMapBackgroundClickRef = useRef(onMapBackgroundClick);
  /** Last `cameraSyncKey` we applied from props (URL / deep link), not user idle echo. */
  const lastAppliedSyncKeyRef = useRef<string>("");
  /** `cameraToSyncKey(normalizeCameraForUrl(…))` last sent to parent via onCameraIdle — detects idle→URL→props echo. */
  const lastEmittedCameraKeyRef = useRef<string | null>(null);
  const cameraSyncKeyRef = useRef(cameraSyncKey);
  const initialBboxRef = useRef(initialBbox);
  const initialCameraRef = useRef(initialCamera);
  /** Invalidate deferred URL-apply callbacks when a newer sync generation starts. */
  const urlApplyGenerationRef = useRef(0);
  /** Bumped when the side panel closes so in-flight marker clicks are ignored. */
  const pinSelectGenerationRef = useRef(0);
  const markerPointerDownGenerationRef = useRef(0);

  const filtered = useMemo(
    () => filterPinsByTags(pins, selectedTagIds),
    [pins, selectedTagIds],
  );
  const filteredRef = useRef(filtered);
  const selectedPinIdRef = useRef(selectedPinId);
  const latestPinHoverIdRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    onPlacementClickRef.current = onPlacementClick;
    onSelectPinRef.current = onSelectPin;
    onCameraIdleRef.current = onCameraIdle;
    onMapBackgroundClickRef.current = onMapBackgroundClick;
    filteredRef.current = filtered;
    selectedPinIdRef.current = selectedPinId;
    latestPinHoverIdRef.current = pinHover?.pin.id ?? null;
  }, [
    onPlacementClick,
    onSelectPin,
    onCameraIdle,
    onMapBackgroundClick,
    filtered,
    selectedPinId,
    pinHover,
  ]);

  const applyMarkerHoverStack = useCallback((hoveredId: string | null) => {
    for (const t of filteredRef.current) {
      const mount = markerMountByPinIdRef.current.get(t.id);
      if (!mount) continue;
      const selected = t.id === selectedPinIdRef.current;
      const hovered = hoveredId !== null && t.id === hoveredId;
      const zIndex = selected || hovered ? "3" : "1";

      const prev = markerVisualByPinIdRef.current.get(t.id);
      if (
        prev?.selected === selected &&
        prev?.hovered === hovered &&
        prev?.zIndex === zIndex
      ) {
        continue;
      }
      markerVisualByPinIdRef.current.set(t.id, {
        selected,
        hovered,
        zIndex,
      });
      mount.setZIndex(zIndex);

      const tag0 = t.pin_tags?.[0]?.tags;
      const fill = tag0?.color ?? null;
      const emoji = tag0?.icon_emoji ?? "📍";
      mount.update({
        emoji,
        fill,
        selected,
        hovered,
        interactive: true,
      });
    }
  }, []);

  const cancelHidePreview = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const requestHidePreview = useCallback(() => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      leaveTimerRef.current = null;
      applyMarkerHoverStack(null);
      setPinHover(null);
    }, HOVER_LEAVE_MS);
  }, [applyMarkerHoverStack]);

  useEffect(() => () => cancelHidePreview(), [cancelHidePreview]);

  const pinHoverAnchorId = pinHover?.pin.id;
  const pinHoverLng = pinHover?.lng;
  const pinHoverLat = pinHover?.lat;

  useEffect(() => {
    if (
      pinHoverAnchorId === undefined ||
      pinHoverLng === undefined ||
      pinHoverLat === undefined
    )
      return;

    const map = mapRef.current;
    const el = containerRef.current;
    if (!map || !el) return;

    const pinId = pinHoverAnchorId;
    const lng = pinHoverLng;
    const lat = pinHoverLat;

    const project = () => {
      const p = map.project([lng, lat]);
      const r = el.getBoundingClientRect();
      setPinHover((h) =>
        h && h.pin.id === pinId ? { ...h, x: r.left + p.x, y: r.top + p.y } : h,
      );
    };

    project();
    map.on("move", project);
    map.on("zoom", project);
    map.on("rotate", project);
    map.on("pitch", project);
    window.addEventListener("resize", project);
    return () => {
      map.off("move", project);
      map.off("zoom", project);
      map.off("rotate", project);
      map.off("pitch", project);
      window.removeEventListener("resize", project);
    };
  }, [pinHoverAnchorId, pinHoverLng, pinHoverLat]);

  useLayoutEffect(() => {
    applyMarkerHoverStack(pinHover?.pin.id ?? null);
  }, [pinHover, applyMarkerHoverStack]);

  useLayoutEffect(() => {
    applyMarkerHoverStack(latestPinHoverIdRef.current);
  }, [selectedPinId, applyMarkerHoverStack]);

  useLayoutEffect(() => {
    if (!pinHover) {
      hoverAnchorRef.current = { x: 0, y: 0 };
      return;
    }
    hoverAnchorRef.current = { x: pinHover.x, y: pinHover.y };
  }, [pinHover]);

  useLayoutEffect(() => {
    if (!pinHover) return;
    const floating = hoverFloatingRef.current;
    if (!floating) return;

    const run = () =>
      computePosition(hoverVirtualReference, floating, {
        placement: "right",
        strategy: "fixed",
        middleware: [
          /* Gap from anchor (marker center); marker face is ~36px — keep tooltip clear of pin. */
          offset(26),
          flip({
            fallbackPlacements: ["left", "top", "bottom"],
          }),
          shift({ padding: 12 }),
        ],
      }).then((data) => {
        const el = hoverFloatingRef.current;
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
    return autoUpdate(hoverVirtualReference, floating, run, {
      animationFrame: true,
      layoutShift: true,
    });
  }, [pinHover, hoverVirtualReference]);

  useImperativeHandle(
    ref,
    () => ({
      lngLatToScreen(lng: number, lat: number) {
        const map = mapRef.current;
        const el = containerRef.current;
        if (!map || !el) return null;
        const p = map.project([lng, lat]);
        const r = el.getBoundingClientRect();
        return { x: r.left + p.x, y: r.top + p.y };
      },
      subscribeCamera(cb: () => void) {
        const map = mapRef.current;
        if (!map) return () => {};
        map.on("move", cb);
        map.on("zoom", cb);
        map.on("rotate", cb);
        map.on("pitch", cb);
        return () => {
          map.off("move", cb);
          map.off("zoom", cb);
          map.off("rotate", cb);
          map.off("pitch", cb);
        };
      },
      fitVisiblePins() {
        const map = mapRef.current;
        const list = filteredRef.current;
        if (!map || list.length === 0) return;

        if (list.length === 1) {
          const t = list[0];
          map.flyTo({
            center: [t.lng, t.lat],
            zoom: SINGLE_PIN_ZOOM,
            duration: CAMERA_DURATION_MS,
            essential: true,
          });
          return;
        }

        const bounds = new maplibregl.LngLatBounds(
          [list[0].lng, list[0].lat],
          [list[0].lng, list[0].lat],
        );
        for (const t of list) {
          bounds.extend([t.lng, t.lat]);
        }
        map.fitBounds(bounds, {
          padding: cameraFitPaddingPx(map),
          maxZoom: CAMERA_MAX_ZOOM,
          duration: CAMERA_DURATION_MS,
        });
      },
      zoomIn() {
        const map = mapRef.current;
        if (!map) return;
        map.zoomTo(map.getZoom() + 1, { duration: 180 });
      },
      zoomOut() {
        const map = mapRef.current;
        if (!map) return;
        map.zoomTo(Math.max(map.getZoom() - 1, map.getMinZoom()), {
          duration: 180,
        });
      },
      triggerGeolocate() {
        void (async () => {
          if (!navigator.geolocation) {
            toast.error("Geolocation is not supported in this browser.");
            return;
          }
          const permitted = await ensureNativeLocationPermission();
          if (!permitted) {
            toast.error("Location permission denied.");
            return;
          }
          const geolocate = geolocateControlRef.current;
          if (!geolocate?.trigger()) {
            toast.error("Map is still loading. Try again in a moment.");
          }
        })();
      },
      getCurrentCamera() {
        const map = mapRef.current;
        if (!map) return null;
        const c = map.getCenter();
        return normalizeCameraForUrl({
          lat: c.lat,
          lng: c.lng,
          zoom: map.getZoom(),
        });
      },
      panForPanel(
        lng: number,
        lat: number,
        panelWidthPx: number,
        onSettled?: () => void,
      ) {
        const map = mapRef.current;
        if (!map) return;
        map.easeTo({
          center: [lng, lat],
          padding: { right: panelWidthPx, left: 0, top: 0, bottom: 0 },
          duration: 280,
          essential: true,
        });
        if (onSettled) {
          map.once("moveend", onSettled);
        }
      },
      invalidatePendingMarkerSelection() {
        pinSelectGenerationRef.current += 1;
      },
      flyToLocation(lng: number, lat: number, zoom = SINGLE_PIN_ZOOM) {
        const map = mapRef.current;
        if (!map) return;
        map.flyTo({
          center: [lng, lat],
          zoom,
          duration: CAMERA_DURATION_MS,
          essential: true,
        });
      },
      restoreCameraAfterPanel(camera: MapCamera) {
        const map = mapRef.current;
        if (!map) return;
        map.easeTo({
          center: [camera.lng, camera.lat],
          zoom: camera.zoom,
          padding: { right: 0, left: 0, top: 0, bottom: 0 },
          duration: 280,
          essential: true,
        });
      },
      clearPanelPadding() {
        const map = mapRef.current;
        if (!map) return;
        const c = map.getCenter();
        map.easeTo({
          center: [c.lng, c.lat],
          zoom: map.getZoom(),
          padding: { right: 0, left: 0, top: 0, bottom: 0 },
          duration: 280,
          essential: true,
        });
      },
    }),
    [],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const start = initialCamera;
    const initialStyle = resolveMapStyle(mapStylePreset, resolvedTheme);
    appliedMapStyleKeyRef.current = mapStyleCacheKey(
      mapStylePreset,
      resolvedTheme,
    );
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: initialStyle,
      center: start ? [start.lng, start.lat] : [10, 20],
      zoom: start?.zoom ?? 1.5,
      attributionControl: false,
      maplibreLogo: false,
      dragRotate: false,
      touchPitch: false,
    });
    map.touchZoomRotate.disableRotation();

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 12_000,
      },
      fitBoundsOptions: {
        maxZoom: CAMERA_MAX_ZOOM,
      },
      trackUserLocation: false,
      showUserLocation: true,
      showAccuracyCircle: true,
    });
    geolocate.on("error", (e) => {
      const err =
        e && typeof e === "object" && "data" in e ? e.data : undefined;
      toast.error(geolocationToastMessage(err));
    });
    map.addControl(geolocate);
    geolocateControlRef.current = geolocate;

    mapRef.current = map;
    return () => {
      geolocateControlRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map instance is created once; initial frame uses initialCamera/cameraSyncKey from first render
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const key = mapStyleCacheKey(mapStylePreset, resolvedTheme);
    if (appliedMapStyleKeyRef.current === key) return;
    appliedMapStyleKeyRef.current = key;
    map.setStyle(resolveMapStyle(mapStylePreset, resolvedTheme));
  }, [mapStylePreset, resolvedTheme]);

  /**
   * Apply camera/bbox from URL when it represents external navigation (search, shared link),
   * not an echo of moveend→URL. While MapLibre is mid-gesture or animation, defer until `idle`.
   */
  useEffect(() => {
    cameraSyncKeyRef.current = cameraSyncKey;
    initialBboxRef.current = initialBbox;
    initialCameraRef.current = initialCamera;

    const map = mapRef.current;
    if (!map || !cameraSyncKey) return;

    urlApplyGenerationRef.current += 1;
    const gen = urlApplyGenerationRef.current;

    const tryApplyFromUrl = () => {
      if (gen !== urlApplyGenerationRef.current) return;
      const m = mapRef.current;
      if (!m) return;

      const syncKey = cameraSyncKeyRef.current;
      if (!syncKey || lastAppliedSyncKeyRef.current === syncKey) return;

      const bbox = initialBboxRef.current;
      const cam = initialCameraRef.current;

      // Point camera in URL matches what we already reported → parent echoed our idle update; do not fly.
      if (!bbox && cam) {
        const urlCamKey = cameraToSyncKey(normalizeCameraForUrl(cam));
        if (lastEmittedCameraKeyRef.current === urlCamKey) {
          lastAppliedSyncKeyRef.current = syncKey;
          return;
        }
      }

      // Bbox URL: compare bbox key to last emitted point key would never match — no echo skip.

      if (m.isMoving()) {
        m.once("idle", tryApplyFromUrl);
        return;
      }

      if (gen !== urlApplyGenerationRef.current) return;
      if (lastAppliedSyncKeyRef.current === syncKey) return;

      if (bbox && isValidMapBbox(bbox)) {
        lastAppliedSyncKeyRef.current = syncKey;
        m.fitBounds(
          new maplibregl.LngLatBounds(
            [bbox.west, bbox.south],
            [bbox.east, bbox.north],
          ),
          {
            padding: cameraFitPaddingPx(m),
            maxZoom: CAMERA_MAX_ZOOM,
            duration: CAMERA_DURATION_MS,
          },
        );
        return;
      }

      if (!cam) return;

      if (cameraCloseEnough(m, cam)) {
        lastAppliedSyncKeyRef.current = syncKey;
        return;
      }

      lastAppliedSyncKeyRef.current = syncKey;
      m.flyTo({
        center: [cam.lng, cam.lat],
        zoom: cam.zoom,
        duration: CAMERA_DURATION_MS,
        essential: true,
      });
    };

    tryApplyFromUrl();
  }, [cameraSyncKey, initialBbox, initialCamera]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const canvas = map.getCanvas();

    const clickHitPinMarker = (e: maplibregl.MapMouseEvent) => {
      const orig = e.originalEvent;
      if (
        orig &&
        "target" in orig &&
        orig.target instanceof Element &&
        orig.target.closest(".maplibregl-marker")
      ) {
        return true;
      }
      /*
       * Touch → synthetic click often reports `target` as the canvas, not the marker.
       * Hit-test at viewport coords — do not use `rect + e.point` (point is scaled canvas space).
       */
      let clientX: number | undefined;
      let clientY: number | undefined;
      if (orig instanceof MouseEvent) {
        clientX = orig.clientX;
        clientY = orig.clientY;
      }
      if (
        clientX !== undefined &&
        clientY !== undefined &&
        Number.isFinite(clientX) &&
        Number.isFinite(clientY)
      ) {
        for (const node of document.elementsFromPoint(clientX, clientY)) {
          if (node instanceof Element && node.closest(".maplibregl-marker")) {
            return true;
          }
        }
      }
      return false;
    };

    const onClick = (e: maplibregl.MapMouseEvent) => {
      if (placementMode) {
        const fn = onPlacementClickRef.current;
        if (fn) fn(e.lngLat.lng, e.lngLat.lat, map.getZoom());
        return;
      }
      if (clickHitPinMarker(e)) return;
      onMapBackgroundClickRef.current?.();
    };

    map.on("click", onClick);
    if (placementMode) {
      canvas.style.cursor = "crosshair";
    } else {
      canvas.style.cursor = "";
    }
    return () => {
      map.off("click", onClick);
      canvas.style.cursor = "";
    };
  }, [placementMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const idle = () => {
      const c = map.getCenter();
      const normalized = normalizeCameraForUrl({
        lng: c.lng,
        lat: c.lat,
        zoom: map.getZoom(),
      });
      lastEmittedCameraKeyRef.current = cameraToSyncKey(normalized);
      const fn = onCameraIdleRef.current;
      if (fn) fn(normalized);
    };
    map.on("moveend", idle);
    return () => {
      map.off("moveend", idle);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const mount of markerMountByPinIdRef.current.values()) {
      mount.unmount();
    }
    markerMountByPinIdRef.current.clear();
    markerVisualByPinIdRef.current.clear();
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const t of filtered) {
      const tag0 = t.pin_tags?.[0]?.tags;
      const fill = tag0?.color ?? null;
      const emoji = tag0?.icon_emoji ?? "📍";
      const mount = createMapMarkerMount({
        emoji,
        fill,
        selected: t.id === selectedPinIdRef.current,
        hovered: false,
        interactive: true,
        ariaLabel: t.title?.trim() || "Open pin",
        onPointerDown: () => {
          markerPointerDownGenerationRef.current =
            pinSelectGenerationRef.current;
        },
        onClick: (e) => {
          e.stopPropagation();
          if (
            markerPointerDownGenerationRef.current !==
            pinSelectGenerationRef.current
          ) {
            return;
          }
          onSelectPinRef.current(t.id);
        },
        onMouseEnter: () => {
          cancelHidePreview();
          const mapInst = mapRef.current;
          const wrap = containerRef.current;
          let x = 0;
          let y = 0;
          if (mapInst && wrap) {
            const p = mapInst.project([t.lng, t.lat]);
            const r = wrap.getBoundingClientRect();
            x = r.left + p.x;
            y = r.top + p.y;
          }
          setPinHover({ pin: t, lng: t.lng, lat: t.lat, x, y });
        },
        onMouseLeave: () => {
          requestHidePreview();
        },
      });
      markerMountByPinIdRef.current.set(t.id, mount);
      const initialSelected = t.id === selectedPinIdRef.current;
      markerVisualByPinIdRef.current.set(t.id, {
        selected: initialSelected,
        hovered: false,
        zIndex: initialSelected ? "3" : "1",
      });
      const marker = new maplibregl.Marker({ element: mount.element })
        .setLngLat([t.lng, t.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }

    setPinHover((h) => {
      if (!h) return null;
      if (!filtered.some((x) => x.id === h.pin.id)) return null;
      return h;
    });

    applyMarkerHoverStack(latestPinHoverIdRef.current);
    // Recreate markers only when the filtered pin set changes.
  }, [filtered, applyMarkerHoverStack, cancelHidePreview, requestHidePreview]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    previewMarkerRef.current?.remove();
    previewMarkerRef.current = null;
    if (!previewPin) return;

    const mount = createMapMarkerMount({
      emoji: previewPin.icon,
      fill: previewPin.color,
      selected: false,
      interactive: false,
      draft: true,
      pointerEvents: "none",
      zIndex: "5",
    });
    const marker = new maplibregl.Marker({ element: mount.element })
      .setLngLat([previewPin.lng, previewPin.lat])
      .addTo(map);
    previewMarkerRef.current = marker;
    return () => {
      marker.remove();
      mount.unmount();
      previewMarkerRef.current = null;
    };
  }, [previewPin]);

  const hoverTitle = pinHover?.pin.title?.trim() || "Untitled place";

  return (
    <>
      <MapCanvas placementMode={placementMode} containerRef={containerRef} />
      {pinHover ? (
        <Tooltip hostRef={hoverFloatingRef}>
          <TooltipContent>
            <TooltipTitle>{hoverTitle}</TooltipTitle>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </>
  );
});

PinMap.displayName = "PinMap";
