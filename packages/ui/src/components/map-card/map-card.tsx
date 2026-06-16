import { Globe, Lock, MapPin, Users } from "lucide-react";
import type * as React from "react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  coverImageCrossOrigin,
  sampleCoverAccentFromImage,
} from "./map-card-cover-accent";
import {
  coverAspectRatioCss,
  deterministicAccentColor,
  deterministicEmojiAspectRatio,
  normalizeCoverAspectRatio,
} from "./map-card-layout";
import styles from "./map-card.module.css";

export type MapCardVisibility = "private" | "public" | "shared";

const VISIBILITY_META: Record<
  MapCardVisibility,
  { label: string; Icon: typeof Lock }
> = {
  private: { label: "Only me", Icon: Lock },
  public: { label: "Public", Icon: Globe },
  shared: { label: "Shared", Icon: Users },
};

function MapCardVisibilityBadge({
  visibility,
  compact = false,
}: {
  visibility: MapCardVisibility;
  compact?: boolean;
}) {
  const { label, Icon } = VISIBILITY_META[visibility];

  return (
    <span
      className={
        compact ? styles.visibilityBadgeCompact : styles.visibilityBadge
      }
      aria-label={label}
      title={label}
    >
      <Icon className={styles.visibilityIcon} aria-hidden />
      {compact ? null : <span className={styles.visibilityLabel}>{label}</span>}
    </span>
  );
}

export function MapCardMasonryGrid({
  children,
  columns = 3,
}: {
  children: React.ReactNode;
  /** Default profile grid uses 3 columns; home feed uses 4. */
  columns?: 3 | 4;
}) {
  return (
    <div
      className={styles.masonry}
      data-columns={columns === 4 ? "4" : undefined}
    >
      {children}
    </div>
  );
}

export function MapCardRowSection({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.rowSection}>
      <h2 className={styles.rowTitle}>{title}</h2>
      <div className={styles.rowScroller}>{children}</div>
    </section>
  );
}

export function MapCardRowItem({ children }: { children: React.ReactNode }) {
  return <div className={styles.rowItem}>{children}</div>;
}

export type MapCardCompactProps = {
  to: string;
  title: React.ReactNode;
  coverUrl?: string | null;
  iconEmoji?: React.ReactNode;
  subtitle?: React.ReactNode;
  visibility?: MapCardVisibility;
};

export function MapCardCompact({
  to,
  title,
  coverUrl,
  iconEmoji,
  subtitle,
  visibility,
}: MapCardCompactProps) {
  const hasCover = Boolean(coverUrl?.trim());

  return (
    <Link to={to} className={styles.compact}>
      <div className={styles.compactThumb}>
        {visibility ? (
          <MapCardVisibilityBadge visibility={visibility} compact />
        ) : null}
        {hasCover ? (
          <img src={coverUrl!} alt="" className={styles.compactThumbImage} />
        ) : (
          <div className={styles.compactEmojiArt} aria-hidden>
            <span className={styles.compactEmojiBackdrop}>{iconEmoji}</span>
            <span className={styles.compactEmojiMark}>{iconEmoji}</span>
          </div>
        )}
      </div>
      <div className={styles.compactText}>
        <p className={styles.compactTitle}>{title}</p>
        {subtitle ? <p className={styles.compactSubtitle}>{subtitle}</p> : null}
      </div>
    </Link>
  );
}

export function MapCardStreamPanel({
  title,
  children,
  empty,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  empty?: React.ReactNode;
}) {
  return (
    <section className={styles.streamPanel}>
      <h2 className={styles.streamHeader}>{title}</h2>
      {empty ? empty : <div className={styles.streamScroller}>{children}</div>}
    </section>
  );
}

export function MapCardStreamItem({ children }: { children: React.ReactNode }) {
  return <div className={styles.streamItem}>{children}</div>;
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
  visibility?: MapCardVisibility;
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
  visibility,
}: MapCardProps) {
  const hasCover = Boolean(coverUrl?.trim());
  const hasMeta = Boolean(pinCountLabel || updatedLabel);
  const showInsetIcon = hasCover && Boolean(iconEmoji);
  const [coverAspectRatio, setCoverAspectRatio] = useState<number | null>(null);
  const [coverAccentColor, setCoverAccentColor] = useState<string | null>(null);
  const coverImageRef = useRef<HTMLImageElement>(null);

  const syncCoverImageMetrics = useCallback((image: HTMLImageElement) => {
    const { naturalWidth, naturalHeight } = image;
    if (naturalWidth <= 0 || naturalHeight <= 0) return;
    setCoverAspectRatio(normalizeCoverAspectRatio(naturalWidth, naturalHeight));
    setCoverAccentColor(sampleCoverAccentFromImage(image));
  }, []);

  useLayoutEffect(() => {
    setCoverAspectRatio(null);
    setCoverAccentColor(null);
    if (!hasCover) return;

    const image = coverImageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      syncCoverImageMetrics(image);
    }
  }, [coverUrl, hasCover, syncCoverImageMetrics]);

  const seed = layoutSeed ?? title?.toString() ?? "map";

  const emojiAspectRatio = useMemo(
    () => deterministicEmojiAspectRatio(seed),
    [seed],
  );

  const insetAccentColor = coverAccentColor ?? deterministicAccentColor(seed);

  const coverCrossOrigin = useMemo(() => {
    if (!hasCover) return undefined;
    return coverImageCrossOrigin(
      coverUrl!,
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost",
    );
  }, [coverUrl, hasCover]);

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
        data-has-inset-icon={showInsetIcon ? "true" : "false"}
        data-aspect-ready={
          hasCover ? (coverAspectRatio != null ? "true" : "false") : "true"
        }
      >
        <div className={styles.cover} style={coverStyle}>
          {visibility ? (
            <MapCardVisibilityBadge visibility={visibility} />
          ) : null}
          {hasCover ? (
            <img
              ref={coverImageRef}
              src={coverUrl!}
              alt=""
              className={styles.coverImage}
              crossOrigin={coverCrossOrigin}
              onLoad={(event) => syncCoverImageMetrics(event.currentTarget)}
            />
          ) : (
            <div className={styles.coverEmojiArt} aria-hidden>
              <span className={styles.coverEmojiBackdrop}>{iconEmoji}</span>
              <span className={styles.coverEmojiMark}>
                <span className={styles.coverEmojiMarkCircle}>{iconEmoji}</span>
              </span>
            </div>
          )}
        </div>
        <div className={styles.body}>
          {showInsetIcon ? (
            <div
              className={styles.insetIcon}
              style={{ backgroundColor: insetAccentColor }}
              aria-hidden
            >
              {iconEmoji}
            </div>
          ) : null}
          <h3 className={styles.title}>{title}</h3>
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
          {hasMeta ? (
            <div className={styles.meta}>
              {pinCountLabel ? (
                <span className={styles.metaItem}>
                  <MapPin className={styles.metaIcon} aria-hidden />
                  {pinCountLabel}
                </span>
              ) : null}
              {updatedLabel ? (
                <span className={styles.metaItem}>{updatedLabel}</span>
              ) : null}
            </div>
          ) : null}
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
