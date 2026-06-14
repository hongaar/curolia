"use client";

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./hover-tooltip.module.css";

export function HoverTooltip({
  content,
  children,
  side = "top",
  delay = 400,
  closeDelay = 100,
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
  closeDelay?: number;
  className?: string;
}) {
  return (
    <PreviewCardPrimitive.Root>
      <PreviewCardPrimitive.Trigger
        delay={delay}
        closeDelay={closeDelay}
        className={cn(styles.trigger, className)}
        render={<span tabIndex={0} />}
      >
        {children}
      </PreviewCardPrimitive.Trigger>
      <PreviewCardPrimitive.Portal>
        <PreviewCardPrimitive.Positioner
          side={side}
          sideOffset={6}
          className={styles.positioner}
        >
          <PreviewCardPrimitive.Popup className={styles.popup}>
            {content}
          </PreviewCardPrimitive.Popup>
        </PreviewCardPrimitive.Positioner>
      </PreviewCardPrimitive.Portal>
    </PreviewCardPrimitive.Root>
  );
}
