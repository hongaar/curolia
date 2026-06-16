import { describe, expect, it } from "vitest";

import { mixHomeFeedMaps, type HomeFeedMap } from "./home-feed";

function map(id: string): HomeFeedMap {
  return {
    id,
    name: id,
    slug: id,
    description: null,
    cover_url: null,
    icon_emoji: null,
    updated_at: "2026-01-01T00:00:00.000Z",
    visited_at: null,
    owner_profile_slug: "alex",
    owner_display_name: "Alex",
    owner_avatar_url: null,
    owner_gravatar_hash: null,
    pin_count: 1,
  };
}

describe("mixHomeFeedMaps", () => {
  it("interleaves followed and discover maps", () => {
    const followed = [map("a"), map("b")];
    const discover = [map("c"), map("d")];

    expect(mixHomeFeedMaps(followed, discover, 4).map((row) => row.id)).toEqual(
      ["a", "c", "b", "d"],
    );
  });

  it("deduplicates maps that appear in both lists", () => {
    const followed = [map("a"), map("shared")];
    const discover = [map("shared"), map("b")];

    expect(mixHomeFeedMaps(followed, discover, 4).map((row) => row.id)).toEqual(
      ["a", "shared", "b"],
    );
  });
});
