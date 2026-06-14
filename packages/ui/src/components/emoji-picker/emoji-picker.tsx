"use client";

import {
  EmojiPicker as EmojiPickerPrimitive,
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListEmojiProps,
  type EmojiPickerListRowProps,
} from "frimousse";
import { LoaderIcon, SearchIcon } from "lucide-react";
import { forwardRef, type ComponentProps } from "react";

import { cn } from "../../lib/utils";
import styles from "./emoji-picker.module.css";

function EmojiPicker({
  className,
  ...props
}: ComponentProps<typeof EmojiPickerPrimitive.Root>) {
  return (
    <EmojiPickerPrimitive.Root
      className={cn(styles.root, className)}
      data-slot="emoji-picker"
      {...props}
    />
  );
}

const EmojiPickerSearch = forwardRef<
  HTMLInputElement,
  ComponentProps<typeof EmojiPickerPrimitive.Search>
>(function EmojiPickerSearch({ className, ...props }, ref) {
  return (
    <div
      className={cn(styles.searchWrapper, className)}
      data-slot="emoji-picker-search-wrapper"
    >
      <SearchIcon className={styles.searchIcon} />
      <EmojiPickerPrimitive.Search
        ref={ref}
        className={styles.search}
        data-slot="emoji-picker-search"
        {...props}
      />
    </div>
  );
});

function EmojiPickerRow({ children, ...props }: EmojiPickerListRowProps) {
  return (
    <div {...props} className={styles.row} data-slot="emoji-picker-row">
      {children}
    </div>
  );
}

function EmojiPickerEmoji({
  emoji,
  className,
  ...props
}: EmojiPickerListEmojiProps) {
  return (
    <button
      {...props}
      className={cn(styles.emoji, className)}
      data-slot="emoji-picker-emoji"
    >
      {emoji.emoji}
    </button>
  );
}

function EmojiPickerCategoryHeader({
  category,
  ...props
}: EmojiPickerListCategoryHeaderProps) {
  return (
    <div
      {...props}
      className={styles.categoryHeader}
      data-slot="emoji-picker-category-header"
    >
      {category.label}
    </div>
  );
}

function EmojiPickerContent({
  className,
  ...props
}: ComponentProps<typeof EmojiPickerPrimitive.Viewport>) {
  return (
    <EmojiPickerPrimitive.Viewport
      className={cn(styles.viewport, className)}
      data-slot="emoji-picker-viewport"
      {...props}
    >
      <EmojiPickerPrimitive.Loading
        className={styles.loading}
        data-slot="emoji-picker-loading"
      >
        <LoaderIcon className="spin" />
      </EmojiPickerPrimitive.Loading>
      <EmojiPickerPrimitive.Empty
        className={styles.empty}
        data-slot="emoji-picker-empty"
      >
        No emoji found.
      </EmojiPickerPrimitive.Empty>
      <EmojiPickerPrimitive.List
        className={styles.list}
        components={{
          Row: EmojiPickerRow,
          Emoji: EmojiPickerEmoji,
          CategoryHeader: EmojiPickerCategoryHeader,
        }}
        data-slot="emoji-picker-list"
      />
    </EmojiPickerPrimitive.Viewport>
  );
}

function EmojiPickerFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(styles.footer, className)}
      data-slot="emoji-picker-footer"
      {...props}
    >
      <EmojiPickerPrimitive.ActiveEmoji>
        {({ emoji }) =>
          emoji ? (
            <>
              <div className={styles.activeEmoji}>{emoji.emoji}</div>
              <span className={styles.activeLabel}>{emoji.label}</span>
            </>
          ) : (
            <span className={styles.placeholder}>Select an emoji…</span>
          )
        }
      </EmojiPickerPrimitive.ActiveEmoji>
    </div>
  );
}

/** Full-width row above the footer — clears the current emoji selection. */
function EmojiPickerClear({
  onClear,
  label = "No icon",
  className,
}: {
  onClear: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(styles.clearRow, className)}
      data-slot="emoji-picker-clear"
    >
      <button type="button" className={styles.clearButton} onClick={onClear}>
        {label}
      </button>
    </div>
  );
}

export {
  EmojiPicker,
  EmojiPickerClear,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
};
