import type * as React from "react";

import { buttonClassName } from "../components/button";
import { Input } from "../components/input";
import {
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "../components/popover";
import { cn } from "../lib/utils";
import styles from "./global-search.module.css";

export function GlobalSearchPopoverTrigger({
  toolbarEmbed,
  title,
  children,
}: {
  toolbarEmbed?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <PopoverTrigger
      type="button"
      title={title}
      className={cn(
        buttonClassName({
          variant: toolbarEmbed ? "ghost" : "outline",
          size: "sm",
        }),
        toolbarEmbed
          ? styles.searchTriggerEmbed
          : styles.searchTriggerStandalone,
      )}
    >
      {children}
    </PopoverTrigger>
  );
}

export function GlobalSearchPopoverContent({
  children,
  align = "start",
  sideOffset = 8,
}: {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  sideOffset?: number;
}) {
  return (
    <PopoverContent
      align={align}
      sideOffset={sideOffset}
      className={styles.popoverContent}
    >
      {children}
    </PopoverContent>
  );
}

export function GlobalSearchPopoverTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PopoverTitle className="srOnly">{children}</PopoverTitle>;
}

export function GlobalSearchInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={styles.searchInput} />;
}

export function GlobalSearchIcon({ children }: { children: React.ReactNode }) {
  return <span className={styles.searchIcon}>{children}</span>;
}

export function GlobalSearchLabel({
  toolbarEmbed,
  children,
}: {
  toolbarEmbed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        toolbarEmbed ? styles.searchLabelEmbed : styles.searchLabelStandalone
      }
    >
      {children}
    </span>
  );
}

export function GlobalSearchHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.searchHeader}>{children}</div>;
}

export function GlobalSearchInputWrap({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export function GlobalSearchResults({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.results}>{children}</div>;
}

export function GlobalSearchEmptyHint({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.emptyHint}>{children}</p>;
}

export function GlobalSearchSectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.sectionLabel}>{children}</div>;
}

export function GlobalSearchResultRow({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        buttonClassName({ variant: "ghost", size: "sm" }),
        styles.resultRow,
      )}
    >
      {children}
    </button>
  );
}

export function GlobalSearchResultIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.resultIcon}>{children}</span>;
}

export function GlobalSearchResultBody({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.resultBody}>{children}</span>;
}

export function GlobalSearchResultTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.resultTitle}>{children}</span>;
}

export function GlobalSearchResultSubtitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.resultSubtitle}>{children}</span>;
}

export function GlobalSearchStatusText({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.statusText}>{children}</p>;
}

export function GlobalSearchFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.footer}>{children}</div>;
}

export function GlobalSearchKbd({ children }: { children: React.ReactNode }) {
  return <kbd className={styles.kbd}>{children}</kbd>;
}

export function GlobalSearchSpinner({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.spinner}>{children}</span>;
}
