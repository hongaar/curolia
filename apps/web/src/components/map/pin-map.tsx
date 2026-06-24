import { mapFloatingViewportPadding } from "@/lib/map-anchor-floating-ui";
import {
  DEFAULT_MAP_STYLE_OPTIONS,
  isDarkBasemap,
  mapStyleCacheKey,
  normalizeMapStylePreset,
  resolveMapStyle,
  syncMapStyleOverlays,
  type MapStyleOptions,
  type MapStylePreset,
} from "@/lib/map-style";
import {
  camerasCloseEnough,
  cameraToSyncKey,
  normalizeCameraForUrl,
  type MapCamera,
} from "@/lib/map-view-params";
import { ensureNativeLocationPermission } from "@/lib/native-geolocation";
import { perfCount } from "@/lib/perf-probe";
import {
  buildCollisionLayout,
  collisionGroupClickWillZoom,
  collisionGroupLikelyZoomable,
  collisionRepresentativePinId,
  DEFAULT_COLLISION_GROUP_ZOOM_TUNING,
  resolveCollisionGroupZoomTarget,
  type CollisionGroupZoomOptions,
  type CollisionGroupZoomTuning,
  type CollisionLayout,
  type PinLngLat,
} from "@/lib/pin-map-collisions";
import {
  syncExploreLayer,
  type ExploreLayerSyncInput,
} from "@/lib/pin-map-explore-layer";
import {
  syncPlaceHighlightLayer,
  type PlaceMapHighlight,
} from "@/lib/pin-map-place-highlight";
import {
  buildPinRouteSegments,
  isMapStyleReady,
  scheduleWhenMapStyleReady,
  syncPinRouteLayers,
  updatePinRouteAnimation,
} from "@/lib/pin-map-route-layers";
import { pinMarkerVisual, type PinMarkerVisual } from "@/lib/pin-marker-visual";
import { filterPinsByTags, type PinWithTags } from "@/lib/pin-with-tags";
import { isValidMapBbox, type MapBbox } from "@curolia/services/coords";
import { MapCanvas } from "@curolia/ui/map";
import {
  createMapMarkerMount,
  type MapMarkerMount,
} from "@curolia/ui/map-marker";
import {
  Tooltip,
  TooltipContent,
  TooltipDescription,
  TooltipTitle,
} from "@curolia/ui/tooltip";
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
  type MutableRefObject,
} from "react";
import { toast } from "sonner";

const HOVER_LEAVE_MS = 140;
/** Hold still on empty map canvas before opening the add-pin context menu (touch). */
const MAP_LONG_PRESS_MS = 500;
const MAP_LONG_PRESS_MOVE_TOLERANCE_PX = 10;

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
  fitVisiblePins: (options?: {
    panelInset?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    onSettled?: () => void;
  }) => void;
  /** Zoom collided pins apart when possible; returns whether the map zoomed. */
  fitCollisionPins: (pinIds: string[]) => boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  /** Request browser geolocation and fly the map toward the user's position. */
  triggerGeolocate: () => void;
  /** Return the current map center + zoom (normalized for URL/storage). */
  getCurrentCamera: () => MapCamera | null;
  /** Map canvas element (for layering overlays under markers). */
  getMapContainer: () => HTMLElement | null;
  /**
   * Ease to keep `lng/lat` in the visible map area, inset by panel/sheet padding
   * (e.g. `{ right }` for a side sheet, `{ bottom }` for a bottom sheet).
   */
  panForPanel: (
    lng: number,
    lat: number,
    inset: { top?: number; right?: number; bottom?: number; left?: number },
    onSettled?: () => void,
  ) => void;
  /** Restore a previously saved camera and reset panel padding to 0. */
  restoreCameraAfterPanel: (camera: MapCamera) => void;
  /** Drop right-side panel padding while keeping the current center and zoom. */
  clearPanelPadding: () => void;
  /** Drop stale marker pointer gestures (e.g. mouseup after ESC closed the sheet). */
  invalidatePendingMarkerSelection: () => void;
  /** Fly the map to a coordinate (e.g. after creating a pin from a pasted link). */
  flyToLocation: (
    lng: number,
    lat: number,
    options?: number | PinMapFlyToOptions,
  ) => void;
  /** Pan to lng/lat at the current zoom when the point is outside the visible bounds. */
  panToLocationIfOutsideView: (
    lng: number,
    lat: number,
    onSettled?: () => void,
  ) => void;
};

export type PinMapFlyToOptions = {
  zoom?: number;
  bbox?: MapBbox;
  padding?: maplibregl.PaddingOptions | number;
};

export type PinMapPreviewPin = {
  lat: number;
  lng: number;
  color: string | null;
  icon: string | null;
};

export type PinMapDraftPinLocation = Pick<PinMapPreviewPin, "lat" | "lng">;

export type PinCollisionClickPayload = {
  pinIds: string[];
  lng: number;
  lat: number;
  clickedPinId: string;
};

/** While the collision picker is open, treat its stack like a map selection. */
export type PinMapCollisionFocus = {
  pinIds: string[];
  clickedPinId: string;
};

const EMPTY_PHOTO_URLS: Record<string, string> = {};

const DEFAULT_DRAFT_PIN: Pick<PinMapPreviewPin, "icon" | "color"> = {
  icon: null,
  color: null,
};

type PinMapProps = {
  pins: PinWithTags[];
  selectedTagIds: Set<string>;
  onSelectPin: (id: string) => void;
  /** Overlapping markers at the same map point — open a disambiguation picker. */
  onPinCollisionClick?: (payload: PinCollisionClickPayload) => void;
  /** Pin whose detail panel is open — distinct marker styling. */
  selectedPinId?: string | null;
  /** Collision picker open — dim non-group markers like `selectedPinId`. */
  collisionFocus?: PinMapCollisionFocus | null;
  /** Draft pin while creating a pin (e.g. New pin dialog). */
  previewPin?: PinMapPreviewPin | null;
  /** Draft pin at the map point opened by the context menu. */
  contextDraftPin?: PinMapDraftPinLocation | null;
  placementMode?: boolean;
  onPlacementClick?: (lng: number, lat: number, zoom: number) => void;
  /** Pin being relocated — click the map to set a new position. */
  relocatePinId?: string | null;
  onRelocateClick?: (
    pinId: string,
    lng: number,
    lat: number,
    zoom: number,
  ) => void;
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
  /** Right click / long press on empty map (not on a pin marker). */
  onMapContextMenu?: (
    lng: number,
    lat: number,
    zoom: number,
    clientX: number,
    clientY: number,
  ) => void;
  /** Right click / long press on a pin marker. */
  onPinContextMenu?: (pinId: string, clientX: number, clientY: number) => void;
  /** Per-map basemap preset from map settings. */
  mapStyle?: MapStylePreset;
  /** Per-map basemap overlays (hillshades, satellite labels). */
  mapStyleOptions?: MapStyleOptions;
  /** Draw chronological route lines between dated pins. */
  showPinRoute?: boolean;
  /** Circle overlay for a place picked from global search. */
  placeHighlight?: PlaceMapHighlight | null;
  /** Active explore categories and filters for synthetic map layers. */
  exploreLayer?: ExploreLayerSyncInput;
  /** Signed first-photo URL per pin id, for photo markers. */
  photoUrlByPinId?: Record<string, string>;
  /** Blog scroll focus — marker hover styling without map tooltip. */
  scrollHoverPinId?: string | null;
  /** When true, blog scroll sync should not pan the map (marker hover). */
  suspendBlogScrollPanRef?: MutableRefObject<boolean>;
};

const CAMERA_DURATION_MS = 850;
/** Side/bottom sheet pan + restore — aligned with `@curolia/ui` bottom sheet dismiss. */
const PANEL_CAMERA_DURATION_MS = 320;
/** Fit-bounds inset per side as a fraction of map container width. */
const CAMERA_FIT_PADDING_WIDTH_FRACTION = 0.1;
const CAMERA_FIT_PADDING_MIN_PX = 48;
const CAMERA_MAX_ZOOM = 16;
const SINGLE_PIN_ZOOM = 10;
const MARKER_ADD_BATCH_SIZE = 48;
/** Expand visible bounds before culling so pins do not pop at the edges. */
const VIEWPORT_BOUNDS_PADDING_RATIO = 0.35;

