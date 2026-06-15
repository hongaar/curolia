import { useEffect, useState } from "react";

/** Re-render on an interval so relative timestamps stay fresh. */
export function useRelativeTimeTick(
  enabled: boolean,
  intervalMs = 60_000,
): void {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      setTick((tick) => tick + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);
}
