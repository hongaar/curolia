import { describe, expect, it } from "vitest";

import {
  estimatedBottomSheetHeightPx,
  measureMapPanelInset,
  SIDE_PANEL_FALLBACK_WIDTH_PX,
} from "./map-panel-inset";

describe("estimatedBottomSheetHeightPx", () => {
  it("caps at 40rem", () => {
    expect(estimatedBottomSheetHeightPx(2000)).toBe(40 * 16);
  });

  it("uses 85% of viewport when smaller than cap", () => {
    expect(estimatedBottomSheetHeightPx(400)).toBe(340);
  });
});

describe("measureMapPanelInset", () => {
  it("reads side panel width with fallback", () => {
    const el = { offsetWidth: 320 } as HTMLElement;
    expect(measureMapPanelInset("side", el)).toEqual({ right: 320 });
    expect(measureMapPanelInset("side", null)).toEqual({
      right: SIDE_PANEL_FALLBACK_WIDTH_PX,
    });
  });

  it("reads bottom sheet height with fallback", () => {
    const el = {
      getBoundingClientRect: () => ({ height: 400 }),
    } as HTMLElement;
    expect(measureMapPanelInset("bottom", el)).toEqual({ bottom: 400 });
    expect(measureMapPanelInset("bottom", null)).toEqual({
      bottom: estimatedBottomSheetHeightPx(),
    });
  });
});
