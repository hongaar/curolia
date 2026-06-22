import * as React from "react";

import { cn } from "../../lib/utils";
import { FloatingPanel } from "../floating-panel/floating-panel";
import styles from "./explore-panel.module.css";

export function ExplorePanel({
  expanded,
  children,
}: {
  expanded: boolean;
  children: React.ReactNode;
}) {
  return (
    <FloatingPanel
      padding="none"
      className={cn(
        styles.explorePanel,
        expanded ? styles.explorePanelExpanded : styles.explorePanelCollapsed,
      )}
    >
      {children}
    </FloatingPanel>
  );
}

export function ExplorePanelPlaceholder({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.placeholder}>{children}</p>;
}

export function ExplorePanelHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.header}>{children}</div>;
}

export function ExplorePanelHeaderIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.headerIcon}>{children}</span>;
}

export function ExplorePanelHeaderTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <h3 className={styles.headerTitle}>{children}</h3>;
}

export function ExplorePanelBody({ children }: { children: React.ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}

export function ExplorePanelFilterGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.filterGroup}>{children}</div>;
}

export function ExplorePanelFilterLabel({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <p className={styles.filterLabel} id={id}>
      {children}
    </p>
  );
}

export function ExplorePanelFilterRow({
  children,
  labelledBy,
}: {
  children: React.ReactNode;
  labelledBy?: string;
}) {
  return (
    <div className={styles.filterRow} role="group" aria-labelledby={labelledBy}>
      {children}
    </div>
  );
}

export function ExplorePanelFilterChip({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(styles.filterChip, active && styles.filterChipActive)}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function ExplorePanelEntryList({
  children,
  emptyLabel = "No matches for these filters.",
}: {
  children: React.ReactNode;
  emptyLabel?: string;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  if (items.length === 0) {
    return <p className={styles.emptyEntries}>{emptyLabel}</p>;
  }
  return <ul className={styles.entryList}>{items}</ul>;
}

export function ExplorePanelEntryButton({
  title,
  subtitle,
  meta,
  onClick,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <li>
      <button type="button" className={styles.entryButton} onClick={onClick}>
        <ExplorePanelEntryTitle>{title}</ExplorePanelEntryTitle>
        {subtitle ? (
          <ExplorePanelEntrySubtitle>{subtitle}</ExplorePanelEntrySubtitle>
        ) : null}
        {meta ? <ExplorePanelEntryMeta>{meta}</ExplorePanelEntryMeta> : null}
      </button>
    </li>
  );
}

export function ExplorePanelEntryTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.entryTitle}>{children}</span>;
}

export function ExplorePanelEntrySubtitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.entrySubtitle}>{children}</span>;
}

export function ExplorePanelEntryMeta({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.entryMeta}>{children}</span>;
}
