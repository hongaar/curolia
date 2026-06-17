import { Calendar, Images } from "lucide-react";
import type * as React from "react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  coverImageCrossOrigin,
  sampleCoverAccentFromImage,
} from "../map-card/map-card-cover-accent";
import {
  coverAspectRatioCss,
  normalizeCoverAspectRatio,
} from "../map-card/map-card-layout";
import styles from "./pin-card.module.css";

export type PinCardProps = {
  title: React.ReactNode;
  /** Navigate to pin detail. Omit when using `onSelect`. */
  to?: string;
  /** Open pin in map sheet (embedded gallery). */
  onSelect?: () => void;
  description?: React.ReactNode;
  coverUrl?: string | null;
  dateLabel?: React.ReactNode;
  photoCountLabel?: React.ReactNode;
  tags?: React.ReactNode;
  pinEntryRef?: React.Ref<HTMLElement>;
  lineAnchorRef?: React.Ref<HTMLHeadingElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
};

function PinCardShell({
  className,
  hasCover,
  coverAspectReady,
  children,
  ...rest
}: {
  className: string;
  hasCover: boolean;
  coverAspectReady: boolean;
  children: React.ReactNode;
} & (
  | ({ to: string; onSelect?: never } & React.ComponentPropsWithoutRef<
      typeof Link
    >)
  | ({
      onSelect: () => void;
      to?: never;
    } & React.ComponentPropsWithoutRef<"button">)
)) {
  const dataProps = {
    className,
    "data-has-cover": hasCover ? "true" : "false",
    "data-aspect-ready": hasCover
      ? coverAspectReady
        ? "true"
        : "false"
      : "true",
  };

  if ("to" in rest && rest.to) {
    const { to, ...linkRest } = rest;
    return (
      <Link to={to} {...dataProps} {...linkRest}>
        {children}
      </Link>
    );
  }

  const { onSelect, ...buttonRest } = rest as {
    onSelect: () => void;
  } & React.ComponentPropsWithoutRef<"button">;

  return (
    <button type="button" onClick={onSelect} {...dataProps} {...buttonRest}>
      {children}
    </button>
  );
}

export function PinCardTagRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.tagRow}>{children}</div>;
}

export function PinCard({
  title,
  to,
  onSelect,
  description,
  coverUrl,
  dateLabel,
  photoCountLabel,
  tags,
  pinEntryRef,
  lineAnchorRef,
  onMouseEnter,
  onMouseLeave,
}: PinCardProps) {
  const hasCover = Boolean(coverUrl?.trim());
  const hasMeta = Boolean(dateLabel || photoCountLabel);
  const [coverAspectRatio, setCoverAspectRatio] = useState<number | null>(null);
  const coverImageRef = useRef<HTMLImageElement>(null);

  const syncCoverImageMetrics = useCallback((image: HTMLImageElement) => {
    const { naturalWidth, naturalHeight } = image;
    if (naturalWidth <= 0 || naturalHeight <= 0) return;
    setCoverAspectRatio(normalizeCoverAspectRatio(naturalWidth, naturalHeight));
    sampleCoverAccentFromImage(image);
  }, []);

  useLayoutEffect(() => {
    setCoverAspectRatio(null);
    if (!hasCover) return;

    const image = coverImageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      syncCoverImageMetrics(image);
    }
  }, [coverUrl, hasCover, syncCoverImageMetrics]);

  const coverCrossOrigin = useMemo(() => {
    if (!hasCover) return undefined;
    return coverImageCrossOrigin(
      coverUrl!,
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost",
    );
  }, [coverUrl, hasCover]);

  const coverStyle =
    hasCover && coverAspectRatio != null
      ? { aspectRatio: coverAspectRatioCss(coverAspectRatio) }
      : undefined;

  const shellProps =
    to != null
      ? ({ to } as const)
      : ({ onSelect: onSelect ?? (() => undefined) } as const);

  return (
    <article
      ref={pinEntryRef}
      className={styles.itemWrap}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <PinCardShell
        {...shellProps}
        className={styles.card}
        hasCover={hasCover}
        coverAspectReady={!hasCover || coverAspectRatio != null}
      >
        {hasCover ? (
          <div className={styles.cover} style={coverStyle}>
            <img
              ref={coverImageRef}
              src={coverUrl!}
              alt=""
              className={styles.coverImage}
              crossOrigin={coverCrossOrigin}
              onLoad={(event) => syncCoverImageMetrics(event.currentTarget)}
            />
          </div>
        ) : null}
        <div className={styles.body}>
          <h3 ref={lineAnchorRef} className={styles.title}>
            {title}
          </h3>
          {tags}
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
          {hasMeta ? (
            <div className={styles.meta}>
              {dateLabel ? (
                <span className={styles.metaItem}>
                  <Calendar className={styles.metaIcon} aria-hidden />
                  {dateLabel}
                </span>
              ) : null}
              {photoCountLabel ? (
                <span className={styles.metaItem}>
                  <Images className={styles.metaIcon} aria-hidden />
                  {photoCountLabel}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </PinCardShell>
    </article>
  );
}

export function PinCardEmptyState({ children }: { children: React.ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}
