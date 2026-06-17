/** Half of map marker face (`--control-h-md` / 2). Centers within this distance collide. */
export const PIN_MARKER_COLLISION_RADIUS_PX = 18;

/** MapLibre world tile size at zoom 0 (Web Mercator). */
export const MAP_PROJECTION_TILE_SIZE = 512;

export type PinScreenPoint = {
  pinId: string;
  x: number;
  y: number;
};

export type PinLngLat = {
  pinId: string;
  lng: number;
  lat: number;
};

export type MapProjectionCamera = {
  centerLng: number;
  centerLat: number;
  zoom: number;
  width: number;
  height: number;
  /** MapLibre side-panel padding — shifts the projected center. */
  panelPadding?: MapViewportPadding;
};

export type MapViewportPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const EMPTY_MAP_VIEWPORT_PADDING: MapViewportPadding = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export function uniformMapViewportPadding(px: number): MapViewportPadding {
  return { top: px, right: px, bottom: px, left: px };
}

type CollisionZoomPadding = {
  panelPadding: MapViewportPadding;
  contentPaddingPx: number;
};

function resolveCollisionZoomPadding(options: {
  paddingPx?: number;
  panelPadding?: MapViewportPadding;
  contentPaddingPx?: number;
}): CollisionZoomPadding {
  if (
    options.panelPadding !== undefined ||
    options.contentPaddingPx !== undefined
  ) {
    return {
      panelPadding: options.panelPadding ?? EMPTY_MAP_VIEWPORT_PADDING,
      contentPaddingPx: options.contentPaddingPx ?? 0,
    };
  }
  return {
    panelPadding: EMPTY_MAP_VIEWPORT_PADDING,
    contentPaddingPx: options.paddingPx ?? 0,
  };
}

function panelPaddingFor(camera: MapProjectionCamera): MapViewportPadding {
  return camera.panelPadding ?? EMPTY_MAP_VIEWPORT_PADDING;
}

function projectionCenter(camera: MapProjectionCamera): {
  x: number;
  y: number;
} {
  const pad = panelPaddingFor(camera);
  return {
    x: pad.left + (camera.width - pad.left - pad.right) / 2,
    y: pad.top + (camera.height - pad.top - pad.bottom) / 2,
  };
}

export type PinGeoPoint = {
  pinId: string;
  lng: number;
  lat: number;
  x: number;
  y: number;
};

export type CollisionLayout = {
  groupByPinId: Map<string, string[]>;
  representativeByPinId: Map<string, string>;
  centroidByRepresentativeId: Map<string, { lng: number; lat: number }>;
};

function findRoot(parent: Map<string, string>, id: string): string {
  let root = id;
  while (parent.get(root) !== root) {
    root = parent.get(root)!;
  }
  return root;
}

function unionRoots(parent: Map<string, string>, a: string, b: string) {
  const ra = findRoot(parent, a);
  const rb = findRoot(parent, b);
  if (ra !== rb) parent.set(rb, ra);
}

/**
 * Group pin ids whose projected screen centers fall within `radiusPx`.
 * Returns every pin id mapped to its full collision group (sorted for stability).
 */
export function groupPinIdsByScreenCollision(
  points: PinScreenPoint[],
  radiusPx: number = PIN_MARKER_COLLISION_RADIUS_PX,
): Map<string, string[]> {
  const radiusSq = radiusPx * radiusPx;
  const parent = new Map<string, string>();
  for (const point of points) {
    parent.set(point.pinId, point.pinId);
  }

  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    for (let j = i + 1; j < points.length; j += 1) {
      const b = points[j]!;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (dx * dx + dy * dy <= radiusSq) {
        unionRoots(parent, a.pinId, b.pinId);
      }
    }
  }

  const groupsByRoot = new Map<string, string[]>();
  for (const point of points) {
    const root = findRoot(parent, point.pinId);
    const group = groupsByRoot.get(root);
    if (group) group.push(point.pinId);
    else groupsByRoot.set(root, [point.pinId]);
  }

  const result = new Map<string, string[]>();
  for (const group of groupsByRoot.values()) {
    group.sort();
    for (const pinId of group) {
      result.set(pinId, group);
    }
  }
  return result;
}

function mercatorNormalizedY(lat: number): number {
  const clamped = Math.max(-85.051129, Math.min(85.051129, lat));
  const rad = (clamped * Math.PI) / 180;
  return 0.5 - Math.log(Math.tan(Math.PI / 4 + rad / 2)) / (2 * Math.PI);
}

