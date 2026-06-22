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
      onClick={onClick}
    >
      {icon ? <span className={styles.chipIcon}>{icon}</span> : null}
      <span>{label}</span>
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
    <button
      type="button"
      className={cn(styles.chipControl, styles.chipMore)}
      aria-expanded={false}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <span aria-hidden>⋯</span>
    </button>
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
    <button
      type="button"
      className={styles.chipControl}
      aria-expanded={true}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <ChevronLeft aria-hidden />
    </button>
  );
}
