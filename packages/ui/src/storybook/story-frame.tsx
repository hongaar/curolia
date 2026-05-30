import type { Decorator } from "@storybook/react";
import type * as React from "react";

import { cn } from "../lib/utils";
import styles from "./story-frame.module.css";

export type StoryFrameWidth = "full" | "sm" | "md" | "lg";

const widthClass: Record<StoryFrameWidth, string | undefined> = {
  full: undefined,
  sm: styles.widthSm,
  md: styles.widthMd,
  lg: styles.widthLg,
};

export function StoryFrame({
  width = "md",
  className,
  children,
}: {
  width?: StoryFrameWidth;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(styles.frame, widthClass[width], className)}>
      {children}
    </div>
  );
}

export function StoryRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(styles.row, className)}>{children}</div>;
}

export function StoryColumn({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(styles.column, className)}>{children}</div>;
}

export const storyFrameStyles = styles;

/** Docs-friendly width constraint; keeps `render` free of `StoryFrame` for Show code. */
export function storyWidthDecorator(width: StoryFrameWidth): Decorator {
  return (Story) => (
    <div className={cn(styles.frame, widthClass[width])}>
      <Story />
    </div>
  );
}

export const storyWidthSm = storyWidthDecorator("sm");
export const storyWidthMd = storyWidthDecorator("md");
export const storyWidthLg = storyWidthDecorator("lg");
