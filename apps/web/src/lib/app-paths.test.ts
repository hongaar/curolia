import { mapViewHrefWithSearch, mapViewSwitchHref } from "@/lib/app-paths";
import { describe, expect, it } from "vitest";

const route = { profileSlug: "joram", mapSlug: "trip" };

describe("mapViewSwitchHref", () => {
  it("keeps tag filters and drops the pin hash when switching views", () => {
    expect(mapViewSwitchHref("gallery", route, "?tags=a")).toBe(
      "/joram/trip/gallery?tags=a",
    );
    expect(mapViewSwitchHref("blog", route, "?filter=food")).toBe(
      "/joram/trip/blog?filter=food",
    );
  });

  it("drops camera, selected-pin query params, and the pin hash", () => {
    expect(
      mapViewSwitchHref("blog", route, "?lat=1&lng=2&zoom=10&pin=cafe"),
    ).toBe("/joram/trip/blog");
  });
});

describe("mapViewHrefWithSearch", () => {
  it("appends a pin hash after query params", () => {
    expect(
      mapViewHrefWithSearch("blog", route, "?lat=1&lng=2&zoom=10", "#cafe"),
    ).toBe("/joram/trip/blog?lat=1&lng=2&zoom=10#cafe");
  });
});
