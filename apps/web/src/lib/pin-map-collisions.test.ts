import { describe, expect, it } from "vitest";
import {
  allPinsFitInViewport,
  buildCollisionLayout,
  canZoomCollisionGroup,
  collisionGroupCentroid,
  collisionGroupLikelyZoomable,
  collisionRepresentativePinId,
  DEFAULT_COLLISION_GROUP_ZOOM_TUNING,
  groupPinIdsByScreenCollision,
  maxCollisionGroupSizeForPins,
  PIN_MARKER_COLLISION_RADIUS_PX,
  pinsCollideAtCamera,
  projectLngLatAtCamera,
  resolveCollisionClickCamera,
  resolveCollisionGroupZoomTarget,
  singletonFractionForPins,
  type PinGeoPoint,
  type PinLngLat,
  type PinScreenPoint,
} from "./pin-map-collisions";

describe("groupPinIdsByScreenCollision", () => {
  it("maps each pin to a singleton when markers are far apart", () => {
    const points: PinScreenPoint[] = [
      { pinId: "a", x: 0, y: 0 },
      { pinId: "b", x: 100, y: 0 },
    ];
    const groups = groupPinIdsByScreenCollision(points);
    expect(groups.get("a")).toEqual(["a"]);
    expect(groups.get("b")).toEqual(["b"]);
  });

  it("groups pins at the same screen position", () => {
    const points: PinScreenPoint[] = [
      { pinId: "b", x: 10, y: 10 },
      { pinId: "a", x: 10, y: 10 },
    ];
    const groups = groupPinIdsByScreenCollision(points);
    expect(groups.get("a")).toEqual(["a", "b"]);
    expect(groups.get("b")).toEqual(["a", "b"]);
  });

  it("groups pins within the collision radius transitively", () => {
    const r = PIN_MARKER_COLLISION_RADIUS_PX;
    const points: PinScreenPoint[] = [
      { pinId: "a", x: 0, y: 0 },
      { pinId: "b", x: r - 2, y: 0 },
      { pinId: "c", x: 2 * (r - 2), y: 0 },
    ];
    const groups = groupPinIdsByScreenCollision(points);
    expect(groups.get("a")).toEqual(["a", "b", "c"]);
    expect(groups.get("c")).toEqual(["a", "b", "c"]);
  });

  it("does not group pins just outside the collision radius", () => {
    const r = PIN_MARKER_COLLISION_RADIUS_PX;
    const points: PinScreenPoint[] = [
      { pinId: "a", x: 0, y: 0 },
      { pinId: "b", x: r + 4, y: 0 },
    ];
    const groups = groupPinIdsByScreenCollision(points);
    expect(groups.get("a")).toEqual(["a"]);
    expect(groups.get("b")).toEqual(["b"]);
  });
});

describe("collisionGroupCentroid", () => {
  it("averages coordinates", () => {
    expect(
      collisionGroupCentroid([
        { lng: 0, lat: 0 },
        { lng: 2, lat: 4 },
      ]),
    ).toEqual({ lng: 1, lat: 2 });
  });
});

describe("collisionRepresentativePinId", () => {
  const group = ["a", "b", "c"];

  it("prefers the selected pin in the group", () => {
    expect(collisionRepresentativePinId(group, "b", null)).toBe("b");
  });

  it("prefers the hovered pin when none is selected", () => {
    expect(collisionRepresentativePinId(group, null, "c")).toBe("c");
  });

  it("falls back to the first sorted id", () => {
    expect(collisionRepresentativePinId(group, null, null)).toBe("a");
  });
});

describe("buildCollisionLayout", () => {
  it("maps every pin to one representative and centroid", () => {
    const points: PinGeoPoint[] = [
      { pinId: "a", lng: 0, lat: 0, x: 0, y: 0 },
      { pinId: "b", lng: 2, lat: 4, x: 0, y: 0 },
    ];
    const layout = buildCollisionLayout(points, null, null);
    expect(layout.representativeByPinId.get("a")).toBe("a");
    expect(layout.representativeByPinId.get("b")).toBe("a");
    expect(layout.centroidByRepresentativeId.get("a")).toEqual({
      lng: 1,
      lat: 2,
    });
  });
});

