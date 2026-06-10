import type { MapWithOwnerSlug } from "@/lib/app-paths";
import { describe, expect, it } from "vitest";
import { parseSelectedPinLookup } from "./global-search-selected-pin";

const maps = [
  {
    id: "map-1",
    slug: "trip",
    owner_profile_slug: "me",
    name: "Trip",
  },
] as unknown as MapWithOwnerSlug[];

describe("parseSelectedPinLookup", () => {
  it("reads pin from map query param", () => {
    expect(
      parseSelectedPinLookup("/me/trip/map", "?pin=cafe", [...maps], maps[0]),
    ).toEqual({
      mapId: "map-1",
      mapRoute: { profileSlug: "me", mapSlug: "trip" },
      pinToken: "cafe",
    });
  });

  it("reads pin from pin detail route", () => {
    expect(
      parseSelectedPinLookup("/me/trip/pin/cafe", "", [...maps], maps[0]),
    ).toEqual({
      mapId: "map-1",
      mapRoute: { profileSlug: "me", mapSlug: "trip" },
      pinToken: "cafe",
    });
  });
});
