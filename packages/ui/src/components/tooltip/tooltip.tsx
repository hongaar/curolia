import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./tooltip.module.css";

/** Positioned tooltip shell (e.g. fixed coords from Floating UI). */
export function Tooltip({
  hostRef,
  children,
  className,
}: {
  hostRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div ref={hostRef} className={cn(styles.host, className)}>
      {children}
    </div>
  );
}

export function TooltipContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(styles.content, className)}>{children}</div>;
}

export function TooltipTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn(styles.title, className)}>{children}</p>;
}

export function TooltipDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn(styles.description, className)}>{children}</p>;
}
