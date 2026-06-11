import { Loader2, X } from "lucide-react";
import type * as React from "react";

import { Button } from "../button";
import { Card, CardContent, CardHeader } from "../card";
import styles from "./suggestion-card.module.css";

/** Vertical stack wrapper for one or more suggestion cards. */
export function SuggestionCardList({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.list}>{children}</div>;
}

export type SuggestionCardProps = {
  /** Small leading icon (e.g. the plugin icon). */
  icon?: React.ReactNode;
  /** Muted eyebrow label above the title (e.g. "Suggested · Wikipedia"). */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  /** Optional supporting text (e.g. an article extract). */
  description?: React.ReactNode;
  /** Optional single-line meta (e.g. "120 m away"). */
  meta?: React.ReactNode;
  /** Optional badge in the top-right (e.g. language code). */
  badge?: React.ReactNode;
  /** Optional thumbnail rendered to the left of the text. */
  thumbnailUrl?: string | null;
  /** Action buttons (e.g. an "Attach" button). Rendered in the footer. */
  actions?: React.ReactNode;
  /** When provided, renders a dismiss (×) button in the top-right corner. */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button. */
  dismissLabel?: string;
  /** Disables the dismiss button and shows the card as working. */
  busy?: boolean;
};

/**
 * Reusable, accent-styled card for surfacing a plugin background suggestion in
 * pin details. Plugins compose it with their own icon, copy, and action button.
 */
export function SuggestionCard({
  icon,
  eyebrow,
  title,
  description,
  meta,
  badge,
  thumbnailUrl,
  actions,
  onDismiss,
  dismissLabel = "Dismiss suggestion",
  busy = false,
}: SuggestionCardProps) {
  return (
    <Card
      variant="colored"
      size="sm"
      className={styles.root}
      data-busy={busy ? "" : undefined}
    >
      {eyebrow || icon ? (
        <CardHeader className={styles.eyebrowHeader}>
          <div className={styles.eyebrow}>
            {icon ? (
              <span className={styles.eyebrowIcon} aria-hidden>
                {icon}
              </span>
            ) : null}
            {eyebrow ? <span>{eyebrow}</span> : null}
            {busy ? <Loader2 className={styles.spinner} aria-hidden /> : null}
          </div>
        </CardHeader>
      ) : null}
      {badge || onDismiss ? (
        <div className={styles.headerCorner}>
          {badge ? <span className={styles.badge}>{badge}</span> : null}
          {onDismiss ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className={styles.dismiss}
              aria-label={dismissLabel}
              disabled={busy}
              onClick={onDismiss}
            >
              <X aria-hidden />
            </Button>
          ) : null}
        </div>
      ) : null}
      <CardContent className={styles.content}>
        <div className={styles.body}>
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className={styles.thumb} />
          ) : null}
          <div className={styles.main}>
            <p className={styles.title}>{title}</p>
            {meta ? <p className={styles.meta}>{meta}</p> : null}
            {description ? (
              <p className={styles.description}>{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
