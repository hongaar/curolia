import { createContext, useContext, useId, type ReactNode } from "react";

import { cn } from "../../lib/utils";
import styles from "./choice-cards.module.css";

type ChoiceCardsContextValue<T extends string> = {
  name: string;
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
};

const ChoiceCardsContext =
  createContext<ChoiceCardsContextValue<string> | null>(null);

function useChoiceCardsContext<T extends string>() {
  const ctx = useContext(ChoiceCardsContext);
  if (!ctx) {
    throw new Error("ChoiceCard must be used within ChoiceCards");
  }
  return ctx as unknown as ChoiceCardsContextValue<T>;
}

export function ChoiceCards<T extends string>({
  name,
  value,
  onValueChange,
  disabled = false,
  "aria-labelledby": ariaLabelledBy,
  className,
  children,
}: {
  name: string;
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
  "aria-labelledby"?: string;
  className?: string;
  children: ReactNode;
}) {
  const fallbackLabelId = useId();
  const labelledBy = ariaLabelledBy ?? fallbackLabelId;

  return (
    <ChoiceCardsContext.Provider
      value={{
        name,
        value,
        onValueChange: onValueChange as (value: string) => void,
        disabled,
      }}
    >
      {!ariaLabelledBy ? (
        <span id={fallbackLabelId} className={styles.srOnlyInput}>
          Choice
        </span>
      ) : null}
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        className={cn(styles.root, className)}
      >
        {children}
      </div>
    </ChoiceCardsContext.Provider>
  );
}

export function ChoiceCard<T extends string>({
  value,
  label,
  description,
  previewSrc,
  previewAlt,
  preview,
  previewIcon,
  previewTone,
  footer,
}: {
  value: T;
  label: string;
  description?: string;
  previewSrc?: string;
  previewAlt?: string;
  preview?: ReactNode;
  /** Centered icon in the preview area (use with `previewTone`). */
  previewIcon?: ReactNode;
  /** Tint for the preview area when using `previewIcon`. */
  previewTone?: "yellow" | "green" | "muted";
  /** Extra controls below the label; clicks do not select this card. */
  footer?: ReactNode;
}) {
  const {
    name,
    value: selectedValue,
    onValueChange,
    disabled,
  } = useChoiceCardsContext<T>();
  const selected = selectedValue === value;
  const inputId = `${name}-${value}`;

  return (
    <div className={cn(styles.card, selected && styles.cardSelected)}>
      <label htmlFor={inputId} className={styles.cardSelect}>
        <input
          id={inputId}
          className={styles.srOnlyInput}
          type="radio"
          name={name}
          value={value}
          checked={selected}
          disabled={disabled}
          onChange={() => onValueChange(value)}
        />
        <div
          className={cn(
            styles.preview,
            previewTone === "yellow" && styles.previewToneYellow,
            previewTone === "green" && styles.previewToneGreen,
            previewTone === "muted" && styles.previewToneMuted,
          )}
          aria-hidden
        >
          {preview ? (
            preview
          ) : previewIcon ? (
            <div className={styles.previewIconWrap}>{previewIcon}</div>
          ) : previewSrc ? (
            <img
              className={styles.previewImage}
              src={previewSrc}
              alt={previewAlt ?? label}
            />
          ) : (
            <div className={styles.previewPlaceholder}>{label}</div>
          )}
        </div>
        <span className={styles.body}>
          <span className={styles.label}>{label}</span>
          {description ? (
            <span className={styles.description}>{description}</span>
          ) : null}
        </span>
      </label>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
}