/** Project lng/lat to map container pixels (bearing 0, pitch 0). */
export function projectLngLatAtCamera(
  lng: number,
  lat: number,
  camera: MapProjectionCamera,
): { x: number; y: number } {
  const worldSize = MAP_PROJECTION_TILE_SIZE * 2 ** camera.zoom;
  const centerX = ((camera.centerLng + 180) / 360) * worldSize;
  const centerY = mercatorNormalizedY(camera.centerLat) * worldSize;
  const x = ((lng + 180) / 360) * worldSize;
  const y = mercatorNormalizedY(lat) * worldSize;
  const origin = projectionCenter(camera);
  return {
    x: origin.x + (x - centerX),
    y: origin.y + (y - centerY),
  };
}

export function pinsCollideAtCamera(
  pins: ReadonlyArray<PinLngLat>,
  camera: MapProjectionCamera,
  radiusPx: number = PIN_MARKER_COLLISION_RADIUS_PX,
): boolean {
  if (pins.length <= 1) return false;
  const points: PinScreenPoint[] = pins.map((pin) => {
    const projected = projectLngLatAtCamera(pin.lng, pin.lat, camera);
    return { pinId: pin.pinId, x: projected.x, y: projected.y };
  });
  const groups = groupPinIdsByScreenCollision(points, radiusPx);
  return pins.some((pin) => (groups.get(pin.pinId)?.length ?? 1) > 1);
}

export function allPinsFitInViewport(
  pins: ReadonlyArray<PinLngLat>,
  camera: MapProjectionCamera,
  contentPaddingPx: number,
): boolean {
  const pad = panelPaddingFor(camera);
  const { width, height } = camera;
  const minX = pad.left + contentPaddingPx;
  const maxX = width - pad.right - contentPaddingPx;
  const minY = pad.top + contentPaddingPx;
  const maxY = height - pad.bottom - contentPaddingPx;
  if (maxX <= minX || maxY <= minY) return false;

  for (const pin of pins) {
    const { x, y } = projectLngLatAtCamera(pin.lng, pin.lat, camera);
    if (x < minX || x > maxX || y < minY || y > maxY) {
      return false;
    }
  }
  return true;
}

function pinScreenPointsAtCamera(
  pins: ReadonlyArray<PinLngLat>,
  camera: MapProjectionCamera,
): PinScreenPoint[] {
  return pins.map((pin) => {
    const projected = projectLngLatAtCamera(pin.lng, pin.lat, camera);
    return { pinId: pin.pinId, x: projected.x, y: projected.y };
  });
}

/** Largest screen-collision subgroup among `pins` at the given camera. */
export function maxCollisionGroupSizeForPins(
  pins: ReadonlyArray<PinLngLat>,
  camera: MapProjectionCamera,
  radiusPx: number = PIN_MARKER_COLLISION_RADIUS_PX,
): number {
  if (pins.length <= 1) return pins.length;
  const groups = groupPinIdsByScreenCollision(
    pinScreenPointsAtCamera(pins, camera),
    radiusPx,
  );
  let max = 1;
  for (const group of new Set(groups.values())) {
    if (group.length > max) max = group.length;
  }
  return max;
}

/** Share of pins that are not screen-colliding with any other pin in `pins`. */
export function singletonFractionForPins(
  pins: ReadonlyArray<PinLngLat>,
  camera: MapProjectionCamera,
  radiusPx: number = PIN_MARKER_COLLISION_RADIUS_PX,
): number {
  if (pins.length === 0) return 1;
  if (pins.length === 1) return 1;
  const groups = groupPinIdsByScreenCollision(
    pinScreenPointsAtCamera(pins, camera),
    radiusPx,
  );
  let singletons = 0;
  for (const pin of pins) {
    const group = groups.get(pin.pinId) ?? [pin.pinId];
    if (group.length === 1) singletons += 1;
  }
  return singletons / pins.length;
}

/**
 * Tune collision-click zoom in `pin-map-collisions.ts` (passed from `PinMap`).
 *
 * - Raise `targetSingletonFraction` to demand more pins unpacked before stopping.
 * - Raise `minZoomDelta` to avoid tiny zoom steps per click.
 * - Lower `minSingletonFractionGain` to accept smaller improvements when the
 *   target fraction is unreachable (e.g. a pair stuck on the same coordinates).
 * - Lower `maxSeparationZoom` to open the collision picker when pins are so
 *   close that separating them would require zooming past that level.
 */
