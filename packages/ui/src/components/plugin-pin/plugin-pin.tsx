import { Loader2 } from "lucide-react";
import type * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../card";
import styles from "./plugin-pin.module.css";

export function PluginPinCard({ children }: { children: React.ReactNode }) {
  return (
    <Card size="sm" className={styles.card}>
      {children}
    </Card>
  );
}

export function PluginPinHeader({
  children,
  between = false,
}: {
  children: React.ReactNode;
  between?: boolean;
}) {
  return (
    <CardHeader
      className={
        between ? `${styles.header} ${styles.headerBetween}` : styles.header
      }
    >
      {children}
    </CardHeader>
  );
}

export function PluginPinTitleRow({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
}) {
  return (
    <div className={styles.titleRow}>
      <span className={styles.iconMuted}>{icon}</span>
      <CardTitle className={styles.title}>{title}</CardTitle>
    </div>
  );
}

export function PluginPinSpinner() {
  return (
    <span className={styles.spinner} aria-hidden>
      <Loader2 className={styles.spinnerIcon} />
    </span>
  );
}

export function PluginPinContent({ children }: { children: React.ReactNode }) {
  return <CardContent className={styles.contentStack}>{children}</CardContent>;
}

export function PluginPinMuted({ children }: { children: React.ReactNode }) {
  return <p className={styles.muted}>{children}</p>;
}

export function PluginPinMutedXs({ children }: { children: React.ReactNode }) {
  return <p className={styles.mutedXs}>{children}</p>;
}

export function PluginPinMutedStack({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.mutedStack}>{children}</div>;
}

export function PluginPinError({ children }: { children: React.ReactNode }) {
  return <p className={styles.error}>{children}</p>;
}

export function PluginPinList({ children }: { children: React.ReactNode }) {
  return <ul className={styles.trackList}>{children}</ul>;
}

function PluginPinTrackAnchor({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.trackLink}
    >
      <span className={styles.trackIcon}>{icon}</span>
      {children}
    </a>
  );
}

export function PluginPinLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li>
      <PluginPinTrackAnchor href={href} icon={icon}>
        {children}
      </PluginPinTrackAnchor>
    </li>
  );
}

export function PluginPinInlineLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <PluginPinTrackAnchor href={href} icon={icon}>
      {children}
    </PluginPinTrackAnchor>
  );
}

export function PluginPinLinkMeta({ children }: { children: React.ReactNode }) {
  return <span className={styles.trackMeta}>{children}</span>;
}

export function PluginPinAddRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.addRow}>{children}</div>;
}

export function PluginPinAddRowInput({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.addRowInput}>{children}</div>;
}

export function PluginPinItemRow({ children }: { children: React.ReactNode }) {
  return <li className={styles.itemRow}>{children}</li>;
}

export function PluginPinItemMain({ children }: { children: React.ReactNode }) {
  return <div className={styles.itemMain}>{children}</div>;
}

export function PluginPinSearchResults({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ul className={styles.searchResults}>{children}</ul>;
}

export function PluginPinSearchHit({
  title,
  meta,
  imageUrl,
  disabled,
  onClick,
}: {
  title: string;
  meta: string | null;
  imageUrl: string | null;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={styles.searchHit}
        disabled={disabled}
        onClick={onClick}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className={styles.searchHitArt} />
        ) : (
          <span className={styles.searchHitArt} aria-hidden />
        )}
        <span className={styles.searchHitBody}>
          <span className={styles.searchHitTitle}>{title}</span>
          {meta ? <span className={styles.searchHitMeta}>{meta}</span> : null}
        </span>
      </button>
    </li>
  );
}

/** Text-only search row (no thumbnail column). */
export function PluginPinSearchHitCompact({
  title,
  meta,
  disabled,
  onClick,
}: {
  title: string;
  meta: string | null;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={styles.searchHitCompact}
        disabled={disabled}
        onClick={onClick}
      >
        <span className={styles.searchHitCompactBody}>
          <span className={styles.searchHitCompactTitle}>{title}</span>
          {meta ? (
            <>
              <span className={styles.searchHitCompactSep}> · </span>
              <span className={styles.searchHitCompactMeta}>{meta}</span>
            </>
          ) : null}
        </span>
      </button>
    </li>
  );
}

export function PluginPinEmbed({
  src,
  title,
  height,
}: {
  src: string;
  title: string;
  height: number;
}) {
  return (
    <iframe
      className={styles.embed}
      src={src}
      title={title}
      width="100%"
      height={height}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

export function PluginPinLangBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.langBadge}>{children}</span>;
}

export function PluginPinArticlePreview({
  title,
  extract,
  thumbnailUrl,
  readMoreHref,
  readMoreLabel = "Read more on Wikipedia",
  readMoreIcon,
  langBadge,
  actions,
}: {
  title: string;
  extract: string;
  thumbnailUrl?: string | null;
  readMoreHref: string;
  readMoreLabel?: string;
  readMoreIcon: React.ReactNode;
  langBadge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <article
      className={styles.article}
      data-has-lang-badge={langBadge ? "" : undefined}
    >
      {langBadge}
      <div className={styles.articleMediaRow}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className={styles.articleThumb} />
        ) : null}
        <div className={styles.articleBody}>
          <h4 className={styles.articleTitle}>{title}</h4>
          <p className={styles.articleExtract}>{extract}</p>
        </div>
      </div>
      <div className={styles.articleActions}>
        <PluginPinInlineLink href={readMoreHref} icon={readMoreIcon}>
          {readMoreLabel}
        </PluginPinInlineLink>
        {actions}
      </div>
    </article>
  );
}
