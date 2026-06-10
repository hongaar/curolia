import * as React from "react";

import { cn } from "../../lib/utils";
import { buttonClassName } from "../button";
import { Input } from "../input";
import {
  PopoverAnchor,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "../popover";
import styles from "./global-search.module.css";

export type GlobalSearchPopoverTriggerProps = {
  /** When true, uses ghost styling for the main toolbar slot; otherwise outline standalone. */
  toolbarEmbed?: boolean;
  /** Native `title` tooltip on the search trigger button. */
  title?: string;
  children: React.ReactNode;
};

export function GlobalSearchPopoverTrigger({
  toolbarEmbed,
  title,
  children,
}: GlobalSearchPopoverTriggerProps) {
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
  toolbarEmbed = false,
}: {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  toolbarEmbed?: boolean;
}) {
  return (
    <PopoverContent
      align={align}
      sideOffset={sideOffset}
      className={cn(
        styles.popoverContent,
        toolbarEmbed && styles.popoverContentToolbar,
      )}
    >
      {children}
    </PopoverContent>
  );
}

/** Toolbar slot anchor for popover positioning (wraps the search field). */
export const GlobalSearchToolbarAnchor = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof PopoverAnchor>
>(function GlobalSearchToolbarAnchor({ className, children, ...props }, ref) {
  return (
    <PopoverAnchor
      ref={ref}
      className={cn(styles.searchToolbarRoot, className)}
      {...props}
    >
      {children}
    </PopoverAnchor>
  );
});

/** Toolbar search input row; use `focused` while the input is active. */
export const GlobalSearchToolbarField = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { focused?: boolean }
>(function GlobalSearchToolbarField(
  { className, children, focused, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        styles.searchToolbarField,
        focused && styles.searchToolbarFieldFocused,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

export function GlobalSearchPopoverTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PopoverTitle className="srOnly">{children}</PopoverTitle>;
}

export function GlobalSearchInput({
  variant = "popover",
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  variant?: "popover" | "toolbar";
}) {
  return (
    <Input
      {...props}
      className={cn(
        variant === "toolbar" ? styles.searchToolbarInput : styles.searchInput,
        className,
      )}
    />
  );
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
  embedded = false,
}: {
  children: React.ReactNode;
  /** Parent supplies scroll bounds (e.g. add-pin dialog above a fixed input). */
  embedded?: boolean;
}) {
  return (
    <div className={embedded ? styles.resultsEmbedded : styles.results}>
      {children}
    </div>
  );
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
  selected = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        buttonClassName({ variant: "ghost", size: "sm" }),
        styles.resultRow,
        selected && styles.resultRowSelected,
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

export function GlobalSearchShortcutKeys({
  keys,
  variant = "result",
}: {
  keys: string[];
  variant?: "toolbar" | "result" | "footer";
}) {
  return (
    <span
      className={cn(
        styles.shortcutKeys,
        variant === "toolbar" && styles.shortcutKeysToolbar,
        variant === "result" && styles.shortcutKeysResult,
        variant === "footer" && styles.shortcutKeysFooter,
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

/** @deprecated Prefer `GlobalSearchShortcutKeys` for multi-key hints. */
export function GlobalSearchKbd({ children }: { children: React.ReactNode }) {
  return (
    <GlobalSearchShortcutKeys keys={[String(children)]} variant="footer" />
  );
}

export function GlobalSearchSpinner({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.spinner}>{children}</span>;
}

/** Keyboard shortcut hint shown inside the toolbar search field. */
export function GlobalSearchToolbarShortcutHint({ keys }: { keys: string[] }) {
  return <GlobalSearchShortcutKeys keys={keys} variant="toolbar" />;
}

/** Trailing shortcut label on a search result row. */
export function GlobalSearchResultShortcut({ keys }: { keys: string[] }) {
  return <GlobalSearchShortcutKeys keys={keys} variant="result" />;
}
