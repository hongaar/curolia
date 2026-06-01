import type { BlogPinListOrder } from "@/lib/blog-pin-list-order";
import {
  readBlogPinListOrder,
  writeBlogPinListOrder,
} from "@/lib/blog-pin-list-order";
import { useCallback, useState } from "react";

export function useBlogPinListOrder(mapId: string | null) {
  const [order, setOrderState] = useState<BlogPinListOrder>(() =>
    readBlogPinListOrder(mapId),
  );
  const [prevMapId, setPrevMapId] = useState(mapId);
  if (mapId !== prevMapId) {
    setPrevMapId(mapId);
    setOrderState(readBlogPinListOrder(mapId));
  }

  const setOrder = useCallback(
    (next: BlogPinListOrder) => {
      if (!mapId) return;
      writeBlogPinListOrder(mapId, next);
      setOrderState(next);
    },
    [mapId],
  );

  return { order, setOrder };
}
