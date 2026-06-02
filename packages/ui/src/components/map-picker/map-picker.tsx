import { ChevronDown } from "lucide-react";
import type * as React from "react";

import { cn } from "../../lib/utils";
import { DropdownMenuContent, DropdownMenuTrigger } from "../dropdown-menu";
import styles from "./map-picker.module.css";

export function MapPickerTrigger({
  mapEmoji,
  mapName,
  ...props
}: Omit<React.ComponentProps<typeof DropdownMenuTrigger>, "children"> & {
  mapEmoji?: React.ReactNode;
  mapName?: string | null;
}) {
  return (
    <DropdownMenuTrigger className={styles.trigger} {...props}>
      {mapEmoji ? (
        <span className={styles.mapEmoji} aria-hidden>
          {mapEmoji}
        </span>
      ) : null}
      <span className={styles.mapName}>{mapName ?? "Select map"}</span>
      <span className={styles.chevron} aria-hidden>
        <ChevronDown />
      </span>
    </DropdownMenuTrigger>
  );
}

export function MapPickerContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      align="start"
      sideOffset={8}
      className={cn(styles.content, className)}
      {...props}
    >
      {children}
    </DropdownMenuContent>
  );
}
