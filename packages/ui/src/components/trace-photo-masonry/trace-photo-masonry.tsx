import { ZoomIn } from "lucide-react";
import type * as React from "react";

import styles from "./trace-photo-masonry.module.css";

export type TracePhotoMasonryItem = {
  id: string;
  url: string;
  alt?: string;
  /** e.g. Google Photos product page — shown as a clickable source badge. */
  originalProductUrl?: string;
  sourceIcon?: React.ReactNode;
  sourceLabel?: string;
  /** Shown on hover/focus of the source badge (e.g. “Opens in a new tab”). */
  sourceTooltip?: string;
};

export type TracePhotoMasonryProps = {
  items: TracePhotoMasonryItem[];
  onOpen: (photoId: string) => void;
  /** Shown while signed URLs are still loading for known photo ids. */
  loadingPlaceholders?: number;
};

export function TracePhotoMasonry({
  items,
  onOpen,
  loadingPlaceholders = 0,
}: TracePhotoMasonryProps) {
  if (items.length === 0 && loadingPlaceholders <= 0) return null;

  return (
    <div className={styles.masonry}>
      {items.map((item) => (
        <div key={item.id} className={styles.itemWrap}>
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
                <span className={styles.sourceBadgeIcon}>
                  {item.sourceIcon}
                </span>
              </a>
            ) : (
              <span
                className={styles.sourceBadge}
                aria-label={item.sourceLabel ?? "Imported photo source"}
                title={item.sourceTooltip ?? item.sourceLabel}
              >
                <span className={styles.sourceBadgeIcon}>
                  {item.sourceIcon}
                </span>
              </span>
            )
          ) : null}
        </div>
      ))}
      {loadingPlaceholders > 0
        ? Array.from({ length: loadingPlaceholders }, (_, i) => (
            <div key={`loading-${i}`} className={styles.itemWrap}>
              <div className={styles.placeholder} aria-hidden>
                …
              </div>
            </div>
          ))
        : null}
    </div>
  );
}

export const tracePhotoMasonryStyles = styles;
