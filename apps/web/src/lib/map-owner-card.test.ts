import { describe, expect, it } from "vitest";

import type { MapWithOwnerSlug } from "@/lib/app-paths";
import { shouldShowMapOwnerCard } from "@/lib/map-owner-card";

const otherUsersMap = {
  id: "map-1",
  created_by_user_id: "owner-1",
} as MapWithOwnerSlug;

describe("shouldShowMapOwnerCard", () => {
  it("shows for anonymous public map views", () => {
    expect(
      shouldShowMapOwnerCard({
        publicView: true,
        activeMap: otherUsersMap,
        userId: undefined,
      }),
    ).toBe(true);
  });

  it("shows when a signed-in user views another user's map", () => {
    expect(
      shouldShowMapOwnerCard({
        publicView: false,
        activeMap: otherUsersMap,
        userId: "viewer-1",
      }),
    ).toBe(true);
  });

  it("hides on the signed-in user's own map", () => {
    expect(
      shouldShowMapOwnerCard({
        publicView: false,
        activeMap: otherUsersMap,
        userId: "owner-1",
      }),
    ).toBe(false);
  });
});
