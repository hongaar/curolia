import {
  isPinDetailPagePathname,
  locationHref,
  pinDetailBackLabel,
  pinDetailBackTarget,
} from "@/lib/pin-detail-back";
import { describe, expect, it } from "vitest";

describe("isPinDetailPagePathname", () => {
  it("matches pin detail but not pin edit", () => {
    expect(isPinDetailPagePathname("/joram/trip/pin/cafe")).toBe(true);
    expect(isPinDetailPagePathname("/joram/trip/pin/cafe/")).toBe(true);
    expect(isPinDetailPagePathname("/joram/trip/pin/cafe/edit")).toBe(false);
  });
});

describe("pinDetailBackTarget", () => {
  it("returns map href and label from frozen map location", () => {
    expect(
      pinDetailBackTarget({
        pathname: "/joram/trip/map",
        search: "?lat=1&lng=2&zoom=10",
        hash: "",
      }),
    ).toEqual({
      href: "/joram/trip/map?lat=1&lng=2&zoom=10",
      label: "Back to map",
      view: "map",
    });
  });

  it("returns blog href and label from frozen blog location", () => {
    expect(
      pinDetailBackTarget({
        pathname: "/joram/trip/blog",
        search: "?tags=a",
        hash: "#pin-1",
      }),
    ).toEqual({
      href: "/joram/trip/blog?tags=a#pin-1",
      label: "Back to blog",
      view: "blog",
    });
  });

  it("returns null for non-base pathnames", () => {
    expect(
      pinDetailBackTarget({
        pathname: "/settings",
        search: "",
        hash: "",
      }),
    ).toBeNull();
  });
});

describe("locationHref", () => {
  it("joins pathname, search, and hash", () => {
    expect(
      locationHref({
        pathname: "/a/b/map",
        search: "?x=1",
        hash: "#y",
      }),
    ).toBe("/a/b/map?x=1#y");
  });
});

describe("pinDetailBackLabel", () => {
  it("maps view segments to labels", () => {
    expect(pinDetailBackLabel("map")).toBe("Back to map");
    expect(pinDetailBackLabel("blog")).toBe("Back to blog");
  });
});
