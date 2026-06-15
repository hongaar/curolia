import { cn } from "../../lib/utils";
import { HoverTooltip } from "../tooltip/hover-tooltip";
import { computeTripTimelinePositions } from "./trip-timeline-positions";
import styles from "./trip-timeline.module.css";

export type TripTimelineItem = {
  id: string;
  title: string;
  color: string | null;
  date: string;
};

export function TripTimeline({
  items,
  currentId,
  onSelect,
  ariaLabel = "Trip timeline",
}: {
  items: TripTimelineItem[];
  currentId: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
}) {
  if (items.length < 2) return null;

  const positions = computeTripTimelinePositions(items);

  return (
    <div className={styles.root} role="group" aria-label={ariaLabel}>
      <div className={styles.rail}>
        <div className={styles.track} aria-hidden />
        {items.map((item, index) => {
          const isActive = item.id === currentId;
          const color = item.color?.trim() || "var(--primary)";
          const position = positions[index] ?? 0;

          return (
            <div
              key={item.id}
              className={styles.stopSlot}
              style={{ left: `${position}%` }}
            >
              <HoverTooltip
                content={item.title}
                delay={0}
                closeDelay={0}
                className={styles.tooltipTrigger}
              >
                <button
                  type="button"
                  className={styles.stopHit}
                  aria-label={`${item.title}${isActive ? " (current)" : ""}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onSelect(item.id)}
                >
                  <span
                    className={cn(styles.dot, isActive && styles.dotActive)}
                    style={
                      isActive
                        ? {
                            background: color,
                            boxShadow: `0 0 0 2px var(--card), 0 0 0 4px ${color}`,
                          }
                        : { background: color }
                    }
                    aria-hidden
                  />
                </button>
              </HoverTooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
}
