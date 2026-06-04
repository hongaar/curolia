import type {
  BlogPinListDirection,
  BlogPinListOrder,
  BlogPinListSort,
} from "@/lib/blog-pin-list-order";
import {
  defaultBlogPinListDirection,
  readBlogPinListSort,
  writeBlogPinListSort,
} from "@/lib/blog-pin-list-order";
import { useCallback, useState } from "react";

export function useBlogPinListSort(mapId: string | null) {
  const [sort, setSortState] = useState<BlogPinListSort>(() =>
    readBlogPinListSort(mapId),
  );
  const [prevMapId, setPrevMapId] = useState(mapId);
  if (mapId !== prevMapId) {
    setPrevMapId(mapId);
    setSortState(readBlogPinListSort(mapId));
  }

  const persist = useCallback(
    (next: BlogPinListSort) => {
      if (!mapId) return;
      writeBlogPinListSort(mapId, next);
      setSortState(next);
    },
    [mapId],
  );

  const setOrder = useCallback(
    (order: BlogPinListOrder) => {
      persist({ order, direction: defaultBlogPinListDirection(order) });
    },
    [persist],
  );

  const setDirection = useCallback(
    (direction: BlogPinListDirection) => {
      setSortState((prev) => {
        const next = { ...prev, direction };
        if (mapId) writeBlogPinListSort(mapId, next);
        return next;
      });
    },
    [mapId],
  );

  return {
    sort,
    order: sort.order,
    direction: sort.direction,
    setSort: persist,
    setOrder,
    setDirection,
  };
}

/** @deprecated Use useBlogPinListSort */
export function useBlogPinListOrder(mapId: string | null) {
  const { order, setOrder } = useBlogPinListSort(mapId);
  return { order, setOrder };
}
