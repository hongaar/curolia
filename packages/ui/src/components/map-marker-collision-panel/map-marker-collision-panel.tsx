import { X } from "lucide-react";
import { useCallback, type WheelEvent } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../button";
import { FloatingPanel } from "../floating-panel";
import { MapMarker } from "../map-marker";
import {
  SearchResultBody,
  SearchResultRow,
  SearchResultSubtitle,
  SearchResultTitle,
  SearchResultTitleRow,
} from "../search";
import styles from "./map-marker-collision-panel.module.css";

export type MapMarkerCollisionItem = {
  id: string;
  emoji: string;
  fill: string | null;
  title: string;
  subtitle?: string;
};

export type MapMarkerCollisionPanelProps = {
  title: string;
  items: MapMarkerCollisionItem[];
  onSelectItem: (id: string) => void;
  onClose: () => void;
  /** Flex child inside `MapFloatingPanel` / `FloatingPanel`. */
  fill?: boolean;
  /** Constrain height when nested in a bottom sheet. */
  sheet?: boolean;
};

export function MapMarkerCollisionPanel({
  title,
  items,
  onSelectItem,
  onClose,
  fill = false,
  sheet = false,
}: MapMarkerCollisionPanelProps) {
  const onListWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const list = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = list;
    const delta = event.deltaY;
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;
    if ((delta < 0 && canScrollUp) || (delta > 0 && canScrollDown)) {
      event.preventDefault();
    }
  }, []);

  return (
    <div
      className={cn(styles.root, fill && styles.fill, sheet && styles.sheet)}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close"
        >
          <X />
        </Button>
      </div>
      <div
        className={styles.list}
        role="listbox"
        aria-label={title}
        onWheel={onListWheel}
      >
        {items.map((item) => (
          <SearchResultRow key={item.id} onClick={() => onSelectItem(item.id)}>
            <span className={styles.rowMarker}>
              <MapMarker emoji={item.emoji} fill={item.fill} size="sm" />
            </span>
            <SearchResultBody>
              <SearchResultTitleRow>
                <SearchResultTitle>{item.title}</SearchResultTitle>
              </SearchResultTitleRow>
              {item.subtitle ? (
                <SearchResultSubtitle>{item.subtitle}</SearchResultSubtitle>
              ) : null}
            </SearchResultBody>
          </SearchResultRow>
        ))}
      </div>
    </div>
  );
}

/** Desktop shell inside `MapFloatingPanel` + `MapFloatingAnchor`. */
export function MapMarkerCollisionFloatingPanel(
  props: MapMarkerCollisionPanelProps,
) {
  return (
    <FloatingPanel padding="none" className={styles.floatingHost}>
      <MapMarkerCollisionPanel {...props} fill />
    </FloatingPanel>
  );
}
