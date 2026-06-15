import type * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  coverAspectRatioCss,
  deterministicEmojiAspectRatio,
  normalizeCoverAspectRatio,
} from "./map-card-layout";
import styles from "./map-card.module.css";

export function MapCardMasonryGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.masonry}>{children}</div>;
}

export type MapCardProps = {
  to: string;
  title: React.ReactNode;
  /** Optional short map blurb. */
  description?: React.ReactNode;
  coverUrl?: string | null;
  /** Shown when there is no cover image. */
  iconEmoji?: React.ReactNode;
  /** Stable id used to pick a deterministic emoji-card aspect ratio. */
  layoutSeed?: string;
  /** Pin count label, e.g. "12 pins". */
  pinCountLabel?: React.ReactNode;
  /** Relative update label, e.g. "Updated 3d ago". */
  updatedLabel?: React.ReactNode;
};

export function MapCard({
  to,
  title,
  description,
  coverUrl,
  iconEmoji,
  layoutSeed,
  pinCountLabel,
  updatedLabel,
}: MapCardProps) {
  const hasCover = Boolean(coverUrl?.trim());
  const hasMeta = Boolean(pinCountLabel || updatedLabel);
  const [coverAspectRatio, setCoverAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    setCoverAspectRatio(null);
  }, [coverUrl]);

  const emojiAspectRatio = useMemo(
    () =>
      deterministicEmojiAspectRatio(layoutSeed ?? title?.toString() ?? "map"),
    [layoutSeed, title],
  );

  const coverStyle = hasCover
    ? coverAspectRatio != null
      ? { aspectRatio: coverAspectRatioCss(coverAspectRatio) }
      : undefined
    : { aspectRatio: emojiAspectRatio };

  return (
    <article className={styles.itemWrap}>
      <Link
        to={to}
        className={styles.card}
        data-has-cover={hasCover ? "true" : "false"}
        data-aspect-ready={
          hasCover ? (coverAspectRatio != null ? "true" : "false") : "true"
        }
      >
        <div className={styles.cover} style={coverStyle}>
          {hasCover ? (
            <img
              src={coverUrl!}
              alt=""
              className={styles.coverImage}
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                setCoverAspectRatio(
                  normalizeCoverAspectRatio(naturalWidth, naturalHeight),
                );
              }}
            />
          ) : (
            <div className={styles.coverEmojiArt} aria-hidden>
              <span className={styles.coverEmojiBackdrop}>{iconEmoji}</span>
              <span className={styles.coverEmojiMark}>
                <span className={styles.coverEmojiMarkCircle}>{iconEmoji}</span>
              </span>
            </div>
          )}
          <div className={styles.scrim} aria-hidden />
          <div className={styles.overlay}>
            <div className={styles.overlayContent}>
              <h3 className={styles.title}>{title}</h3>
              {description ? (
                <p className={styles.description}>{description}</p>
              ) : null}
              {hasMeta ? (
                <div className={styles.meta}>
                  {pinCountLabel ? (
                    <span className={styles.metaItem}>{pinCountLabel}</span>
                  ) : null}
                  {updatedLabel ? (
                    <span className={styles.metaItem}>{updatedLabel}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function MapCoverPreview({
  coverUrl,
  iconEmoji,
}: {
  coverUrl?: string | null;
  iconEmoji?: React.ReactNode;
}) {
  return (
    <div className={styles.coverPreview}>
      {coverUrl ? (
        <img src={coverUrl} alt="" className={styles.coverPreviewImage} />
      ) : (
        <span className={styles.coverPreviewFallback} aria-hidden>
          {iconEmoji}
        </span>
      )}
    </div>
  );
}

export function MapCardEmptyState({ children }: { children: React.ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}
