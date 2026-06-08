import type * as React from "react";

import { cn } from "../../lib/utils";
import { buttonClassName } from "../button";
import { DropdownMenuItem } from "../dropdown-menu";
import styles from "./dropdown-menu-list.module.css";

export function DropdownMenuEditRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.editRow}>{children}</div>;
}

export function DropdownMenuEditButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      className={cn(
        buttonClassName({ variant: "ghost", size: "icon" }),
        styles.editButton,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function DropdownMenuCheckItem({
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem>) {
  return (
    <DropdownMenuItem className={styles.checkItem} {...props}>
      {children}
    </DropdownMenuItem>
  );
}

export function DropdownMenuCheckIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.checkIcon}>{children}</span>;
}

export function DropdownMenuCheckSpacer() {
  return <span className={styles.checkSpacer} aria-hidden />;
}

export function DropdownMenuItemEmoji({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className={styles.itemEmoji} aria-hidden>
      {children}
    </span>
  );
}

export function DropdownMenuItemName({
  children,
  selected,
  secondary,
}: {
  children: React.ReactNode;
  selected?: boolean;
  secondary?: React.ReactNode;
}) {
  return (
    <span className={cn(styles.itemName, selected && styles.itemNameSelected)}>
      {children}
      {secondary ? (
        <span className={styles.itemNameSecondary}>{secondary}</span>
      ) : null}
    </span>
  );
}
