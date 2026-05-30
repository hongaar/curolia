import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { buttonClassName } from "../button";
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
            <p className={styles.popoverTitle}>Preset colors</p>
            <div
              className={styles.colorGrid}
              role="listbox"
              aria-label="Color presets"
            >
              {colors.map((row, ri) =>
                row.map((hex, ci) => {
                  const selected = hex.toLowerCase() === normalized;
                  return (
                    <button
                      key={`${ri}-${ci}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={
                        selected
                          ? `${styles.colorSwatchButton} ${styles.colorSwatchButtonSelected}`
                          : styles.colorSwatchButton
                      }
                      style={{ backgroundColor: hex }}
                      title={hex}
                      onClick={() => onChange(hex)}
                    />
                  );
                }),
              )}
            </div>
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
  const displayChar = value || "📍";

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
              <span className={styles.emojiHint}>Choose emoji</span>
            </span>
            <ChevronDown className={styles.chevron} aria-hidden />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            className={styles.popoverEmoji}
          >
            <EmojiPickerRoot
              className={styles.emojiPickerRoot}
              onEmojiSelect={(emoji) => {
                onChange(emoji.emoji);
                setOpen(false);
              }}
            >
              <EmojiPickerSearch />
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
