import { useSyncExternalStore } from "react";

/** Matches `min-width: 768px` — wide enough to show the map side panel. */
const QUERY = "(min-width: 768px)";

export function useMinMd(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = matchMedia(QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => matchMedia(QUERY).matches,
    () => false,
  );
}
