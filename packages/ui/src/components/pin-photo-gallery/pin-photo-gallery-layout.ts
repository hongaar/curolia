const DEFAULT_ASPECT = 4 / 3;

export type PinPhotoGalleryLayoutItem = {
  width?: number;
  height?: number;
};
const GAP_PX = 12;

export function photoAspect(item: PinPhotoGalleryLayoutItem): number {
  if (item.width != null && item.height != null && item.height > 0) {
    return item.width / item.height;
  }
  return DEFAULT_ASPECT;
}

/** Fixed-height strip thumb with natural aspect ratio (defaults to 4:3). */
export function stripThumbSize(
  item: PinPhotoGalleryLayoutItem,
  thumbHeight: number,
): { width: number; height: number } {
  const aspect = photoAspect(item);
  return {
    width: Math.round(thumbHeight * aspect),
    height: thumbHeight,
  };
}

export type SizedGalleryItem<T extends PinPhotoGalleryLayoutItem> = {
  item: T;
  width: number;
  height: number;
};

function aspectSum<T extends PinPhotoGalleryLayoutItem>(items: T[]): number {
  return items.reduce((sum, item) => sum + photoAspect(item), 0);
}

function aspectSumForHeight(
  containerWidth: number,
  count: number,
  rowHeight: number,
): number {
  return (containerWidth - GAP_PX * Math.max(0, count - 1)) / rowHeight;
}

function rowHeightAtWidth<T extends PinPhotoGalleryLayoutItem>(
  photos: T[],
  containerWidth: number,
): number {
  if (photos.length === 0) return 0;
  const gaps = GAP_PX * (photos.length - 1);
  const sumAspect = aspectSum(photos);
  return (containerWidth - gaps) / sumAspect;
}

function sizeRow<T extends PinPhotoGalleryLayoutItem>(
  photos: T[],
  containerWidth: number,
): SizedGalleryItem<T>[] {
  const height = rowHeightAtWidth(photos, containerWidth);
  return photos.map((item) => {
    const aspect = photoAspect(item);
    return { item, width: aspect * height, height };
  });
}

function partitionRowsForHeight<T extends PinPhotoGalleryLayoutItem>(
  items: T[],
  containerWidth: number,
  rowHeight: number,
): T[][] {
  const rows: T[][] = [];
  let row: T[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]!;
    row.push(item);
    const remaining = items.length - index - 1;
    const needed = aspectSumForHeight(containerWidth, row.length, rowHeight);
    const fullEnough = aspectSum(row) >= needed;

    if (!fullEnough) continue;

    // Avoid closing early when that would orphan 1–2 photos on a tall last row.
    if (remaining > 0 && remaining < 3 && aspectSum(row) < needed * 1.12) {
      continue;
    }

    rows.push(row);
    row = [];
  }

  if (row.length > 0) {
    rows.push(row);
  }

  return rows;
}

function balanceSparseLastRow<T extends PinPhotoGalleryLayoutItem>(
  rows: T[][],
  containerWidth: number,
  rowHeight: number,
): T[][] {
  const out = rows.map((row) => [...row]);
  const minLastRowItems = 3;
  const maxLastRowHeight = rowHeight * 1.28;

  while (out.length >= 2) {
    const last = out[out.length - 1]!;
    const lastHeight = rowHeightAtWidth(last, containerWidth);
    const tooSparse =
      last.length < minLastRowItems || lastHeight > maxLastRowHeight;
    if (!tooSparse) break;

    const prev = out[out.length - 2]!;
    if (prev.length <= 2) break;

    last.unshift(prev.pop()!);
  }

  return out;
}

function partitionScore<T extends PinPhotoGalleryLayoutItem>(
  rows: T[][],
  containerWidth: number,
  rowHeight: number,
): number {
  if (rows.length === 0) return Number.POSITIVE_INFINITY;

  const heights = rows.map((row) => rowHeightAtWidth(row, containerWidth));
  const last = rows[rows.length - 1]!;
  const lastHeight = heights[heights.length - 1]!;
  const heightSpread = Math.max(...heights) - Math.min(...heights);
  const lastRowCountPenalty = last.length < 3 ? (3 - last.length) * 2_000 : 0;
  const tallLastPenalty =
    lastHeight > rowHeight * 1.15 ? (lastHeight - rowHeight) * 40 : 0;

  return lastRowCountPenalty + tallLastPenalty + heightSpread;
}

/** Justified rows with uniform height — balances the last row to avoid tall orphans. */
export function computeRowsLayout<T extends PinPhotoGalleryLayoutItem>(
  items: T[],
  containerWidth: number,
  targetRowHeight: number,
): SizedGalleryItem<T>[][] {
  if (containerWidth <= 0 || items.length === 0) return [];

  if (items.length === 1) {
    return [sizeRow(items, containerWidth)];
  }

  const heightCandidates = [
    targetRowHeight,
    targetRowHeight * 0.9,
    targetRowHeight * 0.95,
    targetRowHeight * 1.05,
    targetRowHeight * 1.1,
  ];

  let bestRows: T[][] = [];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidateHeight of heightCandidates) {
    const partitions = balanceSparseLastRow(
      partitionRowsForHeight(items, containerWidth, candidateHeight),
      containerWidth,
      candidateHeight,
    );
    const score = partitionScore(partitions, containerWidth, candidateHeight);
    if (score < bestScore) {
      bestScore = score;
      bestRows = partitions;
    }
  }

  if (bestRows.length === 0) {
    return [sizeRow(items, containerWidth)];
  }

  return bestRows.map((row) => sizeRow(row, containerWidth));
}

export function columnsForContainerWidth(containerWidth: number): number {
  if (containerWidth >= 1200) return 5;
  if (containerWidth >= 600) return 4;
  if (containerWidth >= 300) return 3;
  return 2;
}

/** Denser columns grid for the map blog side panel. */
export function columnsForBlogPanelWidth(containerWidth: number): number {
  if (containerWidth >= 720) return 5;
  if (containerWidth >= 480) return 4;
  return 3;
}

/** Top-to-bottom columns (round-robin), similar to react-photo-album columns layout. */
export function computeColumnsLayout<T extends PinPhotoGalleryLayoutItem>(
  items: T[],
  containerWidth: number,
  columnCount: number,
): SizedGalleryItem<T>[][] {
  if (containerWidth <= 0 || items.length === 0) return [];

  const columnWidth =
    (containerWidth - GAP_PX * (columnCount - 1)) / columnCount;
  const columns: SizedGalleryItem<T>[][] = Array.from(
    { length: columnCount },
    () => [],
  );

  items.forEach((item, index) => {
    const col = index % columnCount;
    const aspect = photoAspect(item);
    columns[col].push({
      item,
      width: columnWidth,
      height: columnWidth / aspect,
    });
  });

  return columns;
}

export function targetRowHeightForWidth(containerWidth: number): number {
  if (containerWidth >= 1200) return containerWidth / 5;
  if (containerWidth >= 600) return containerWidth / 4;
  if (containerWidth >= 300) return containerWidth / 5;
  return containerWidth / 2;
}

/** Slightly shorter rows for the map blog side panel (more photos per row). */
export function targetRowHeightForBlogPanel(containerWidth: number): number {
  if (containerWidth >= 600) return containerWidth / 5.5;
  return containerWidth / 4.5;
}

export const pinPhotoGalleryGapPx = GAP_PX;
