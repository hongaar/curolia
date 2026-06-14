import { ZoomIn } from "lucide-react";
import type * as React from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  columnsForContainerWidth,
  computeColumnsLayout,
  computeRowsLayout,
  targetRowHeightForWidth,
} from "./pin-photo-gallery-layout";
import styles from "./pin-photo-gallery.module.css";

export type PinPhotoGalleryLayout = "rows" | "columns" | "masonry" | "strip";

export type PinPhotoGalleryItem = {
  id: string;
  url: string;
  alt?: string;
  /** Pixel dimensions for rows/columns layout; defaults to 4:3 when omitted. */
  width?: number;
  height?: number;
  /** e.g. Google Photos product page — shown as a clickable source badge. */
  originalProductUrl?: string;
  sourceIcon?: React.ReactNode;
  sourceLabel?: string;
  /** Shown on hover/focus of the source badge (e.g. “Opens in a new tab”). */
  sourceTooltip?: string;
};

export type PinPhotoGalleryProps = {
  items: PinPhotoGalleryItem[];
  onOpen: (photoId: string) => void;
  /** Shown while signed URLs are still loading for known photo ids. */
  loadingPlaceholders?: number;
  layout?: PinPhotoGalleryLayout;
};

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      setWidth(el.clientWidth);
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

function PinPhotoCell({
  item,
  onOpen,
  width,
  height,
}: {
  item: PinPhotoGalleryItem;
  onOpen: (photoId: string) => void;
  width?: number;
  height?: number;
}) {
  const sized = width != null && height != null;

  return (
    <div
      className={styles.itemWrap}
      style={sized ? { width, height } : undefined}
    >
      <button
        type="button"
        className={styles.thumb}
        aria-label={item.alt?.trim() || "Open photo"}
        onClick={() => onOpen(item.id)}
      >
        <img
          src={item.url}
          alt={item.alt ?? ""}
          className={styles.image}
          loading="lazy"
          draggable={false}
        />
        <span className={styles.hoverOverlay} aria-hidden>
          <ZoomIn className={styles.hoverIcon} />
        </span>
      </button>
      {item.sourceIcon ? (
        item.originalProductUrl ? (
          <a
            href={item.originalProductUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.sourceBadge}
            aria-label={item.sourceLabel ?? "Open original photo"}
            title={
              item.sourceTooltip ??
              (item.sourceLabel
                ? `${item.sourceLabel} (new tab)`
                : "Opens in a new tab")
            }
          >
            <span className={styles.sourceBadgeIcon}>{item.sourceIcon}</span>
          </a>
        ) : (
          <span
            className={styles.sourceBadge}
            aria-label={item.sourceLabel ?? "Imported photo source"}
            title={item.sourceTooltip ?? item.sourceLabel}
          >
            <span className={styles.sourceBadgeIcon}>{item.sourceIcon}</span>
          </span>
        )
      ) : null}
    </div>
  );
}

function LoadingPlaceholders({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={`loading-${i}`} className={styles.itemWrap}>
          <div className={styles.placeholder} aria-hidden>
            …
          </div>
        </div>
      ))}
    </>
  );
}

function RowsGallery({
  items,
  containerWidth,
  onOpen,
  loadingPlaceholders,
}: {
  items: PinPhotoGalleryItem[];
  containerWidth: number;
  onOpen: (photoId: string) => void;
  loadingPlaceholders: number;
}) {
  const rows = useMemo(
    () =>
      computeRowsLayout(
        items,
        containerWidth,
        targetRowHeightForWidth(containerWidth),
      ),
    [items, containerWidth],
  );

  return (
    <div className={styles.rows}>
      {rows.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className={styles.row}>
          {row.map(({ item, width, height }) => (
            <PinPhotoCell
              key={item.id}
              item={item}
              width={width}
              height={height}
              onOpen={onOpen}
            />
          ))}
        </div>
      ))}
      {loadingPlaceholders > 0 ? (
        <div className={styles.row}>
          <LoadingPlaceholders count={loadingPlaceholders} />
        </div>
      ) : null}
    </div>
  );
}

