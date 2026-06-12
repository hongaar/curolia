import { describe, expect, it } from "vitest";

import { bottomSheetDragThresholds } from "./bottom-sheet-drag";

describe("bottomSheetDragThresholds", () => {
  it("scales collapse and close thresholds with sheet height", () => {
    const small = bottomSheetDragThresholds(280);
    expect(small.collapse).toBe(56);
    expect(small.close).toBe(120);

    const tall = bottomSheetDragThresholds(900);
    expect(tall.collapse).toBe(162);
    expect(tall.close).toBe(378);
  });
});
