import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./stack.module.css";

export type StackGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";
export type StackAlign = "start" | "center" | "end" | "stretch";
export type StackJustify = "start" | "center" | "end" | "between";
export type StackPadding = "none" | "sm" | "md" | "lg";

const gapClass: Record<StackGap, string> = {
  none: styles.gapNone,
  xs: styles.gapXs,
  sm: styles.gapSm,
  md: styles.gapMd,
  lg: styles.gapLg,
  xl: styles.gapXl,
};

const alignClass: Record<StackAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
  stretch: styles.alignStretch,
};

const justifyClass: Record<StackJustify, string> = {
  start: styles.justifyStart,
  center: styles.justifyCenter,
  end: styles.justifyEnd,
  between: styles.justifyBetween,
};

const paddingClass: Record<StackPadding, string> = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

export type StackProps = React.ComponentProps<"div"> & {
  direction?: "row" | "column";
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  padding?: StackPadding;
  fill?: boolean;
  wrap?: boolean;
};

export function Stack({
  direction = "column",
  gap = "none",
  align,
  justify,
  padding = "none",
  fill = false,
  wrap = false,
  className,
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        styles.stack,
        direction === "row" ? styles.directionRow : styles.directionColumn,
        gapClass[gap],
        align && alignClass[align],
        justify && justifyClass[justify],
        paddingClass[padding],
        fill && styles.fill,
        wrap && styles.wrap,
        className,
      )}
      {...props}
    />
  );
}
