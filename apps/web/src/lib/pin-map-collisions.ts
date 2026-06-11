/** Half of map marker face (`--control-h-md` / 2). Centers within this distance collide. */
export const PIN_MARKER_COLLISION_RADIUS_PX = 18;

export type PinScreenPoint = {
  pinId: string;
  x: number;
  y: number;
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
