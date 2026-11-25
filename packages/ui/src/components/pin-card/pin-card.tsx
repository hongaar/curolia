import { Calendar, Images } from "lucide-react";
import type * as React from "react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Card } from "../card";
import { CardMeta, CardMetaItem } from "../card-meta";
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
  /**
   * Known cover size (e.g. stored photo dimensions). Reserves the final cover
   * height before the image loads so masonry neighbours do not reflow.
   */
  coverSize?: { width: number; height: number } | null;
  dateLabel?: React.ReactNode;
  photoCountLabel?: React.ReactNode;
  tags?: React.ReactNode;
  pinEntryRef?: React.Ref<HTMLElement>;
  lineAnchorRef?: React.Ref<HTMLHeadingElement>;
  /** When set on embedded gallery cards, used to scroll/highlight from search. */
  pinId?: string;
  entryClassName?: string;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
  /** Hover/active accent (e.g. tag color); lightness is clamped for contrast. Defaults to primary. */
  accentColor?: string;
  /** Selected pin: accent border and title color. */
  active?: boolean;
};

function PinCardShell({
  className,
  hasCover,
  coverAspectReady,
  active,
  children,
  ...rest
}: {
  className: string;
  active: boolean;
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
    interactive: true,
    active,
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
      <Card {...dataProps} render={<Link to={to} {...linkRest} />}>
        {children}
      </Card>
    );
  }

  const { onSelect, ...buttonRest } = rest as {
    onSelect: () => void;
  } & React.ComponentPropsWithoutRef<"button">;

  return (
    <Card
      {...dataProps}
      render={<button type="button" onClick={onSelect} {...buttonRest} />}
    >
      {children}
    </Card>
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
  coverSize,
  dateLabel,
  photoCountLabel,
  tags,
  pinEntryRef,
  lineAnchorRef,
  pinId,
  entryClassName,
  onMouseEnter,
  onMouseLeave,
  accentColor,
  active = false,
}: PinCardProps) {
  const hasCover = Boolean(coverUrl?.trim());
  const hasMeta = Boolean(dateLabel || photoCountLabel);
  const knownCoverAspectRatio =
    coverSize && coverSize.width > 0 && coverSize.height > 0
      ? normalizeCoverAspectRatio(coverSize.width, coverSize.height)
      : null;
  const [loadedCoverAspectRatio, setCoverAspectRatio] = useState<number | null>(
    null,
  );
  const coverAspectRatio = knownCoverAspectRatio ?? loadedCoverAspectRatio;
  const coverImageRef = useRef<HTMLImageElement>(null);

  const syncCoverAspectRatio = useCallback((image: HTMLImageElement) => {
    const { naturalWidth, naturalHeight } = image;
    if (naturalWidth <= 0 || naturalHeight <= 0) return;
    setCoverAspectRatio(normalizeCoverAspectRatio(naturalWidth, naturalHeight));
  }, []);

  useLayoutEffect(() => {
    setCoverAspectRatio(null);
    if (!hasCover) return;

    const image = coverImageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      syncCoverAspectRatio(image);
    }
  }, [coverUrl, hasCover, syncCoverAspectRatio]);

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
      className={[styles.itemWrap, entryClassName].filter(Boolean).join(" ")}
      data-gallery-pin-id={pinId}
      data-active={active ? "true" : undefined}
      style={
        accentColor
          ? ({ "--pin-card-accent": accentColor } as React.CSSProperties)
          : undefined
      }
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <PinCardShell
        {...shellProps}
        className={styles.card}
        active={active}
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
              onLoad={(event) => syncCoverAspectRatio(event.currentTarget)}
            />
          </div>
        ) : null}
        <div className={styles.body}>
          <h3 ref={lineAnchorRef} className={styles.title} data-pin-line-anchor>
            {title}
          </h3>
          {tags}
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
          {hasMeta ? (
            <CardMeta>
              {dateLabel ? (
                <CardMetaItem icon={<Calendar aria-hidden />}>
                  {dateLabel}
                </CardMetaItem>
              ) : null}
              {photoCountLabel ? (
                <CardMetaItem icon={<Images aria-hidden />}>
                  {photoCountLabel}
                </CardMetaItem>
              ) : null}
            </CardMeta>
          ) : null}
        </div>
      </PinCardShell>
    </article>
  );
}

export function PinCardEmptyState({ children }: { children: React.ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}
