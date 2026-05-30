import type * as React from "react";
import { NavLink } from "react-router-dom";

import { cn } from "../lib/utils";
import { buttonClassName } from "../components/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import styles from "./navigation-sidebar.module.css";

export const navigationSidebarStyles = styles;

export function NavigationSidebarRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.root}>{children}</div>;
}

export function NavigationSidebarSection({
  children,
  gap = "default",
}: {
  children: React.ReactNode;
  gap?: "default" | "lg";
}) {
  return (
    <div className={cn(styles.section, gap === "lg" && styles.sectionLg)}>
      {children}
    </div>
  );
}

export function NavigationSidebarLabel({
  children,
  spaced = false,
}: {
  children: React.ReactNode;
  spaced?: boolean;
}) {
  return (
    <span
      className={cn(styles.sectionLabel, spaced && styles.sectionLabelSpaced)}
    >
      {children}
    </span>
  );
}

export function NavigationSidebarNavLink({
  to,
  end,
  icon,
  children,
}: {
  to: string;
  end?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(styles.navRow, isActive && styles.navRowActive)
      }
    >
      <span className={styles.navIcon}>{icon}</span>
      {children}
    </NavLink>
  );
}

export function SidebarPickerTrigger({
  children,
  active = false,
  ...props
}: React.ComponentProps<typeof DropdownMenuTrigger> & { active?: boolean }) {
  return (
    <DropdownMenuTrigger
      className={
        active
          ? `${styles.pickerTrigger} ${styles.pickerTriggerActive}`
          : styles.pickerTrigger
      }
      {...props}
    >
      {children}
    </DropdownMenuTrigger>
  );
}

export function SidebarPickerLabel({
  emoji,
  children,
}: {
  emoji?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className={styles.pickerLabel}>
      {emoji ? <span className={styles.pickerEmoji}>{emoji}</span> : null}
      <span className={styles.pickerName}>{children}</span>
    </span>
  );
}

export function SidebarPickerChevron({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.pickerChevron}>{children}</span>;
}

export function JournalDropdownRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.journalRow}>{children}</div>;
}

export function JournalDropdownEditButton({
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

export function NavigationSidebarHint({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.hintText}>{children}</p>;
}

export function SidebarDropdownRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.dropdownRow}>{children}</div>;
}

export function SidebarTagIconWrap({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span className={styles.tagIconWrap}>
      {children}
      {active ? <span className={styles.tagFilterDot} aria-hidden /> : null}
    </span>
  );
}

export function SidebarTagName({
  children,
  selected,
}: {
  children: React.ReactNode;
  selected?: boolean;
}) {
  return (
    <span
      className={
        selected
          ? `${styles.tagName} ${styles.tagNameSelected}`
          : styles.tagName
      }
    >
      {children}
    </span>
  );
}

export function SidebarJournalName({
  children,
  selected,
  personal,
}: {
  children: React.ReactNode;
  selected?: boolean;
  personal?: boolean;
}) {
  return (
    <span
      className={
        selected
          ? `${styles.journalName} ${styles.journalNameSelected}`
          : styles.journalName
      }
    >
      {children}
      {personal ? (
        <span className={styles.journalPersonal}> (personal)</span>
      ) : null}
    </span>
  );
}

export function NavigationSidebarIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.navIcon}>{children}</span>;
}

export function SidebarDropdownContent({
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent className={styles.dropdownWide} {...props}>
      {children}
    </DropdownMenuContent>
  );
}

export function SidebarDropdownMenuItem({
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem>) {
  return (
    <DropdownMenuItem className={styles.journalItem} {...props}>
      {children}
    </DropdownMenuItem>
  );
}

export function SidebarCheckIcon({ children }: { children: React.ReactNode }) {
  return <span className={styles.checkIcon}>{children}</span>;
}

export function SidebarCheckSpacer() {
  return <span className={styles.checkSpacer} aria-hidden />;
}

export function SidebarJournalEmoji({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className={styles.journalEmoji} aria-hidden>
      {children}
    </span>
  );
}

export function dropdownPanelWideClassName() {
  return styles.dropdownWide;
}