export type CollisionGroupZoomTuning = {
  /** Desired share of pins that end up non-colliding (0–1). */
  targetSingletonFraction: number;
  /** Minimum zoom increase over the current level. */
  minZoomDelta: number;
  /** Binary-search / scan precision for zoom levels. */
  zoomPrecision: number;
  /**
   * When `targetSingletonFraction` is unreachable, minimum singleton-fraction
   * gain (0–1) over the current centroid view to still zoom.
   */
  minSingletonFractionGain: number;
  /**
   * Highest zoom the collision-click algorithm may target. When pins still
   * collide above this level, the picker opens instead of zooming further.
   */
  maxSeparationZoom: number;
};

export const DEFAULT_COLLISION_GROUP_ZOOM_TUNING: CollisionGroupZoomTuning = {
  targetSingletonFraction: 0.67,
  minZoomDelta: 0.25,
  zoomPrecision: 0.05,
  minSingletonFractionGain: 0.15,
  maxSeparationZoom: 20,
};

function cappedCollisionMaxZoom(
  maxZoom: number,
  tuning: CollisionGroupZoomTuning,
): number {
  return Math.min(maxZoom, tuning.maxSeparationZoom);
}

function geographicBounds(pins: ReadonlyArray<PinLngLat>) {
  let minLng = pins[0]!.lng;
  let maxLng = pins[0]!.lng;
  let minLat = pins[0]!.lat;
  let maxLat = pins[0]!.lat;
  for (const pin of pins) {
    minLng = Math.min(minLng, pin.lng);
    maxLng = Math.max(maxLng, pin.lng);
    minLat = Math.min(minLat, pin.lat);
    maxLat = Math.max(maxLat, pin.lat);
  }
  return {
    minLng,
    maxLng,
    minLat,
    maxLat,
    centerLng: (minLng + maxLng) / 2,
    centerLat: (minLat + maxLat) / 2,
    degenerate:
      Math.abs(maxLng - minLng) < 1e-9 && Math.abs(maxLat - minLat) < 1e-9,
  };
}

function maximumZoomFittingAllPins(
  pins: ReadonlyArray<PinLngLat>,
  centerLng: number,
  centerLat: number,
  width: number,
  height: number,
  padding: CollisionZoomPadding,
  maxZoom: number,
  zoomPrecision: number,
): number {
  const cameraBase = {
    centerLng,
    centerLat,
    width,
    height,
    panelPadding: padding.panelPadding,
  };
  const fits = (zoom: number) =>
    allPinsFitInViewport(
      pins,
      { ...cameraBase, zoom },
      padding.contentPaddingPx,
    );

  let lo = 0;
  let hi = maxZoom;
  let best = 0;
  while (hi - lo > zoomPrecision) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  while (best < maxZoom && fits(best + zoomPrecision)) {
    best += zoomPrecision;
  }
  return Math.min(best, maxZoom);
}

function minimumZoomSeparatingVisiblePins(
  pins: ReadonlyArray<PinLngLat>,
  centerLng: number,
  centerLat: number,
  width: number,
  height: number,
  padding: CollisionZoomPadding,
  currentZoom: number,
  maxZoom: number,
  zoomPrecision: number,
): number | null {
  const cameraBase = {
    centerLng,
    centerLat,
    width,
    height,
    panelPadding: padding.panelPadding,
  };
  const satisfies = (zoom: number) => {
    const camera = { ...cameraBase, zoom };
    return (
      !pinsCollideAtCamera(pins, camera) &&
      allPinsFitInViewport(pins, camera, padding.contentPaddingPx)
    );
  };

  if (!pinsCollideAtCamera(pins, { ...cameraBase, zoom: currentZoom })) {
    return null;
  }

  let found: number | null = null;
  for (
    let zoom = currentZoom + zoomPrecision;
    zoom <= maxZoom + zoomPrecision / 2;
    zoom += zoomPrecision
  ) {
    if (satisfies(zoom)) {
      found = zoom;
      break;
    }
  }
  if (found === null) return null;

  let lo = currentZoom;
  let hi = found;
  while (hi - lo > zoomPrecision) {
    const mid = (lo + hi) / 2;
    if (satisfies(mid)) hi = mid;
    else lo = mid;
  }
  return hi > currentZoom ? hi : null;
}

