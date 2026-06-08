import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getEmojiLabel, loadEmojiLabels } from "../../lib/emoji-label";
import { buttonClassName } from "../button";
import {
  ColorPicker,
  ColorPickerGrid,
  ColorPickerTitle,
} from "../color-picker";
import {
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPicker as EmojiPickerRoot,
  EmojiPickerSearch,
} from "../emoji-picker";
import { Label } from "../label";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import styles from "./picker.module.css";

type PresetColorPickerProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (hex: string) => void;
  colors: readonly (readonly string[])[];
};

export function PresetColorPicker({
  id,
  label,
  value,
  onChange,
  colors,
}: PresetColorPickerProps) {
  const normalized = value.toLowerCase();

  return (
    <div className={styles.root}>
      {label ? (
        <Label htmlFor={id} className={styles.blockLabel}>
          {label}
        </Label>
      ) : null}
      <div className={styles.triggerWrap}>
        <Popover>
          <PopoverTrigger
            id={id}
            type="button"
            className={buttonClassName({
              variant: "outline",
              size: "lg",
              className: styles.trigger,
            })}
          >
            <span className={styles.triggerInner}>
              <span
                className={styles.colorSwatch}
                style={{ backgroundColor: value }}
                aria-hidden
              />
              <span className={styles.colorValue}>{normalized}</span>
            </span>
            <ChevronDown className={styles.chevron} aria-hidden />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            className={styles.popoverWide}
          >
            <ColorPicker value={value} colors={colors} onColorSelect={onChange}>
              <ColorPickerTitle>Preset colors</ColorPickerTitle>
              <ColorPickerGrid />
            </ColorPicker>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

type EmojiFieldPickerProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (emoji: string) => void;
  disabled?: boolean;
};

export function EmojiFieldPicker({
  id,
  label,
  value,
  onChange,
  disabled = false,
}: EmojiFieldPickerProps) {
  const [open, setOpen] = useState(false);
  const [emojiLabel, setEmojiLabel] = useState<string | undefined>(() =>
    value ? getEmojiLabel(value) : undefined,
  );
  const searchRef = useRef<HTMLInputElement>(null);
  const displayChar = value || "📍";
  const hintText = value ? emojiLabel : "Choose emoji";

  useEffect(() => {
    if (!value) {
      setEmojiLabel(undefined);
      return;
    }

    const cached = getEmojiLabel(value);
    if (cached) {
      setEmojiLabel(cached);
      return;
    }

    let cancelled = false;
    void loadEmojiLabels().then(() => {
      if (!cancelled) {
        setEmojiLabel(getEmojiLabel(value));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className={styles.root}>
      <Label htmlFor={id} className={styles.blockLabel}>
        {label}
      </Label>
      <div className={styles.triggerWrap}>
        <Popover
          open={disabled ? false : open}
          onOpenChange={(o) => !disabled && setOpen(o)}
        >
          <PopoverTrigger
            id={id}
            type="button"
            disabled={disabled}
            className={buttonClassName({
              variant: "outline",
              size: "lg",
              className: styles.trigger,
            })}
          >
            <span className={styles.triggerInner}>
              <span className={styles.emojiDisplay} aria-hidden>
                {displayChar}
              </span>
              <span className={styles.emojiHint}>{hintText}</span>
            </span>
            <ChevronDown className={styles.chevron} aria-hidden />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            className={styles.popoverEmoji}
            initialFocus={searchRef}
          >
            <EmojiPickerRoot
              className={styles.emojiPickerRoot}
              onEmojiSelect={(emoji) => {
                setEmojiLabel(emoji.label);
                onChange(emoji.emoji);
                setOpen(false);
              }}
            >
              <EmojiPickerSearch ref={searchRef} />
              <EmojiPickerContent className={styles.emojiPickerContent} />
              <EmojiPickerFooter />
            </EmojiPickerRoot>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export const pickerUiStyles = styles;
