import { ChevronRight } from "lucide-react";

import styles from "./about-dialog.module.css";

export type AboutLinkItem = {
  id: string;
  label: string;
};

export type AboutLinkListProps = {
  items: AboutLinkItem[];
  onSelect: (id: string) => void;
  "aria-label"?: string;
};

export function AboutLinkList({
  items,
  onSelect,
  "aria-label": ariaLabel = "About links",
}: AboutLinkListProps) {
  return (
    <nav className={styles.linksNav} aria-label={ariaLabel}>
      <ul className={styles.links}>
        {items.map(({ id, label }) => (
          <li key={id} className={styles.linkItem}>
            <button
              type="button"
              className={styles.link}
              onClick={() => onSelect(id)}
            >
              {label}
              <ChevronRight className={styles.linkChevron} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
