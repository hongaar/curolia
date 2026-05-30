import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./box.module.css";

export type BoxVariant =
  | "relative"
  | "fullViewport"
  | "overflowHidden"
  | "overflowAuto"
  | "minHeight0"
  | "minWidth0"
  | "flex1"
  | "shrink0"
  | "bgBackground"
  | "bgSidebar"
  | "borderSidebar"
  | "z30"
  | "z96"
  | "fixedTop"
  | "pointerEventsNone"
  | "pointerEventsAuto"
  | "paddingNavShell"
  | "centeredPage"
  | "maxWidthMd"
  | "maxWidthLg"
  | "maxWidthXl"
  | "maxWidth2xl"
  | "maxWidthFull"
  | "textCenter"
  | "truncate";

const variantClass: Record<BoxVariant, string> = {
  relative: styles.relative,
  fullViewport: styles.fullViewport,
  overflowHidden: styles.overflowHidden,
  overflowAuto: styles.overflowAuto,
  minHeight0: styles.minHeight0,
  minWidth0: styles.minWidth0,
  flex1: styles.flex1,
  shrink0: styles.shrink0,
  bgBackground: styles.bgBackground,
  bgSidebar: styles.bgSidebar,
  borderSidebar: styles.borderSidebar,
  z30: styles.z30,
  z96: styles.z96,
  fixedTop: styles.fixedTop,
  pointerEventsNone: styles.pointerEventsNone,
  pointerEventsAuto: styles.pointerEventsAuto,
  paddingNavShell: styles.paddingNavShell,
  centeredPage: styles.centeredPage,
  maxWidthMd: styles.maxWidthMd,
  maxWidthLg: styles.maxWidthLg,
  maxWidthXl: styles.maxWidthXl,
  maxWidth2xl: styles.maxWidth2xl,
  maxWidthFull: styles.maxWidthFull,
  textCenter: styles.textCenter,
  truncate: styles.truncate,
};

export type BoxProps = React.ComponentProps<"div"> & {
  variant?: BoxVariant | BoxVariant[];
};

export function Box({ variant, className, ...props }: BoxProps) {
  const variants = variant
    ? Array.isArray(variant)
      ? variant
      : [variant]
    : [];
  return (
    <div
      className={cn(...variants.map((v) => variantClass[v]), className)}
      {...props}
    />
  );
}
