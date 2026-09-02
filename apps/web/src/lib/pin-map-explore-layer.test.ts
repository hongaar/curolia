import { describe, expect, it } from "vitest";

import type { ExplorePlaceResultEntry } from "@curolia/plugin-contract";

import {
  EMPTY_EXPLORE_LAYER,
  exploreLayerFingerprint,
} from "./pin-map-explore-layer";

function place(id: string, lng = 4.9, lat = 52.3): ExplorePlaceResultEntry {
  return {
    id,
    title: id,
    categoryId: "coffee",
    featureKind: "place",
    filterValues: {},
    geometry: { kind: "point", lng, lat },
  };
}

describe("exploreLayerFingerprint", () => {
  it("is stable for empty layers regardless of selectedEntryId null vs omitted", () => {
    expect(exploreLayerFingerprint(EMPTY_EXPLORE_LAYER)).toBe("empty:");
    expect(exploreLayerFingerprint({ entries: [] })).toBe("empty:");
  });

  it("changes when selection or geometry changes", () => {
    const a = exploreLayerFingerprint({
      entries: [place("a")],
      selectedEntryId: null,
    });
    const selected = exploreLayerFingerprint({
      entries: [place("a")],
      selectedEntryId: "a",
    });
    const moved = exploreLayerFingerprint({
      entries: [place("a", 5, 52)],
      selectedEntryId: null,
    });
    expect(a).not.toBe(selected);
    expect(a).not.toBe(moved);
  });
});
