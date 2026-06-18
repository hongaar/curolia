import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/utils";
import { Button, buttonClassName } from "../button";
import styles from "./pin-photo-lightbox.module.css";

export type PinPhotoLightboxItem = {
  id: string;
  url: string;
  originalProductUrl?: string | null;
  originalProductLabel?: string | null;
};

type PinPhotoLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PinPhotoLightboxItem[];
  initialPhotoId?: string | null;
  title?: string;
  isLoading?: boolean;
};

export function PinPhotoLightbox({
  open,
  onOpenChange,
  items,
  initialPhotoId = null,
  title,
  isLoading = false,
}: PinPhotoLightboxProps) {
  const [index, setIndex] = useState(0);
  const itemsKey = useMemo(() => items.map((i) => i.id).join("|"), [items]);

  useEffect(() => {
    if (!open) return;
    if (items.length === 0) return;
    const idx = initialPhotoId
      ? items.findIndex((x) => x.id === initialPhotoId)
      : 0;
    setIndex(idx >= 0 ? idx : 0);
  }, [open, itemsKey, initialPhotoId, items]);

  const safeIndex = items.length > 0 ? Math.min(index, items.length - 1) : 0;
  const current = items[safeIndex];
  const n = items.length;
  const hasNav = n > 1;

  const goPrev = useCallback(() => {
    setIndex((i) => (n <= 0 ? 0 : (i - 1 + n) % n));
  }, [n]);

  const goNext = useCallback(() => {
    setIndex((i) => (n <= 0 ? 0 : (i + 1) % n));
  }, [n]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        onOpenChange(false);
      } else if (e.key === "ArrowLeft" && hasNav) {
        e.preventDefault();
        e.stopImmediatePropagation();
        goPrev();
      } else if (e.key === "ArrowRight" && hasNav) {
        e.preventDefault();
        e.stopImmediatePropagation();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [open, hasNav, onOpenChange, goPrev, goNext]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const showEmpty = !isLoading && n === 0;

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Photos: ${title}` : "Photo gallery"}
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close gallery"
        onClick={() => onOpenChange(false)}
      />
      <div className={styles.layout}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            {title ? <p className={styles.headerTitle}>{title}</p> : null}
            {n > 0 ? (
              <p className={styles.headerCount}>
                {safeIndex + 1} / {n}
              </p>
            ) : null}
          </div>
          <div className={styles.headerActions}>
            {current?.originalProductUrl ? (
              <a
                href={current.originalProductUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName({
                  variant: "ghost",
                  size: "icon-sm",
                  className: styles.lightButton,
                })}
                aria-label={
                  current.originalProductLabel
                    ? `Open in ${current.originalProductLabel}`
                    : "Open original"
                }
                title={
                  current.originalProductLabel
                    ? `Open in ${current.originalProductLabel} — new tab`
                    : "Open original — new tab"
                }
              >
                <ExternalLink className={styles.iconMd} />
              </a>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={styles.lightButton}
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <X className={styles.iconMd} />
            </Button>
          </div>
        </header>

        <div className={styles.stage}>
          {isLoading && n === 0 ? (
            <p className={styles.stageMessage}>Loading photos…</p>
          ) : showEmpty ? (
            <p className={styles.stageMessage}>No photos to show.</p>
          ) : current ? (
            <div className={styles.stageInner}>
              {hasNav ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`${styles.navButton} ${styles.navButtonPrev} ${styles.lightButton}`}
                  aria-label="Previous photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                >
                  <ChevronLeft className={styles.navIcon} />
                </Button>
              ) : null}
              <img
                src={current.url}
                alt=""
                className={styles.stageImage}
                draggable={false}
              />
              {hasNav ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`${styles.navButton} ${styles.navButtonNext} ${styles.lightButton}`}
                  aria-label="Next photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                >
                  <ChevronRight className={styles.navIcon} />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

type PinPhotoThumbProps = {
  url: string;
  alt?: string;
  size?: "md" | "lg" | "square";
  onOpen: () => void;
};

export function PinPhotoThumb({
  url,
  alt = "",
  size = "md",
  onOpen,
}: PinPhotoThumbProps) {
  return (
    <button
      type="button"
      className={cn(
        styles.thumbButton,
        size === "lg" && styles.thumbLg,
        size === "md" && styles.thumbMd,
        size === "square" && styles.thumbSquare,
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen();
      }}
    >
      <img
        src={url}
        alt={alt}
        className={styles.thumbImage}
        draggable={false}
      />
    </button>
  );
}

export const pinPhotoLightboxStyles = styles;
