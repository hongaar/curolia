/** React Router history index (`history.state.idx`) per location key. */
const historyIndexByKey = new Map<string, number>();

function currentHistoryIndex(): number | null {
  if (typeof window === "undefined") return null;
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  return typeof idx === "number" ? idx : null;
}

/** Record the history index of the entry currently shown for `key`. */
export function rememberHistoryIndex(key: string) {
  const idx = currentHistoryIndex();
  if (idx !== null) historyIndexByKey.set(key, idx);
}

/**
 * Negative delta to pass to `navigate()` to pop back to the entry for `key`,
 * or `null` when that entry is not behind the current one in history.
 */
export function historyDeltaTo(key: string): number | null {
  const target = historyIndexByKey.get(key);
  const current = currentHistoryIndex();
  if (target === undefined || current === null || target >= current) {
    return null;
  }
  return target - current;
}
