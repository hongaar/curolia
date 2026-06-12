import { isStackRoute } from "@/lib/stack-routes";

/** React Router stores the history index on `window.history.state.idx`. */
export function canNavigateBack(
  historyState: { idx?: number } | null = typeof window !== "undefined"
    ? (window.history.state as { idx?: number } | null)
    : null,
): boolean {
  if (historyState && typeof historyState.idx === "number") {
    return historyState.idx > 0;
  }
  return typeof window !== "undefined" && window.history.length > 1;
}

/** Stack screens always expose back; other pages follow browser history. */
export function shouldShowPageBackButton(
  pathname: string,
  historyState: { idx?: number } | null = typeof window !== "undefined"
    ? (window.history.state as { idx?: number } | null)
    : null,
): boolean {
  if (isStackRoute(pathname)) return true;
  return canNavigateBack(historyState);
}