export type CollisionGroupZoomOptions = {
  pins: ReadonlyArray<PinLngLat>;
  width: number;
  height: number;
  /** Uniform margin inside the visible map (legacy). Prefer `contentPaddingPx`. */
  paddingPx?: number;
  /** MapLibre side-panel insets (blog, gallery, pin sheet). */
  panelPadding?: MapViewportPadding;
  /** Extra margin inside the visible map area on every side. */
  contentPaddingPx?: number;
  currentCenterLng: number;
  currentCenterLat: number;
  currentZoom: number;
  maxZoom: number;
  tuning?: CollisionGroupZoomTuning;
};

export type CollisionClickCamera = {
  centerLng: number;
  centerLat: number;
  zoom: number;
};

/** Above this count, skip singleton-fraction search (too slow for hover/click UI). */
export const LARGE_COLLISION_GROUP_PIN_COUNT = 64;

function resolveLargeCollisionGroupZoomTarget({
  pins,
  width,
  height,
  paddingPx,
  panelPadding,
  contentPaddingPx,
  currentZoom,
  maxZoom,
  tuning = DEFAULT_COLLISION_GROUP_ZOOM_TUNING,
}: CollisionGroupZoomOptions): CollisionClickCamera | null {
  const padding = resolveCollisionZoomPadding({
    paddingPx,
    panelPadding,
    contentPaddingPx,
  });
  const zoomCap = cappedCollisionMaxZoom(maxZoom, tuning);
  const centroid = collisionGroupCentroid(pins);
  const coarsePrecision = Math.max(tuning.zoomPrecision, 0.25);
  const currentAtCentroid: MapProjectionCamera = {
    centerLng: centroid.lng,
    centerLat: centroid.lat,
    zoom: currentZoom,
    width,
    height,
    panelPadding: padding.panelPadding,
  };
  const currentMaxSize = maxCollisionGroupSizeForPins(pins, currentAtCentroid);

  const separatedZoom = minimumZoomSeparatingVisiblePins(
    pins,
    centroid.lng,
    centroid.lat,
    width,
    height,
    padding,
    currentZoom,
    zoomCap,
    coarsePrecision,
  );
  if (separatedZoom !== null) {
    return {
      centerLng: centroid.lng,
      centerLat: centroid.lat,
      zoom: separatedZoom,
    };
  }

  const fitZoom = maximumZoomFittingAllPins(
    pins,
    centroid.lng,
    centroid.lat,
    width,
    height,
    padding,
    zoomCap,
    coarsePrecision,
  );
  if (fitZoom <= currentZoom + tuning.minZoomDelta) return null;

  const maxSize = maxCollisionGroupSizeForPins(pins, {
    ...currentAtCentroid,
    zoom: fitZoom,
  });
  if (maxSize >= currentMaxSize) return null;

  return {
    centerLng: centroid.lng,
    centerLat: centroid.lat,
    zoom: fitZoom,
  };
}

