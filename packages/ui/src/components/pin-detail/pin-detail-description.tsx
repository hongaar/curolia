"use client";

import { useLayoutEffect, useRef, useState } from "react";

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
      setOverflows(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [trimmed, expanded, collapsible]);

  if (!trimmed) return null;

  const showToggle = collapsible && (overflows || expanded);

  return (
    <div className={styles.root}>
      <div
        ref={contentRef}
        className={
          !collapsible || expanded
            ? styles.contentExpanded
            : styles.contentCollapsed
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
