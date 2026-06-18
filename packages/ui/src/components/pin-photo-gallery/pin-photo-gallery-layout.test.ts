import { describe, expect, it } from "vitest";

import {
  computeRowsLayout,
  photoAspect,
  pinContentRowMargin,
  pinPhotoGalleryRowWidth,
  rowWidthAtHeight,
  targetRowHeightForBlogPanel,
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

  it("fills each full-width row to the container width", () => {
    const items = [
      { width: 1200, height: 800 },
      { width: 800, height: 1200 },
      { width: 1600, height: 900 },
      { width: 1000, height: 1000 },
      { width: 1400, height: 900 },
    ];
    const target = targetRowHeightForWidth(W);

    const rows = computeRowsLayout(items, W, target);
    for (const row of rows) {
      const width = pinPhotoGalleryRowWidth(row);
      if (width >= W - 1) {
        expect(width).toBeCloseTo(W, 0);
      } else {
        for (const cell of row) {
          expect(cell.height).toBeLessThanOrEqual(target + 1);
        }
      }
    }
  });

  it("caps sparse rows at the target height instead of stretching tall", () => {
    const items = [
      { width: 1600, height: 900 },
      { width: 1600, height: 900 },
    ];
    const target = targetRowHeightForWidth(W);

    const rows = computeRowsLayout(items, W, target);
    expect(rows).toHaveLength(1);
    expect(rows[0]![0]!.height).toBeLessThanOrEqual(target + 0.5);
    expect(pinPhotoGalleryRowWidth(rows[0]!)).toBeLessThan(W);
    expect(rowWidthAtHeight(items, target)).toBeCloseTo(
      pinPhotoGalleryRowWidth(rows[0]!),
      0,
    );
  });

  it("justifies multi-photo rows to full width in multi-row galleries", () => {
    const items = Array.from({ length: 14 }, () => ({
      width: 1600,
      height: 900,
    }));

    const rows = computeRowsLayout(items, W, targetRowHeightForWidth(W));
    expect(rows.length).toBeGreaterThan(1);

    for (const row of rows) {
      if (row.length >= 3) {
        expect(pinPhotoGalleryRowWidth(row)).toBeCloseTo(W, 0);
      }
    }
  });

  it("caps a single-row three-photo gallery at the target height", () => {
    const items = [
      { width: 900, height: 1600 },
      { width: 1600, height: 900 },
      { width: 1600, height: 900 },
    ];
    const container = 900;
    const target = targetRowHeightForBlogPanel(container);

    const rows = computeRowsLayout(items, container, target);
    expect(rows).toHaveLength(1);
    expect(rows[0]![0]!.height).toBeCloseTo(target, 0);
    expect(pinPhotoGalleryRowWidth(rows[0]!)).toBeLessThan(container);
  });

  it("matches capped height across two- and three-photo single-row galleries", () => {
    const container = 900;
    const target = targetRowHeightForBlogPanel(container);
    const two = computeRowsLayout(
      [
        { width: 1600, height: 900 },
        { width: 1600, height: 900 },
      ],
      container,
      target,
    );
    const three = computeRowsLayout(
      [
        { width: 900, height: 1600 },
        { width: 1600, height: 900 },
        { width: 1600, height: 900 },
      ],
      container,
      target,
    );

    expect(two[0]![0]!.height).toBeCloseTo(target, 0);
    expect(three[0]![0]!.height).toBeCloseTo(target, 0);
  });

  it("centers a capped row wider than pin content", () => {
    const container = 900;
    const target = targetRowHeightForBlogPanel(container);
    const items = [
      { width: 900, height: 1600 },
      { width: 1600, height: 900 },
      { width: 1600, height: 900 },
    ];
    const rows = computeRowsLayout(items, container, target);
    const rowWidth = pinPhotoGalleryRowWidth(rows[0]!);
    const contentMax = 640;
    expect(rowWidth).toBeGreaterThan(contentMax);
    expect(pinContentRowMargin(rowWidth, container, contentMax)).toEqual({
      marginInline: "auto",
    });
  });
});

describe("pinContentRowMargin", () => {
  const contentMax = 640;
  const container = 900;

  it("left-aligns rows narrower than pin content", () => {
    expect(pinContentRowMargin(400, container, contentMax)).toEqual({
      marginInlineStart: 130,
    });
  });

  it("centers rows wider than pin content but narrower than the container", () => {
    expect(pinContentRowMargin(700, container, contentMax)).toEqual({
      marginInline: "auto",
    });
  });

  it("uses full width for justified rows", () => {
    expect(pinContentRowMargin(container, container, contentMax)).toEqual({});
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
