import { describe, expect, it } from "vitest";

import {
  tripTimelineActiveRingColor,
  tripTimelineDimmedColor,
} from "./trip-timeline-colors";

describe("tripTimelineDimmedColor", () => {
  it("mixes with a solid surface color instead of transparent", () => {
    expect(tripTimelineDimmedColor("#c45c26")).toBe(
      "color-mix(in oklch, #c45c26 42%, var(--muted))",
    );
  });
});

describe("tripTimelineActiveRingColor", () => {
  it("mixes tag color with card for a solid ring", () => {
    expect(tripTimelineActiveRingColor("#c45c26")).toBe(
      "color-mix(in oklch, #c45c26 28%, var(--card))",
    );
  });
});
