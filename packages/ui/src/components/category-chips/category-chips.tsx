import { ChevronLeft } from "lucide-react";
import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./category-chips.module.css";

export function CategoryChipRow({
  children,
  className,
  "aria-label": ariaLabel = "Categories",
}: {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      className={cn(styles.row, className)}
      role="listbox"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export function CategoryChipPanel({
  children,
  className,
  "aria-label": ariaLabel = "Categories",
}: {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      className={cn(styles.panel, className)}
      role="listbox"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export function CategoryChipPanelBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(styles.panelBody, className)}>{children}</div>;
}

export function CategoryChipGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(styles.grid, className)}>{children}</div>;
}

export function CategoryChipTransition({
  expanded,
  collapsed,
  expandedPane,
}: {
  expanded: boolean;
  collapsed: React.ReactNode;
  expandedPane: React.ReactNode;
}) {
  return (
    <div className={styles.transition}>
      <div
        className={cn(
          styles.transitionPane,
          !expanded && styles.transitionPaneActive,
        )}
        aria-hidden={expanded}
        inert={expanded}
      >
        {collapsed}
      </div>
      <div
        className={cn(
          styles.transitionPane,
          expanded && styles.transitionPaneActive,
        )}
        aria-hidden={!expanded}
        inert={!expanded}
      >
        {expandedPane}
      </div>
    </div>
  );
}

export function CategoryChip({
  icon,
  label,
  active = false,
  variant = "poi",
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  variant?: "poi" | "route";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      className={cn(
        styles.chip,
        variant === "route" && styles.chipRoute,
        active && styles.chipActive,
      )}
      aria-label={label}
      onClick={onClick}
    >
      {icon ? <span className={styles.chipIcon}>{icon}</span> : null}
      <span className={styles.chipLabel} aria-hidden>
        {label}
      </span>
    </button>
  );
}

export function CategoryChipControl({
  children,
  onClick,
  active,
  title,
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
  "aria-pressed": ariaPressed,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
  "aria-label": string;
  "aria-expanded"?: boolean;
  "aria-pressed"?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        styles.chipControl,
        active && styles.chipControlActive,
        className,
      )}
      title={title}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function CategoryChipMore({
  onClick,
  "aria-label": ariaLabel = "More categories",
}: {
  onClick: () => void;
  "aria-label"?: string;
}) {
  return (
    <CategoryChipControl
      className={styles.chipMore}
      aria-label={ariaLabel}
      aria-expanded={false}
      onClick={onClick}
    >
      <span aria-hidden>⋯</span>
    </CategoryChipControl>
  );
}

export function CategoryChipCollapse({
  onClick,
  "aria-label": ariaLabel = "Fewer categories",
}: {
  onClick: () => void;
  "aria-label"?: string;
}) {
  return (
    <CategoryChipControl
      aria-label={ariaLabel}
      aria-expanded={true}
      onClick={onClick}
    >
      <ChevronLeft aria-hidden />
    </CategoryChipControl>
  );
}
