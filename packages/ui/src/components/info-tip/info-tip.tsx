"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import type * as React from "react";

import styles from "./info-tip.module.css";

/**
 * Inline "Learn more" style trigger that reveals a short explanation in a
 * tooltip on hover or keyboard focus.
 */
export function InfoTip({
  label = "Learn more",
  children,
}: {
  /** Visible trigger text. */
  label?: React.ReactNode;
  /** Tooltip body. */
  children: React.ReactNode;
}) {
  return (
    <TooltipPrimitive.Provider delay={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger
          render={<button type="button" className={styles.trigger} />}
        >
          {label}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Positioner
            sideOffset={6}
            className={styles.positioner}
          >
            <TooltipPrimitive.Popup className={styles.popup}>
              {children}
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