/** Collision-click zoom tuning — edit fields or spread `DEFAULT_COLLISION_GROUP_ZOOM_TUNING`. */
const COLLISION_GROUP_ZOOM_TUNING: CollisionGroupZoomTuning = {
  ...DEFAULT_COLLISION_GROUP_ZOOM_TUNING,
  maxSeparationZoom: CAMERA_MAX_ZOOM,
};

function clampLatitude(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

function paddedMapBounds(map: maplibregl.Map): maplibregl.LngLatBounds {
  const bounds = map.getBounds();
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const lngSpan = Math.abs(ne.lng - sw.lng);
  const latSpan = Math.abs(ne.lat - sw.lat);
  const lngPad = lngSpan * VIEWPORT_BOUNDS_PADDING_RATIO;
  const latPad = latSpan * VIEWPORT_BOUNDS_PADDING_RATIO;
  const south = clampLatitude(Math.min(sw.lat, ne.lat) - latPad);
  const north = clampLatitude(Math.max(sw.lat, ne.lat) + latPad);
  return new maplibregl.LngLatBounds(
    [sw.lng - lngPad, south],
    [ne.lng + lngPad, north],
  );
}

function pinInMapBounds(
  lng: number,
  lat: number,
  bounds: maplibregl.LngLatBounds,
): boolean {
  return bounds.contains([lng, lat]);
}

function hasMapContainerSize(map: maplibregl.Map): boolean {
  const container = map.getContainer();
  return container.clientWidth > 0 && container.clientHeight > 0;
}

function cameraFitPaddingPx(map: maplibregl.Map): number {
  const width = map.getContainer().clientWidth;
  if (width <= 0) return 80;
  return Math.max(
    CAMERA_FIT_PADDING_MIN_PX,
    Math.round(width * CAMERA_FIT_PADDING_WIDTH_FRACTION),
  );
}

function mapPanelPadding(map: maplibregl.Map) {
  const padding = map.getPadding();
  return {
    top: padding.top ?? 0,
    right: padding.right ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
  };
}

function fitPaddingForMap(
  map: maplibregl.Map,
  panelInset?: { top?: number; right?: number; bottom?: number; left?: number },
): maplibregl.PaddingOptions {
  const pad = cameraFitPaddingPx(map);
  return {
    top: (panelInset?.top ?? 0) + pad,
    right: (panelInset?.right ?? 0) + pad,
    bottom: (panelInset?.bottom ?? 0) + pad,
    left: (panelInset?.left ?? 0) + pad,
  };
}

function notifyFitSettled(map: maplibregl.Map, onSettled?: () => void) {
  if (!onSettled) return;
  const finish = () => onSettled();
  requestAnimationFrame(() => {
    if (map.isMoving()) {
      map.once("moveend", finish);
    } else {
      finish();
    }
  });
}

function boundsSpanIsDegenerate(bounds: maplibregl.LngLatBounds): boolean {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const eps = 1e-9;
  return Math.abs(sw.lng - ne.lng) < eps && Math.abs(sw.lat - ne.lat) < eps;
}

function fitMapToPinCoordinates(
  map: maplibregl.Map,
  coords: ReadonlyArray<{ lng: number; lat: number }>,
  options?: {
    maxZoom?: number;
    panelInset?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    onSettled?: () => void;
  },
) {
  if (coords.length === 0) return;

  const maxZoom = options?.maxZoom ?? map.getMaxZoom();
  const padding = fitPaddingForMap(map, options?.panelInset);

  if (coords.length === 1) {
    const t = coords[0]!;
    map.flyTo({
      center: [t.lng, t.lat],
      zoom: Math.min(SINGLE_PIN_ZOOM, maxZoom),
      padding,
      duration: CAMERA_DURATION_MS,
      essential: true,
    });
    notifyFitSettled(map, options?.onSettled);
    return;
  }

  const bounds = new maplibregl.LngLatBounds(
    [coords[0]!.lng, coords[0]!.lat],
    [coords[0]!.lng, coords[0]!.lat],
  );
  for (const t of coords) {
    bounds.extend([t.lng, t.lat]);
  }

  if (boundsSpanIsDegenerate(bounds)) {
    const center = bounds.getCenter();
    map.flyTo({
      center: [center.lng, center.lat],
      zoom: Math.min(map.getZoom() + 2, maxZoom),
      padding,
      duration: CAMERA_DURATION_MS,
      essential: true,
    });
    notifyFitSettled(map, options?.onSettled);
    return;
  }

  map.fitBounds(bounds, {
    padding,
    maxZoom,
    duration: CAMERA_DURATION_MS,
    essential: true,
  });
  notifyFitSettled(map, options?.onSettled);
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

function contextMenuClientPoint(
  orig: Event | undefined,
): { x: number; y: number } | null {
  if (orig instanceof MouseEvent) {
    return { x: orig.clientX, y: orig.clientY };
  }
  if (orig instanceof TouchEvent) {
    const t = orig.changedTouches[0] ?? orig.touches[0];
    if (t) return { x: t.clientX, y: t.clientY };
  }
  return null;
}

function pinIdFromContextEvent(orig: Event | undefined): string | null {
  if (!orig || !("target" in orig)) return null;
  const target = orig.target;
  if (!(target instanceof Element)) return null;
  const host = target.closest("[data-pin-id]");
  return host?.getAttribute("data-pin-id")?.trim() || null;
}

function clientPointHitsPinMarker(clientX: number, clientY: number): boolean {
  for (const node of document.elementsFromPoint(clientX, clientY)) {
    if (node instanceof Element && node.closest(".maplibregl-marker")) {
      return true;
    }
  }
  return false;
}

function lngLatAtClientPoint(
  map: maplibregl.Map,
  container: HTMLElement,
  clientX: number,
  clientY: number,
): maplibregl.LngLat {
  const rect = container.getBoundingClientRect();
  return map.unproject([clientX - rect.left, clientY - rect.top]);
}

function collisionGroupIsFocused(
  group: string[],
  selectedId: string | null,
  collisionFocus: PinMapCollisionFocus | null,
): boolean {
  if (selectedId !== null && group.includes(selectedId)) return true;
  if (!collisionFocus) return false;
  return group.some((id) => collisionFocus.pinIds.includes(id));
}

function layoutSelectedPinId(
  selectedId: string | null,
  collisionFocus: PinMapCollisionFocus | null,
): string | null {
  if (selectedId !== null) return selectedId;
  return collisionFocus?.clickedPinId ?? null;
}

function mapHasMarkerFocus(
  selectedId: string | null,
  collisionFocus: PinMapCollisionFocus | null,
): boolean {
  return selectedId !== null || collisionFocus !== null;
}

export const PinMap = forwardRef<PinMapHandle, PinMapProps>(function PinMap(
  {
    pins,
    selectedTagIds,
    onSelectPin,
    onPinCollisionClick,
    selectedPinId = null,
    collisionFocus = null,
    previewPin = null,
    contextDraftPin = null,
    placementMode = false,
    onPlacementClick,
    relocatePinId = null,
    onRelocateClick,
    initialCamera = null,
    initialBbox = null,
    cameraSyncKey = "",
    onCameraIdle,
    onMapBackgroundClick,
    onMapContextMenu,
    onPinContextMenu,
    mapStyle = "auto",
    mapStyleOptions = DEFAULT_MAP_STYLE_OPTIONS,
    showPinRoute = false,
    placeHighlight = null,
    exploreLayer = { activeCategories: [], filterValuesByCategory: {} },
    photoUrlByPinId = EMPTY_PHOTO_URLS,
    scrollHoverPinId = null,
    suspendBlogScrollPanRef,
  },
  ref,
) {
  const { resolvedTheme } = useTheme();
  const mapStylePreset = normalizeMapStylePreset(mapStyle);
  const mapStyleOpts = mapStyleOptions;
  const mapStylePresetRef = useRef(mapStylePreset);
  const mapStyleOptsRef = useRef(mapStyleOpts);
  mapStylePresetRef.current = mapStylePreset;
  mapStyleOptsRef.current = mapStyleOpts;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pinHover, setPinHover] = useState<PinHoverPreview | null>(null);
  const scrollHoverPinIdRef = useRef(scrollHoverPinId);
  scrollHoverPinIdRef.current = scrollHoverPinId;
  const hoveredCollisionCountRef = useRef(1);
  const hoveredCollisionSeparableRef = useRef(true);
  const [hoveredCollisionEpoch, setHoveredCollisionEpoch] = useState(0);
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
  const markerByPinIdRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const markerMountByPinIdRef = useRef<Map<string, MapMarkerMount>>(new Map());
  const markerVisualByPinIdRef = useRef(
    new Map<
      string,
      {
        selected: boolean;
        hovered: boolean;
        dimmed: boolean;
        zIndex: string;
        badge: number | null;
      }
    >(),
  );
  const markerContentByPinIdRef = useRef<Map<string, PinMarkerVisual>>(
    new Map(),
  );
  const photoUrlByPinIdRef = useRef(photoUrlByPinId);
  photoUrlByPinIdRef.current = photoUrlByPinId;
  const filteredByIdRef = useRef<Map<string, PinWithTags>>(new Map());
  const pendingMarkerAddsRef = useRef<PinWithTags[]>([]);
  const markerAddRafRef = useRef<number | null>(null);
  const markerSyncRafRef = useRef<number | null>(null);
  const markerSyncGenerationRef = useRef(0);
  /** Viewport culling is unreliable until MapLibre has idled with a real container size. */
  const mapHasIdledRef = useRef(false);
  const mapCameraMovingRef = useRef(false);
  const previewMarkerRef = useRef<maplibregl.Marker | null>(null);
  const placementDraftMarkerRef = useRef<maplibregl.Marker | null>(null);
  const placementDraftMountRef = useRef<MapMarkerMount | null>(null);
  const geolocateControlRef = useRef<maplibregl.GeolocateControl | null>(null);
  const onPlacementClickRef = useRef(onPlacementClick);
  const onRelocateClickRef = useRef(onRelocateClick);
  const onSelectPinRef = useRef(onSelectPin);
  const onPinCollisionClickRef = useRef(onPinCollisionClick);
  const collisionGroupByPinIdRef = useRef<Map<string, string[]>>(new Map());
  const collisionRepresentativeByPinIdRef = useRef<Map<string, string>>(
    new Map(),
  );
  const collisionCentroidByRepresentativeRef = useRef<
    Map<string, { lng: number; lat: number }>
  >(new Map());
  const onCameraIdleRef = useRef(onCameraIdle);
  const onMapBackgroundClickRef = useRef(onMapBackgroundClick);
  const onMapContextMenuRef = useRef(onMapContextMenu);
  const onPinContextMenuRef = useRef(onPinContextMenu);
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
  const suppressNextMapClickRef = useRef(false);
  const routeAnimationPhaseRef = useRef(0);
  const showPinRouteRef = useRef(showPinRoute);
  const placeHighlightRef = useRef(placeHighlight);
  const exploreLayerRef = useRef(exploreLayer);
  const routeSegmentsRef = useRef(buildPinRouteSegments([]));
  const darkBasemapRef = useRef(isDarkBasemap(mapStylePreset, resolvedTheme));
  const syncMapOverlaysRef = useRef<() => void>(() => {});
  const syncVisibleMarkersRef = useRef<() => void>(() => {});
  const invalidateMarkerViewportCullingRef = useRef<() => void>(() => {});
  const repaintMountedMarkersRef = useRef<() => void>(() => {});

  const filtered = useMemo(
    () => filterPinsByTags(pins, selectedTagIds),
    [pins, selectedTagIds],
  );
  const routeSegments = useMemo(
    () => buildPinRouteSegments(filtered),
    [filtered],
  );

  const filteredRef = useRef(filtered);
  const selectedPinIdRef = useRef(selectedPinId);
  const collisionFocusRef = useRef(collisionFocus);
  const latestPinHoverIdRef = useRef<string | null>(null);
  const placementModeRef = useRef(placementMode);
  const relocatePinIdRef = useRef(relocatePinId);

  useLayoutEffect(() => {
    onPlacementClickRef.current = onPlacementClick;
    onRelocateClickRef.current = onRelocateClick;
    onSelectPinRef.current = onSelectPin;
    onPinCollisionClickRef.current = onPinCollisionClick;
    onCameraIdleRef.current = onCameraIdle;
    onMapBackgroundClickRef.current = onMapBackgroundClick;
    onMapContextMenuRef.current = onMapContextMenu;
    onPinContextMenuRef.current = onPinContextMenu;
    filteredRef.current = filtered;
    filteredByIdRef.current = new Map(filtered.map((p) => [p.id, p]));
    selectedPinIdRef.current = selectedPinId;
    collisionFocusRef.current = collisionFocus;
    latestPinHoverIdRef.current = pinHover?.pin.id ?? scrollHoverPinId ?? null;
    placementModeRef.current = placementMode;
    relocatePinIdRef.current = relocatePinId;
  }, [
    onPlacementClick,
    onRelocateClick,
    onSelectPin,
    onPinCollisionClick,
    onCameraIdle,
    onMapBackgroundClick,
    onMapContextMenu,
    onPinContextMenu,
    filtered,
    selectedPinId,
    collisionFocus,
    pinHover,
    scrollHoverPinId,
    placementMode,
    relocatePinId,
  ]);

  const setMarkersCameraMoving = useCallback((moving: boolean) => {
    if (mapCameraMovingRef.current === moving) return;
    mapCameraMovingRef.current = moving;
    for (const mount of markerMountByPinIdRef.current.values()) {
      mount.setCameraMoving(moving);
    }
  }, []);

  const markerLngLatForPin = useCallback((pinId: string): [number, number] => {
    const centroid = collisionCentroidByRepresentativeRef.current.get(pinId);
    if (centroid) return [centroid.lng, centroid.lat];
    const pin = filteredByIdRef.current.get(pinId);
    return pin ? [pin.lng, pin.lat] : [0, 0];
  }, []);

  const updateCollisionLayout = useCallback(
    (
      map: maplibregl.Map,
      selectedId: string | null,
      hoveredId: string | null,
    ): CollisionLayout => {
      const relocatingId = relocatePinIdRef.current;
      const points = filteredRef.current
        .filter((pin) => pin.id !== relocatingId)
        .map((pin) => {
          const projected = map.project([pin.lng, pin.lat]);
          return {
            pinId: pin.id,
            lng: pin.lng,
            lat: pin.lat,
            x: projected.x,
            y: projected.y,
          };
        });
      const layout = buildCollisionLayout(points, selectedId, hoveredId);
      collisionGroupByPinIdRef.current = layout.groupByPinId;
      collisionRepresentativeByPinIdRef.current = layout.representativeByPinId;
      collisionCentroidByRepresentativeRef.current =
        layout.centroidByRepresentativeId;
      return layout;
    },
    [],
  );

  const collisionPinsLngLat = useCallback((pinIds: string[]): PinLngLat[] => {
    return pinIds
      .map((id) => filteredByIdRef.current.get(id))
      .filter(
        (pin): pin is PinWithTags =>
          Boolean(pin) &&
          typeof pin!.lat === "number" &&
          typeof pin!.lng === "number",
      )
      .map((pin) => ({ pinId: pin.id, lng: pin.lng, lat: pin.lat }));
  }, []);

  const collisionZoomOptionsForGroup = useCallback(
    (pinIds: string[]): CollisionGroupZoomOptions | null => {
      const pins = collisionPinsLngLat(pinIds);
      if (pins.length <= 1) return null;

      const map = mapRef.current;
      if (!map) return null;

      const container = map.getContainer();
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width <= 0 || height <= 0) return null;

      const center = map.getCenter();
      return {
        pins,
        width,
        height,
        panelPadding: mapPanelPadding(map),
        contentPaddingPx: cameraFitPaddingPx(map),
        currentCenterLng: center.lng,
        currentCenterLat: center.lat,
        currentZoom: map.getZoom(),
        maxZoom: map.getMaxZoom(),
        tuning: COLLISION_GROUP_ZOOM_TUNING,
      };
    },
    [collisionPinsLngLat],
  );

  const collisionPinsZoomableHint = useCallback(
    (
      pinIds: string[],
      options?: {
        /** Match click behavior; only use for the hovered/focused collision group. */
        precise?: boolean;
      },
    ): boolean => {
      if (pinIds.length <= 1) return false;
      const pins = collisionPinsLngLat(pinIds);
      if (!options?.precise) {
        return collisionGroupLikelyZoomable(pins);
      }
      const zoomOptions = collisionZoomOptionsForGroup(pinIds);
      if (!zoomOptions) return collisionGroupLikelyZoomable(pins);
      return collisionGroupClickWillZoom(zoomOptions);
    },
    [collisionPinsLngLat, collisionZoomOptionsForGroup],
  );

  const syncHoveredCollisionTooltip = useCallback(
    (hoverId?: string | null) => {
      const id = hoverId ?? latestPinHoverIdRef.current;
      if (!id) return;
      const count = collisionGroupByPinIdRef.current.get(id)?.length ?? 1;
      const group = collisionGroupByPinIdRef.current.get(id) ?? [id];
      const zoomable =
        group.length <= 1
          ? true
          : collisionPinsZoomableHint(group, { precise: true });
      let changed = false;
      if (count !== hoveredCollisionCountRef.current) {
        hoveredCollisionCountRef.current = count;
        changed = true;
      }
      if (zoomable !== hoveredCollisionSeparableRef.current) {
        hoveredCollisionSeparableRef.current = zoomable;
        changed = true;
      }
      if (changed) setHoveredCollisionEpoch((epoch) => epoch + 1);
    },
    [collisionPinsZoomableHint],
  );

  const collisionMarkerAriaLabel = useCallback(
    (pin: PinWithTags, group: string[], precise = false) => {
      if (group.length <= 1) return pin.title?.trim() || "Open pin";
      return collisionPinsZoomableHint(group, { precise })
        ? `${group.length} overlapping pins. Click to zoom in.`
        : `${group.length} overlapping pins. Click to choose a pin.`;
    },
    [collisionPinsZoomableHint],
  );

  const applyRepresentativeMarkerPositions = useCallback(() => {
    for (const [pinId, marker] of markerByPinIdRef.current) {
      const [lng, lat] = markerLngLatForPin(pinId);
      marker.setLngLat([lng, lat]);
    }
  }, [markerLngLatForPin]);

  const removeMarkerForPin = useCallback((pinId: string) => {
    markerByPinIdRef.current.get(pinId)?.remove();
    markerByPinIdRef.current.delete(pinId);
    const mount = markerMountByPinIdRef.current.get(pinId);
    mount?.unmount();
    markerMountByPinIdRef.current.delete(pinId);
    markerVisualByPinIdRef.current.delete(pinId);
    markerContentByPinIdRef.current.delete(pinId);
  }, []);

  const applyMarkerHoverStack = useCallback(
    (hoveredId: string | null) => {
      const selectedId = selectedPinIdRef.current;
      const collisionFocus = collisionFocusRef.current;
      const hasFocus = mapHasMarkerFocus(selectedId, collisionFocus);
      let restacked = false;
      for (const [pinId, mount] of markerMountByPinIdRef.current) {
        const t = filteredByIdRef.current.get(pinId);
        if (!t) continue;
        const group = collisionGroupByPinIdRef.current.get(pinId) ?? [pinId];
        const focused = collisionGroupIsFocused(
          group,
          selectedId,
          collisionFocus,
        );
        const hovered = hoveredId !== null && group.includes(hoveredId);
        const dimmed = hasFocus && !focused;
        const zIndex = focused || hovered ? "3" : "1";
        const badge = group.length > 1 ? group.length : null;

        const prev = markerVisualByPinIdRef.current.get(pinId);
        if (
          prev?.selected === focused &&
          prev?.hovered === hovered &&
          prev?.dimmed === dimmed &&
          prev?.zIndex === zIndex &&
          prev?.badge === badge
        ) {
          continue;
        }
        markerVisualByPinIdRef.current.set(pinId, {
          selected: focused,
          hovered,
          dimmed,
          zIndex,
          badge,
        });
        mount.setZIndex(zIndex);

        const { emoji, fill, photoUrl } = pinMarkerVisual(
          t,
          photoUrlByPinIdRef.current[pinId],
        );
        mount.update({
          emoji,
          fill,
          photoUrl,
          selected: focused,
          hovered,
          dimmed,
          badge,
          interactive: true,
          ariaLabel: collisionMarkerAriaLabel(t, group, hovered || focused),
        });
        restacked = true;
      }
      if (restacked) perfCount("markerRestack");
    },
    [collisionMarkerAriaLabel],
  );

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
      const hoverId = scrollHoverPinIdRef.current;
      setPinHover(null);
      applyMarkerHoverStack(hoverId);
      hoveredCollisionCountRef.current = 1;
      hoveredCollisionSeparableRef.current = true;
    }, HOVER_LEAVE_MS);
  }, [applyMarkerHoverStack]);

  const shouldMountPinMarker = useCallback(
    (
      pin: PinWithTags,
      bounds: maplibregl.LngLatBounds,
      selectedId: string | null,
      hoveredId: string | null,
    ) => {
      if (pin.id === selectedId || pin.id === hoveredId) return true;
      if (collisionFocusRef.current?.pinIds.includes(pin.id)) return true;
      return pinInMapBounds(pin.lng, pin.lat, bounds);
    },
    [],
  );

  const createMarkerForPin = useCallback(
    (t: PinWithTags) => {
      const map = mapRef.current;
      if (!map || markerMountByPinIdRef.current.has(t.id)) return;

      const { emoji, fill, photoUrl } = pinMarkerVisual(
        t,
        photoUrlByPinIdRef.current[t.id],
      );
      const group = collisionGroupByPinIdRef.current.get(t.id) ?? [t.id];
      const selectedId = selectedPinIdRef.current;
      const collisionFocus = collisionFocusRef.current;
      const focused = collisionGroupIsFocused(
        group,
        selectedId,
        collisionFocus,
      );
      const hasFocus = mapHasMarkerFocus(selectedId, collisionFocus);
      const mount = createMapMarkerMount({
        emoji,
        fill,
        photoUrl,
        selected: focused,
        hovered: false,
        dimmed: hasFocus && !focused,
        interactive: true,
        ariaLabel: collisionMarkerAriaLabel(t, group, focused),
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
          const group = collisionGroupByPinIdRef.current.get(t.id) ?? [t.id];
          const [lng, lat] = markerLngLatForPin(t.id);
          if (group.length > 1 && onPinCollisionClickRef.current) {
            onPinCollisionClickRef.current({
              pinIds: group,
              lng,
              lat,
              clickedPinId: t.id,
            });
            return;
          }
          onSelectPinRef.current(t.id);
        },
        onContextMenu: (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (placementModeRef.current || relocatePinIdRef.current) return;
          onPinContextMenuRef.current?.(t.id, e.clientX, e.clientY);
        },
        onMouseEnter: () => {
          cancelHidePreview();
          const mapInst = mapRef.current;
          const wrap = containerRef.current;
          let x = 0;
          let y = 0;
          const [lng, lat] = markerLngLatForPin(t.id);
          if (mapInst && wrap) {
            const p = mapInst.project([lng, lat]);
            const r = wrap.getBoundingClientRect();
            x = r.left + p.x;
            y = r.top + p.y;
          }
          setPinHover({ pin: t, lng, lat, x, y });
          syncHoveredCollisionTooltip(t.id);
        },
        onMouseLeave: () => {
          requestHidePreview();
        },
      });
      mount.setCameraMoving(mapCameraMovingRef.current);
      mount.element.dataset.pinId = t.id;
      markerMountByPinIdRef.current.set(t.id, mount);
      markerContentByPinIdRef.current.set(t.id, { emoji, fill, photoUrl });
      markerVisualByPinIdRef.current.set(t.id, {
        selected: focused,
        hovered: false,
        dimmed: hasFocus && !focused,
        zIndex: focused ? "3" : "1",
        badge: null,
      });
      const [lng, lat] = markerLngLatForPin(t.id);
      const marker = new maplibregl.Marker({ element: mount.element })
        .setLngLat([lng, lat])
        .addTo(map);
      markerByPinIdRef.current.set(t.id, marker);
    },
    [
      cancelHidePreview,
      collisionMarkerAriaLabel,
      markerLngLatForPin,
      requestHidePreview,
      syncHoveredCollisionTooltip,
    ],
  );

  const drainPendingMarkerAdds = useCallback(
    (viaRaf: boolean) => {
      const runBatch = () => {
        const batch = pendingMarkerAddsRef.current.splice(
          0,
          MARKER_ADD_BATCH_SIZE,
        );
        for (const pin of batch) {
          if (!filteredByIdRef.current.has(pin.id)) continue;
          createMarkerForPin(pin);
        }
      };

      if (!viaRaf) {
        if (markerAddRafRef.current !== null) {
          cancelAnimationFrame(markerAddRafRef.current);
          markerAddRafRef.current = null;
        }
        while (pendingMarkerAddsRef.current.length > 0) runBatch();
        const map = mapRef.current;
        if (map) {
          updateCollisionLayout(
            map,
            layoutSelectedPinId(
              selectedPinIdRef.current,
              collisionFocusRef.current,
            ),
            latestPinHoverIdRef.current,
          );
        }
        applyRepresentativeMarkerPositions();
        applyMarkerHoverStack(latestPinHoverIdRef.current);
        syncHoveredCollisionTooltip();
        return;
      }

      markerAddRafRef.current = null;
      runBatch();
      if (pendingMarkerAddsRef.current.length > 0) {
        markerAddRafRef.current = requestAnimationFrame(() =>
          drainPendingMarkerAdds(true),
        );
      } else {
        const map = mapRef.current;
        if (map) {
          updateCollisionLayout(
            map,
            layoutSelectedPinId(
              selectedPinIdRef.current,
              collisionFocusRef.current,
            ),
            latestPinHoverIdRef.current,
          );
        }
        applyRepresentativeMarkerPositions();
        applyMarkerHoverStack(latestPinHoverIdRef.current);
        syncHoveredCollisionTooltip();
      }
    },
    [
      applyMarkerHoverStack,
      applyRepresentativeMarkerPositions,
      createMarkerForPin,
      syncHoveredCollisionTooltip,
      updateCollisionLayout,
    ],
  );

  const scheduleMarkerAdds = useCallback(
    (pins: PinWithTags[]) => {
      if (pins.length === 0) return;
      pendingMarkerAddsRef.current.push(...pins);
      const viaRaf = mapCameraMovingRef.current;
      if (viaRaf) {
        if (markerAddRafRef.current !== null) return;
        markerAddRafRef.current = requestAnimationFrame(() =>
          drainPendingMarkerAdds(true),
        );
        return;
      }
      drainPendingMarkerAdds(false);
    },
    [drainPendingMarkerAdds],
  );

  const cancelMarkerAdds = useCallback(() => {
    pendingMarkerAddsRef.current = [];
    if (markerAddRafRef.current !== null) {
      cancelAnimationFrame(markerAddRafRef.current);
      markerAddRafRef.current = null;
    }
  }, []);

  const syncVisibleMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isMapStyleReady(map)) return;

    const gen = ++markerSyncGenerationRef.current;
    let bounds: maplibregl.LngLatBounds | null = null;
    const trustBounds =
      mapHasIdledRef.current &&
      hasMapContainerSize(map) &&
      !mapCameraMovingRef.current;
    if (trustBounds) {
      try {
        bounds = paddedMapBounds(map);
      } catch {
        // MapLibre can reject padded bounds at world zoom; mount every pin that frame.
        bounds = null;
      }
    }
    const selectedId = selectedPinIdRef.current;
    const hoveredId = latestPinHoverIdRef.current;
    const layoutSelectedId = layoutSelectedPinId(
      selectedId,
      collisionFocusRef.current,
    );

    const layout = updateCollisionLayout(map, layoutSelectedId, hoveredId);
    const uniqueGroups = [...new Set(layout.groupByPinId.values())];
    const mountRepresentatives = new Set<string>();

    for (const group of uniqueGroups) {
      const representativeId = collisionRepresentativePinId(
        group,
        layoutSelectedId,
        hoveredId,
      );
      const centroid = layout.centroidByRepresentativeId.get(representativeId);
      if (!centroid) continue;

      const groupVisible =
        bounds === null ||
        (layoutSelectedId !== null && group.includes(layoutSelectedId)) ||
        (hoveredId !== null && group.includes(hoveredId)) ||
        pinInMapBounds(centroid.lng, centroid.lat, bounds) ||
        group.some((pinId) => {
          const pin = filteredByIdRef.current.get(pinId);
          return (
            pin !== undefined &&
            shouldMountPinMarker(pin, bounds, layoutSelectedId, hoveredId)
          );
        });

      if (groupVisible) {
        mountRepresentatives.add(representativeId);
      }
    }

    for (const pinId of [...markerMountByPinIdRef.current.keys()]) {
      if (!mountRepresentatives.has(pinId)) {
        removeMarkerForPin(pinId);
      }
    }

    pendingMarkerAddsRef.current = pendingMarkerAddsRef.current.filter((p) =>
      mountRepresentatives.has(p.id),
    );

    const toAdd: PinWithTags[] = [];
    for (const representativeId of mountRepresentatives) {
      const pin = filteredByIdRef.current.get(representativeId);
      if (!pin) continue;
      const [lng, lat] = markerLngLatForPin(representativeId);
      if (!markerMountByPinIdRef.current.has(representativeId)) {
        toAdd.push(pin);
        continue;
      }
      const visual = pinMarkerVisual(
        pin,
        photoUrlByPinIdRef.current[representativeId],
      );
      const prev = markerContentByPinIdRef.current.get(representativeId);
      if (
        prev?.emoji !== visual.emoji ||
        prev?.fill !== visual.fill ||
        prev?.photoUrl !== visual.photoUrl
      ) {
        markerContentByPinIdRef.current.set(representativeId, visual);
        markerMountByPinIdRef.current.get(representativeId)?.update({
          emoji: visual.emoji,
          fill: visual.fill,
          photoUrl: visual.photoUrl,
        });
      }
      markerByPinIdRef.current.get(representativeId)?.setLngLat([lng, lat]);
    }

    if (gen !== markerSyncGenerationRef.current) return;
    scheduleMarkerAdds(toAdd);
    applyMarkerHoverStack(hoveredId);
    syncHoveredCollisionTooltip();
  }, [
    applyMarkerHoverStack,
    markerLngLatForPin,
    removeMarkerForPin,
    scheduleMarkerAdds,
    shouldMountPinMarker,
    syncHoveredCollisionTooltip,
    updateCollisionLayout,
  ]);

  const scheduleSyncVisibleMarkers = useCallback(() => {
    const run = () => {
      markerSyncRafRef.current = null;
      syncVisibleMarkers();
    };
    if (!mapCameraMovingRef.current) {
      if (markerSyncRafRef.current !== null) {
        cancelAnimationFrame(markerSyncRafRef.current);
        markerSyncRafRef.current = null;
      }
      run();
      return;
    }
    if (markerSyncRafRef.current !== null) return;
    markerSyncRafRef.current = requestAnimationFrame(run);
  }, [syncVisibleMarkers]);

  const repaintMountedMarkers = useCallback(() => {
    applyRepresentativeMarkerPositions();
  }, [applyRepresentativeMarkerPositions]);

  const syncMapOverlays = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    scheduleWhenMapStyleReady(map, () => {
      if (!isMapStyleReady(map)) return false;
      // Markers first — route layer writes must not block DOM marker mounts.
      syncVisibleMarkers();
      syncPinRouteLayers(map, {
        show: showPinRouteRef.current,
        segments: routeSegmentsRef.current,
        selectedPinId: selectedPinIdRef.current,
        animationPhase: routeAnimationPhaseRef.current,
        darkBasemap: darkBasemapRef.current,
      });
      syncPlaceHighlightLayer(map, () => placeHighlightRef.current);
      syncExploreLayer(map, exploreLayerRef.current);
      return true;
    });
  }, [syncVisibleMarkers]);

  const invalidateMarkerViewportCulling = useCallback(() => {
    mapHasIdledRef.current = false;
    syncMapOverlaysRef.current();
  }, []);

  syncVisibleMarkersRef.current = syncVisibleMarkers;
  syncMapOverlaysRef.current = syncMapOverlays;
  invalidateMarkerViewportCullingRef.current = invalidateMarkerViewportCulling;
  repaintMountedMarkersRef.current = repaintMountedMarkers;

  useEffect(() => () => cancelHidePreview(), [cancelHidePreview]);

  useLayoutEffect(() => {
    const suspendRef = suspendBlogScrollPanRef;
    if (!suspendRef) return;
    suspendRef.current = pinHover !== null;
  }, [pinHover, suspendBlogScrollPanRef]);

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
      syncHoveredCollisionTooltip(pinId);
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
  }, [pinHoverAnchorId, pinHoverLng, pinHoverLat, syncHoveredCollisionTooltip]);

  const pinHoverPinId = pinHover?.pin.id ?? null;

  useLayoutEffect(() => {
    const effectiveHoverId = pinHoverPinId ?? scrollHoverPinId ?? null;
    applyMarkerHoverStack(effectiveHoverId);
  }, [scrollHoverPinId, pinHoverPinId, applyMarkerHoverStack]);

  const showHoverTooltip = pinHover !== null;

  useLayoutEffect(() => {
    scheduleSyncVisibleMarkers();
  }, [selectedPinId, collisionFocus, scheduleSyncVisibleMarkers]);

  // Photos load asynchronously after pins; re-sync marker faces when they arrive.
  useLayoutEffect(() => {
    scheduleSyncVisibleMarkers();
  }, [photoUrlByPinId, scheduleSyncVisibleMarkers]);

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
            padding: mapFloatingViewportPadding(),
          }),
          shift({ padding: mapFloatingViewportPadding(), crossAxis: true }),
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
      getMapContainer() {
        return containerRef.current;
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
      fitVisiblePins(options) {
        const map = mapRef.current;
        const list = filteredRef.current;
        if (!map || list.length === 0) return;

        invalidateMarkerViewportCullingRef.current();
        fitMapToPinCoordinates(
          map,
          list.map((t) => ({ lng: t.lng, lat: t.lat })),
          {
            maxZoom: CAMERA_MAX_ZOOM,
            panelInset: options?.panelInset,
            onSettled: options?.onSettled,
          },
        );
      },
      fitCollisionPins(pinIds: string[]) {
        const map = mapRef.current;
        if (!map || pinIds.length <= 1) return false;

        const pins = pinIds
          .map((id) => filteredByIdRef.current.get(id))
          .filter(
            (pin): pin is PinWithTags =>
              Boolean(pin) &&
              typeof pin!.lat === "number" &&
              typeof pin!.lng === "number",
          )
          .map((pin) => ({ pinId: pin.id, lng: pin.lng, lat: pin.lat }));
        if (pins.length <= 1) return false;

        const container = map.getContainer();
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width <= 0 || height <= 0) return false;

        const center = map.getCenter();
        const panelPadding = mapPanelPadding(map);
        const cameraOptions = {
          pins,
          width,
          height,
          panelPadding,
          contentPaddingPx: cameraFitPaddingPx(map),
          currentCenterLng: center.lng,
          currentCenterLat: center.lat,
          currentZoom: map.getZoom(),
          maxZoom: map.getMaxZoom(),
          tuning: COLLISION_GROUP_ZOOM_TUNING,
        };
        const target = resolveCollisionGroupZoomTarget(cameraOptions);
        if (target === null) return false;

        perfCount("collisionZoomSearch");
        invalidateMarkerViewportCullingRef.current();
        map.flyTo({
          center: [target.centerLng, target.centerLat],
          zoom: target.zoom,
          padding: panelPadding,
          duration: CAMERA_DURATION_MS,
          essential: true,
        });
        return true;
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
        inset: {
          top?: number;
          right?: number;
          bottom?: number;
          left?: number;
        },
        onSettled?: () => void,
      ) {
        const map = mapRef.current;
        if (!map) return;
        invalidateMarkerViewportCullingRef.current();
        map.easeTo({
          center: [lng, lat],
          padding: {
            top: inset.top ?? 0,
            right: inset.right ?? 0,
            bottom: inset.bottom ?? 0,
            left: inset.left ?? 0,
          },
          duration: PANEL_CAMERA_DURATION_MS,
          essential: true,
        });
        map.once("moveend", () => {
          map.resize();
          syncMapOverlaysRef.current();
          onSettled?.();
        });
      },
      invalidatePendingMarkerSelection() {
        pinSelectGenerationRef.current += 1;
      },
      flyToLocation(
        lng: number,
        lat: number,
        options: number | PinMapFlyToOptions = {},
      ) {
        const map = mapRef.current;
        if (!map) return;
        map.stop();
        invalidateMarkerViewportCullingRef.current();
        const resolved =
          typeof options === "number" ? { zoom: options } : options;
        const zoom = resolved.zoom ?? SINGLE_PIN_ZOOM;
        const padding: maplibregl.PaddingOptions =
          typeof resolved.padding === "number"
            ? {
                top: resolved.padding,
                right: resolved.padding,
                bottom: resolved.padding,
                left: resolved.padding,
              }
            : (resolved.padding ?? {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              });
        if (resolved.bbox && isValidMapBbox(resolved.bbox)) {
          map.fitBounds(
            [
              [resolved.bbox.west, resolved.bbox.south],
              [resolved.bbox.east, resolved.bbox.north],
            ],
            {
              padding,
              duration: CAMERA_DURATION_MS,
              essential: true,
              maxZoom: zoom,
            },
          );
          return;
        }
        map.flyTo({
          center: [lng, lat],
          zoom,
          padding,
          duration: CAMERA_DURATION_MS,
          essential: true,
        });
      },
      panToLocationIfOutsideView(
        lng: number,
        lat: number,
        onSettled?: () => void,
      ) {
        const map = mapRef.current;
        if (!map) {
          onSettled?.();
          return;
        }
        if (map.getBounds().contains([lng, lat])) {
          onSettled?.();
          return;
        }
        invalidateMarkerViewportCullingRef.current();
        map.easeTo({
          center: [lng, lat],
          duration: CAMERA_DURATION_MS,
          essential: true,
        });
        map.once("moveend", () => {
          map.resize();
          syncMapOverlaysRef.current();
          onSettled?.();
        });
      },
      restoreCameraAfterPanel(camera: MapCamera) {
        const map = mapRef.current;
        if (!map) return;
        invalidateMarkerViewportCullingRef.current();
        map.easeTo({
          center: [camera.lng, camera.lat],
          zoom: camera.zoom,
          padding: { right: 0, left: 0, top: 0, bottom: 0 },
          duration: PANEL_CAMERA_DURATION_MS,
          essential: true,
        });
        map.once("moveend", () => {
          map.resize();
          repaintMountedMarkersRef.current();
        });
      },
      clearPanelPadding() {
        const map = mapRef.current;
        if (!map) return;
        invalidateMarkerViewportCullingRef.current();
        const c = map.getCenter();
        map.easeTo({
          center: [c.lng, c.lat],
          zoom: map.getZoom(),
          padding: { right: 0, left: 0, top: 0, bottom: 0 },
          duration: PANEL_CAMERA_DURATION_MS,
          essential: true,
        });
        map.once("moveend", () => {
          map.resize();
          repaintMountedMarkersRef.current();
        });
      },
    }),
    [],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const start = initialCamera;
    const initialStyle = resolveMapStyle(
      mapStylePreset,
      resolvedTheme,
      mapStyleOpts,
    );
    appliedMapStyleKeyRef.current = mapStyleCacheKey(
      mapStylePreset,
      resolvedTheme,
      mapStyleOpts,
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

    const onStyleLoad = () => {
      syncMapStyleOverlays(
        map,
        mapStylePresetRef.current,
        mapStyleOptsRef.current,
      );
      syncMapOverlaysRef.current();
    };
    map.on("style.load", onStyleLoad);

    mapRef.current = map;
    if (import.meta.env.VITE_E2E === "1") {
      window.__curoliaMapWhenSettled = () =>
        new Promise<void>((resolve) => {
          if (!map.isMoving()) {
            resolve();
            return;
          }
          map.once("idle", () => resolve());
        });
    }
    return () => {
      map.off("style.load", onStyleLoad);
      geolocateControlRef.current = null;
      if (import.meta.env.VITE_E2E === "1") {
        delete window.__curoliaMapWhenSettled;
      }
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map instance is created once; initial frame uses initialCamera/cameraSyncKey from first render
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const key = mapStyleCacheKey(mapStylePreset, resolvedTheme, mapStyleOpts);
    if (appliedMapStyleKeyRef.current === key) return;

    const applyStyle = () => {
      if (!mapRef.current) return;
      const style = resolveMapStyle(
        mapStylePreset,
        resolvedTheme,
        mapStyleOpts,
      );
      appliedMapStyleKeyRef.current = key;
      mapHasIdledRef.current = false;
      const onStyleLoad = () => {
        syncMapStyleOverlays(
          map,
          mapStylePresetRef.current,
          mapStyleOptsRef.current,
        );
        syncMapOverlaysRef.current();
      };
      map.once("style.load", onStyleLoad);
      map.setStyle(style);
    };

    if (map.style && map.isStyleLoaded()) {
      applyStyle();
    } else {
      map.once("load", applyStyle);
    }
  }, [mapStylePreset, resolvedTheme, mapStyleOpts]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!isMapStyleReady(map)) return;
    syncMapStyleOverlays(map, mapStylePreset, mapStyleOpts);
  }, [mapStylePreset, mapStyleOpts]);

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
        invalidateMarkerViewportCullingRef.current();
        const basePad = cameraFitPaddingPx(m);
        const highlightPad = Math.max(96, basePad + 40);
        const padding = placeHighlightRef.current
          ? {
              top: highlightPad,
              right: highlightPad,
              bottom: highlightPad + 48,
              left: highlightPad,
            }
          : basePad;
        m.fitBounds(
          new maplibregl.LngLatBounds(
            [bbox.west, bbox.south],
            [bbox.east, bbox.north],
          ),
          {
            padding,
            maxZoom: CAMERA_MAX_ZOOM,
            duration: CAMERA_DURATION_MS,
          },
        );
        return;
      }

      if (!cam) return;

      // Side sheet owns camera + right padding; URL point camera must not clear it.
      if (selectedPinIdRef.current) {
        lastAppliedSyncKeyRef.current = syncKey;
        return;
      }

      if (cameraCloseEnough(m, cam)) {
        lastAppliedSyncKeyRef.current = syncKey;
        return;
      }

      lastAppliedSyncKeyRef.current = syncKey;
      invalidateMarkerViewportCullingRef.current();
      m.flyTo({
        center: [cam.lng, cam.lat],
        zoom: cam.zoom,
        duration: CAMERA_DURATION_MS,
        essential: true,
        padding: m.getPadding(),
      });
    };

    tryApplyFromUrl();
  }, [cameraSyncKey, initialBbox, initialCamera]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const canvas = map.getCanvas();

    const removePlacementDraft = () => {
      placementDraftMarkerRef.current?.remove();
      placementDraftMarkerRef.current = null;
      placementDraftMountRef.current?.unmount();
      placementDraftMountRef.current = null;
    };

    const pickLocationMode = placementMode || Boolean(relocatePinId);

    const draftPinVisual = (): PinMarkerVisual => {
      const relocating = relocatePinIdRef.current;
      if (relocating) {
        const pin = filteredByIdRef.current.get(relocating);
        if (pin) return pinMarkerVisual(pin);
      }
      return {
        emoji: null,
        fill: DEFAULT_DRAFT_PIN.color,
        photoUrl: null,
      };
    };

    const placeOrMoveDraft = (lngLat: maplibregl.LngLatLike) => {
      if (!isMapStyleReady(map)) return;
      if (placementDraftMarkerRef.current) {
        placementDraftMarkerRef.current.setLngLat(lngLat);
        return;
      }
      const { emoji, fill } = draftPinVisual();
      const mount = createMapMarkerMount({
        emoji,
        fill,
        selected: false,
        interactive: false,
        draft: true,
        pointerEvents: "none",
        zIndex: "5",
      });
      const marker = new maplibregl.Marker({ element: mount.element })
        .setLngLat(lngLat)
        .addTo(map);
      placementDraftMountRef.current = mount;
      placementDraftMarkerRef.current = marker;
    };

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
      const point = contextMenuClientPoint(orig);
      if (point && clientPointHitsPinMarker(point.x, point.y)) {
        return true;
      }
      return false;
    };

    const openMapContextMenuAt = (
      lng: number,
      lat: number,
      clientX: number,
      clientY: number,
    ) => {
      onMapContextMenuRef.current?.(lng, lat, map.getZoom(), clientX, clientY);
    };

    const onClick = (e: maplibregl.MapMouseEvent) => {
      if (suppressNextMapClickRef.current) {
        suppressNextMapClickRef.current = false;
        return;
      }
      if (placementMode) {
        const fn = onPlacementClickRef.current;
        if (fn) fn(e.lngLat.lng, e.lngLat.lat, map.getZoom());
        return;
      }
      const relocatingId = relocatePinIdRef.current;
      if (relocatingId) {
        const fn = onRelocateClickRef.current;
        if (fn) fn(relocatingId, e.lngLat.lng, e.lngLat.lat, map.getZoom());
        return;
      }
      if (clickHitPinMarker(e)) return;
      onMapBackgroundClickRef.current?.();
    };

    const onContextMenu = (e: maplibregl.MapMouseEvent) => {
      e.preventDefault();
      if (pickLocationMode) return;
      const point = contextMenuClientPoint(e.originalEvent);
      if (!point) return;

      if (clickHitPinMarker(e)) {
        const pinId = pinIdFromContextEvent(e.originalEvent);
        if (pinId) onPinContextMenuRef.current?.(pinId, point.x, point.y);
        return;
      }

      openMapContextMenuAt(e.lngLat.lng, e.lngLat.lat, point.x, point.y);
    };

    let mapLongPressTimer: ReturnType<typeof setTimeout> | null = null;
    let mapLongPressTouch: {
      clientX: number;
      clientY: number;
      lng: number;
      lat: number;
    } | null = null;

    const clearMapLongPress = () => {
      if (mapLongPressTimer) {
        clearTimeout(mapLongPressTimer);
        mapLongPressTimer = null;
      }
      mapLongPressTouch = null;
    };

    const onCanvasTouchStart = (e: TouchEvent) => {
      if (placementModeRef.current || relocatePinIdRef.current) return;
      if (e.touches.length !== 1) {
        clearMapLongPress();
        return;
      }
      const touch = e.touches[0];
      if (clientPointHitsPinMarker(touch.clientX, touch.clientY)) {
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const lngLat = lngLatAtClientPoint(
        map,
        container,
        touch.clientX,
        touch.clientY,
      );
      mapLongPressTouch = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        lng: lngLat.lng,
        lat: lngLat.lat,
      };
      mapLongPressTimer = setTimeout(() => {
        mapLongPressTimer = null;
        const pending = mapLongPressTouch;
        mapLongPressTouch = null;
        if (!pending || placementModeRef.current || relocatePinIdRef.current) {
          return;
        }
        suppressNextMapClickRef.current = true;
        openMapContextMenuAt(
          pending.lng,
          pending.lat,
          pending.clientX,
          pending.clientY,
        );
      }, MAP_LONG_PRESS_MS);
    };

    const onCanvasTouchMove = (e: TouchEvent) => {
      if (!mapLongPressTouch || !mapLongPressTimer) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - mapLongPressTouch.clientX;
      const dy = touch.clientY - mapLongPressTouch.clientY;
      const tolerance = MAP_LONG_PRESS_MOVE_TOLERANCE_PX;
      if (dx * dx + dy * dy > tolerance * tolerance) {
        clearMapLongPress();
      }
    };

    const onPlacementMouseMove = (e: maplibregl.MapMouseEvent) => {
      placeOrMoveDraft(e.lngLat);
    };

    const onPlacementMouseLeave = () => {
      removePlacementDraft();
    };

    map.on("click", onClick);
    map.on("contextmenu", onContextMenu);
    canvas.addEventListener("touchstart", onCanvasTouchStart, {
      passive: true,
    });
    canvas.addEventListener("touchmove", onCanvasTouchMove, { passive: true });
    canvas.addEventListener("touchend", clearMapLongPress);
    canvas.addEventListener("touchcancel", clearMapLongPress);

    let attachPlacementMove: (() => void) | null = null;
    if (pickLocationMode && !previewPin) {
      attachPlacementMove = () => {
        map.on("mousemove", onPlacementMouseMove);
        canvas.addEventListener("mouseleave", onPlacementMouseLeave);
      };
      if (isMapStyleReady(map)) {
        attachPlacementMove();
      } else {
        map.once("load", attachPlacementMove);
      }
    } else {
      removePlacementDraft();
    }

    if (pickLocationMode) {
      canvas.style.cursor = "crosshair";
    } else {
      canvas.style.cursor = "";
    }
    return () => {
      map.off("click", onClick);
      map.off("contextmenu", onContextMenu);
      map.off("mousemove", onPlacementMouseMove);
      canvas.removeEventListener("touchstart", onCanvasTouchStart);
      canvas.removeEventListener("touchmove", onCanvasTouchMove);
      canvas.removeEventListener("touchend", clearMapLongPress);
      canvas.removeEventListener("touchcancel", clearMapLongPress);
      clearMapLongPress();
      if (attachPlacementMove) {
        map.off("load", attachPlacementMove);
      }
      canvas.removeEventListener("mouseleave", onPlacementMouseLeave);
      canvas.style.cursor = "";
      removePlacementDraft();
    };
  }, [placementMode, relocatePinId, previewPin]);

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
      perfCount("cameraIdleSync");
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

    const filteredIds = new Set(filtered.map((p) => p.id));
    for (const pinId of [...markerMountByPinIdRef.current.keys()]) {
      if (!filteredIds.has(pinId)) {
        removeMarkerForPin(pinId);
      }
    }

    setPinHover((h) => {
      if (!h) return null;
      if (!filteredIds.has(h.pin.id)) return null;
      return h;
    });

    syncMapOverlaysRef.current();
  }, [filtered, removeMarkerForPin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onMoveStart = () => {
      setMarkersCameraMoving(true);
    };
    const onMoveEnd = () => {
      setMarkersCameraMoving(false);
      syncMapOverlaysRef.current();
    };
    const onMove = () => scheduleSyncVisibleMarkers();

    const onIdle = () => {
      mapHasIdledRef.current = true;
      syncMapOverlaysRef.current();
      if (import.meta.env.VITE_E2E === "1") {
        window.__curoliaMapIdle = (window.__curoliaMapIdle ?? 0) + 1;
      }
    };

    map.on("movestart", onMoveStart);
    map.on("moveend", onMoveEnd);
    map.on("move", onMove);
    map.on("zoom", onMove);
    map.on("idle", onIdle);

    const container = containerRef.current;
    const resizeObserver =
      container &&
      new ResizeObserver(() => {
        mapHasIdledRef.current = false;
        map.resize();
        scheduleSyncVisibleMarkers();
        syncMapOverlaysRef.current();
      });
    if (container && resizeObserver) {
      resizeObserver.observe(container);
    }

    return () => {
      map.off("movestart", onMoveStart);
      map.off("moveend", onMoveEnd);
      map.off("move", onMove);
      map.off("zoom", onMove);
      map.off("idle", onIdle);
      resizeObserver?.disconnect();
      if (markerSyncRafRef.current !== null) {
        cancelAnimationFrame(markerSyncRafRef.current);
        markerSyncRafRef.current = null;
      }
      cancelMarkerAdds();
    };
  }, [
    cancelMarkerAdds,
    scheduleSyncVisibleMarkers,
    setMarkersCameraMoving,
    syncVisibleMarkers,
  ]);

  useEffect(() => {
    if (selectedPinId) {
      mapHasIdledRef.current = false;
    }
    scheduleSyncVisibleMarkers();
  }, [
    selectedPinId,
    relocatePinId,
    pinHover?.pin.id,
    scheduleSyncVisibleMarkers,
  ]);

  useLayoutEffect(() => {
    showPinRouteRef.current = showPinRoute;
    placeHighlightRef.current = placeHighlight;
    exploreLayerRef.current = exploreLayer;
    routeSegmentsRef.current = routeSegments;
    darkBasemapRef.current = isDarkBasemap(mapStylePreset, resolvedTheme);
  }, [
    showPinRoute,
    placeHighlight,
    exploreLayer,
    routeSegments,
    mapStylePreset,
    resolvedTheme,
  ]);

  useEffect(() => {
    syncMapOverlaysRef.current();
  }, [
    showPinRoute,
    placeHighlight,
    exploreLayer,
    routeSegments,
    selectedPinId,
    mapStylePreset,
    mapStyleOpts,
    resolvedTheme,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        syncMapOverlaysRef.current();
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!showPinRoute || !selectedPinId) return;

    let raf = 0;
    const tick = (now: number) => {
      routeAnimationPhaseRef.current = (now / 2200) % 1;
      const map = mapRef.current;
      const selectedPinId = selectedPinIdRef.current;
      if (map && isMapStyleReady(map) && selectedPinId) {
        updatePinRouteAnimation(
          map,
          routeSegmentsRef.current,
          selectedPinId,
          routeAnimationPhaseRef.current,
          darkBasemapRef.current,
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showPinRoute, selectedPinId]);

  const staticDraftPin = useMemo((): PinMapPreviewPin | null => {
    if (previewPin) return previewPin;
    if (!contextDraftPin) return null;
    return { ...contextDraftPin, ...DEFAULT_DRAFT_PIN };
  }, [previewPin, contextDraftPin]);

  const draftPinLat = staticDraftPin?.lat;
  const draftPinLng = staticDraftPin?.lng;
  const draftPinColor = staticDraftPin?.color;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    previewMarkerRef.current?.remove();
    previewMarkerRef.current = null;
    if (draftPinLat == null || draftPinLng == null) {
      return;
    }

    const mount = createMapMarkerMount({
      emoji: null,
      fill: draftPinColor ?? null,
      selected: false,
      interactive: false,
      draft: true,
      pointerEvents: "none",
      zIndex: "5",
    });
    const marker = new maplibregl.Marker({ element: mount.element })
      .setLngLat([draftPinLng, draftPinLat])
      .addTo(map);
    previewMarkerRef.current = marker;
    return () => {
      marker.remove();
      mount.unmount();
      previewMarkerRef.current = null;
    };
  }, [draftPinLat, draftPinLng, draftPinColor]);

  const baseHoverTitle = pinHover?.pin.title?.trim() || "Untitled place";
  const hoverCollisionCount = useMemo(() => {
    if (!pinHover) return 1;
    return collisionGroupByPinIdRef.current.get(pinHover.pin.id)?.length ?? 1;
  }, [pinHover, hoveredCollisionEpoch]);
  const hoverTitle =
    hoverCollisionCount > 1
      ? `${baseHoverTitle} + ${hoverCollisionCount - 1} more`
      : baseHoverTitle;
  const hoverCollisionSeparable = useMemo(() => {
    if (!pinHover || hoverCollisionCount <= 1) return true;
    return hoveredCollisionSeparableRef.current;
  }, [pinHover, hoverCollisionCount, hoveredCollisionEpoch]);

  return (
    <>
      <MapCanvas
        placementMode={placementMode || Boolean(relocatePinId)}
        containerRef={containerRef}
      />
      {showHoverTooltip ? (
        <Tooltip hostRef={hoverFloatingRef}>
          <TooltipContent>
            <TooltipTitle>{hoverTitle}</TooltipTitle>
            {hoverCollisionCount > 1 ? (
              <TooltipDescription>
                {hoverCollisionSeparable
                  ? "Click to zoom in"
                  : "Click to choose a pin"}
              </TooltipDescription>
            ) : null}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </>
  );
});

PinMap.displayName = "PinMap";