function maxZoomPassing(
  pins: ReadonlyArray<PinLngLat>,
  cameraBase: Omit<MapProjectionCamera, "zoom">,
  currentZoom: number,
  maxZoom: number,
  padding: CollisionZoomPadding,
  tuning: CollisionGroupZoomTuning,
  predicate: (camera: MapProjectionCamera) => boolean,
): number | null {
  const { minZoomDelta, zoomPrecision } = tuning;
  const minZoom = currentZoom + minZoomDelta;
  if (minZoom > maxZoom) return null;

  const passes = (zoom: number) =>
    predicate({ ...cameraBase, zoom }) &&
    allPinsFitInViewport(
      pins,
      { ...cameraBase, zoom },
      padding.contentPaddingPx,
    );

  let lo = minZoom;
  let hi = maxZoom;
  let best: number | null = null;

  while (hi - lo > zoomPrecision) {
    const mid = (lo + hi) / 2;
    if (passes(mid)) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  if (best === null) {
    for (
      let zoom = minZoom;
      zoom <= maxZoom + zoomPrecision / 2;
      zoom += zoomPrecision
    ) {
      if (passes(zoom)) {
        best = zoom;
        break;
      }
    }
  }

  while (best !== null && best < maxZoom && passes(best + zoomPrecision)) {
    best += zoomPrecision;
  }

  return best !== null && best > currentZoom + zoomPrecision / 2 ? best : null;
}

/**
 * Highest zoom (centered on the pin centroid) that unpacks most of the stack.
 * Returns `null` when no useful zoom-in remains — caller should open the picker.
 */
export function resolveCollisionGroupZoomTarget(
  options: CollisionGroupZoomOptions,
): CollisionClickCamera | null {
  const {
    pins,
    width,
    height,
    paddingPx,
    panelPadding,
    contentPaddingPx,
    currentCenterLng,
    currentCenterLat,
    currentZoom,
    maxZoom,
    tuning = DEFAULT_COLLISION_GROUP_ZOOM_TUNING,
  } = options;
  if (pins.length <= 1 || width <= 0 || height <= 0) return null;

  const padding = resolveCollisionZoomPadding({
    paddingPx,
    panelPadding,
    contentPaddingPx,
  });
  const zoomCap = cappedCollisionMaxZoom(maxZoom, tuning);

  const stillColliding = pinsCollideAtCamera(pins, {
    centerLng: currentCenterLng,
    centerLat: currentCenterLat,
    zoom: currentZoom,
    width,
    height,
    panelPadding: padding.panelPadding,
  });
  if (!stillColliding) return null;

  if (pins.length > LARGE_COLLISION_GROUP_PIN_COUNT) {
    return resolveLargeCollisionGroupZoomTarget(options);
  }

  const centroid = collisionGroupCentroid(pins);
  const cameraBase = {
    centerLng: centroid.lng,
    centerLat: centroid.lat,
    width,
    height,
    panelPadding: padding.panelPadding,
  };
  const currentAtCentroid: MapProjectionCamera = {
    ...cameraBase,
    zoom: currentZoom,
  };
  const currentFraction = singletonFractionForPins(pins, currentAtCentroid);
  const currentMaxSize = maxCollisionGroupSizeForPins(pins, currentAtCentroid);

  const targetZoom = maxZoomPassing(
    pins,
    cameraBase,
    currentZoom,
    zoomCap,
    padding,
    tuning,
    (camera) =>
      singletonFractionForPins(pins, camera) >= tuning.targetSingletonFraction,
  );
  if (targetZoom !== null) {
    return {
      centerLng: centroid.lng,
      centerLat: centroid.lat,
      zoom: targetZoom,
    };
  }

  const improvedZoom = maxZoomPassing(
    pins,
    cameraBase,
    currentZoom,
    zoomCap,
    padding,
    tuning,
    (camera) =>
      singletonFractionForPins(pins, camera) >=
      currentFraction + tuning.minSingletonFractionGain,
  );
  if (improvedZoom !== null) {
    return {
      centerLng: centroid.lng,
      centerLat: centroid.lat,
      zoom: improvedZoom,
    };
  }

  const reducedZoom = maxZoomPassing(
    pins,
    cameraBase,
    currentZoom,
    zoomCap,
    padding,
    tuning,
    (camera) => maxCollisionGroupSizeForPins(pins, camera) < currentMaxSize,
  );
  if (reducedZoom !== null) {
    return {
      centerLng: centroid.lng,
      centerLat: centroid.lat,
      zoom: reducedZoom,
    };
  }

  return null;
}

/**
 * Fast UI hint: identical coordinates cannot be separated by zoom alone.
 * Full separation is resolved on click via {@link canZoomCollisionGroup}.
 */
export function collisionGroupLikelyZoomable(
  pins: ReadonlyArray<PinLngLat>,
): boolean {
  if (pins.length <= 1) return false;
  const first = pins[0]!;
  return pins.some((pin) => pin.lng !== first.lng || pin.lat !== first.lat);
}

/** True when a collision click should zoom rather than open the pin picker. */
export function canZoomCollisionGroup(
  options: CollisionGroupZoomOptions,
): boolean {
  return resolveCollisionGroupZoomTarget(options) !== null;
}

export type ResolveCollisionClickCameraOptions = {
  pins: ReadonlyArray<PinLngLat>;
  width: number;
  height: number;
  paddingPx: number;
  currentCenterLng: number;
  currentCenterLat: number;
  currentZoom: number;
  maxZoom: number;
  zoomPrecision?: number;
};

/**
 * @deprecated Legacy fit/separate heuristic; collision clicks use
 * `resolveCollisionGroupZoomTarget` instead.
 */
export function resolveCollisionClickCamera({
  pins,
  width,
  height,
  paddingPx,
  currentCenterLng,
  currentCenterLat,
  currentZoom,
  maxZoom,
  zoomPrecision = 0.05,
}: ResolveCollisionClickCameraOptions): CollisionClickCamera | null {
  if (pins.length <= 1 || width <= 0 || height <= 0) return null;

  const currentCamera = {
    centerLng: currentCenterLng,
    centerLat: currentCenterLat,
    zoom: currentZoom,
    width,
    height,
  };
  const padding = resolveCollisionZoomPadding({ paddingPx });
  if (!pinsCollideAtCamera(pins, currentCamera)) return null;

  const bounds = geographicBounds(pins);
  const centroid = collisionGroupCentroid(pins);
  const candidates: CollisionClickCamera[] = [];

  const fitZoom = maximumZoomFittingAllPins(
    pins,
    bounds.centerLng,
    bounds.centerLat,
    width,
    height,
    padding,
    maxZoom,
    zoomPrecision,
  );
  if (fitZoom > currentZoom + zoomPrecision / 2) {
    candidates.push({
      centerLng: bounds.centerLng,
      centerLat: bounds.centerLat,
      zoom: fitZoom,
    });
  } else if (bounds.degenerate) {
    const bumpZoom = Math.min(currentZoom + 1, maxZoom);
    if (bumpZoom > currentZoom + zoomPrecision / 2) {
      candidates.push({
        centerLng: bounds.centerLng,
        centerLat: bounds.centerLat,
        zoom: bumpZoom,
      });
    }
  }

  const separateZoom = minimumZoomSeparatingVisiblePins(
    pins,
    centroid.lng,
    centroid.lat,
    width,
    height,
    padding,
    currentZoom,
    maxZoom,
    zoomPrecision,
  );
  if (separateZoom !== null) {
    candidates.push({
      centerLng: centroid.lng,
      centerLat: centroid.lat,
      zoom: separateZoom,
    });
  }

  if (candidates.length === 0) {
    if (pinsCollideAtCamera(pins, currentCamera)) {
      const bumpZoom = Math.min(currentZoom + 1, maxZoom);
      const camera = {
        centerLng: centroid.lng,
        centerLat: centroid.lat,
        zoom: bumpZoom,
        width,
        height,
      };
      if (
        bumpZoom > currentZoom + zoomPrecision / 2 &&
        allPinsFitInViewport(pins, camera, padding.contentPaddingPx)
      ) {
        return camera;
      }
    }
    return null;
  }

  return candidates.reduce((best, next) =>
    next.zoom < best.zoom ? next : best,
  );
}

export function collisionGroupCentroid(
  coords: ReadonlyArray<{ lng: number; lat: number }>,
): { lng: number; lat: number } {
  if (coords.length === 0) return { lng: 0, lat: 0 };
  let lng = 0;
  let lat = 0;
  for (const point of coords) {
    lng += point.lng;
    lat += point.lat;
  }
  return { lng: lng / coords.length, lat: lat / coords.length };
}

/** Pin whose marker is shown for a collision group. */
export function collisionRepresentativePinId(
  group: string[],
  selectedId: string | null,
  hoveredId: string | null,
): string {
  if (group.length === 0) return "";
  if (group.length === 1) return group[0]!;
  if (selectedId && group.includes(selectedId)) return selectedId;
  if (hoveredId && group.includes(hoveredId)) return hoveredId;
  return group[0]!;
}

export function buildCollisionLayout(
  points: PinGeoPoint[],
  selectedId: string | null,
  hoveredId: string | null,
): CollisionLayout {
  const groupByPinId = groupPinIdsByScreenCollision(points);
  const uniqueGroups = [...new Set(groupByPinId.values())];
  const pinById = new Map(points.map((point) => [point.pinId, point]));

  const representativeByPinId = new Map<string, string>();
  const centroidByRepresentativeId = new Map<
    string,
    { lng: number; lat: number }
  >();

  for (const group of uniqueGroups) {
    const representativeId = collisionRepresentativePinId(
      group,
      selectedId,
      hoveredId,
    );
    const coords = group
      .map((id) => pinById.get(id))
      .filter((point): point is PinGeoPoint => Boolean(point))
      .map((point) => ({ lng: point.lng, lat: point.lat }));
    centroidByRepresentativeId.set(
      representativeId,
      collisionGroupCentroid(coords),
    );
    for (const pinId of group) {
      representativeByPinId.set(pinId, representativeId);
    }
  }

  return {
    groupByPinId,
    representativeByPinId,
    centroidByRepresentativeId,
  };
}
