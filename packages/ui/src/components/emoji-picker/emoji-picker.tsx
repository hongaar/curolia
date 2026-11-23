"use client";

import {
  EmojiPicker as EmojiPickerPrimitive,
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListEmojiProps,
  type EmojiPickerListRowProps,
} from "frimousse";
import { LoaderIcon, SearchIcon } from "lucide-react";
import { forwardRef, type ComponentProps, type CSSProperties } from "react";

import { cn } from "../../lib/utils";
import styles from "./emoji-picker.module.css";

const EMOJIBASE_URL = "https://cdn.jsdelivr.net/npm/emojibase-data@latest";

/** Shared emoji font stack (see `--font-emoji` in tokens.css). */
const EMOJI_FONT = "var(--font-emoji)";

/** Newest-first samples per emoji version, probed like frimousse does. */
const EMOJI_VERSION_SAMPLES: [number, string][] = [
  [16, "\u{1FAE9}"],
  [15.1, "\u{1F642}\u200D\u2194\uFE0F"],
  [15, "\u{1FAE8}"],
  [14, "\u{1FAE0}"],
  [13, "\u{1F972}"],
  [12, "\u{1F971}"],
  [11, "\u{1F970}"],
];

function canRenderEmoji(ctx: CanvasRenderingContext2D, emoji: string) {
  const size = 2;
  ctx.clearRect(0, 0, size, size);
  if (ctx.measureText(emoji).width >= size * 2) return false;
  ctx.fillStyle = "#00f";
  ctx.fillText(emoji, 0, 0);
  const blue = ctx.getImageData(0, 0, size, size).data;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#f00";
  ctx.fillText(emoji, 0, 0);
  const red = ctx.getImageData(0, 0, size, size).data;
  for (let i = 0; i < blue.length; i += 4) {
    if (
      blue[i] !== red[i] ||
      blue[i + 1] !== red[i + 1] ||
      blue[i + 2] !== red[i + 2]
    ) {
      return false;
    }
  }
  return true;
}

function detectEmojiVersion(): number | undefined {
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 2;
    ctx = canvas.getContext("2d", { willReadFrequently: true });
  } catch {
    return undefined;
  }
  if (!ctx) return undefined;
  const fontStack =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--font-emoji")
      .trim() || "sans-serif";
  ctx.font = `2px ${fontStack}`;
  ctx.textBaseline = "middle";
  for (const [version, sample] of EMOJI_VERSION_SAMPLES) {
    if (canRenderEmoji(ctx, sample)) return version;
  }
  return 11;
}

/**
 * Frimousse hides country flags when its canvas probe (system emoji fonts only)
 * cannot render them — e.g. on Windows. We ship a flag web font, so force the
 * cached capability flag on. Relies on frimousse 0.4 sessionStorage metadata.
 */
function enableCountryFlags(emojibaseUrl: string) {
  if (typeof sessionStorage === "undefined") return;
  const key = `frimousse/metadata/${emojibaseUrl}`;
  try {
    const raw = sessionStorage.getItem(key);
    const meta = raw
      ? (JSON.parse(raw) as Record<string, unknown>)
      : { revalidated: [] };
    if (meta.countryFlags === true && typeof meta.emojiVersion === "number") {
      return;
    }
    const emojiVersion =
      typeof meta.emojiVersion === "number"
        ? meta.emojiVersion
        : detectEmojiVersion();
    if (emojiVersion === undefined) return;
    sessionStorage.setItem(
      key,
      JSON.stringify({
        revalidated: [],
        ...meta,
        emojiVersion,
        countryFlags: true,
      }),
    );
  } catch {
    // sessionStorage unavailable — flags fall back to frimousse's detection.
  }
}

function EmojiPicker({
  className,
  style,
  columns = 8,
  emojibaseUrl = EMOJIBASE_URL,
  ...props
}: ComponentProps<typeof EmojiPickerPrimitive.Root>) {
  enableCountryFlags(emojibaseUrl);
  return (
    <EmojiPickerPrimitive.Root
      className={cn(styles.root, className)}
      data-slot="emoji-picker"
      columns={columns}
      emojibaseUrl={emojibaseUrl}
      style={
        { "--frimousse-emoji-font": EMOJI_FONT, ...style } as CSSProperties
      }
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
