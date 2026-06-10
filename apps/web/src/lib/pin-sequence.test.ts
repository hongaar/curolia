import { describe, expect, it } from "vitest";

import type { PinWithTags } from "@/lib/pin-with-tags";
import {
  hasPinTravelSequence,
  orderedPinTravelSequence,
  pinSequenceNeighbors,
  toPinSequenceNavItems,
} from "./pin-sequence";

function pin(id: string, date: string | null, title?: string): PinWithTags {
  return {
    id,
    date,
    end_date: null,
    title: title ?? null,
    map_id: "map-1",
    lat: 0,
    lng: 0,
    created_at: "",
    updated_at: "",
    description: null,
    created_by_user_id: null,
    modified_by_user_id: null,
    geocode: null,
    location_label_detail: "city_country",
    slug: id,
  };
}

describe("orderedPinTravelSequence", () => {
  it("orders dated pins chronologically", () => {
    const sequence = orderedPinTravelSequence([
      pin("b", "2024-03-01"),
      pin("a", "2024-01-01"),
      pin("c", "2024-06-01"),
      pin("x", null),
    ]);
    expect(sequence.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
});

describe("hasPinTravelSequence", () => {
  it("requires at least two dated pins", () => {
    expect(hasPinTravelSequence([pin("a", "2024-01-01")])).toBe(false);
    expect(
      hasPinTravelSequence([pin("a", "2024-01-01"), pin("b", "2024-02-01")]),
    ).toBe(true);
  });
});

describe("pinSequenceNeighbors", () => {
  it("returns previous and next in sequence", () => {
    const sequence = orderedPinTravelSequence([
      pin("a", "2024-01-01", "First"),
      pin("b", "2024-02-01", "Second"),
      pin("c", "2024-03-01", "Third"),
    ]);
    expect(pinSequenceNeighbors(sequence, "b")).toEqual({
      index: 1,
      previous: sequence[0],
      next: sequence[2],
    });
  });
});

describe("toPinSequenceNavItems", () => {
  it("maps titles and colors", () => {
    const sequence = [
      {
        ...pin("a", "2024-01-01", "Alpha"),
        pin_tags: [
          {
            tag_id: "t1",
            tags: {
              id: "t1",
              name: "Food",
              color: "#ff0000",
              icon_emoji: "🍕",
            },
          },
        ],
      },
    ];
    expect(toPinSequenceNavItems(sequence)).toEqual([
      { id: "a", title: "Alpha", color: "#ff0000" },
    ]);
  });
});
