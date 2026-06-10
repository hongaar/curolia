import { Shuffle } from "lucide-react";
import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from "react";

import { cn } from "../../lib/utils";
import styles from "./color-picker.module.css";

export function randomFromColorGrid(
  colors: readonly (readonly string[])[],
): string {
  const flat = colors.flat();
  return flat[Math.floor(Math.random() * flat.length)] ?? "#6366f1";
}

type ColorPickerContextValue = {
  value: string;
  normalizedValue: string;
  colors: readonly (readonly string[])[];
  columns: number;
  onColorSelect: (hex: string) => void;
};

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null);

function useColorPickerContext(): ColorPickerContextValue {
  const context = useContext(ColorPickerContext);
  if (!context) {
    throw new Error("ColorPicker components must be used within ColorPicker");
  }
  return context;
}

type ColorPickerProps = {
  value: string;
  colors: readonly (readonly string[])[];
  onColorSelect: (hex: string) => void;
  columns?: number;
  className?: string;
  children?: ReactNode;
};

function ColorPicker({
  value,
  colors,
  onColorSelect,
  columns = 8,
  className,
  children,
}: ColorPickerProps) {
  const normalizedValue = value.toLowerCase();

  return (
    <ColorPickerContext.Provider
      value={{
        value,
        normalizedValue,
        colors,
        columns,
        onColorSelect,
      }}
    >
      <div className={cn(styles.root, className)} data-slot="color-picker">
        {children}
      </div>
    </ColorPickerContext.Provider>
  );
}

function ColorPickerTitle({
  className,
  children = "Color",
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      {...props}
      className={cn(styles.title, className)}
      data-slot="color-picker-title"
    >
      {children}
    </p>
  );
}

function ColorPickerGrid({ className, ...props }: ComponentProps<"div">) {
  const { colors, columns, normalizedValue, onColorSelect } =
    useColorPickerContext();

  return (
    <div
      {...props}
      className={cn(styles.grid, className)}
      style={{ gridTemplateColumns: `repeat(${columns}, auto)` }}
      role="listbox"
      aria-label="Color presets"
      data-slot="color-picker-grid"
    >
      {colors.map((row, rowIndex) =>
        row.map((hex, columnIndex) => {
          const selected = hex.toLowerCase() === normalizedValue;
          return (
            <button
              key={`${rowIndex}-${columnIndex}`}
              type="button"
              role="option"
              aria-selected={selected}
              aria-label={hex}
              className={cn(styles.swatch, selected && styles.swatchSelected)}
              title={hex}
              data-slot="color-picker-swatch"
              onClick={() => onColorSelect(hex)}
            >
              <span
                className={styles.swatchColor}
                style={{ backgroundColor: hex }}
                aria-hidden
              />
            </button>
          );
        }),
      )}
    </div>
  );
}

type ColorPickerRandomProps = Omit<ComponentProps<"button">, "onClick"> & {
  label?: string;
};

function ColorPickerRandom({
  className,
  label = "Random color",
  ...props
}: ColorPickerRandomProps) {
  const { colors, onColorSelect } = useColorPickerContext();

  return (
    <div className={styles.randomRow} data-slot="color-picker-random-row">
      <button
        {...props}
        type="button"
        className={cn(styles.randomButton, className)}
        data-slot="color-picker-random"
        onClick={() => onColorSelect(randomFromColorGrid(colors))}
      >
        <Shuffle className={styles.randomIcon} aria-hidden />
        {label}
      </button>
    </div>
  );
}

function ColorPickerFooter({ className, ...props }: ComponentProps<"div">) {
  const { value, normalizedValue } = useColorPickerContext();

  return (
    <div
      {...props}
      className={cn(styles.footer, className)}
      data-slot="color-picker-footer"
    >
      {value ? (
        <>
          <span
            className={styles.footerSwatch}
            style={{ backgroundColor: value }}
            aria-hidden
          />
          <span className={styles.footerValue}>{normalizedValue}</span>
        </>
      ) : (
        <span className={styles.footerPlaceholder}>Select a color…</span>
      )}
    </div>
  );
}

export {
  ColorPicker,
  ColorPickerFooter,
  ColorPickerGrid,
  ColorPickerRandom,
  ColorPickerTitle,
};