describe("resolveCollisionClickCamera", () => {
  const viewport = {
    width: 800,
    height: 600,
    maxZoom: 20,
    paddingPx: 48,
    currentCenterLng: 4.9,
    currentCenterLat: 52.37,
  };

  function pinsAt(deltaLng: number, deltaLat = 0): PinLngLat[] {
    const baseLng = 4.9;
    const baseLat = 52.37;
    return [
      { pinId: "a", lng: baseLng, lat: baseLat },
      { pinId: "b", lng: baseLng + deltaLng, lat: baseLat + deltaLat },
    ];
  }

  it("returns null for a single pin", () => {
    const pin = pinsAt(0)[0]!;
    expect(
      resolveCollisionClickCamera({
        pins: [pin],
        currentZoom: 10,
        ...viewport,
      }),
    ).toBeNull();
  });

  it("returns null when pins already separate at the current zoom", () => {
    const pins = pinsAt(0.05);
    expect(
      resolveCollisionClickCamera({
        pins,
        currentZoom: 8,
        ...viewport,
      }),
    ).toBeNull();
  });

  it("zooms in for identical coordinates via the fit fallback", () => {
    const pins = pinsAt(0);
    const currentZoom = 10;
    const target = resolveCollisionClickCamera({
      pins,
      currentZoom,
      ...viewport,
    });

    expect(target).not.toBeNull();
    expect(target!.zoom).toBeGreaterThan(currentZoom);
    expect(
      allPinsFitInViewport(
        pins,
        {
          centerLng: target!.centerLng,
          centerLat: target!.centerLat,
          zoom: target!.zoom,
          width: viewport.width,
          height: viewport.height,
        },
        viewport.paddingPx,
      ),
    ).toBe(true);
  });

  it("prefers separation when it needs less zoom than fit", () => {
    const pins = pinsAt(0.00012);
    const currentZoom = 10;
    const target = resolveCollisionClickCamera({
      pins,
      currentZoom,
      ...viewport,
    });

    expect(target).not.toBeNull();
    expect(target!.zoom).toBeGreaterThan(currentZoom);
    expect(
      pinsCollideAtCamera(pins, {
        centerLng: target!.centerLng,
        centerLat: target!.centerLat,
        zoom: target!.zoom,
        width: viewport.width,
        height: viewport.height,
      }),
    ).toBe(false);
    expect(
      allPinsFitInViewport(
        pins,
        {
          centerLng: target!.centerLng,
          centerLat: target!.centerLat,
          zoom: target!.zoom,
          width: viewport.width,
          height: viewport.height,
        },
        viewport.paddingPx,
      ),
    ).toBe(true);
  });

  it("can frame spread pins even when separation is impossible", () => {
    const pins: PinLngLat[] = [
      { pinId: "a", lng: 4.9, lat: 52.37 },
      { pinId: "b", lng: 4.92, lat: 52.39 },
      { pinId: "c", lng: 4.88, lat: 52.35 },
    ];
    const currentZoom = 8;
    const target = resolveCollisionClickCamera({
      pins,
      currentZoom,
      ...viewport,
    });

    expect(target).not.toBeNull();
    expect(target!.zoom).toBeGreaterThan(currentZoom);
    expect(
      allPinsFitInViewport(
        pins,
        {
          centerLng: target!.centerLng,
          centerLat: target!.centerLat,
          zoom: target!.zoom,
          width: viewport.width,
          height: viewport.height,
        },
        viewport.paddingPx,
      ),
    ).toBe(true);
  });

  it("projects lng/lat relative to the map center", () => {
    const center = projectLngLatAtCamera(0, 0, {
      centerLng: 0,
      centerLat: 0,
      zoom: 10,
      width: 800,
      height: 600,
    });
    expect(center).toEqual({ x: 400, y: 300 });
  });

  it("projects lng/lat relative to the padded visible map center", () => {
    const center = projectLngLatAtCamera(0, 0, {
      centerLng: 0,
      centerLat: 0,
      zoom: 10,
      width: 800,
      height: 600,
      panelPadding: { top: 0, right: 400, bottom: 0, left: 0 },
    });
    expect(center.x).toBeCloseTo(200, 0);
    expect(center.y).toBeCloseTo(300, 0);
  });
});

