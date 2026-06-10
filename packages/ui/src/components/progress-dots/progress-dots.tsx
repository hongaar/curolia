import { cn } from "../../lib/utils";
import styles from "./progress-dots.module.css";

export type ProgressDotItem = {
  id: string;
  /** Pin/tag color; falls back to muted foreground when omitted. */
  color?: string | null;
  label?: string;
};

export function ProgressDots({
  items,
  currentIndex,
  onSelectIndex,
  ariaLabel = "Progress",
  showCompletedStyle = true,
}: {
  items: ProgressDotItem[];
  currentIndex: number;
  onSelectIndex?: (index: number) => void;
  ariaLabel?: string;
  /** When true, dots before `currentIndex` use a softer completed style. */
  showCompletedStyle?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className={styles.root} role="tablist" aria-label={ariaLabel}>
      {items.map((item, index) => {
        const isActive = index === currentIndex;
        const isDone = showCompletedStyle && index < currentIndex;
        const color = item.color?.trim() || null;
        const interactive = Boolean(onSelectIndex);

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={
              item.label ??
              `Step ${index + 1} of ${items.length}${isActive ? " (current)" : ""}`
            }
            className={cn(
              styles.dot,
              isActive && styles.dotActive,
              isDone && styles.dotDone,
              interactive && styles.dotInteractive,
            )}
            style={
              color
                ? {
                    background: isActive
                      ? color
                      : isDone
                        ? `color-mix(in oklch, ${color} 55%, transparent)`
                        : `color-mix(in oklch, ${color} 40%, transparent)`,
                  }
                : isActive
                  ? { background: "var(--primary)" }
                  : isDone
                    ? {
                        background:
                          "color-mix(in oklch, var(--primary) 55%, transparent)",
                      }
                    : undefined
            }
            disabled={!interactive}
            onClick={onSelectIndex ? () => onSelectIndex(index) : undefined}
          />
        );
      })}
    </div>
  );
}
