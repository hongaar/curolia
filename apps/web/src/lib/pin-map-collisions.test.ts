import { describe, expect, it } from "vitest";
import {
  buildCollisionLayout,
  collisionGroupCentroid,
  collisionRepresentativePinId,
  groupPinIdsByScreenCollision,
  PIN_MARKER_COLLISION_RADIUS_PX,
  type PinGeoPoint,
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
