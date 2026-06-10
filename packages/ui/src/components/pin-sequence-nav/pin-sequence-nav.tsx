import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "../../lib/utils";
import {
  buildPinSequenceDotSegments,
  type PinSequenceDotSegment,
} from "./pin-sequence-dots";
import styles from "./pin-sequence-nav.module.css";

export type PinSequenceNavItem = {
  id: string;
  title: string;
  color: string | null;
};

export type PinSequenceNavEndpoint = {
  title: string;
  href?: string;
  onClick?: () => void;
};

function SequenceNavControl({
  direction,
  endpoint,
}: {
  direction: "previous" | "next";
  endpoint: PinSequenceNavEndpoint;
}) {
  const heading = direction === "previous" ? "Previous" : "Next";
  const ariaLabel = `${heading}: ${endpoint.title}`;
  const icon =
    direction === "previous" ? (
      <ChevronLeft className={styles.arrowIcon} aria-hidden />
    ) : (
      <ChevronRight className={styles.arrowIcon} aria-hidden />
    );
  const text = (
    <span className={styles.navLinkText}>
      <span className={styles.navLinkLabel}>{heading}</span>
      <span className={styles.navLinkTitle}>{endpoint.title}</span>
    </span>
  );
  const content =
    direction === "previous" ? (
      <>
        {icon}
        {text}
      </>
    ) : (
      <>
        {text}
        {icon}
      </>
    );
  const className = cn(
    styles.navControl,
    direction === "previous"
      ? styles.navControlPrevious
      : styles.navControlNext,
  );

  if (endpoint.href) {
    return (
      <Link
        to={endpoint.href}
        className={className}
        aria-label={ariaLabel}
        onClick={endpoint.onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={endpoint.onClick}
    >
      {content}
    </button>
  );
}

function collapsedLabel(
  segment: Extract<PinSequenceDotSegment, { kind: "collapsed" }>,
) {
  const noun = segment.count === 1 ? "stop" : "stops";
  return segment.side === "left"
    ? `${segment.count} earlier ${noun}`
    : `${segment.count} later ${noun}`;
}

function CollapsedDots({
  segment,
  interactive,
  onSelectIndex,
}: {
  segment: Extract<PinSequenceDotSegment, { kind: "collapsed" }>;
  interactive: boolean;
  onSelectIndex?: (index: number) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={false}
      aria-label={collapsedLabel(segment)}
      className={styles.collapsedButton}
      disabled={!interactive}
      onClick={
        onSelectIndex ? () => onSelectIndex(segment.targetIndex) : undefined
      }
    >
      <span className={styles.collapsedDot} aria-hidden />
      <span className={styles.collapsedDot} aria-hidden />
      <span className={styles.collapsedDot} aria-hidden />
    </button>
  );
}

function PinSequenceDots({
  items,
  currentIndex,
  onSelectIndex,
  ariaLabel,
}: {
  items: PinSequenceNavItem[];
  currentIndex: number;
  onSelectIndex?: (index: number) => void;
  ariaLabel: string;
}) {
  const segments = buildPinSequenceDotSegments(items, currentIndex);
  const interactive = Boolean(onSelectIndex);

  return (
    <div className={styles.dots} role="tablist" aria-label={ariaLabel}>
      {segments.map((segment) => {
        if (segment.kind === "collapsed") {
          return (
            <CollapsedDots
              key={`collapsed-${segment.side}`}
              segment={segment}
              interactive={interactive}
              onSelectIndex={onSelectIndex}
            />
          );
        }

        const { index, item } = segment;
        const isActive = index === currentIndex;
        const color = item.color?.trim() || "var(--primary)";

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`${item.title}${isActive ? " (current)" : ""}`}
            className={cn(
              styles.dot,
              isActive && styles.dotActive,
              interactive && styles.dotInteractive,
            )}
            style={{
              background: isActive
                ? color
                : `color-mix(in oklch, ${color} 40%, transparent)`,
            }}
            disabled={!interactive}
            onClick={onSelectIndex ? () => onSelectIndex(index) : undefined}
          />
        );
      })}
    </div>
  );
}

export function PinSequenceNav({
  items,
  currentIndex,
  onSelectIndex,
  previous,
  next,
  showDots = true,
  ariaLabel = "Trip stops",
  dotsAriaLabel = "Trip stops",
}: {
  items: PinSequenceNavItem[];
  currentIndex: number;
  onSelectIndex?: (index: number) => void;
  previous?: PinSequenceNavEndpoint | null;
  next?: PinSequenceNavEndpoint | null;
  /** Progress dots between prev/next links; omit on narrow detail or side sheet. */
  showDots?: boolean;
  ariaLabel?: string;
  dotsAriaLabel?: string;
}) {
  if (items.length < 2 || currentIndex < 0) return null;

  const hasEndpoints = Boolean(previous || next);
  if (!showDots && !hasEndpoints) return null;

  const dots = showDots ? (
    <PinSequenceDots
      items={items}
      currentIndex={currentIndex}
      onSelectIndex={onSelectIndex}
      ariaLabel={dotsAriaLabel}
    />
  ) : null;

  return (
    <nav className={styles.root} aria-label={ariaLabel}>
      <div className={styles.panel}>
        {hasEndpoints ? (
          <div className={cn(styles.row, !showDots && styles.rowEndpointsOnly)}>
            <div className={styles.endpointSlot}>
              {previous ? (
                <SequenceNavControl direction="previous" endpoint={previous} />
              ) : null}
            </div>
            {dots ? <div className={styles.dotsSlot}>{dots}</div> : null}
            <div className={cn(styles.endpointSlot, styles.endpointNext)}>
              {next ? (
                <SequenceNavControl direction="next" endpoint={next} />
              ) : null}
            </div>
          </div>
        ) : (
          <div className={styles.dotsOnly}>{dots}</div>
        )}
      </div>
    </nav>
  );
}
