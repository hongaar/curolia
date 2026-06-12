export const BOTTOM_SHEET_HISTORY_STATE = { bottomSheet: true } as const;

export function isBottomSheetHistoryState(state: unknown): boolean {
  return (
    typeof state === "object" &&
    state !== null &&
    "bottomSheet" in state &&
    (state as { bottomSheet: unknown }).bottomSheet === true
  );
}
