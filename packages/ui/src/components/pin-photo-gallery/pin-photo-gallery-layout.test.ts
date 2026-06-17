import { describe, expect, it } from "vitest";

import {
  computeRowsLayout,
  photoAspect,
  targetRowHeightForWidth,
} from "./pin-photo-gallery-layout";

const W = 800;

function rowHeights(rows: ReturnType<typeof computeRowsLayout>): number[] {
  return rows.map((row) => row[0]?.height ?? 0);
}

describe("computeRowsLayout", () => {
  it("returns a single justified row for one photo", () => {
    const rows = computeRowsLayout(
      [{ width: 1600, height: 900 }],
      W,
      targetRowHeightForWidth(W),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]![0]!.width + rows[0]![0]!.height).toBeGreaterThan(0);
  });

  it("balances the last row so it is not much taller than earlier rows", () => {
    const items = [
      { width: 1600, height: 900 },
      { width: 1600, height: 900 },
      { width: 1600, height: 900 },
      { width: 1600, height: 900 },
      { width: 900, height: 1600 },
      { width: 1600, height: 900 },
      { width: 1600, height: 900 },
    ];

    const rows = computeRowsLayout(items, W, targetRowHeightForWidth(W));
    const heights = rowHeights(rows);
    const last = rows[rows.length - 1]!;

    expect(last.length).toBeGreaterThanOrEqual(3);
    expect(Math.max(...heights) / Math.min(...heights)).toBeLessThan(1.45);
  });

  it("keeps row heights within a narrow band when justified", () => {
    const items = Array.from({ length: 11 }, (_, i) => ({
      width: i % 3 === 0 ? 900 : 1600,
      height: i % 3 === 0 ? 1600 : 900,
    }));

    const rows = computeRowsLayout(items, W, targetRowHeightForWidth(W));
    const heights = rowHeights(rows);

    expect(rows.length).toBeGreaterThan(1);
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(80);
  });

  it("fills each row to the container width", () => {
    const items = [
      { width: 1200, height: 800 },
      { width: 800, height: 1200 },
      { width: 1600, height: 900 },
      { width: 1000, height: 1000 },
      { width: 1400, height: 900 },
    ];
    const gap = 12;

    const rows = computeRowsLayout(items, W, targetRowHeightForWidth(W));
    for (const row of rows) {
      const width =
        row.reduce((sum, cell) => sum + cell.width, 0) + gap * (row.length - 1);
      expect(width).toBeCloseTo(W, 0);
    }
  });
});

describe("photoAspect", () => {
  it("defaults missing dimensions to 4:3", () => {
    expect(photoAspect({})).toBeCloseTo(4 / 3);
  });
});

describe("targetRowHeightForWidth", () => {
  it("uses taller rows on phone-width containers", () => {
    expect(targetRowHeightForWidth(375)).toBeCloseTo(150);
  });
});
