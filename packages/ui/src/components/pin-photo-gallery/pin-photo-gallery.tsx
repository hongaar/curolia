import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import type * as React from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../button";
import {
  columnsForContainerWidth,
  computeColumnsLayout,
  computeRowsLayout,
  stripThumbSize,
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
  /**
   * Strip layout only: span the full width of the parent shell while keeping the
   * first and last photos aligned with `--card-pad` at the scroll extents.
   */
  stripBleed?: boolean;
  /** Strip layout only: fixed thumb height in px; width follows each photo aspect. */
  stripThumbHeight?: number;
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

function LoadingPlaceholders({
  count,
  thumbSize,
}: {
  count: number;
  thumbSize?: { width: number; height: number };
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={`loading-${i}`}
          className={styles.itemWrap}
          style={
            thumbSize
              ? { width: thumbSize.width, height: thumbSize.height }
              : undefined
          }
        >
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
  stripBleed = false,
  stripThumbHeight,
}: {
  items: PinPhotoGalleryItem[];
  onOpen: (photoId: string) => void;
  loadingPlaceholders: number;
  stripBleed?: boolean;
  stripThumbHeight?: number;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollHints, setScrollHints] = useState({ left: false, right: false });

  const syncScrollHint = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setScrollHints({
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
  };

  const scrollStrip = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.75, 120);
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    syncScrollHint();
    const ro = new ResizeObserver(syncScrollHint);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length, loadingPlaceholders]);

  const stripSized = stripThumbHeight != null;
  const placeholderThumbSize = stripSized
    ? stripThumbSize({}, stripThumbHeight)
    : undefined;

  return (
    <div
      className={
        stripBleed
          ? `${styles.stripWrap} ${styles.stripWrapBleed}`
          : styles.stripWrap
      }
    >
      <div
        ref={scrollerRef}
        className={
          stripBleed
            ? `${styles.stripScroller} ${styles.stripScrollerBleed}`
            : styles.stripScroller
        }
        onScroll={syncScrollHint}
      >
        <div
          className={
            stripSized ? `${styles.strip} ${styles.stripSized}` : styles.strip
          }
        >
          {items.map((item) => {
            const thumbSize = stripSized
              ? stripThumbSize(item, stripThumbHeight)
              : { width: 104, height: 104 };

            return (
              <PinPhotoCell
                key={item.id}
                item={item}
                width={thumbSize.width}
                height={thumbSize.height}
                onOpen={onOpen}
              />
            );
          })}
          {loadingPlaceholders > 0 ? (
            <LoadingPlaceholders
              count={loadingPlaceholders}
              thumbSize={placeholderThumbSize}
            />
          ) : null}
        </div>
      </div>
      {scrollHints.left ? (
        <div className={styles.stripFadeLeft} aria-hidden />
      ) : null}
      {scrollHints.right ? (
        <div className={styles.stripFadeRight} aria-hidden />
      ) : null}
      {scrollHints.left ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(styles.stripNav, styles.stripNavPrev)}
          aria-label="Scroll photos left"
          onClick={() => scrollStrip(-1)}
        >
          <ChevronLeft className={styles.stripNavIcon} aria-hidden />
        </Button>
      ) : null}
      {scrollHints.right ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(styles.stripNav, styles.stripNavNext)}
          aria-label="Scroll photos right"
          onClick={() => scrollStrip(1)}
        >
          <ChevronRight className={styles.stripNavIcon} aria-hidden />
        </Button>
      ) : null}
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
  stripBleed = false,
  stripThumbHeight,
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
          stripBleed={stripBleed}
          stripThumbHeight={stripThumbHeight}
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
