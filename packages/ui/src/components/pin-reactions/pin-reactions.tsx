import { PlusIcon } from "lucide-react";
import {
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "../emoji-picker";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import styles from "./pin-reactions.module.css";

export type PinReactionChipItem = {
  emoji: string;
  count: number;
  /** Viewer has this reaction selected. */
  active?: boolean;
};

export type PinReactionBarProps = {
  /** Existing reactions on the pin (any emoji). */
  reactions: readonly PinReactionChipItem[];
  /** Quick-add emojis shown when not already in `reactions`. */
  quickAddEmojis?: readonly string[];
  onToggle?: (emoji: string) => void;
  onCustomEmoji?: (emoji: string) => void;
  disabled?: boolean;
  /** When false, chips are read-only (no add controls). */
  interactive?: boolean;
  "aria-label"?: string;
};

function chipClassName(active: boolean, readOnly: boolean) {
  return [
    styles.chip,
    active ? styles.chipActive : null,
    readOnly ? styles.chipReadOnly : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export function PinReactionChip({
  emoji,
  count,
  active = false,
  disabled = false,
  readOnly = false,
  onClick,
  ...props
}: {
  emoji: string;
  count?: number;
  active?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onClick?: () => void;
} & Omit<ComponentPropsWithoutRef<"button">, "onClick">) {
  const showCount = count != null && count > 0;
  const Tag = readOnly ? "span" : "button";

  return (
    <Tag
      type={readOnly ? undefined : "button"}
      className={chipClassName(active, readOnly)}
      disabled={readOnly ? undefined : disabled}
      aria-pressed={readOnly ? undefined : active}
      onClick={readOnly ? undefined : onClick}
      {...props}
    >
      <span className={styles.emoji} aria-hidden>
        {emoji}
      </span>
      {showCount ? <span className={styles.count}>{count}</span> : null}
    </Tag>
  );
}

export function PinReactionCustomPicker({
  disabled = false,
  onEmojiSelect,
  trigger,
}: {
  disabled?: boolean;
  onEmojiSelect: (emoji: string) => void;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <Popover open={disabled ? false : open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        aria-label="Choose emoji"
        className={styles.customAdd}
      >
        {trigger ?? <PlusIcon aria-hidden />}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className={styles.popoverEmoji}
        initialFocus={searchRef}
      >
        <EmojiPicker
          className={styles.emojiPickerRoot}
          onEmojiSelect={(emoji) => {
            onEmojiSelect(emoji.emoji);
            setOpen(false);
          }}
        >
          <EmojiPickerSearch ref={searchRef} placeholder="Search emoji…" />
          <EmojiPickerContent className={styles.emojiPickerContent} />
          <EmojiPickerFooter />
        </EmojiPicker>
      </PopoverContent>
    </Popover>
  );
}

export function PinReactionBar({
  reactions,
  quickAddEmojis = [],
  onToggle,
  onCustomEmoji,
  disabled = false,
  interactive = true,
  "aria-label": ariaLabel = "Pin reactions",
}: PinReactionBarProps) {
  const readOnly = !interactive || !onToggle;
  const present = new Set(reactions.map((reaction) => reaction.emoji));
  const quickAdds = quickAddEmojis.filter((emoji) => !present.has(emoji));
  const showCustom = interactive && onCustomEmoji;

  if (reactions.length === 0 && quickAdds.length === 0 && !showCustom) {
    return null;
  }

  return (
    <div className={styles.bar} role="group" aria-label={ariaLabel}>
      {reactions.map((reaction) => (
        <PinReactionChip
          key={reaction.emoji}
          emoji={reaction.emoji}
          count={reaction.count}
          active={reaction.active}
          readOnly={readOnly}
          disabled={disabled}
          onClick={() => onToggle?.(reaction.emoji)}
        />
      ))}
      {interactive && onToggle
        ? quickAdds.map((emoji) => (
            <button
              key={`add-${emoji}`}
              type="button"
              className={styles.addChip}
              disabled={disabled}
              aria-label={`React with ${emoji}`}
              onClick={() => onToggle(emoji)}
            >
              <span className={styles.emoji} aria-hidden>
                {emoji}
              </span>
            </button>
          ))
        : null}
      {showCustom ? (
        <PinReactionCustomPicker
          disabled={disabled}
          onEmojiSelect={onCustomEmoji}
        />
      ) : null}
    </div>
  );
}
