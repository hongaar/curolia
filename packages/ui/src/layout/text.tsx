import type * as React from "react";

import { cn } from "../lib/utils";
import styles from "./text.module.css";

export type TextVariant =
  | "display"
  | "heading"
  | "title"
  | "titleLg"
  | "body"
  | "muted"
  | "mutedXs"
  | "label"
  | "medium"
  | "destructive"
  | "center"
  | "truncate";

const variantClass: Record<TextVariant, string> = {
  display: styles.display,
  heading: styles.heading,
  title: styles.title,
  titleLg: styles.titleLg,
  body: styles.body,
  muted: styles.muted,
  mutedXs: styles.mutedXs,
  label: styles.label,
  medium: styles.medium,
  destructive: styles.destructive,
  center: styles.center,
  truncate: styles.truncate,
};

export type TextProps<T extends keyof React.JSX.IntrinsicElements = "p"> = {
  as?: T;
  variant?: TextVariant | TextVariant[];
} & React.ComponentPropsWithoutRef<T>;

export function Text<T extends keyof React.JSX.IntrinsicElements = "p">({
  as,
  variant = "body",
  className,
  ...props
}: TextProps<T>) {
  const Component = (as ?? "p") as React.ElementType;
  const variants = Array.isArray(variant) ? variant : [variant];
  return (
    <Component
      className={cn(...variants.map((v) => variantClass[v]), className)}
      {...props}
    />
  );
}
