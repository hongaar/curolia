import type * as React from "react";

import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Input } from "../input";
import styles from "./plugin-account.module.css";

export function PluginAccountPanel({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact ? `${styles.panel} ${styles.panelCompact}` : styles.panel
      }
    >
      {children}
    </div>
  );
}

export function PluginAccountHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.heading}>{children}</p>;
}

export function PluginAccountRow({
  children,
  between = true,
  gap = "md",
}: {
  children: React.ReactNode;
  between?: boolean;
  gap?: "md" | "sm";
}) {
  return (
    <div
      className={
        between
          ? gap === "sm"
            ? `${styles.row} ${styles.rowGapSm} ${styles.rowBetween}`
            : `${styles.row} ${styles.rowBetween}`
          : gap === "sm"
            ? `${styles.row} ${styles.rowGapSm}`
            : styles.row
      }
    >
      {children}
    </div>
  );
}

export function PluginAccountBody({ children }: { children: React.ReactNode }) {
  return <p className={styles.body}>{children}</p>;
}

export function PluginAccountMuted({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.muted}>{children}</p>;
}

export function PluginAccountName({ children }: { children: React.ReactNode }) {
  return <span className={styles.accountName}>{children}</span>;
}

export function PluginAccountInputRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.inputRow}>{children}</div>;
}

export function PluginAccountInputDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.inputDescription}>{children}</div>;
}

export function PluginAccountInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input className={cn(styles.inputMax, className)} {...props} />;
}

export function PluginAccountButton({
  variant = "outline",
  size = "sm",
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(styles.buttonRounded, className)}
      {...props}
    />
  );
}