describe("resolveCollisionGroupZoomTarget", () => {
  const viewport = {
    width: 800,
    height: 600,
    maxZoom: 20,
    paddingPx: 48,
    currentCenterLng: 4.9,
    currentCenterLat: 52.37,
  };

  const tuning = {
    ...DEFAULT_COLLISION_GROUP_ZOOM_TUNING,
    minZoomDelta: 0.05,
  };

  function pinsAt(deltaLng: number): PinLngLat[] {
    const baseLng = 4.9;
    const baseLat = 52.37;
    return [
      { pinId: "a", lng: baseLng, lat: baseLat },
      { pinId: "b", lng: baseLng + deltaLng, lat: baseLat },
    ];
  }

  it("returns null when every pin in the group is inseparable", () => {
    expect(
      resolveCollisionGroupZoomTarget({
        pins: pinsAt(0),
        currentZoom: 10,
        tuning,
        ...viewport,
      }),
    ).toBeNull();
    expect(
      canZoomCollisionGroup({
        pins: pinsAt(0),
        currentZoom: 10,
        tuning,
        ...viewport,
      }),
    ).toBe(false);
  });

  it("centers on the pin centroid", () => {
    const pins = pinsAt(0.00012);
    const centroid = collisionGroupCentroid(pins);
    const target = resolveCollisionGroupZoomTarget({
      pins,
      currentZoom: 10,
      tuning,
      ...viewport,
    });
    expect(target).not.toBeNull();
    expect(target!.centerLng).toBeCloseTo(centroid.lng, 8);
    expect(target!.centerLat).toBeCloseTo(centroid.lat, 8);
  });

  it("zooms in aggressively for a separable pair", () => {
    const pins = pinsAt(0.00012);
    const currentZoom = 10;
    const target = resolveCollisionGroupZoomTarget({
      pins,
      currentZoom,
      tuning,
      ...viewport,
    });

    expect(target).not.toBeNull();
    expect(target!.zoom).toBeGreaterThan(currentZoom + 1);
    expect(
      singletonFractionForPins(pins, {
        centerLng: target!.centerLng,
        centerLat: target!.centerLat,
        zoom: target!.zoom,
        width: viewport.width,
        height: viewport.height,
      }),
    ).toBe(1);
  });

  it("returns true when a nearby pin can peel off a tight cluster", () => {
    const pins: PinLngLat[] = [
      { pinId: "a", lng: 4.9, lat: 52.37 },
      { pinId: "b", lng: 4.9, lat: 52.37 },
      { pinId: "c", lng: 4.90012, lat: 52.37 },
    ];
    expect(
      canZoomCollisionGroup({
        pins,
        currentZoom: 10,
        tuning,
        ...viewport,
      }),
    ).toBe(true);
  });

  it("tracks the largest on-screen collision subgroup", () => {
    const pins: PinLngLat[] = [
      { pinId: "a", lng: 4.9, lat: 52.37 },
      { pinId: "b", lng: 4.9, lat: 52.37 },
      { pinId: "c", lng: 4.90012, lat: 52.37 },
    ];
    expect(
      maxCollisionGroupSizeForPins(pins, {
        centerLng: 4.9,
        centerLat: 52.37,
        zoom: 10,
        width: viewport.width,
        height: viewport.height,
      }),
    ).toBe(3);
  });

  it("opens the picker when separation needs zoom past maxSeparationZoom", () => {
    const pins = pinsAt(0.00012);
    const tightCapTuning = {
      ...tuning,
      maxSeparationZoom: 11,
    };
    expect(
      resolveCollisionGroupZoomTarget({
        pins,
        currentZoom: 10,
        tuning: tightCapTuning,
        ...viewport,
      }),
    ).toBeNull();
    expect(
      canZoomCollisionGroup({
        pins,
        currentZoom: 10,
        tuning: tightCapTuning,
        ...viewport,
      }),
    ).toBe(false);
  });

  it("still zooms when separation fits within maxSeparationZoom", () => {
    const pins = pinsAt(0.00012);
    const looseCapTuning = {
      ...tuning,
      maxSeparationZoom: 20,
    };
    expect(
      resolveCollisionGroupZoomTarget({
        pins,
        currentZoom: 10,
        tuning: looseCapTuning,
        ...viewport,
      }),
    ).not.toBeNull();
  });

  it("keeps separated pins inside the visible map area when a side sheet is open", () => {
    const pins = pinsAt(0.00012);
    const panelPadding = { top: 0, right: 400, bottom: 0, left: 0 };
    const target = resolveCollisionGroupZoomTarget({
      pins,
      currentZoom: 10,
      tuning,
      width: 800,
      height: 600,
      maxZoom: 20,
      contentPaddingPx: 48,
      panelPadding,
      currentCenterLng: 4.9,
      currentCenterLat: 52.37,
    });

    expect(target).not.toBeNull();
    expect(
      allPinsFitInViewport(
        pins,
        {
          centerLng: target!.centerLng,
          centerLat: target!.centerLat,
          zoom: target!.zoom,
          width: 800,
          height: 600,
          panelPadding,
        },
        48,
      ),
    ).toBe(true);
    for (const pin of pins) {
      const { x } = projectLngLatAtCamera(pin.lng, pin.lat, {
        centerLng: target!.centerLng,
        centerLat: target!.centerLat,
        zoom: target!.zoom,
        width: 800,
        height: 600,
        panelPadding,
      });
      expect(x).toBeLessThan(800 - 400 - 48);
      expect(x).toBeGreaterThan(48);
    }
  });
});

describe("collisionGroupLikelyZoomable", () => {
  it("returns false for a single pin", () => {
    expect(collisionGroupLikelyZoomable([{ pinId: "a", lng: 1, lat: 2 }])).toBe(
      false,
    );
  });

  it("returns false when all pins share identical coordinates", () => {
    expect(
      collisionGroupLikelyZoomable([
        { pinId: "a", lng: 4.9, lat: 52.37 },
        { pinId: "b", lng: 4.9, lat: 52.37 },
      ]),
    ).toBe(false);
  });

  it("returns true when pins have distinct coordinates", () => {
    expect(
      collisionGroupLikelyZoomable([
        { pinId: "a", lng: 4.9, lat: 52.37 },
        { pinId: "b", lng: 4.901, lat: 52.371 },
      ]),
    ).toBe(true);
  });
});
