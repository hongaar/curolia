"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils";
import { MarkdownContent } from "../markdown-content";
import styles from "./pin-detail-description.module.css";

export function PinDetailDescription({
  markdown,
  collapsible = true,
}: {
  markdown: string;
  /** When false, always show the full description (e.g. standalone pin detail page). */
  collapsible?: boolean;
}) {
  const trimmed = markdown.trim();
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el || !collapsible || expanded) return;

    const measure = () => {
      const styles = getComputedStyle(el);
      const lineHeight = Number.parseFloat(styles.lineHeight);
      const maxLines = Number.parseInt(
        styles.getPropertyValue("--pin-detail-description-collapsed-lines") ||
          "5",
        10,
      );
      if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
        setOverflows(el.scrollHeight > el.clientHeight + 1);
        return;
      }
      setOverflows(el.scrollHeight > lineHeight * maxLines + 1);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [trimmed, expanded, collapsible]);

  if (!trimmed) return null;

  const showToggle = collapsible && (overflows || expanded);
  const showCollapsed = collapsible && !expanded && overflows !== false;
  const showFade = collapsible && !expanded && overflows === true;

  return (
    <div className={styles.root}>
      <div
        ref={contentRef}
        className={
          showCollapsed
            ? cn(styles.contentCollapsed, showFade && styles.contentFaded)
            : styles.contentExpanded
        }
      >
        <MarkdownContent markdown={trimmed} />
      </div>
      {showToggle ? (
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
