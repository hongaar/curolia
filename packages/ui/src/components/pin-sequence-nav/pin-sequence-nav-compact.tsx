import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../button";
import { HoverTooltip } from "../tooltip/hover-tooltip";
import type { PinSequenceNavEndpoint } from "./pin-sequence-nav";
import styles from "./pin-sequence-nav-compact.module.css";

function CompactNavSlot({
  direction,
  endpoint,
}: {
  direction: "previous" | "next";
  endpoint: PinSequenceNavEndpoint | null;
}) {
  const heading = direction === "previous" ? "Previous" : "Next";
  const icon =
    direction === "previous" ? (
      <ChevronLeft aria-hidden />
    ) : (
      <ChevronRight aria-hidden />
    );

  if (!endpoint) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={styles.roundButton}
        disabled
        aria-label={heading}
        aria-disabled
      >
        {icon}
      </Button>
    );
  }

  const ariaLabel = `${heading}: ${endpoint.title}`;
  const button = endpoint.href ? (
    <Button
      variant="ghost"
      size="icon-sm"
      className={styles.roundButton}
      aria-label={ariaLabel}
      render={<Link to={endpoint.href} />}
      onClick={endpoint.onClick}
    >
      {icon}
    </Button>
  ) : (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={styles.roundButton}
      aria-label={ariaLabel}
      onClick={endpoint.onClick}
    >
      {icon}
    </Button>
  );

  return (
    <HoverTooltip
      content={endpoint.title}
      delay={0}
      closeDelay={0}
      className={styles.tooltipTrigger}
    >
      {button}
    </HoverTooltip>
  );
}

export function PinSequenceNavCompact({
  previous,
  next,
  ariaLabel = "Trip stops",
}: {
  previous?: PinSequenceNavEndpoint | null;
  next?: PinSequenceNavEndpoint | null;
  ariaLabel?: string;
}) {
  if (!previous && !next) return null;

  return (
    <nav className={styles.root} aria-label={ariaLabel}>
      <CompactNavSlot direction="previous" endpoint={previous ?? null} />
      <CompactNavSlot direction="next" endpoint={next ?? null} />
    </nav>
  );
}
