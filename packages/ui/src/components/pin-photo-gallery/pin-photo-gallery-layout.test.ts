import { describe, expect, it } from "vitest";

import {
  areaBalancedRowHeight,
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

  it("never leaves an interior row with fewer than three photos", () => {
    let seed = 1;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const aspects = [0.67, 0.75, 1.33, 1.5, 1.78];

    for (let trial = 0; trial < 2000; trial += 1) {
      const count = 4 + Math.floor(random() * 10);
      const items = Array.from({ length: count }, () => ({
        width: aspects[Math.floor(random() * aspects.length)]! * 100,
        height: 100,
      }));
      const width = 800 + Math.floor(random() * 900);
      const rows = computeRowsLayout(items, width, width / 5);
      for (const row of rows.slice(0, -1)) {
        expect(row.length).toBeGreaterThanOrEqual(3);
      }
    }
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

describe("computeRowsLayout interior rows", () => {
  // Storybook sample set: a square + 8:3 panorama form an interior two-photo row.
  const sample = [
    [800, 1200],
    [900, 600],
    [700, 900],
    [800, 500],
    [1000, 1000],
    [1600, 600],
    [600, 1400],
    [1200, 900],
    [1100, 750],
    [750, 1100],
    [1400, 400],
    [640, 960],
  ].map(([width, height]) => ({ width: width!, height: height! }));

  it("justifies every non-last row, even with fewer than three photos", () => {
    for (let width = 400; width <= 1800; width += 25) {
      const rows = computeRowsLayout(
        sample,
        width,
        targetRowHeightForWidth(width),
      );
      for (const row of rows.slice(0, -1)) {
        expect(pinPhotoGalleryRowWidth(row)).toBeCloseTo(width, 0);
      }
    }
  });

  it("justifies interior rows with panoramas across random galleries", () => {
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const aspects = [0.67, 0.75, 1, 1.33, 1.78, 2.67, 3.5];
    for (let trial = 0; trial < 1000; trial += 1) {
      const count = 2 + Math.floor(random() * 14);
      const items = Array.from({ length: count }, () => ({
        width: aspects[Math.floor(random() * aspects.length)]! * 100,
        height: 100,
      }));
      const width = 400 + Math.floor(random() * 1400);
      const rows = computeRowsLayout(
        items,
        width,
        targetRowHeightForWidth(width),
      );
      for (const row of rows.slice(0, -1)) {
        expect(pinPhotoGalleryRowWidth(row)).toBeCloseTo(width, 0);
      }
    }
  });
});

describe("areaBalancedRowHeight", () => {
  const target = 200;
  const repeat = (width: number, height: number, n = 12) =>
    Array.from({ length: n }, () => ({ width, height }));

  it("keeps the target height for 4:3 rows", () => {
    expect(areaBalancedRowHeight(repeat(1200, 900), target)).toBeCloseTo(
      target,
    );
  });

  it("makes portrait rows taller and landscape rows shorter", () => {
    expect(areaBalancedRowHeight(repeat(900, 1200), target)).toBeGreaterThan(
      target,
    );
    expect(areaBalancedRowHeight(repeat(1600, 900), target)).toBeLessThan(
      target,
    );
  });

  it("clamps extreme rows", () => {
    expect(areaBalancedRowHeight(repeat(100, 1000), target)).toBeCloseTo(
      target * 1.5,
    );
    expect(areaBalancedRowHeight(repeat(1000, 100), target)).toBeCloseTo(
      target * 0.8,
    );
  });

  it("returns the target for an empty row", () => {
    expect(areaBalancedRowHeight([], target)).toBe(target);
  });
});

describe("computeRowsLayout with balanceArea", () => {
  const landscapes = Array.from({ length: 8 }, () => ({
    width: 1600,
    height: 1000,
  }));
  const portraits = Array.from({ length: 12 }, () => ({
    width: 1000,
    height: 1500,
  }));
  const mixed = [...landscapes, ...portraits];
  const target = targetRowHeightForWidth(W);
  const isPortrait = (cell: { item: { width: number; height: number } }) =>
    cell.item.height > cell.item.width;

  /** Mean landscape area / mean portrait area within the gallery. */
  function areaRatio(rows: ReturnType<typeof computeRowsLayout>): number {
    const cells = rows.flat() as {
      item: { width: number; height: number };
      width: number;
      height: number;
    }[];
    const mean = (list: typeof cells) =>
      list.reduce((sum, c) => sum + c.width * c.height, 0) / list.length;
    return (
      mean(cells.filter((c) => !isPortrait(c))) /
      mean(cells.filter((c) => isPortrait(c)))
    );
  }

  it("gives portraits a surface much closer to landscapes in mixed galleries", () => {
    const plain = areaRatio(computeRowsLayout(mixed, W, target));
    const balanced = areaRatio(
      computeRowsLayout(mixed, W, target, { balanceArea: true }),
    );

    expect(plain).toBeGreaterThan(1.5);
    expect(balanced).toBeLessThan(1.45);
    expect(Math.log(balanced)).toBeLessThan(Math.log(plain) * 0.65);
  });

  it("puts fewer photos in portrait rows than without balancing", () => {
    const portraitRowSize = (rows: ReturnType<typeof computeRowsLayout>) =>
      Math.max(
        ...rows
          .slice(0, -1)
          .filter((r) => r.every(isPortrait))
          .map((r) => r.length),
      );
    const plain = computeRowsLayout(mixed, W, target);
    const balanced = computeRowsLayout(mixed, W, target, { balanceArea: true });
    expect(portraitRowSize(balanced)).toBeLessThan(portraitRowSize(plain));
  });

  it("still justifies every non-last row", () => {
    for (let width = 400; width <= 1800; width += 50) {
      const rows = computeRowsLayout(
        mixed,
        width,
        targetRowHeightForWidth(width),
        { balanceArea: true },
      );
      for (const row of rows.slice(0, -1)) {
        expect(pinPhotoGalleryRowWidth(row)).toBeCloseTo(width, 0);
      }
    }
  });

  it("leaves 4:3 galleries unchanged", () => {
    const items = Array.from({ length: 10 }, () => ({
      width: 1200,
      height: 900,
    }));
    expect(computeRowsLayout(items, W, target, { balanceArea: true })).toEqual(
      computeRowsLayout(items, W, target),
    );
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
