import { describe, expect, it } from "vitest";

import { computeTripTimelinePositions } from "./trip-timeline-positions";

describe("computeTripTimelinePositions", () => {
  it("returns a single centered position for one item", () => {
    expect(computeTripTimelinePositions([{ date: "2025-06-01" }])).toEqual([
      50,
    ]);
  });

  it("spaces items evenly when all dates are equal", () => {
    expect(
      computeTripTimelinePositions([
        { date: "2025-06-01" },
        { date: "2025-06-01" },
        { date: "2025-06-01" },
      ]),
    ).toEqual([0, 50, 100]);
  });

  it("spaces items proportionally by date", () => {
    const positions = computeTripTimelinePositions([
      { date: "2025-06-01" },
      { date: "2025-06-11" },
      { date: "2025-06-21" },
    ]);
    expect(positions[0]).toBe(0);
    expect(positions[2]).toBe(100);
    expect(positions[1]).toBeCloseTo(50, 5);
  });
});
