import type * as React from "react";
import { ExternalLink, Globe, Loader2 } from "lucide-react";

import { cn } from "../../lib/utils";
import styles from "./pin-links.module.css";

export function PinLinksListRoot({ children }: { children: React.ReactNode }) {
  return <ul className={styles.list}>{children}</ul>;
}

export function PinLinkRowLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.rowLink}
    >
      {children}
    </a>
  );
}

export function PinLinkRowEditor({ children }: { children: React.ReactNode }) {
  return <div className={styles.rowEditor}>{children}</div>;
}

export function PinLinkRowBody({ children }: { children: React.ReactNode }) {
  return <div className={styles.rowBody}>{children}</div>;
}

export function PinLinkRowTitle({ children }: { children: React.ReactNode }) {
  return <p className={styles.rowTitle}>{children}</p>;
}

export function PinLinkRowTitleLink({
  href,
  title,
  children,
}: {
  href: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.rowTitleLink}
      title={title}
    >
      {children}
    </a>
  );
}

export function PinLinkRowDomain({ children }: { children: React.ReactNode }) {
  return <p className={styles.rowDomain}>{children}</p>;
}

export function PinLinkExternalIcon() {
  return <ExternalLink className={styles.externalIcon} aria-hidden />;
}

export function PinLinkFavicon({
  faviconUrl,
  domain,
  size = "default",
  onError,
}: {
  faviconUrl: string | null;
  domain: string;
  size?: "default" | "lg";
  onError?: () => void;
}) {
  const showImage = Boolean(faviconUrl);
  return (
    <span
      className={cn(styles.favicon, size === "lg" && styles.faviconLg)}
      aria-label={domain ? `${domain} favicon` : undefined}
    >
      {showImage ? (
        <img
          src={faviconUrl ?? undefined}
          alt=""
          className={styles.faviconImage}
          loading="lazy"
          onError={onError}
        />
      ) : (
        <Globe className={styles.faviconIcon} aria-hidden />
      )}
    </span>
  );
}

export function PinLinksEditorRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.editorRoot}>{children}</div>;
}

export function PinLinksEditorList({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.editorList}>{children}</div>;
}

export function PinLinksEditorAddRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.editorAddRow}>{children}</div>;
}

export function PinLinksSpinnerIcon() {
  return <Loader2 className={styles.spinIcon} aria-hidden />;
}

export const pinLinksStyles = styles;
