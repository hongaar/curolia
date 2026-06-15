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

function rowHeightAtWidth<T extends PinPhotoGalleryLayoutItem>(
  photos: T[],
  containerWidth: number,
): number {
  if (photos.length === 0) return 0;
  const gaps = GAP_PX * (photos.length - 1);
  const sumAspect = photos.reduce((sum, p) => sum + photoAspect(p), 0);
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

/** Justified rows (Flickr-style), similar to react-photo-album rows layout. */
export function computeRowsLayout<T extends PinPhotoGalleryLayoutItem>(
  items: T[],
  containerWidth: number,
  targetRowHeight: number,
): SizedGalleryItem<T>[][] {
  if (containerWidth <= 0 || items.length === 0) return [];

  const rows: SizedGalleryItem<T>[][] = [];
  let row: T[] = [];

  for (const item of items) {
    const candidate = [...row, item];
    const height = rowHeightAtWidth(candidate, containerWidth);

    if (row.length > 0 && height < targetRowHeight) {
      rows.push(sizeRow(row, containerWidth));
      row = [item];
    } else {
      row = candidate;
    }
  }

  if (row.length > 0) {
    rows.push(sizeRow(row, containerWidth));
  }

  return rows;
}

export function columnsForContainerWidth(containerWidth: number): number {
  if (containerWidth >= 1200) return 5;
  if (containerWidth >= 600) return 4;
  if (containerWidth >= 300) return 3;
  return 2;
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

export const pinPhotoGalleryGapPx = GAP_PX;
