import * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./card-meta.module.css";

export function CardMeta({
  children,
  className,
  inset = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** When true, adds a small top inset for card bodies. Blog rows pass `false`. */
  inset?: boolean;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <div className={cn(styles.meta, inset && styles.metaInset, className)}>
      {items}
    </div>
  );
}

export function CardMetaItem({
  icon,
  children,
  className,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(styles.metaItem, className)}>
      {icon ? <span className={styles.metaIcon}>{icon}</span> : null}
      {children}
    </span>
  );
}

export function CardMetaEmojiIcon({ emoji }: { emoji: string }) {
  return <span className={styles.emojiIcon}>{emoji}</span>;
}
