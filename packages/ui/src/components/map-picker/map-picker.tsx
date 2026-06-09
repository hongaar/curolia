import { ChevronDown, ChevronRight } from "lucide-react";
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
    <DropdownMenuTrigger
      className={cn(styles.trigger, !mapEmoji && styles.triggerNoEmoji)}
      {...props}
    >
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

/** Pill button that navigates back to a map (emoji + name). */
export function MapNavButton({
  mapEmoji,
  mapName,
  onClick,
  "aria-label": ariaLabel,
}: {
  mapEmoji?: React.ReactNode;
  mapName: string;
  onClick: () => void;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        styles.trigger,
        styles.mapNavRoot,
        !mapEmoji && styles.triggerNoEmoji,
      )}
      onClick={onClick}
      aria-label={ariaLabel ?? `Go to ${mapName}`}
    >
      {mapEmoji ? (
        <span className={styles.mapEmoji} aria-hidden>
          {mapEmoji}
        </span>
      ) : null}
      <span className={styles.mapName}>{mapName}</span>
      <span className={styles.chevron} aria-hidden>
        <ChevronRight />
      </span>
    </button>
  );
}

/** Read-only map title for public (unsigned) map views — no selector chevron. */
export function PublicMapToolbarInfo({
  mapEmoji,
  mapName,
  ownerName,
}: {
  mapEmoji?: React.ReactNode;
  mapName: string;
  ownerName?: string | null;
}) {
  return (
    <div
      className={styles.publicInfo}
      aria-label={`${mapName}${ownerName ? ` by ${ownerName}` : ""}`}
    >
      {mapEmoji ? (
        <span className={styles.mapEmoji} aria-hidden>
          {mapEmoji}
        </span>
      ) : null}
      <span className={styles.publicText}>
        <span className={styles.publicMapName}>{mapName}</span>
        {ownerName ? (
          <span className={styles.publicOwnerName}>{ownerName}</span>
        ) : null}
      </span>
    </div>
  );
}