function ColumnsGallery({
  items,
  containerWidth,
  onOpen,
  loadingPlaceholders,
}: {
  items: PinPhotoGalleryItem[];
  containerWidth: number;
  onOpen: (photoId: string) => void;
  loadingPlaceholders: number;
}) {
  const columns = useMemo(() => {
    const count = columnsForContainerWidth(containerWidth);
    return computeColumnsLayout(items, containerWidth, count);
  }, [items, containerWidth]);

  const placeholderColumn =
    loadingPlaceholders > 0
      ? columns.length > 0
        ? columns.reduce(
            (shortest, col, i) =>
              col.length < columns[shortest].length ? i : shortest,
            0,
          )
        : 0
      : -1;

  return (
    <div className={styles.columns}>
      {columns.map((column, colIndex) => (
        <div key={`col-${colIndex}`} className={styles.column}>
          {column.map(({ item, width, height }) => (
            <PinPhotoCell
              key={item.id}
              item={item}
              width={width}
              height={height}
              onOpen={onOpen}
            />
          ))}
          {colIndex === placeholderColumn ? (
            <LoadingPlaceholders count={loadingPlaceholders} />
          ) : null}
        </div>
      ))}
      {columns.length === 0 && loadingPlaceholders > 0 ? (
        <div className={styles.column}>
          <LoadingPlaceholders count={loadingPlaceholders} />
        </div>
      ) : null}
    </div>
  );
}

function StripGallery({
  items,
  onOpen,
  loadingPlaceholders,
}: {
  items: PinPhotoGalleryItem[];
  onOpen: (photoId: string) => void;
  loadingPlaceholders: number;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncScrollHint = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    syncScrollHint();
    const ro = new ResizeObserver(syncScrollHint);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length, loadingPlaceholders]);

  return (
    <div className={styles.stripWrap}>
      <div
        ref={scrollerRef}
        className={styles.stripScroller}
        onScroll={syncScrollHint}
      >
        <div className={styles.strip}>
          {items.map((item) => (
            <PinPhotoCell
              key={item.id}
              item={item}
              width={104}
              height={104}
              onOpen={onOpen}
            />
          ))}
          {loadingPlaceholders > 0 ? (
            <LoadingPlaceholders count={loadingPlaceholders} />
          ) : null}
        </div>
      </div>
      {canScrollRight ? <div className={styles.stripFade} aria-hidden /> : null}
    </div>
  );
}

function MasonryGallery({
  items,
  onOpen,
  loadingPlaceholders,
}: {
  items: PinPhotoGalleryItem[];
  onOpen: (photoId: string) => void;
  loadingPlaceholders: number;
}) {
  return (
    <div className={styles.masonry}>
      {items.map((item) => (
        <PinPhotoCell key={item.id} item={item} onOpen={onOpen} />
      ))}
      {loadingPlaceholders > 0 ? (
        <LoadingPlaceholders count={loadingPlaceholders} />
      ) : null}
    </div>
  );
}

export function PinPhotoGallery({
  items,
  onOpen,
  loadingPlaceholders = 0,
  layout = "rows",
}: PinPhotoGalleryProps) {
  const { ref, width } = useContainerWidth();

  if (items.length === 0 && loadingPlaceholders <= 0) return null;

  const showJustified = layout !== "masonry" && width > 0;

  return (
    <div ref={ref} className={styles.album}>
      {layout === "strip" ? (
        <StripGallery
          items={items}
          onOpen={onOpen}
          loadingPlaceholders={loadingPlaceholders}
        />
      ) : layout === "masonry" ? (
        <MasonryGallery
          items={items}
          onOpen={onOpen}
          loadingPlaceholders={loadingPlaceholders}
        />
      ) : layout === "columns" ? (
        showJustified ? (
          <ColumnsGallery
            items={items}
            containerWidth={width}
            onOpen={onOpen}
            loadingPlaceholders={loadingPlaceholders}
          />
        ) : (
          <MasonryGallery
            items={items}
            onOpen={onOpen}
            loadingPlaceholders={loadingPlaceholders}
          />
        )
      ) : showJustified ? (
        <RowsGallery
          items={items}
          containerWidth={width}
          onOpen={onOpen}
          loadingPlaceholders={loadingPlaceholders}
        />
      ) : (
        <MasonryGallery
          items={items}
          onOpen={onOpen}
          loadingPlaceholders={loadingPlaceholders}
        />
      )}
    </div>
  );
}

export const pinPhotoGalleryStyles = styles;
