import { useEffect, useRef, useState } from "react";

import { getEmojiLabel, loadEmojiLabels } from "../../lib/emoji-label";
import { cn } from "../../lib/utils";
import {
  ColorPicker,
  ColorPickerGrid,
  ColorPickerRandom,
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
import styles from "./entity-label-input.module.css";

export { randomFromColorGrid } from "../color-picker";

type EntityLabelInputProps = {
  id?: string;
  label?: string;
  name: string;
  onNameChange: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  color?: string;
  onColorChange?: (hex: string) => void;
  colors?: readonly (readonly string[])[];
  emoji?: string;
  onEmojiChange?: (emoji: string) => void;
  emojiFallback?: string;
};

export function EntityLabelInput({
  id,
  label,
  name,
  onNameChange,
  placeholder,
  disabled = false,
  color,
  onColorChange,
  colors,
  emoji,
  onEmojiChange,
  emojiFallback = "📍",
}: EntityLabelInputProps) {
  const showColor = Boolean(onColorChange && colors && color != null);
  const showEmoji = Boolean(onEmojiChange);
  const [colorOpen, setColorOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiLabel, setEmojiLabel] = useState<string | undefined>(() =>
    emoji ? getEmojiLabel(emoji) : undefined,
  );
  const emojiSearchRef = useRef<HTMLInputElement>(null);
  const normalizedColor = (color ?? "").toLowerCase();
  const displayEmoji = emoji || emojiFallback;

  useEffect(() => {
    if (!emoji) {
      setEmojiLabel(undefined);
      return;
    }

    const cached = getEmojiLabel(emoji);
    if (cached) {
      setEmojiLabel(cached);
      return;
    }

    let cancelled = false;
    void loadEmojiLabels().then(() => {
      if (!cancelled) {
        setEmojiLabel(getEmojiLabel(emoji));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [emoji]);

  return (
    <div className={styles.root}>
      {label ? (
        <Label htmlFor={id} className={styles.blockLabel}>
          {label}
        </Label>
      ) : null}
      <div
        className={cn(
          styles.field,
          disabled ? styles.fieldDisabled : undefined,
        )}
      >
        {showColor || showEmoji ? (
          <div className={styles.adornments}>
            {showColor ? (
              <Popover
                open={disabled ? false : colorOpen}
                onOpenChange={(open) => !disabled && setColorOpen(open)}
              >
                <PopoverTrigger
                  type="button"
                  disabled={disabled}
                  className={styles.adornmentButton}
                  aria-label={
                    color
                      ? `Color ${normalizedColor}. Choose color`
                      : "Choose color"
                  }
                >
                  <span
                    className={styles.colorSwatch}
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={6}
                  className={styles.popoverColor}
                >
                  <ColorPicker
                    value={color!}
                    colors={colors!}
                    onColorSelect={(hex) => {
                      onColorChange!(hex);
                      setColorOpen(false);
                    }}
                  >
                    <ColorPickerTitle />
                    <ColorPickerGrid />
                    <ColorPickerRandom />
                  </ColorPicker>
                </PopoverContent>
              </Popover>
            ) : null}
            {showEmoji ? (
              <Popover
                open={disabled ? false : emojiOpen}
                onOpenChange={(open) => !disabled && setEmojiOpen(open)}
              >
                <PopoverTrigger
                  type="button"
                  disabled={disabled}
                  className={styles.adornmentButton}
                  aria-label={
                    emoji && emojiLabel
                      ? `Icon ${emojiLabel}. Choose icon`
                      : "Choose icon"
                  }
                >
                  <span className={styles.emojiDisplay} aria-hidden>
                    {displayEmoji}
                  </span>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={6}
                  className={styles.popoverEmoji}
                  initialFocus={emojiSearchRef}
                >
                  <EmojiPickerRoot
                    className={styles.emojiPickerRoot}
                    onEmojiSelect={(selected) => {
                      setEmojiLabel(selected.label);
                      onEmojiChange!(selected.emoji);
                      setEmojiOpen(false);
                    }}
                  >
                    <EmojiPickerSearch ref={emojiSearchRef} />
                    <EmojiPickerContent className={styles.emojiPickerContent} />
                    <EmojiPickerFooter />
                  </EmojiPickerRoot>
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
        ) : null}
        <input
          id={id}
          type="text"
          className={styles.input}
          value={name}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </div>
    </div>
  );
}
