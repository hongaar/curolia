export type TripTimelinePositionItem = {
  date: string;
};

function parseYmdTimestamp(ymd: string): number | null {
  const parts = ymd.trim().split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d).getTime();
}

/** Percent positions (0–100) along the trip timeline, spaced by pin dates. */
export function computeTripTimelinePositions(
  items: TripTimelinePositionItem[],
): number[] {
  const count = items.length;
  if (count === 0) return [];
  if (count === 1) return [50];

  const timestamps = items.map((item) => parseYmdTimestamp(item.date));
  const valid = timestamps.filter((t): t is number => t != null);

  if (valid.length === 0) {
    return items.map((_, index) => (index / (count - 1)) * 100);
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);

  if (min === max) {
    return items.map((_, index) => (index / (count - 1)) * 100);
  }

  return timestamps.map((timestamp) => {
    if (timestamp == null) return 0;
    return ((timestamp - min) / (max - min)) * 100;
  });
}
