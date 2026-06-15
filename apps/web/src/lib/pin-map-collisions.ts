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
};

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
  return {
    x: camera.width / 2 + (x - centerX),
    y: camera.height / 2 + (y - centerY),
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
  paddingPx: number,
): boolean {
  const { width, height } = camera;
  if (width <= 0 || height <= 0) return false;
  if (width - 2 * paddingPx <= 0 || height - 2 * paddingPx <= 0) return false;

  for (const pin of pins) {
    const { x, y } = projectLngLatAtCamera(pin.lng, pin.lat, camera);
    if (
      x < paddingPx ||
      x > width - paddingPx ||
      y < paddingPx ||
      y > height - paddingPx
    ) {
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
  paddingPx: number,
  maxZoom: number,
  zoomPrecision: number,
): number {
  const cameraBase = { centerLng, centerLat, width, height };
  const fits = (zoom: number) =>
    allPinsFitInViewport(pins, { ...cameraBase, zoom }, paddingPx);

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
  paddingPx: number,
  currentZoom: number,
  maxZoom: number,
  zoomPrecision: number,
): number | null {
  const cameraBase = { centerLng, centerLat, width, height };
  const satisfies = (zoom: number) => {
    const camera = { ...cameraBase, zoom };
    return (
      !pinsCollideAtCamera(pins, camera) &&
      allPinsFitInViewport(pins, camera, paddingPx)
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
  paddingPx: number;
  currentCenterLng: number;
  currentCenterLat: number;
  currentZoom: number;
  maxZoom: number;
  zoomPrecision?: number;
};

/**
 * Lowest zoom above `currentZoom` where the largest screen-collision subgroup
 * among `pins` shrinks while every pin stays in the viewport.
 */
export function minimumZoomToReduceCollisionGroup({
  pins,
  width,
  height,
  paddingPx,
  currentCenterLng,
  currentCenterLat,
  currentZoom,
  maxZoom,
  zoomPrecision = 0.05,
}: CollisionGroupZoomOptions): CollisionClickCamera | null {
  if (pins.length <= 1 || width <= 0 || height <= 0) return null;

  const cameraBase = {
    centerLng: currentCenterLng,
    centerLat: currentCenterLat,
    width,
    height,
  };
  const currentCamera = { ...cameraBase, zoom: currentZoom };
  const currentMaxSize = maxCollisionGroupSizeForPins(pins, currentCamera);
  if (currentMaxSize <= 1) return null;

  const reducesAtZoom = (zoom: number) => {
    const camera = { ...cameraBase, zoom };
    return (
      allPinsFitInViewport(pins, camera, paddingPx) &&
      maxCollisionGroupSizeForPins(pins, camera) < currentMaxSize
    );
  };

  let found: number | null = null;
  for (
    let zoom = currentZoom + zoomPrecision;
    zoom <= maxZoom + zoomPrecision / 2;
    zoom += zoomPrecision
  ) {
    if (reducesAtZoom(zoom)) {
      found = zoom;
      break;
    }
  }
  if (found === null) return null;

  let lo = currentZoom;
  let hi = found;
  while (hi - lo > zoomPrecision) {
    const mid = (lo + hi) / 2;
    if (reducesAtZoom(mid)) hi = mid;
    else lo = mid;
  }
  if (hi <= currentZoom + zoomPrecision / 2) return null;

  return {
    centerLng: currentCenterLng,
    centerLat: currentCenterLat,
    zoom: hi,
  };
}

/** True when zooming in can split a mixed collision stack before opening a picker. */
export function canZoomToReduceCollisionGroup(
  options: CollisionGroupZoomOptions,
): boolean {
  return minimumZoomToReduceCollisionGroup(options) !== null;
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
  /** Stop zoom search when the bracket is narrower than this. */
  zoomPrecision?: number;
};

export type CollisionClickCamera = {
  centerLng: number;
  centerLat: number;
  zoom: number;
};

/**
 * Pick the least aggressive zoom-in (lowest target zoom above `currentZoom`)
 * that either frames every pin in the viewport (collisions allowed) or
 * separates them while keeping them on screen.
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
    paddingPx,
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
    paddingPx,
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
        allPinsFitInViewport(pins, camera, paddingPx)
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
