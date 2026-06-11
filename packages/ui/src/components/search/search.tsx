import * as React from "react";

import { cn } from "../../lib/utils";
import { buttonClassName } from "../button";
import { Input } from "../input";
import { PopoverAnchor, PopoverContent, PopoverTitle } from "../popover";
import styles from "./search.module.css";

export function SearchPopoverContent({
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

/** Toolbar slot anchor for popover positioning (wraps the search field). */
export const SearchToolbarAnchor = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof PopoverAnchor>
>(function SearchToolbarAnchor({ className, children, ...props }, ref) {
  return (
    <PopoverAnchor
      ref={ref}
      className={cn(styles.toolbarRoot, className)}
      {...props}
    >
      {children}
    </PopoverAnchor>
  );
});

/** Toolbar search input row; use `focused` while the input is active. */
export const SearchToolbarField = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { focused?: boolean }
>(function SearchToolbarField({ className, children, focused, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        styles.toolbarField,
        focused && styles.toolbarFieldFocused,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

export function SearchPopoverTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PopoverTitle className="srOnly">{children}</PopoverTitle>;
}

export function SearchInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(styles.toolbarInput, className)} />;
}

export function SearchIcon({ children }: { children: React.ReactNode }) {
  return <span className={styles.icon}>{children}</span>;
}

export function SearchResults({
  children,
  embedded = false,
  id,
  role = "listbox",
}: {
  children: React.ReactNode;
  /** Parent supplies scroll bounds when the list is not inside a popover panel. */
  embedded?: boolean;
  id?: string;
  role?: "listbox" | "presentation";
}) {
  return (
    <div
      id={id}
      role={role}
      className={embedded ? styles.resultsEmbedded : styles.results}
    >
      {children}
    </div>
  );
}

export function SearchEmptyHint({ children }: { children: React.ReactNode }) {
  return <p className={styles.emptyHint}>{children}</p>;
}

export function SearchSectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.sectionLabel}>{children}</div>;
}

export function SearchResultRow({
  children,
  onClick,
  selected = false,
  active = false,
  id,
  onMouseMove,
}: {
  children: React.ReactNode;
  onClick: () => void;
  /** Confirmed selection in the list (e.g. picked place). */
  selected?: boolean;
  /** Keyboard or pointer highlight while navigating results. */
  active?: boolean;
  id?: string;
  onMouseMove?: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      id={id}
      onClick={onClick}
      aria-selected={selected}
      onMouseMove={onMouseMove}
      className={cn(
        buttonClassName({ variant: "ghost", size: "sm" }),
        styles.resultRow,
        active && styles.resultRowActive,
        selected && styles.resultRowSelected,
      )}
    >
      {children}
    </button>
  );
}

export function SearchResultIcon({ children }: { children: React.ReactNode }) {
  return <span className={styles.resultIcon}>{children}</span>;
}

export function SearchResultBody({ children }: { children: React.ReactNode }) {
  return <span className={styles.resultBody}>{children}</span>;
}

export function SearchResultTitleRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.resultTitleRow}>{children}</span>;
}

export function SearchResultTitle({ children }: { children: React.ReactNode }) {
  return <span className={styles.resultTitle}>{children}</span>;
}

export function SearchResultCategory({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.resultCategory}>{children}</span>;
}

export function SearchToolbarActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.toolbarActions}>{children}</div>;
}

export function SearchResultSubtitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.resultSubtitle}>{children}</span>;
}

export function SearchStatusText({ children }: { children: React.ReactNode }) {
  return <p className={styles.statusText}>{children}</p>;
}

export function SearchShortcutKeys({
  keys,
  variant = "result",
}: {
  keys: string[];
  variant?: "toolbar" | "result";
}) {
  return (
    <span
      className={cn(
        styles.shortcutKeys,
        variant === "toolbar" && styles.shortcutKeysToolbar,
        variant === "result" && styles.shortcutKeysResult,
      )}
      aria-hidden
    >
      {keys.map((key, index) => (
        <kbd key={`${key}-${index}`} className={styles.shortcutKey}>
          {key}
        </kbd>
      ))}
    </span>
  );
}

export function SearchSpinner({ children }: { children: React.ReactNode }) {
  return <span className={styles.spinner}>{children}</span>;
}

/** Keyboard shortcut hint shown inside the toolbar search field. */
export function SearchToolbarShortcutHint({ keys }: { keys: string[] }) {
  return <SearchShortcutKeys keys={keys} variant="toolbar" />;
}

/** Trailing shortcut label on a search result row. */
export function SearchResultShortcut({ keys }: { keys: string[] }) {
  return <SearchShortcutKeys keys={keys} variant="result" />;
}
