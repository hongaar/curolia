import { describe, expect, it } from "vitest";

import {
  tripTimelineActiveRingColor,
  tripTimelineDimmedColor,
  tripTimelineSoftColor,
} from "./trip-timeline-colors";

describe("tripTimelineSoftColor", () => {
  it("mixes tag color with card instead of muted gray", () => {
    expect(tripTimelineSoftColor("#c45c26", 55)).toBe(
      "color-mix(in oklch, #c45c26 55%, var(--card))",
    );
  });
});

describe("tripTimelineDimmedColor", () => {
  it("keeps a majority of tag hue for inactive dots", () => {
    expect(tripTimelineDimmedColor("#c45c26")).toBe(
      "color-mix(in oklch, #c45c26 55%, var(--card))",
    );
  });
});

describe("tripTimelineActiveRingColor", () => {
  it("uses a softer mix than inactive dots", () => {
    expect(tripTimelineActiveRingColor("#c45c26")).toBe(
      "color-mix(in oklch, #c45c26 40%, var(--card))",
    );
  });
});
