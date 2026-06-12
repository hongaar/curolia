import { describe, expect, it } from "vitest";

import {
  BOTTOM_SHEET_HISTORY_STATE,
  isBottomSheetHistoryState,
} from "./bottom-sheet-history";

describe("isBottomSheetHistoryState", () => {
  it("recognizes bottom sheet history entries", () => {
    expect(isBottomSheetHistoryState(BOTTOM_SHEET_HISTORY_STATE)).toBe(true);
  });

  it("recognizes merged React Router state", () => {
    expect(isBottomSheetHistoryState({ idx: 1, bottomSheet: true })).toBe(true);
  });

  it("rejects unrelated history state", () => {
    expect(isBottomSheetHistoryState(null)).toBe(false);
    expect(isBottomSheetHistoryState({ idx: 1 })).toBe(false);
  });
});
