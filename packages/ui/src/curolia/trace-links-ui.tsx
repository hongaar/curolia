import type * as React from "react";
import { ExternalLink, Globe, Loader2 } from "lucide-react";

import { cn } from "../lib/utils";
import styles from "./trace-links-ui.module.css";

export function TraceLinksListRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ul className={styles.list}>{children}</ul>;
}

export function TraceLinkRowLink({
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

export function TraceLinkRowEditor({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.rowEditor}>{children}</div>;
}

export function TraceLinkRowBody({ children }: { children: React.ReactNode }) {
  return <div className={styles.rowBody}>{children}</div>;
}

export function TraceLinkRowTitle({ children }: { children: React.ReactNode }) {
  return <p className={styles.rowTitle}>{children}</p>;
}

export function TraceLinkRowTitleLink({
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

export function TraceLinkRowDomain({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.rowDomain}>{children}</p>;
}

export function TraceLinkExternalIcon() {
  return <ExternalLink className={styles.externalIcon} aria-hidden />;
}

export function TraceLinkFavicon({
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

export function TraceLinksEditorRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.editorRoot}>{children}</div>;
}

export function TraceLinksEditorList({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.editorList}>{children}</div>;
}

export function TraceLinksEditorAddRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.editorAddRow}>{children}</div>;
}

export function TraceLinksSpinnerIcon() {
  return <Loader2 className={styles.spinIcon} aria-hidden />;
}

export const traceLinksStyles = styles;
